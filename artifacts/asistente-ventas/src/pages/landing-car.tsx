import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useGetCar, useCreateLead, useListCars, getGetCarQueryKey } from "@workspace/api-client-react";
import type { PublicCar } from "@workspace/api-client-react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Settings2,
  Calendar,
  Timer,
  Zap,
  DoorOpen,
  Users,
  CarFront,
  Wind,
  MapPin,
  Fuel,
  PlayCircle,
  Phone,
  CalendarDays,
  Wrench,
  Globe,
  BadgeCheck,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { WhatsappWidget, buildWhatsappUrl, useWhatsappNumber } from "@/components/whatsapp-widget";
import { formatPrice, sanitizePhotoUrl } from "@/lib/format";

/* ─── GALERÍA ───────────────────────────────────────────────────────────── */
function Gallery({ car }: { car: PublicCar }) {
  const photos = (car.photos?.length ? car.photos : car.imageUrl ? [car.imageUrl] : []).map(sanitizePhotoUrl);
  const [idx, setIdx] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-stone-100 h-64 sm:h-[380px] flex items-center justify-center">
        <CarFront className="h-20 w-20 text-stone-300" />
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  const thumbs = photos.slice(0, 5);

  return (
    <div className="space-y-2">
      {/* Main + thumbnails side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 h-64 sm:h-[380px]">
        {/* Main photo */}
        <div className="sm:col-span-2 relative rounded-xl overflow-hidden bg-stone-100 group">
          <img
            src={photos[idx]}
            alt={`${car.make} ${car.model}`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
          />
          {photos.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/50 text-white text-xs font-bold">
                {idx + 1}/{photos.length}
              </div>
            </>
          )}
          {/* Banner precio mayorista */}
          <div className="absolute bottom-0 inset-x-0 bg-[#EE7B22]/95 text-white text-[11px] font-extrabold text-center py-2 uppercase tracking-widest">
            Precio mayorista verificado
          </div>
        </div>

        {/* Thumbnail grid */}
        {photos.length > 1 && (
          <div className="hidden sm:grid grid-rows-4 gap-2">
            {thumbs.slice(1).map((url, i) => (
              <button
                key={i}
                onClick={() => setIdx(i + 1)}
                className={`relative rounded-lg overflow-hidden bg-stone-100 border-2 transition-all ${idx === i + 1 ? "border-[#EE7B22]" : "border-transparent hover:border-stone-300"}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-black text-sm">
                    +{photos.length - 5}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scroll strip on mobile */}
      {photos.length > 1 && (
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`flex-shrink-0 rounded-lg overflow-hidden border-2 ${i === idx ? "border-[#EE7B22]" : "border-transparent"}`}>
              <img src={url} alt="" className="h-14 w-20 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────── */
export default function LandingCarPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ? Number(params.id) : 0;
  const { data: car } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: allCars } = useListCars();
  const create = useCreateLead();
  const waNumber = useWhatsappNumber();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!car) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center text-stone-500 font-jakarta">Cargando ficha…</div>;
  }

  const others = (allCars ?? [])
    .filter((c) => c.id !== car.id && c.status === "open")
    .slice(0, 4);

  const isLockedByOther = car.status === "locked";
  const hasConsumption = car.consumptionUrban != null || car.consumptionHighway != null || car.consumptionMixed != null;
  const monthlyEst = Math.round(car.price / 60);

  const waUrl = buildWhatsappUrl(waNumber, `Hola, me interesa el ${car.make} ${car.model} ${car.year} (${formatPrice(car.price)}) que vi en Pujamostucoche.es. ¿Podéis darme más información?`);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted || !name.trim() || !phone.trim()) return;
    create.mutate(
      { data: { name: name.trim(), phone: phone.trim(), carId: car.id } },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  return (
    <div className="bg-[#f0f2f5] text-[#222] font-jakarta min-h-screen">

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <a href="#datos" className="hover:text-[#EE7B22] transition-colors">Datos básicos</a>
            <a href="#ficha" className="hover:text-[#EE7B22] transition-colors">Ficha técnica</a>
            <a href="#garantia" className="hover:text-[#EE7B22] transition-colors">Garantía</a>
          </nav>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#EE7B22] whitespace-nowrap">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Volver al catálogo</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </header>

      <main className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* BREADCRUMB */}
          <nav className="text-xs text-stone-400 py-3">
            <Link href="/" className="hover:text-[#EE7B22]">Inicio</Link>
            <span className="mx-2">/</span>
            <span>{car.make}</span>
            <span className="mx-2">/</span>
            <span className="text-stone-700 font-semibold">{car.make} {car.model} {car.year}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-3 space-y-5 order-2 lg:order-1">

              {/* GALERÍA */}
              <Gallery car={car} />

              {/* DETALLES / PRECIO */}
              <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{car.make}</div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mt-0.5">
                      {car.make} {car.model}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded">{car.year}</span>
                      <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded">{(car.km / 1000).toFixed(0)}k km</span>
                      <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded">{car.fuel}</span>
                      {car.bodyType && <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded">{car.bodyType}</span>}
                      <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded"><MapPin className="h-3 w-3" />{car.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black tabular-nums text-[#0A0A1A]">{formatPrice(car.price)}</div>
                    <div className="text-xs text-stone-400 mt-0.5">Desde <strong className="text-[#EE7B22]">{monthlyEst} €/mes</strong> con financiación</div>
                  </div>
                </div>
              </div>

              {/* DATOS BÁSICOS */}
              <section id="datos" className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden scroll-mt-20">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="text-lg font-extrabold">Datos básicos</h2>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 divide-x divide-stone-100">
                  <BasicCell icon={Gauge} label="Kilómetros" value={`${(car.km / 1000).toFixed(0)}k`} />
                  <BasicCell icon={Calendar} label="Año" value={String(car.year)} />
                  <BasicCell icon={Fuel} label="Combustible" value={car.fuel} />
                  <BasicCell icon={Settings2} label="Cambio" value={car.transmission} />
                  {car.horsepower != null
                    ? <BasicCell icon={Zap} label="Potencia" value={`${car.horsepower} CV`} />
                    : <BasicCell icon={Zap} label="Potencia" value="—" />}
                  {car.doors != null
                    ? <BasicCell icon={DoorOpen} label="Puertas" value={String(car.doors)} />
                    : <BasicCell icon={DoorOpen} label="Puertas" value="—" />}
                  {car.seats != null
                    ? <BasicCell icon={Users} label="Plazas" value={String(car.seats)} />
                    : <BasicCell icon={Users} label="Plazas" value="—" />}
                  {car.bodyType
                    ? <BasicCell icon={CarFront} label="Carrocería" value={car.bodyType} />
                    : <BasicCell icon={MapPin} label="Ubicación" value={car.location} />}
                </div>
              </section>

              {/* DESCRIPCIÓN */}
              {car.description && (
                <section className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                  <h2 className="text-lg font-extrabold mb-3">Descripción</h2>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{car.description}</p>
                </section>
              )}

              {/* FICHA TÉCNICA */}
              <section id="ficha" className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden scroll-mt-20">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="text-lg font-extrabold">Ficha técnica y especificaciones</h2>
                </div>

                {/* Motor y prestaciones */}
                <div className="px-5 pt-4 pb-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-stone-400 mb-3">Motor y Prestaciones</h3>
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <TechRow label="Marca" value={car.make} />
                    <TechRow label="Modelo" value={car.model} />
                    <TechRow label="Año" value={String(car.year)} />
                    <TechRow label="Kilómetros" value={`${car.km.toLocaleString("es-ES")} km`} />
                    <TechRow label="Combustible" value={car.fuel} />
                    <TechRow label="Transmisión" value={car.transmission} />
                    {car.horsepower != null && <TechRow label="Potencia" value={`${car.horsepower} CV`} />}
                    {car.engineCc != null && <TechRow label="Cilindrada" value={`${car.engineCc} cc`} />}
                    {car.doors != null && <TechRow label="Número de puertas" value={String(car.doors)} />}
                    {car.seats != null && <TechRow label="Plazas" value={String(car.seats)} />}
                    {car.color && <TechRow label="Color" value={car.color} />}
                    {car.bodyType && <TechRow label="Carrocería" value={car.bodyType} />}
                    <TechRow label="Ubicación" value={car.location} />
                  </div>
                </div>

                {/* Consumo y emisiones */}
                {(hasConsumption || car.co2 != null) && (
                  <div className="border-t border-stone-100 px-5 pt-4 pb-5">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-stone-400 mb-4">Consumo y emisiones</h3>
                    <div className="flex flex-wrap gap-4">
                      {car.consumptionMixed != null && (
                        <div className="flex flex-col items-center gap-2">
                          <ConsumptionGauge value={car.consumptionMixed} unit="L/100" color="#3B82F6" />
                          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Consumo mixto</span>
                        </div>
                      )}
                      {car.consumptionUrban != null && (
                        <div className="flex flex-col items-center gap-2">
                          <ConsumptionGauge value={car.consumptionUrban} unit="L/100" color="#F59E0B" />
                          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Urbano</span>
                        </div>
                      )}
                      {car.consumptionHighway != null && (
                        <div className="flex flex-col items-center gap-2">
                          <ConsumptionGauge value={car.consumptionHighway} unit="L/100" color="#10B981" />
                          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Carretera</span>
                        </div>
                      )}
                      {car.co2 != null && (
                        <div className="flex flex-col items-center gap-2">
                          <ConsumptionGauge value={car.co2} unit="g/km" color="#EF4444" />
                          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">Emisiones CO2</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* VIDEO */}
              {car.videoUrl && (
                <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100">
                    <h2 className="text-lg font-extrabold">Vídeo del vehículo</h2>
                  </div>
                  <div className="p-5">
                    {car.videoUrl.includes("youtube") || car.videoUrl.includes("youtu.be") ? (
                      <div className="aspect-video rounded-xl overflow-hidden">
                        <iframe
                          src={car.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a href={car.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors">
                        <PlayCircle className="h-8 w-8 text-[#EE7B22]" />
                        <span className="text-sm font-semibold text-stone-700">Ver vídeo del vehículo</span>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* GARANTÍA */}
              <section id="garantia" className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden scroll-mt-20">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight">
                    Tu coche con la garantía más completa del mercado
                  </h2>
                  <p className="text-sm text-stone-500 mt-3 max-w-lg">
                    Todos nuestros coches pasan una revisión profesional de más de 320 puntos de control y se entregan con garantía oficial Velocar Premium de 12 meses.
                  </p>
                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#EE7B22]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Wrench className="h-4 w-4 text-[#EE7B22]" />
                      </div>
                      <p className="text-sm text-stone-600">Cobertura integral del motor, caja de cambios, sistema eléctrico, frenos y dirección.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#EE7B22]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="h-4 w-4 text-[#EE7B22]" />
                      </div>
                      <p className="text-sm text-stone-600">Asistencia y servicio en toda España.</p>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <div className="h-8 w-8 rounded-lg bg-[#EE7B22]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BadgeCheck className="h-4 w-4 text-[#EE7B22]" />
                      </div>
                      <p className="text-sm text-stone-600">Reparaciones sin coste según tu nivel de cobertura. Trámites de transferencia incluidos.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ESTADO ACTUAL DEL VEHÍCULO */}
              <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="text-lg font-extrabold">Estado actual del vehículo</h2>
                  <p className="text-xs text-stone-500 mt-1">Un coche, cero sorpresas</p>
                </div>
                <div className="p-5">
                  <div className="flex gap-6 mb-6">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded border border-stone-200"
                        style={{ backgroundColor: colorToHex(car.color ?? "") }}
                      />
                      <span className="text-[11px] text-stone-500 font-semibold">Exterior</span>
                      {car.color && <span className="text-[10px] text-stone-400">{car.color}</span>}
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded border border-stone-200 bg-stone-800" />
                      <span className="text-[11px] text-stone-500 font-semibold">Interior</span>
                      <span className="text-[10px] text-stone-400">Oscuro</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Car top-view SVG */}
                    <div className="flex flex-col items-center gap-2">
                      <svg viewBox="0 0 80 160" className="w-20 h-40 text-stone-400">
                        <rect x="22" y="8" width="36" height="144" rx="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <rect x="26" y="42" width="28" height="76" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="8" y="20" width="10" height="22" rx="3" fill="currentColor" opacity="0.3"/>
                        <rect x="62" y="20" width="10" height="22" rx="3" fill="currentColor" opacity="0.3"/>
                        <rect x="8" y="118" width="10" height="22" rx="3" fill="currentColor" opacity="0.3"/>
                        <rect x="62" y="118" width="10" height="22" rx="3" fill="currentColor" opacity="0.3"/>
                        <line x1="26" y1="80" x2="54" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4"/>
                      </svg>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wide font-semibold">Vista superior</span>
                    </div>

                    {/* Quality badge */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-extrabold text-blue-900">Garantía de Calidad</span>
                      </div>
                      {[
                        "Revisión 320 puntos",
                        "Carrocería sin accidentes",
                        "Kilometraje verificado",
                        "Documentación en regla",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-blue-700 mb-1">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* CÓMO FUNCIONA */}
              <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="text-lg font-extrabold">Cómo funciona el bloqueo</h2>
                  <p className="text-xs text-stone-500 mt-1">Sin pagar nada. Bloquéalo, te escribimos en minutos y tienes 2h para cerrar.</p>
                </div>
                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                  <LockStep n={1} icon={Lock} title="Bloquéalo gratis" body="Pulsas el botón y la unidad queda solo para ti. Sin pagar nada. Sin compromiso." />
                  <LockStep n={2} icon={MessageSquare} title="Te escribimos por WhatsApp" body="En minutos un comercial te contacta para resolver dudas y agendar la visita." />
                  <LockStep n={3} icon={Timer} title="Tienes 2h para cerrar" body="Visita, financiación o transferencia. Si no cierras, vuelve al catálogo automáticamente." />
                </div>
              </section>

            </div>

            {/* ── SIDEBAR DERECHO ── */}
            <aside className="lg:col-span-2 order-1 lg:order-2">
              <div className="lg:sticky lg:top-24 space-y-4">

                {/* PRECIO Y BLOQUEO */}
                <div className="bg-white rounded-xl p-5 sm:p-6 border border-stone-200 shadow-sm">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{car.make}</div>
                  <h1 className="text-xl font-extrabold mt-0.5 leading-snug">{car.make} {car.model}</h1>
                  {car.bodyType && <div className="text-xs text-stone-400 mt-0.5">{car.bodyType}</div>}

                  {/* Specs rápidos */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                      <Calendar className="h-3 w-3" /> {car.year}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                      <Gauge className="h-3 w-3" /> {(car.km / 1000).toFixed(0)}k km
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                      <Wind className="h-3 w-3" /> {car.fuel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                      <Settings2 className="h-3 w-3" /> {car.transmission}
                    </span>
                    {car.horsepower != null && (
                      <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-full">
                        <Zap className="h-3 w-3" /> {car.horsepower} CV
                      </span>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="mt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-baseline gap-3 justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Al contado</div>
                        <div className="text-3xl font-black tabular-nums text-[#0A0A1A]">{formatPrice(car.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Financiado</div>
                        <div className="text-xl font-black text-[#EE7B22]">{monthlyEst} €<span className="text-sm font-bold">/mes</span></div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-stone-400">*Financiación estimada a 60 meses. Sujeto a aprobación bancaria.</div>
                  </div>

                  {/* ESTADO: reservado por otro */}
                  {isLockedByOther ? (
                    <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="font-extrabold text-stone-900 flex items-center gap-2 mb-1.5 text-sm">
                        <Lock className="h-5 w-5" /> Reservado temporalmente
                      </div>
                      <p className="text-xs text-stone-600">
                        Esta unidad está bloqueada 2h por otro cliente. Si no se cierra la compra, vuelve al catálogo automáticamente.
                      </p>
                      <Link href="/" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#EE7B22] hover:underline">
                        Ver otros coches →
                      </Link>
                    </div>

                  ) : submitted ? (
                    <div className="mt-5 p-5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center">
                      <CheckCircle2 className="h-10 w-10 text-[#16A34A] mx-auto mb-3" />
                      <div className="font-extrabold text-[#15803D] text-base mb-1">Reserva recibida</div>
                      <p className="text-xs text-[#166534] leading-relaxed">
                        Nos ponemos en contacto contigo por WhatsApp en los próximos minutos para gestionar la visita.
                      </p>
                    </div>

                  ) : (
                    <form onSubmit={onSubmit} className="mt-5 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Tu nombre</label>
                        <input
                          required value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: María García"
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1.5">Teléfono (WhatsApp)</label>
                        <input
                          required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 600 000 000"
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </div>
                      <label className="flex items-start gap-2 text-xs text-stone-500 cursor-pointer">
                        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 shrink-0" />
                        <span>Acepto que un comercial me contacte para gestionar el bloqueo gratuito de 2h.</span>
                      </label>
                      <button
                        type="submit"
                        disabled={!accepted || create.isPending}
                        className="w-full py-3.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        {create.isPending ? "Enviando…" : "Reservar vehículo"}
                      </button>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" /> Sin pagos · Sin compromiso · Cancelas cuando quieras
                      </div>
                    </form>
                  )}

                  {/* WhatsApp directo */}
                  {!submitted && waUrl && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <p className="text-xs text-stone-400 text-center mb-2.5">¿Prefieres hablar directamente?</p>
                      <a
                        href={waUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-lg bg-[#25D366] hover:bg-[#1FBA57] text-white font-extrabold text-sm transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" /> Preguntar por WhatsApp
                      </a>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <a
                          href={`tel:+${waNumber || "34604928624"}`}
                          className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" /> Llamar ahora
                        </a>
                        <a
                          href={buildWhatsappUrl(waNumber, `Hola, me gustaría agendar una cita para ver el ${car.make} ${car.model} ${car.year}. ¿Cuándo os va bien?`) ?? undefined}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors"
                        >
                          <CalendarDays className="h-3.5 w-3.5" /> Agendar cita
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* MINI GARANTÍA */}
                <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-stone-900">Garantía de Calidad</div>
                      <ul className="mt-2 space-y-1">
                        {["Revisión 50+ puntos", "14 días garantía mecánica", "Transferencia incluida", "Sin comisiones ocultas"].map((t) => (
                          <li key={t} className="flex items-center gap-1.5 text-xs text-stone-500">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#27AE60] shrink-0" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* OTROS COCHES */}
          {others.length > 0 && (
            <section className="mt-14">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold">Otros coches <em className="not-italic text-[#EE7B22]">disponibles</em></h2>
                <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#EE7B22] hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {others.map((o) => (
                  <Link key={o.id} href={`/coche/${o.id}`}>
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
            </section>
          )}
        </div>
      </main>

      <footer className="bg-[#070711] text-white/30 py-10 px-6 text-center text-sm border-t border-white/5">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="text-white font-extrabold text-base">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Pujamostucoche. Todos los derechos reservados.</p>
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

function BasicCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-4 px-2 text-center">
      <Icon className="h-5 w-5 text-[#EE7B22]" />
      <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold leading-tight">{label}</div>
      <div className="text-xs font-extrabold text-stone-800 leading-tight">{value}</div>
    </div>
  );
}

function ConsumptionGauge({ value, unit, color }: { value: number; unit: string; color: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const max = unit === "g/km" ? 200 : 12;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="text-base font-black leading-none" style={{ color }}>{value}</div>
        <div className="text-[9px] text-stone-400 font-semibold mt-0.5">{unit}</div>
      </div>
    </div>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function GuaranteeItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-stone-600">
      <CheckCircle2 className="h-4 w-4 text-[#EE7B22] shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    negro: "#1a1a1a",
    blanco: "#f5f5f0",
    gris: "#808080",
    plata: "#c0c0c0",
    plateado: "#c0c0c0",
    rojo: "#cc2200",
    azul: "#1a3ccc",
    verde: "#2d8c3e",
    naranja: "#ee7b22",
    amarillo: "#f5d800",
    marrón: "#7b4c2a",
    beige: "#f5e8c8",
    dorado: "#cfa000",
    burdeos: "#800020",
    granate: "#800020",
  };
  const key = color.toLowerCase().split(" ")[0];
  return map[key] ?? "#888888";
}

function LockStep({ n, icon: Icon, title, body }: { n: number; icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-lg bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Paso {n}</span>
      </div>
      <h3 className="text-sm font-extrabold text-stone-900">{title}</h3>
      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
