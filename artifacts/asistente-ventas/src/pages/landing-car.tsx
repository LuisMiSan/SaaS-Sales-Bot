import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useGetCar, useListCars, getGetCarQueryKey } from "@workspace/api-client-react";
import type { PublicCar } from "@workspace/api-client-react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Fuel,
  Settings2,
  Calendar,
  CarFront,
  Mic,
  Phone,
  Receipt,
  Truck,
  Wrench,
  ArrowRight,
  Images,
  Palette,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { WhatsappWidget, buildWhatsappUrl, useWhatsappNumber } from "@/components/whatsapp-widget";
import { formatPrice, sanitizePhotoUrl } from "@/lib/format";

/* ─── RESOLVE IMAGE ─────────────────────────────────────────────────────── */
function resolveGalleryUrl(url: string): string {
  const sanitized = sanitizePhotoUrl(url);
  if (/^(?:https?:)?\/\//i.test(sanitized) || sanitized.startsWith("data:")) return sanitized;
  const base = import.meta.env.BASE_URL || "/";
  const trimmed = sanitized.startsWith("/") ? sanitized.slice(1) : sanitized;
  return base.endsWith("/") ? base + trimmed : base + "/" + trimmed;
}

/* ─── GALLERY ───────────────────────────────────────────────────────────── */
function Gallery({ car }: { car: PublicCar }) {
  const photos = (car.photos?.length ? car.photos : car.imageUrl ? [car.imageUrl] : []).map(resolveGalleryUrl);
  const [idx, setIdx] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="relative bg-stone-100 h-64 sm:h-80 flex items-center justify-center">
        <CarFront className="h-20 w-20 text-stone-300" />
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);
  const thumbs = photos.slice(0, 4);
  const extra = photos.length - 4;

  return (
    <div>
      <div className="relative overflow-hidden bg-[#f4f5f7] h-64 sm:h-[340px] flex items-center justify-center">
        <img
          src={photos[idx]}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
        />
        <div className="absolute top-3 left-3 bg-[#EE7B22] text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded">
          Stock limitado
        </div>
        {photos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 text-stone-700" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center">
              <ChevronRight className="h-4 w-4 text-stone-700" />
            </button>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded">
          {idx + 1}/{photos.length}
        </div>
        <button className="absolute bottom-3 right-3 bg-white/90 shadow text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded inline-flex items-center gap-1 text-stone-700 hover:bg-white transition-colors">
          <Images className="h-3.5 w-3.5" /> Ver más fotos
        </button>
      </div>

      {/* Thumbnails row */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 p-2 bg-white border-t border-stone-100">
          {thumbs.map((url, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative flex-1 h-16 overflow-hidden rounded border-2 transition-all ${idx === i ? "border-[#EE7B22]" : "border-transparent hover:border-stone-300"}`}
            >
              <img src={url} alt="" className="w-full h-full object-contain bg-[#f4f5f7]" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </button>
          ))}
          {extra > 0 && (
            <button
              onClick={() => setIdx(4)}
              className="flex-1 h-16 bg-stone-100 rounded border border-stone-200 flex flex-col items-center justify-center hover:bg-stone-200 transition-colors"
            >
              <span className="text-base font-black text-stone-700">+{extra}</span>
              <span className="text-[10px] text-stone-500 font-semibold">Ver todas</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── INVOICE MOCK ──────────────────────────────────────────────────────── */
function InvoiceMock({ car, mayorista, transporte, gestion }: { car: PublicCar; mayorista: number; transporte: number; gestion: number }) {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}.${today.getFullYear()}`;
  const refNum = `ESP${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden text-xs font-mono shadow-sm">
      {/* Invoice header */}
      <div className="bg-[#003B7A] text-white px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-black tracking-tight text-white">AUTO<span className="text-[#EE7B22]">1</span><span className="text-[10px] font-normal">.com</span></div>
          <div className="text-[10px] text-blue-200 mt-0.5">AUTO1 European Cars B.V.</div>
        </div>
        <div className="text-right text-[10px] text-blue-200">
          <div>C/ Rosario Pino, nº 14-16</div>
          <div>1ª Planta, 28020 Madrid</div>
        </div>
      </div>
      {/* Invoice body */}
      <div className="bg-white px-4 py-3 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">Factura proforma</span>
          <span className="text-stone-500">Fecha: {dateStr}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-stone-500">Núm. Pedido</span>
          <span className="font-bold text-stone-700">{refNum}</span>
        </div>
        <div className="border-t border-stone-100 pt-2 mt-1">
          <div className="text-[10px] text-stone-500 mb-1">Descripción</div>
          <div className="text-[11px] font-semibold text-stone-800">{car.make} {car.model} {car.year}</div>
          <div className="text-[10px] text-stone-500">{car.fuel} · {car.transmission} · {car.km.toLocaleString("es-ES")} km</div>
        </div>
        <table className="w-full border-t border-stone-100 pt-2 mt-1">
          <tbody className="text-[10px]">
            <tr className="border-b border-stone-100">
              <td className="py-1 text-stone-600">Precio vehículo (mayorista)</td>
              <td className="py-1 text-right font-bold">{formatPrice(mayorista)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-1 text-stone-600">Transporte a destino</td>
              <td className="py-1 text-right font-bold">{formatPrice(transporte)}</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-1 text-stone-600">Gestión y tramitación</td>
              <td className="py-1 text-right font-bold">{formatPrice(gestion)}</td>
            </tr>
            <tr>
              <td className="py-1.5 font-extrabold text-stone-800">Total · Total €</td>
              <td className="py-1.5 text-right font-extrabold text-stone-800">{formatPrice(car.price)}</td>
            </tr>
          </tbody>
        </table>
        <div className="text-[9px] text-stone-400 border-t border-stone-100 pt-2">
          Documento no vinculante · Precio sujeto a confirmación final. IVA incluido.
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────── */
export default function LandingCarPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : 0;
  const { data: car } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: allCars } = useListCars();
  const waNumber = useWhatsappNumber();
  const ctaRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!car) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-stone-500 font-jakarta">Cargando ficha…</div>;
  }

  const others = (allCars ?? []).filter((c) => c.id !== car.id && c.status === "open").slice(0, 4);

  const gestionFee = 1000;
  const transporteFee = 200;
  const mayorista = car.price - gestionFee - transporteFee;
  const hasMarket = car.marketPriceMin != null && car.marketPriceMax != null && car.marketPriceMax > car.price;
  const savingsMin = hasMarket ? car.marketPriceMin! - car.price : null;
  const savingsMax = hasMarket ? car.marketPriceMax! - car.price : null;
  const monthlyEst = Math.round(car.price / 60);

  const waVoiceUrl = buildWhatsappUrl(waNumber, `Hola, tengo dudas sobre el ${car.make} ${car.model} ${car.year} (${formatPrice(car.price)}). ¿Podéis responderme?`);
  const waHeaderUrl = buildWhatsappUrl(waNumber, `Hola, quiero este ${car.make} ${car.model} ${car.year} (${formatPrice(car.price)}). ¿Podéis ayudarme?`);

  const onScrollToCta = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setShowForm(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted || !name.trim() || !phone.trim()) return;
    setSending(true);
    try {
      const res = await fetch("https://n8n.iadivisionmadrid.es/webhook/pujamostucoche-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          carInterest: `${car.make} ${car.model} ${car.year}`,
        }),
      });
      const data = await res.json() as { ok: boolean; waLink?: string };
      if (data.ok && data.waLink) {
        window.location.href = data.waLink;
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white text-[#111827] font-jakarta min-h-screen">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="text-base font-extrabold tracking-tight whitespace-nowrap">
            pujamos<span className="text-[#EE7B22]">tu</span>coche
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
            <a href="#como-funciona" className="hover:text-[#EE7B22] transition-colors">Cómo funciona</a>
            <Link href="/tienda" className="hover:text-[#EE7B22] transition-colors">Ver coches disponibles</Link>
            <a href="#sobre-nosotros" className="hover:text-[#EE7B22] transition-colors">Sobre nosotros</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onScrollToCta}
              className="inline-flex items-center gap-1.5 bg-[#EE7B22] hover:bg-[#C4621A] text-white text-[11px] font-extrabold uppercase tracking-wide px-4 py-2 rounded-full transition-colors"
            >
              Quiero este coche <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {waHeaderUrl && (
              <a
                href={waHeaderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-[#25D366] hover:bg-[#1FBA57] flex items-center justify-center transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.546 4.1 1.5 5.834L0 24l6.334-1.5A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.668-.497-5.2-1.363l-.373-.22-3.758.888.903-3.668-.243-.386A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ── SECCIÓN 1: Galería + Datos del coche ── */}
        <section className="border-b border-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2">
              {/* Galería */}
              <div className="md:border-r border-stone-100">
                <Gallery car={car} />
              </div>

              {/* Info del coche */}
              <div className="px-6 py-6 flex flex-col justify-center">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400">{car.make}</div>
                <h1 className="text-3xl sm:text-4xl font-black mt-1 leading-tight">
                  {car.make} {car.model} {car.year}
                </h1>
                <div className="text-2xl font-black text-stone-500 mt-1 tabular-nums">
                  {car.km.toLocaleString("es-ES")} km
                </div>

                <div className="mt-6 space-y-3">
                  <SpecRow icon={Calendar} label="Año" value={String(car.year)} />
                  <SpecRow icon={Fuel} label="Combustible" value={car.fuel} />
                  <SpecRow icon={Settings2} label="Transmisión" value={car.transmission} />
                  {car.color && <SpecRow icon={Palette} label="Color" value={car.color} />}
                </div>

                <div className="mt-6 pt-6 border-t border-stone-100">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[11px] text-stone-400 font-semibold uppercase tracking-wide">Precio total final</div>
                      <div className="text-3xl font-black tabular-nums text-[#EE7B22]">{formatPrice(car.price)}</div>
                      <div className="text-xs text-stone-400 mt-0.5">Desde <strong className="text-[#EE7B22]">{monthlyEst} €/mes</strong> con financiación</div>
                    </div>
                    {car.status === "open" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 2: Transparencia de precio + Factura ── */}
        <section className="border-b border-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2">

              {/* Panel de precios — fondo oscuro */}
              <div className="bg-[#0d1b2a] text-white px-6 py-8 md:border-r border-white/10">
                <h2 className="text-xl font-black leading-tight">
                  TRANSPARENCIA TOTAL.<br />
                  <span className="text-[#EE7B22]">SIN LETRA PEQUEÑA.</span>
                </h2>

                <div className="mt-6 space-y-3">
                  <PriceRow
                    icon={<Receipt className="h-4 w-4 text-[#EE7B22]" />}
                    label="Precio Mayorista AUTO1"
                    amount={formatPrice(mayorista)}
                    action={<a href="#factura" className="text-[10px] text-[#EE7B22] font-bold hover:underline whitespace-nowrap">VER FACTURA →</a>}
                  />
                  <PriceRow
                    icon={<Truck className="h-4 w-4 text-[#EE7B22]" />}
                    label="Transporte"
                    amount={formatPrice(transporteFee)}
                  />
                  <PriceRow
                    icon={<Wrench className="h-4 w-4 text-[#EE7B22]" />}
                    label="Gestión Pujamostucoche"
                    amount={formatPrice(gestionFee)}
                  />
                </div>

                <div className="mt-5 pt-5 border-t border-white/15 flex items-center justify-between">
                  <span className="text-sm font-extrabold uppercase tracking-wide text-white/80">Precio total</span>
                  <span className="text-3xl font-black tabular-nums">{formatPrice(car.price)}</span>
                </div>

                {hasMarket && (
                  <div className="mt-5 pt-5 border-t border-white/15">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 leading-snug">
                      Rango de precio en portales conocidos y concesionarios de autos de ocasión
                    </p>
                    <div className="mt-2 text-xl font-black tabular-nums text-white/60">
                      {formatPrice(car.marketPriceMin!)} – {formatPrice(car.marketPriceMax!)}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-[#EE7B22]">
                      Tu ahorro real&nbsp;&nbsp;
                      <span className="tabular-nums">{formatPrice(savingsMin!)} – {formatPrice(savingsMax!)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 bg-[#EE7B22] rounded-xl px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold uppercase tracking-wide">Precio total final</span>
                    <span className="text-2xl font-black tabular-nums">{formatPrice(car.price)}</span>
                  </div>
                  <div className="text-[11px] text-white/80 mt-1 font-semibold">Y sí, también puedes financiarlo.</div>
                </div>
              </div>

              {/* Panel de factura */}
              <div id="factura" className="bg-white px-6 py-8">
                <h2 className="text-base font-extrabold text-stone-800 leading-snug">
                  FACTURA DE COMPRA AL MAYORISTA<br />
                  <span className="font-normal text-stone-500">CON GASTOS DESGLOSADOS</span>
                </h2>
                <div className="mt-5">
                  <InvoiceMock car={car} mayorista={mayorista} transporte={transporteFee} gestion={gestionFee} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 3: ¿Tienes dudas? Nota de voz ── */}
        <section className="py-10 px-6 bg-[#f8f9fb] border-b border-stone-100">
          <div className="max-w-lg mx-auto text-center">
            <div className="h-14 w-14 rounded-full bg-[#EE7B22] flex items-center justify-center mx-auto shadow-lg shadow-[#EE7B22]/25">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-stone-900">¿Tienes dudas?</h3>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed max-w-sm mx-auto">
              Mándanos una nota de voz y te respondemos punto por punto con la mayor claridad.
            </p>
            {waVoiceUrl && (
              <a
                href={waVoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1FBA57] text-white font-extrabold text-sm px-6 py-3 rounded-full transition-colors shadow"
              >
                <Mic className="h-4 w-4" /> Enviar nota de voz por WhatsApp
              </a>
            )}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: Phone, label: "Atención real.", sub: "Sin bots." },
                { icon: Mic, label: "Te respondemos", sub: "por nota de voz." },
                { icon: ShieldCheck, label: "Sin presiones,", sub: "sin prisas." },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full border border-stone-200 bg-white flex items-center justify-center shadow-sm">
                    <Icon className="h-5 w-5 text-[#EE7B22]" />
                  </div>
                  <div className="text-[11px] font-semibold text-stone-700 leading-tight">{label}<br />{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 4: Extras opcionales + CTA final ── */}
        <section className="py-8 px-6 bg-[#f0f2f5] border-b border-stone-200">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-4">
              Añade, solo lo que quieras, opcionalmente o sin — al contado o financiado:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Opciones recomendadas", sub: "Garantía Premium" },
                { label: "Pintura", sub: "y retoques" },
                { label: "Limpieza profesional", sub: "Detailing Deluxe" },
                { label: "Neumáticos", sub: "Cambio aceite" },
              ].map(({ label, sub }) => (
                <label key={label} className="flex items-start gap-2 bg-white border border-stone-200 rounded-xl p-3 cursor-pointer hover:border-[#EE7B22] transition-colors group">
                  <input type="checkbox" className="mt-0.5 shrink-0 accent-[#EE7B22]" />
                  <span className="text-[11px] font-semibold text-stone-700 leading-tight group-hover:text-[#EE7B22] transition-colors">
                    {label}<br /><span className="font-normal text-stone-400">{sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 5: CTA final con formulario ── */}
        <section className="py-10 px-6 bg-white border-b border-stone-100" ref={ctaRef}>
          <div className="max-w-xl mx-auto text-center">
            {submitted ? (
              <div className="p-6 rounded-2xl bg-green-50 border border-green-200">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <div className="font-extrabold text-green-800 text-lg mb-1">Solicitud recibida</div>
                <p className="text-sm text-green-700">Nos ponemos en contacto contigo por WhatsApp en los próximos minutos.</p>
              </div>
            ) : (
              <>
                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-5 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-base tracking-wide uppercase rounded-2xl transition-colors shadow-xl shadow-[#EE7B22]/25 inline-flex items-center justify-center gap-2"
                  >
                    <Lock className="h-5 w-5" />
                    Quiero comprar como un profesional
                  </button>
                ) : (
                  <form onSubmit={onSubmit} className="text-left space-y-3">
                    <div className="text-center mb-2">
                      <div className="text-sm font-extrabold text-stone-900">Tus datos de contacto</div>
                      <div className="text-xs text-stone-400 mt-0.5">{car.make} {car.model} {car.year} · {formatPrice(car.price)}</div>
                    </div>
                    <input
                      required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                    />
                    <input
                      required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="Teléfono WhatsApp (+34 600 000 000)"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                    />
                    <label className="flex items-start gap-2 text-xs text-stone-500 cursor-pointer">
                      <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 shrink-0 accent-[#EE7B22]" />
                      <span>Acepto que un comercial me contacte por WhatsApp para gestionar la compra.</span>
                    </label>
                    <button
                      type="submit"
                      disabled={!accepted || sending}
                      className="w-full py-5 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-base tracking-wide uppercase rounded-2xl transition-colors shadow-xl shadow-[#EE7B22]/25 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="h-5 w-5" />
                      {sending ? "Enviando…" : "Quiero comprar como un profesional"}
                    </button>
                  </form>
                )}
                <p className="mt-3 text-[11px] text-stone-400">
                  Sin compromiso · Sin adelanto · Tú decides cuando ves los números
                </p>
              </>
            )}
          </div>
        </section>

        {/* ── SECCIÓN 6: Otros coches disponibles ── */}
        {others.length > 0 && (
          <section className="py-10 px-6 bg-[#f8f9fb]">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold">Otros coches <em className="not-italic text-[#EE7B22]">disponibles</em></h2>
                <Link href="/tienda" className="text-xs font-bold uppercase tracking-widest text-[#EE7B22] hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {others.map((o) => (
                  <Link key={o.id} href={`/tienda/coche/${o.id}`}>
                    <article className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#EE7B22] hover:-translate-y-1 transition-all">
                      <CarThumb make={o.make} model={o.model} imageUrl={o.imageUrl} photos={o.photos} className="h-32 w-full" />
                      <div className="p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{o.make}</div>
                        <div className="text-sm font-extrabold leading-tight mt-0.5 line-clamp-1">{o.model}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{o.year} · {(o.km / 1000).toFixed(0)}k km</div>
                        <div className="mt-1.5 text-base font-black tabular-nums">{formatPrice(o.price)}</div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#070711] text-white/30 py-8 px-6 text-center text-xs border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-white font-extrabold text-sm">pujamos<span className="text-[#EE7B22]">tu</span>coche.es</div>
          <p className="text-white/20 mt-1">© {new Date().getFullYear()} Pujamostucoche. Todos los derechos reservados.</p>
        </div>
      </footer>

      <WhatsappWidget
        message={`Hola, me interesa el ${car.make} ${car.model} ${car.year} (${formatPrice(car.price)}). ¿Sigue disponible?`}
        label={`Pregunta por este ${car.make}`}
      />
    </div>
  );
}

/* ─── HELPERS ──────────────────────────────────────────────────────────── */

function SpecRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-[#EE7B22]/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-[#EE7B22]" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-extrabold uppercase tracking-wide text-stone-400 text-[11px] w-24">{label}</span>
        <span className="font-extrabold uppercase tracking-wide text-stone-800">{value}</span>
      </div>
    </div>
  );
}

function PriceRow({
  icon,
  label,
  amount,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 text-sm text-white/70">{label}</div>
      <div className="text-sm font-extrabold tabular-nums whitespace-nowrap">{amount}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
