import { openai } from "@workspace/integrations-openai-ai-server";

export function isUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

const META_RE = /<meta\b[^>]*>/gi;
const NAME_ATTR_RE = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i;
const CONTENT_ATTR_RE = /\bcontent\s*=\s*["']([^"']*)["']/i;

function pickMeta(html: string, names: string[]): string | null {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const tags = html.match(META_RE);
  if (!tags) return null;
  for (const candidate of names) {
    const target = candidate.toLowerCase();
    for (const tag of tags) {
      const nm = tag.match(NAME_ATTR_RE);
      if (!nm || nm[1].toLowerCase() !== target) continue;
      if (!wanted.has(nm[1].toLowerCase())) continue;
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

export async function fetchCarPage(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AsistenteVentasBot/1.0; +https://replit.com)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const html = await res.text();
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "").trim();
  const ogTitle = pickMeta(html, ["og:title", "twitter:title"]);
  const ogDesc = pickMeta(html, ["og:description", "twitter:description", "description"]);
  const text = stripHtml(html).slice(0, 5000);
  return [
    `URL: ${url}`,
    title && `TÍTULO: ${title}`,
    ogTitle && ogTitle !== title && `OG_TITLE: ${ogTitle}`,
    ogDesc && `DESCRIPCIÓN: ${ogDesc}`,
    `CONTENIDO:\n${text}`,
  ]
    .filter(Boolean)
    .join("\n");
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
  notes: string;
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
  "notes": string
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
- notes: ficha comercial 2-4 frases en español de España, sin emojis, sin asteriscos. Tono profesional cercano. Destaca lo que vende este coche concreto (equipamiento si se menciona, ratio km/año, ventajas reales). NO inventes equipamiento que no esté insinuado en el texto. Si solo tienes marca+modelo+año+precio+km, redacta una ficha sobria sin inventar extras.

Devuelve SOLO el JSON. Nada más.`;

export async function parseCarLine(line: string): Promise<ParsedCar> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Coche a procesar:\n${line}` },
    ],
  });
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
    notes: String(data.notes ?? ""),
  };
}
