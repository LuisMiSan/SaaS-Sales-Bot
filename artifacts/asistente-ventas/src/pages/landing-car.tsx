import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useGetCar, useCreateLead, useListCars, getGetCarQueryKey } from "@workspace/api-client-react";
import type { PublicCar } from "@workspace/api-client-react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Fuel,
  Lock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Gauge,
  Settings2,
  Calendar,
  Timer,
  Zap,
  DoorOpen,
  Users,
  Palette,
  CarFront,
  Pipette,
  Wind,
  PlayCircle,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { WhatsappWidget } from "@/components/whatsapp-widget";
import { CustomerChat } from "@/components/customer-chat";
import { formatPrice } from "@/lib/format";

type StoredLead = { leadId: number; publicToken: string; name: string; phone: string };

function loadStoredLead(carId: number): StoredLead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`pujamostucoche.lead.${carId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLead>;
    if (
      typeof parsed.leadId === "number" &&
      typeof parsed.publicToken === "string" &&
      parsed.publicToken.length > 0 &&
      typeof parsed.name === "string" &&
      typeof parsed.phone === "string"
    ) {
      return { leadId: parsed.leadId, publicToken: parsed.publicToken, name: parsed.name, phone: parsed.phone };
    }
    return null;
  } catch {
    return null;
  }
}

function saveStoredLead(carId: number, value: StoredLead) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`pujamostucoche.lead.${carId}`, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function Gallery({ car }: { car: PublicCar }) {
  const photos = car.photos?.length ? car.photos : car.imageUrl ? [car.imageUrl] : [];
  const [idx, setIdx] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-stone-100 shadow-sm h-[260px] sm:h-[380px] md:h-[460px] flex items-center justify-center">
        <CarFront className="h-20 w-20 text-stone-300" />
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm">
        <img
          src={photos[idx]}
          alt={`${car.make} ${car.model} foto ${idx + 1}`}
          className="w-full h-[260px] sm:h-[380px] md:h-[460px] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
        />
        {photos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 text-white text-xs font-bold">
              {idx + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-thin">
          {photos.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === idx ? "border-[#EE7B22]" : "border-transparent"}`}>
              <img src={url} alt="" className="h-16 w-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingCarPage() {
  const [, params] = useRoute("/tienda/coche/:id");
  const id = params ? Number(params.id) : 0;
  const { data: car } = useGetCar(id, { query: { enabled: !!id, queryKey: getGetCarQueryKey(id) } });
  const { data: allCars } = useListCars();
  const create = useCreateLead();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [stored, setStored] = useState<StoredLead | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) setStored(loadStoredLead(id));
  }, [id]);

  if (!car) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center text-stone-500 font-jakarta">Cargando ficha…</div>;
  }

  const others = (allCars ?? []).filter((c) => c.id !== car.id).slice(0, 4);
  const isLockedByOther = car.status === "locked" && !stored;

  const hasConsumption = car.consumptionUrban != null || car.consumptionHighway != null || car.consumptionMixed != null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted || !name.trim() || !phone.trim()) return;
    create.mutate(
      { data: { name: name.trim(), phone: phone.trim(), carId: car.id } },
      {
        onSuccess: (lead) => {
          const token = (lead as { publicToken?: string }).publicToken ?? "";
          if (!token) return;
          const value: StoredLead = { leadId: lead.id, publicToken: token, name: name.trim(), phone: phone.trim() };
          saveStoredLead(car.id, value);
          setStored(value);
        },
      },
    );
  };

  return (
    <div className="bg-[#f5f7fa] text-[#222] font-jakarta min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap min-w-0 truncate">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-[#EE7B22] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="sm:hidden">Volver</span>
            <span className="hidden sm:inline">Volver al outlet</span>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-stone-500 mb-5">
            <Link href="/" className="hover:text-[#EE7B22]">Outlet</Link>
            <span className="mx-2">/</span>
            <span>{car.make}</span>
            <span className="mx-2">/</span>
            <span className="text-stone-800 font-semibold">{car.model}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            {/* LEFT: GALLERY + INFO */}
            <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
              <Gallery car={car} />

              {/* DATOS BÁSICOS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SpecCard icon={Calendar} label="Año" value={String(car.year)} />
                <SpecCard icon={Gauge} label="Kilómetros" value={`${(car.km / 1000).toFixed(0)}k km`} />
                <SpecCard icon={Fuel} label="Combustible" value={car.fuel} />
                <SpecCard icon={Settings2} label="Cambio" value={car.transmission} />
                {car.horsepower != null && <SpecCard icon={Zap} label="Potencia" value={`${car.horsepower} CV`} />}
                {car.doors != null && <SpecCard icon={DoorOpen} label="Puertas" value={String(car.doors)} />}
                {car.seats != null && <SpecCard icon={Users} label="Plazas" value={String(car.seats)} />}
                {car.color && <SpecCard icon={Palette} label="Color" value={car.color} />}
                {car.bodyType && <SpecCard icon={CarFront} label="Carrocería" value={car.bodyType} />}
                {car.engineCc != null && <SpecCard icon={Pipette} label="Cilindrada" value={`${car.engineCc} cc`} />}
              </div>

              {/* DESCRIPCIÓN */}
              {car.description ? (
                <section className="bg-white rounded-2xl p-7 shadow-sm">
                  <h2 className="text-xl font-extrabold mb-3">Sobre este coche</h2>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{car.description}</p>
                  <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                    <Bullet>Revisión multipunto y limpieza profesional</Bullet>
                    <Bullet>Garantía mecánica de 14 días incluida</Bullet>
                    <Bullet>Documentación y transferencia gestionadas</Bullet>
                    <Bullet>Financiación a tu medida disponible</Bullet>
                  </div>
                </section>
              ) : (
                <section className="bg-white rounded-2xl p-7 shadow-sm">
                  <h2 className="text-xl font-extrabold mb-3">Sobre este coche</h2>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {`${car.make} ${car.model} en perfecto estado, mantenimiento al día y revisión multipunto pasada en nuestro taller. Listo para entregar con garantía mecánica de 14 días.`}
                  </p>
                  <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                    <Bullet>Revisión multipunto y limpieza profesional</Bullet>
                    <Bullet>Garantía mecánica de 14 días incluida</Bullet>
                    <Bullet>Documentación y transferencia gestionadas</Bullet>
                    <Bullet>Financiación a tu medida disponible</Bullet>
                  </div>
                </section>
              )}

              {/* FICHA TÉCNICA COMPLETA */}
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-7 pt-6 pb-4 border-b border-stone-100">
                  <h2 className="text-xl font-extrabold">Ficha técnica y especificaciones</h2>
                </div>
                <div className="px-7 py-5 space-y-0">
                  <TechRow label="Marca" value={car.make} />
                  <TechRow label="Modelo" value={car.model} />
                  <TechRow label="Año" value={String(car.year)} />
                  <TechRow label="Kilómetros" value={`${car.km.toLocaleString("es-ES")} km`} />
                  <TechRow label="Combustible" value={car.fuel} />
                  <TechRow label="Cambio" value={car.transmission} />
                  {car.bodyType && <TechRow label="Carrocería" value={car.bodyType} />}
                  {car.color && <TechRow label="Color exterior" value={car.color} />}
                  {car.doors != null && <TechRow label="Puertas" value={String(car.doors)} />}
                  {car.seats != null && <TechRow label="Plazas" value={String(car.seats)} />}
                  {car.horsepower != null && <TechRow label="Potencia" value={`${car.horsepower} CV`} />}
                  {car.engineCc != null && <TechRow label="Cilindrada" value={`${car.engineCc} cc`} />}
                  <TechRow label="Ubicación" value={car.location} />
                </div>
              </section>

              {/* CONSUMO Y EMISIONES */}
              {(hasConsumption || car.co2 != null) && (
                <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-7 pt-6 pb-4 border-b border-stone-100">
                    <h2 className="text-xl font-extrabold">Consumo y emisiones</h2>
                  </div>
                  <div className="px-7 py-5">
                    {hasConsumption && (
                      <div className="grid grid-cols-3 gap-4 mb-5">
                        {car.consumptionUrban != null && (
                          <div className="text-center p-4 bg-stone-50 rounded-xl">
                            <Wind className="h-5 w-5 text-[#EE7B22] mx-auto mb-1" />
                            <div className="text-lg font-black">{car.consumptionUrban}</div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wide">Urbano L/100</div>
                          </div>
                        )}
                        {car.consumptionMixed != null && (
                          <div className="text-center p-4 bg-stone-50 rounded-xl">
                            <Wind className="h-5 w-5 text-[#EE7B22] mx-auto mb-1" />
                            <div className="text-lg font-black">{car.consumptionMixed}</div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wide">Mixto L/100</div>
                          </div>
                        )}
                        {car.consumptionHighway != null && (
                          <div className="text-center p-4 bg-stone-50 rounded-xl">
                            <Wind className="h-5 w-5 text-[#EE7B22] mx-auto mb-1" />
                            <div className="text-lg font-black">{car.consumptionHighway}</div>
                            <div className="text-[10px] text-stone-500 uppercase tracking-wide">Carretera L/100</div>
                          </div>
                        )}
                      </div>
                    )}
                    {car.co2 != null && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                        <div className="h-10 w-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-black text-xs">CO2</div>
                        <div>
                          <div className="text-lg font-black">{car.co2} g/km</div>
                          <div className="text-xs text-stone-500">Emisiones de CO2</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* VIDEO */}
              {car.videoUrl && (
                <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-7 pt-6 pb-4 border-b border-stone-100">
                    <h2 className="text-xl font-extrabold">Vídeo del vehículo</h2>
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

              {/* CÓMO FUNCIONA EL BLOQUEO */}
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-200">
                <header className="px-7 pt-6 pb-4 border-b border-stone-100">
                  <h2 className="text-xl font-extrabold leading-tight">Cómo funciona el bloqueo</h2>
                  <p className="text-sm text-stone-500 mt-1.5">
                    Sin pagar nada. Solo bloquéalo, te escribimos en minutos y tienes 2h para cerrar.
                  </p>
                </header>
                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                  <LockStep n={1} icon={Lock} title="Bloquéalo gratis" body="Pulsas el botón y la unidad queda solo para ti. Sin pagar nada. Sin compromiso." />
                  <LockStep n={2} icon={MessageSquare} title="Te escribimos por WhatsApp" body="En minutos un comercial te llama o escribe para resolver dudas y agendar visita." />
                  <LockStep n={3} icon={Timer} title="Tienes 2h para cerrar" body="Visita, financiación o transferencia. Si pasan las 2h sin cerrar, vuelve al outlet." />
                </div>
              </section>
            </div>

            {/* RIGHT: SIDEBAR — bloqueo */}
            <aside className="lg:col-span-2 order-1 lg:order-2">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-stone-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{car.make}</div>
                  <h1 className="text-2xl font-extrabold mt-1 leading-tight">{car.model}</h1>
                  {car.bodyType && <div className="text-xs text-stone-400 font-medium mt-0.5">{car.bodyType}</div>}
                  <div className="text-xs text-stone-500 mt-1.5 inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{car.location}</div>

                  <div className="mt-5 flex items-baseline gap-3">
                    <div className="text-4xl font-black tabular-nums">{formatPrice(car.price)}</div>
                  </div>
                  <div className="mt-1 text-xs text-[#27AE60] font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Bloqueo gratuito · Sin pagar nada
                  </div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#E74C3C] font-bold">
                    <Clock className="h-4 w-4" />
                    {car.status === "locked" ? "Reservada temporalmente" : "Disponible esta semana"}
                  </div>

                  {/* SPECS RÁPIDOS */}
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-stone-600 border-t border-stone-100 pt-4">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-stone-400" /> {car.year}</div>
                    <div className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-stone-400" /> {(car.km / 1000).toFixed(0)}k km</div>
                    <div className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-stone-400" /> {car.fuel}</div>
                    <div className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5 text-stone-400" /> {car.transmission}</div>
                    {car.horsepower != null && <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-stone-400" /> {car.horsepower} CV</div>}
                    {car.doors != null && <div className="flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5 text-stone-400" /> {car.doors} puertas</div>}
                  </div>

                  {stored ? (
                    <div className="mt-6">
                      <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-[#27AE60]">
                        <CheckCircle2 className="h-4 w-4" /> Reserva confirmada · {stored.phone}
                      </div>
                      <CustomerChat leadId={stored.leadId} publicToken={stored.publicToken} customerName={stored.name} />
                      <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                        Lo que escribes aquí también le llega al comercial por WhatsApp. Te respondemos en minutos en horario comercial.
                      </p>
                    </div>
                  ) : isLockedByOther ? (
                    <div className="mt-6 p-5 rounded-xl bg-stone-100 border border-stone-200 text-sm text-stone-700">
                      <div className="font-extrabold text-stone-900 flex items-center gap-2 mb-1.5">
                        <Lock className="h-5 w-5" /> Reservado por otro cliente
                      </div>
                      <p className="text-xs text-stone-600">
                        Esta unidad está bloqueada 2h. Si no se cierra la compra, vuelve al outlet automáticamente.
                      </p>
                      <Link href="/" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#C4621A] hover:underline">
                        Ver otros coches →
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-3">
                      <FormField label="Tu nombre">
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: María García"
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </FormField>
                      <FormField label="Teléfono (WhatsApp)">
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 ..."
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </FormField>
                      <label className="flex items-start gap-2 text-xs text-stone-500 cursor-pointer">
                        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
                        <span>Acepto que un comercial me contacte por WhatsApp para gestionar el bloqueo gratuito de 2h.</span>
                      </label>
                      <button
                        type="submit"
                        disabled={!accepted || create.isPending}
                        className="w-full py-3.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        {create.isPending ? "Enviando…" : "Bloquear unidad 2h"}
                      </button>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" /> Sin pagos · Cancelas cuando quieras
                      </div>
                    </form>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 text-sm">
                  <div className="flex items-center gap-2 text-stone-700 font-bold">
                    <CreditCard className="h-4 w-4 text-[#EE7B22]" /> Financiación a medida
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Desde 36 meses con condiciones a tu medida. Pregunta al comercial al bloquear.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* OTROS COCHES */}
          {others.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Otros coches del <em className="not-italic text-[#EE7B22]">outlet</em>
                </h2>
                <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#C4621A] hover:underline">
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
                        <div className="text-[11px] text-stone-500 mt-0.5">{o.year} · {(o.km/1000).toFixed(0)}k km</div>
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

      <footer className="bg-[#0A3D6E] text-white/60 py-10 px-6 text-center text-sm">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="text-white font-extrabold text-lg">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </div>
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Pujamostucoche. Todos los derechos reservados.</p>
        </div>
      </footer>

      <WhatsappWidget
        message={`Hola, me interesa el ${car.make} ${car.model} ${car.year} (${formatPrice(car.price)}). ¿Sigue disponible?`}
        label={`Pregunta por este ${car.make}`}
      />
    </div>
  );
}

function SpecCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
      <Icon className="h-5 w-5 text-[#EE7B22] mb-2" />
      <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">{label}</div>
      <div className="text-sm font-extrabold text-stone-900 mt-0.5">{value}</div>
    </div>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-semibold text-stone-900">{value}</span>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-stone-600">
      <CheckCircle2 className="h-4 w-4 text-[#27AE60] shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function LockStep({ n, icon: Icon, title, body }: { n: number; icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="h-10 w-10 rounded-lg bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center">
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Paso {n}</span>
      </div>
      <h3 className="text-base font-extrabold text-stone-900">{title}</h3>
      <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
