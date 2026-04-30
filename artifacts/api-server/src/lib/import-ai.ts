import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { openai } from "@workspace/integrations-openai-ai-server";

export function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

const FETCH_TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 512 * 1024; // 512 KB is plenty to extract car data
const MAX_REDIRECTS = 5;

const PRIVATE_IP_RES: RegExp[] = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^100\.6[4-9]\./,
  /^100\.[7-9]\d\./,
  /^100\.1[01]\d\./,
  /^100\.12[0-7]\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^::$/,
  /^fc[\da-f]{2}:/i,
  /^fd[\da-f]{2}:/i,
  /^fe80:/i,
  /^::ffff:(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i,
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RES.some((re) => re.test(ip));
}

function assertSafeHostname(hostname: string): void {
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error("Destino de URL no permitido");
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Destino de URL no permitido");
    }
  }
}

function assertSafeUrlSync(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Solo se permiten URLs http/https");
  }

  assertSafeHostname(parsed.hostname);
  return parsed;
}

/**
 * Resolves the hostname once, validates it is not a private IP, and returns
 * the resolved IP address so the caller can pin the outbound connection to
 * that address.  This prevents DNS-rebinding: a subsequent OS-level lookup
 * performed by Node's http/https stack could return a different (private) IP
 * if the attacker's DNS TTL has expired between the validation and the
 * connect() call.
 *
 * For literal IPs the function validates the IP directly and returns it as-is.
 */
async function resolveAndValidateHostname(hostname: string): Promise<string> {
  // Literal IP — validate and return as-is, no DNS query needed
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("Destino de URL no permitido");
    return hostname;
  }

  let address: string;
  try {
    const result = await dns.promises.lookup(hostname, { family: 0 });
    address = result.address;
  } catch {
    throw new Error(`No se pudo resolver el dominio: ${hostname}`);
  }

  if (!address) throw new Error(`No se pudo resolver el dominio: ${hostname}`);
  if (isPrivateIp(address)) throw new Error("Destino de URL no permitido");

  return address;
}

const defaultHttpAgent = new http.Agent({ keepAlive: false });
const defaultHttpsAgent = new https.Agent({ keepAlive: false });

interface RawResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  readBody(maxBytes: number, signal: AbortSignal): Promise<string>;
}

/**
 * Low-level HTTP GET.
 *
 * @param parsed   - The validated URL (provides path, protocol, original hostname).
 * @param pinnedIp - The IP address that was returned by the DNS validation step.
 *                   We connect to this IP directly so that no second OS-level DNS
 *                   resolution occurs — this defeats DNS-rebinding attacks.
 *                   The original hostname is still sent in the Host header and as
 *                   the TLS SNI so that the server can identify the virtual host.
 */
function httpGetRaw(parsed: URL, pinnedIp: string, signal: AbortSignal): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Timeout al descargar URL"));
      return;
    }

    const isHttps = parsed.protocol === "https:";
    const mod = isHttps ? https : http;
    const agent = isHttps ? defaultHttpsAgent : defaultHttpAgent;

    const req = mod.request({
      // Connect to the pinned IP, not the hostname, to prevent a second DNS
      // resolution that an attacker could manipulate (DNS rebinding).
      // Node's http/https stack accepts a bare IPv6 address (without brackets)
      // as the `hostname` option and handles the socket addressing internally.
      hostname: pinnedIp,
      port: parsed.port || (isHttps ? 443 : 80),
      path: (parsed.pathname || "/") + parsed.search,
      method: "GET",
      // Preserve the original hostname in the Host header (required by HTTP/1.1)
      // and as the TLS servername (SNI) so virtual hosting and TLS certs work.
      // parsed.host already contains the correctly bracketed IPv6 address and
      // any explicit port, so we use it directly instead of reconstructing.
      headers: {
        Host: parsed.host,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      // For HTTPS: set servername (SNI) to the original hostname, not the IP,
      // so the server presents the correct TLS certificate.
      ...(isHttps ? { servername: parsed.hostname } : {}),
      agent,
    });

    function abortReq() {
      req.destroy(new Error("Timeout al descargar URL"));
    }
    signal.addEventListener("abort", abortReq, { once: true });

    req.on("error", (err) => {
      signal.removeEventListener("abort", abortReq);
      reject(err);
    });

    req.on("response", (res) => {
      signal.removeEventListener("abort", abortReq);
      resolve({
        status: res.statusCode ?? 0,
        headers: res.headers,
        readBody(maxBytes: number, sig: AbortSignal): Promise<string> {
          return new Promise((resolveBody, rejectBody) => {
            const chunks: Buffer[] = [];
            let total = 0;
            let truncated = false;

            function abortBody() {
              res.destroy(new Error("Timeout al descargar URL"));
            }
            sig.addEventListener("abort", abortBody, { once: true });

            res.on("data", (chunk: Buffer) => {
              if (truncated) return;
              const remaining = maxBytes - total;
              if (chunk.byteLength >= remaining) {
                chunks.push(chunk.subarray(0, remaining));
                truncated = true;
                sig.removeEventListener("abort", abortBody);
                res.destroy(); // stop downloading, we have enough
                resolveBody(Buffer.concat(chunks).toString("utf8")); // resolve right away
                return;
              }
              total += chunk.byteLength;
              chunks.push(chunk);
            });

            res.on("end", () => {
              sig.removeEventListener("abort", abortBody);
              resolveBody(Buffer.concat(chunks).toString("utf8"));
            });

            res.on("error", (err) => {
              sig.removeEventListener("abort", abortBody);
              if (truncated) return; // already resolved above
              rejectBody(err);
            });
          });
        },
      });
    });

    req.end();
  });
}

const META_RE = /<meta\b[^>]*>/gi;
const NAME_ATTR_RE = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i;
const CONTENT_ATTR_RE = /\bcontent\s*=\s*["']([^"']*)["']/i;

function pickMeta(html: string, names: string[]): string | null {
  const tags = html.match(META_RE);
  if (!tags) return null;
  for (const candidate of names) {
    const target = candidate.toLowerCase();
    for (const tag of tags) {
      const nm = tag.match(NAME_ATTR_RE);
      if (!nm || nm[1].toLowerCase() !== target) continue;
      const ct = tag.match(CONTENT_ATTR_RE);
      if (ct && ct[1]) return ct[1];
    }
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&euro;/g, "€")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface FetchedPage {
  text: string;
  photos: string[];
}

function extractPhotos(html: string, baseUrl: string): string[] {
  const photos: string[] = [];
  const seen = new Set<string>();

  function addPhoto(src: string | null | undefined) {
    if (!src) return;
    src = src.trim();
    if (!src || src.startsWith("data:")) return;
    try {
      const abs = new URL(src, baseUrl).href;
      if (!abs.startsWith("http")) return;
      if (seen.has(abs)) return;
      seen.add(abs);
      photos.push(abs);
    } catch { /* ignore invalid URLs */ }
  }

  // 1. og:image (most reliable)
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const prop = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (prop === "og:image" || prop === "twitter:image") {
      addPhoto(tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]);
    }
  }

  // 2. JSON-LD image arrays
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    try {
      const obj = JSON.parse(m[1]);
      const imgs: unknown[] = Array.isArray(obj.image) ? obj.image : obj.image ? [obj.image] : [];
      for (const img of imgs) {
        if (typeof img === "string") addPhoto(img);
        else if (img && typeof img === "object" && "url" in img) addPhoto((img as { url: string }).url);
      }
    } catch { /* ignore */ }
  }

  // 3. Large <img> or lazy-load data-src on known gallery patterns
  const imgRe = /<img\b[^>]*>/gi;
  const imgTags = html.match(imgRe) ?? [];
  for (const tag of imgTags) {
    // Only pick images that look like car photos (large, not icons/logos)
    const src = tag.match(/(?:data-src|data-lazy|data-original|src)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src || src.length < 10) continue;
    const lc = src.toLowerCase();
    if (lc.includes("logo") || lc.includes("icon") || lc.includes("avatar") || lc.includes("sprite") || lc.includes("banner")) continue;
    // Prefer large images
    const widthMatch = tag.match(/width\s*=\s*["']?(\d+)/i);
    const width = widthMatch ? parseInt(widthMatch[1]) : 0;
    if (width > 0 && width < 200) continue;
    addPhoto(src);
    if (photos.length >= 20) break;
  }

  return photos.slice(0, 20);
}

export async function fetchCarPage(url: string): Promise<FetchedPage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentParsed = assertSafeUrlSync(url);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      // Resolve the hostname once, validate it is not a private IP, and pin
      // the returned IP for the outbound connection.  This single atomic
      // lookup-then-connect pattern eliminates the DNS-rebinding window that
      // existed when the validation lookup and the connection lookup were
      // separate operations.
      const pinnedIp = await resolveAndValidateHostname(currentParsed.hostname);

      const raw = await httpGetRaw(currentParsed, pinnedIp, controller.signal);

      if (raw.status >= 300 && raw.status < 400) {
        if (hop === MAX_REDIRECTS) throw new Error("Demasiadas redirecciones");
        const locationHeader = raw.headers["location"];
        const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
        if (!location) throw new Error("Redirect sin cabecera Location");
        const nextUrl = new URL(location, currentParsed.href).href;
        currentParsed = assertSafeUrlSync(nextUrl);
        continue;
      }

      if (raw.status < 200 || raw.status >= 300) {
        throw new Error(`HTTP ${raw.status} al descargar ${url}`);
      }

      const html = await raw.readBody(MAX_RESPONSE_BYTES, controller.signal);
      const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "").trim();
      const ogTitle = pickMeta(html, ["og:title", "twitter:title"]);
      const ogDesc = pickMeta(html, ["og:description", "twitter:description", "description"]);

      // Extract JSON-LD structured data (most reliable source for car listings)
      const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      const jsonLdSnippets = jsonLdMatches
        .map((m) => {
          try { return JSON.stringify(JSON.parse(m[1]), null, 0).slice(0, 800); } catch { return null; }
        })
        .filter(Boolean)
        .join("\n");

      const text = stripHtml(html).slice(0, 8000);
      const photos = extractPhotos(html, currentParsed.href);

      const textPayload = [
        `URL: ${url}`,
        title && `TÍTULO: ${title}`,
        ogTitle && ogTitle !== title && `OG_TITLE: ${ogTitle}`,
        ogDesc && `DESCRIPCIÓN: ${ogDesc}`,
        jsonLdSnippets && `DATOS_ESTRUCTURADOS:\n${jsonLdSnippets}`,
        `CONTENIDO:\n${text}`,
      ]
        .filter(Boolean)
        .join("\n");

      return { text: textPayload, photos };
    }

    throw new Error("Demasiadas redirecciones");
  } finally {
    clearTimeout(timer);
  }
}

export interface ParsedCar {
  make: string;
  model: string;
  year: number;
  price: number;
  km: number;
  fuel: "Diésel" | "Gasolina" | "Híbrido" | "Eléctrico" | "GLP" | "GNC";
  transmission: "Manual" | "Automático";
  location: string;
  attractiveness: "hot" | "normal" | "hard";
  depositCents: number;
  description: string;
  notes: string;
  marketPriceMin: number;
  marketPriceMax: number;
  // Extended specs — null means not found in source
  horsepower: number | null;
  doors: number | null;
  seats: number | null;
  color: string | null;
  bodyType: string | null;
  engineCc: number | null;
  co2: number | null;
  consumptionUrban: number | null;
  consumptionHighway: number | null;
  consumptionMixed: number | null;
}

const SYSTEM_PROMPT = `Eres un experto del mercado español de coches de ocasión. Recibes una descripción libre de UN coche (puede venir muy mal escrita: solo marca/modelo/año/precio, una línea CSV, un anuncio entero, o el contenido scrapeado de una página web de portales como coches.net, autoscout24, milanuncios, wallapop o similares).

Devuelves SOLO un JSON con este formato exacto:
{
  "make": string,
  "model": string,
  "year": number,
  "price": number,
  "km": number,
  "fuel": "Diésel" | "Gasolina" | "Híbrido" | "Eléctrico" | "GLP" | "GNC",
  "transmission": "Manual" | "Automático",
  "location": string,
  "attractiveness": "hot" | "normal" | "hard",
  "depositCents": number,
  "description": string,
  "notes": string,
  "marketPriceMin": number,
  "marketPriceMax": number,
  "horsepower": number | null,
  "doors": number | null,
  "seats": number | null,
  "color": string | null,
  "bodyType": string | null,
  "engineCc": number | null,
  "co2": number | null,
  "consumptionUrban": number | null,
  "consumptionHighway": number | null,
  "consumptionMixed": number | null
}

REGLAS:
- price en euros (número, sin símbolo). Si no se menciona, estima un precio de mercado realista en España para ese modelo/año/km.
- km: número entero. Si no se menciona, estima un km típico para el año (8000-15000 km/año).
- fuel: si no está claro, deduce por modelo/motor (TDI=Diésel, TSI/MPI=Gasolina, HEV=Híbrido, EV=Eléctrico).
- transmission: "Manual" salvo que diga DSG/AT/Automático/Tiptronic/S-Tronic.
- location: ciudad española. Si no se menciona, "Madrid".
- attractiveness:
  - "hot" si es coche muy demandado (Audi/BMW/Mercedes premium reciente, SUV familiar muy buscado, eléctrico popular, precio claramente por debajo de mercado).
  - "hard" si es coche difícil de vender (>150.000km, motor problemático conocido, marca/modelo poco demandado, precio alto para lo que es).
  - "normal" en el resto.
- depositCents: 10000 (100€) si precio<10.000€, 20000 (200€) si 10.000-20.000€, 30000 (300€) si >20.000€.
- description: descripción comercial completa del vehículo en 3-6 frases en español de España, sin emojis, sin asteriscos. Tono profesional cercano. Incluye el equipamiento destacado si se menciona, ratio km/año, estado del vehículo, ventajas reales. Si hay descripción original en el anuncio, úsala como base y mejórala. NO inventes equipamiento que no esté insinuado en el texto.
- notes: 1-2 frases internas para el comercial (no se muestra al público). Destaca puntos fuertes de venta o alertas.
- marketPriceMin / marketPriceMax: rango realista en EUROS al que se vende ESTE coche (mismo modelo/año/km/combustible/cambio aprox.) en portales españoles tipo coches.net, autoscout24.es, milanuncios y wallapop motor. Considera estado de mercado actual, depreciación por año (~12-15%/año), penalización por kms altos (>20k km/año = -5/-10%), prima por automático y por equipamiento premium. El rango debe abarcar la dispersión real (entre el más barato listado y un buen ejemplar particular o concesión), normalmente con una amplitud del 15-25% entre min y max. NUESTRO precio (price) suele estar igual o por debajo del min porque vendemos en outlet, pero NO fuerces eso: si el coche está caro, el precio puede caer dentro del rango. Devuelve enteros sin decimales.
- horsepower: CV del motor, entero. null si no se menciona.
- doors: número de puertas (3, 5, 2, 4...). null si no se menciona.
- seats: número de plazas. null si no se menciona.
- color: color exterior en español (p.ej. "Blanco", "Gris Plata", "Negro"). null si no se menciona.
- bodyType: carrocería en español (p.ej. "Berlina", "SUV", "Familiar", "Furgoneta", "Monovolumen", "Descapotable", "Coupé"). null si no se puede deducir.
- engineCc: cilindrada en cc, entero. null si no se menciona.
- co2: emisiones CO2 en g/km, entero. null si no se menciona.
- consumptionUrban: consumo urbano en L/100km, número decimal. null si no se menciona.
- consumptionHighway: consumo carretera en L/100km, número decimal. null si no se menciona.
- consumptionMixed: consumo mixto en L/100km, número decimal. null si no se menciona.

Devuelve SOLO el JSON. Nada más.`;

export async function parseCarLine(line: string): Promise<ParsedCar> {
  const response = await openai.chat.completions.create(
    {
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Coche a procesar:\n${line.slice(0, 12000)}` },
      ],
    },
    { timeout: 45_000 },
  );
  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  let data: Partial<ParsedCar>;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`AI returned invalid JSON: ${raw.slice(0, 120)}`);
  }
  if (!data.make || !data.model || typeof data.year !== "number" || typeof data.price !== "number") {
    throw new Error(`AI omitted required fields (make/model/year/price)`);
  }
  function nullableInt(v: unknown): number | null {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  function nullableFloat(v: unknown): number | null {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function nullableStr(v: unknown): string | null {
    if (v == null || String(v).trim() === "" || String(v) === "null") return null;
    return String(v).trim();
  }

  return {
    make: String(data.make),
    model: String(data.model),
    year: Number(data.year),
    price: Number(data.price),
    km: Number(data.km ?? 0),
    fuel: (data.fuel as ParsedCar["fuel"]) ?? "Diésel",
    transmission: (data.transmission as ParsedCar["transmission"]) ?? "Manual",
    location: String(data.location ?? "Madrid"),
    attractiveness: (data.attractiveness as ParsedCar["attractiveness"]) ?? "normal",
    depositCents: Number(data.depositCents ?? 20000),
    description: String(data.description ?? ""),
    notes: String(data.notes ?? ""),
    ...normalizeMarketRangeStrict(
      Number(data.marketPriceMin ?? data.price ?? 0),
      Number(data.marketPriceMax ?? data.price ?? 0),
    ),
    horsepower: nullableInt(data.horsepower),
    doors: nullableInt(data.doors),
    seats: nullableInt(data.seats),
    color: nullableStr(data.color),
    bodyType: nullableStr(data.bodyType),
    engineCc: nullableInt(data.engineCc),
    co2: nullableInt(data.co2),
    consumptionUrban: nullableFloat(data.consumptionUrban),
    consumptionHighway: nullableFloat(data.consumptionHighway),
    consumptionMixed: nullableFloat(data.consumptionMixed),
  };
}

export function normalizeMarketRange(
  rawMin: number | null | undefined,
  rawMax: number | null | undefined,
): { marketPriceMin: number | null; marketPriceMax: number | null } {
  const min = Number.isFinite(rawMin) ? Math.max(0, Math.round(rawMin as number)) : null;
  const max = Number.isFinite(rawMax) ? Math.max(0, Math.round(rawMax as number)) : null;
  if (min == null || max == null) return { marketPriceMin: min, marketPriceMax: max };
  if (max < min) return { marketPriceMin: max, marketPriceMax: min };
  return { marketPriceMin: min, marketPriceMax: max };
}

export function normalizeMarketRangeStrict(
  rawMin: number,
  rawMax: number,
): { marketPriceMin: number; marketPriceMax: number } {
  const min = Math.max(0, Math.round(Number.isFinite(rawMin) ? rawMin : 0));
  const max = Math.max(0, Math.round(Number.isFinite(rawMax) ? rawMax : 0));
  if (max < min) return { marketPriceMin: max, marketPriceMax: min };
  return { marketPriceMin: min, marketPriceMax: max };
}
