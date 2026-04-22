import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import {
  Search,
  Heart,
  CreditCard,
  Wrench,
  Clock,
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  MessageSquare,
  Gauge,
  Fuel,
  Settings2,
  CheckCircle2,
  Inbox as InboxIcon,
  LayoutDashboard,
  Car as CarIcon,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: undefined, label: "Todos" },
  { value: "hot" as const, label: "Atractivos 24h" },
  { value: "normal" as const, label: "Normales 48h" },
  { value: "hard" as const, label: "Difíciles 72h" },
];

function endOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const sat = (6 - day + 7) % 7;
  const out = new Date(d);
  out.setDate(d.getDate() + (sat || 7));
  out.setHours(23, 59, 0, 0);
  return out;
}

function useWeekCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = endOfWeek().getTime() - now;
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

export default function LandingPage() {
  const { data: allCars } = useListCars();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const cars = useMemo(() => {
    const open = (allCars ?? []).filter((c) => c.status !== "sold");
    if (!filter) return open.slice(0, 15);
    return open.filter((c) => c.attractiveness === filter).slice(0, 15);
  }, [allCars, filter]);

  const { d, h, m, s } = useWeekCountdown();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => { document.documentElement.classList.add("dark"); };
  }, []);

  return (
    <div className="bg-[#f5f7fa] text-[#222] font-jakarta min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/tienda" className="text-xl font-extrabold tracking-tight">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <a href="#catalogo" className="hover:text-[#EE7B22]">Ver coches</a>
            <a href="#proceso" className="hover:text-[#EE7B22]">Cómo funciona</a>
            <a href="#confianza" className="hover:text-[#EE7B22]">Sobre nosotros</a>
            <Link href="/" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white normal-case tracking-normal text-[11px]">
              <LayoutDashboard className="h-3.5 w-3.5" /> Panel comercial
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-20">
        <div
          className="relative overflow-hidden text-center px-6 py-24 md:py-32"
          style={{ background: "linear-gradient(135deg,#0E4F8E 0%,#15558A 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(212,165,116,0.18) 0%,transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#EE7B22] border border-[#EE7B22]/40 bg-[#EE7B22]/15 mb-5">
              Ofertas Flash Outlet
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
              Coches de <em className="not-italic text-[#EE7B22]">oportunidad</em><br /> cada semana
            </h1>
            <p className="mt-5 text-lg text-white/70">
              Miércoles a sábado. Bloqueas la unidad 12h con un pequeño depósito. Ningún precio sube. Lo que pierdes es la oportunidad.
            </p>
            <a href="#catalogo" className="mt-8 inline-flex items-center gap-2 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold px-7 py-3.5 rounded-md transition-colors">
              Ver oferta esta semana <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* COUNTDOWN GLOBAL */}
        <div className="bg-[#E74C3C] text-white text-center py-3.5 px-6 font-bold text-sm">
          <Clock className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Oferta termina sábado 23:59 —
          <span className="font-mono font-black ml-2 tabular-nums">
            {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
          </span>
        </div>
      </section>

      {/* QUICK ACTIONS — corresponden a las secciones del SaaS */}
      <section className="bg-white py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          <QuickAction icon={CarIcon} title="Catálogo outlet" desc="15 coches esta semana" href="#catalogo" tag="Inventario" />
          <QuickAction icon={InboxIcon} title="Mi bloqueo" desc="Habla con tu comercial" href="#proceso" tag="Buzón" />
          <QuickAction icon={LayoutDashboard} title="Estado en vivo" desc="Cuántas unidades quedan" href="#proceso" tag="Dashboard" />
          <QuickAction icon={CreditCard} title="Financiación" desc="Planes a tu medida" href="#confianza" />
        </div>
      </section>

      {/* MARCAS */}
      <section className="py-14 px-6" style={{ background: "#eef2f7" }}>
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Marcas <em className="not-italic text-[#EE7B22]">disponibles</em>
        </h2>
        <p className="text-center text-sm text-stone-500 mt-1">Las mejores marcas del mercado pasan por el escaparate</p>
        <div className="mt-10 max-w-7xl mx-auto bg-white rounded-xl overflow-hidden">
          <div className="flex items-center gap-12 py-8 px-8 overflow-hidden">
            <div className="flex items-center gap-12 animate-[scroll_30s_linear_infinite] shrink-0">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <div key={i} className="text-stone-400 hover:text-stone-800 font-extrabold text-xl tracking-widest shrink-0 transition-colors uppercase">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO — 15 coches */}
      <section id="catalogo" className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Outlet de la <em className="not-italic text-[#EE7B22]">semana</em>
              </h2>
              <p className="text-sm text-stone-500 mt-1">15 coches con ventana de oportunidad. Pulsa "Bloquear unidad" y queda solo para ti durante 12h.</p>
            </div>
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-full border-2 transition-all",
                    filter === f.value
                      ? "bg-[#EE7B22] border-[#EE7B22] text-white"
                      : "bg-transparent border-stone-200 text-stone-600 hover:border-[#EE7B22]",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {cars.map((car, idx) => {
              const original = parseOriginal(car.notes);
              const discount = original ? Math.round(((original - car.price) / original) * 100) : null;
              return (
                <Link key={car.id} href={`/tienda/coche/${car.id}`}>
                  <article className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#EE7B22] hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col">
                    <div className="relative">
                      <CarThumb make={car.make} model={car.model} imageUrl={car.imageUrl} className="h-44 w-full" />
                      {idx < 3 && (
                        <span className="absolute top-3 left-3 bg-[#E74C3C] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                          Flash
                        </span>
                      )}
                      {idx >= 3 && car.status === "open" && car.attractiveness === "hard" && (
                        <span className="absolute top-3 left-3 bg-[#F39C12] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                          Última
                        </span>
                      )}
                      {discount && discount > 0 && (
                        <span className="absolute top-3 right-3 bg-[#27AE60] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          -{discount}%
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 bg-black/45 backdrop-blur text-white text-[10px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {car.viewersNow} viendo
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{car.make}</div>
                      <div className="text-base font-extrabold leading-tight mt-1 line-clamp-1">{car.model}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="bg-stone-100 text-stone-600 text-[11px] px-2 py-0.5 rounded">{car.year}</span>
                        <span className="bg-stone-100 text-stone-600 text-[11px] px-2 py-0.5 rounded">{(car.km / 1000).toFixed(0)}k km</span>
                        <span className="bg-stone-100 text-stone-600 text-[11px] px-2 py-0.5 rounded">{car.fuel}</span>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black tabular-nums">{formatPrice(car.price)}</span>
                        {original && (
                          <span className="text-sm text-stone-400 line-through tabular-nums">{formatPrice(original)}</span>
                        )}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#E74C3C] font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        Quedan {timeUntilLabel(car.availableUntil)}
                      </div>
                      <button className="mt-4 w-full py-2.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors">
                        Bloquear unidad
                      </button>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESO — corresponde a Buzón + Dashboard */}
      <section id="proceso" className="bg-[#0E4F8E] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#EE7B22] border border-[#EE7B22]/40 bg-[#EE7B22]/15 mb-4">
              Cómo funciona
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Una ventana de <em className="not-italic text-[#EE7B22]">12 horas</em>
            </h2>
            <p className="mt-3 text-white/60 max-w-xl mx-auto">
              Aquí no sube el precio. Aquí pierdes la oportunidad. Bloqueas la unidad, hablamos por WhatsApp, decides con calma.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Step n={1} icon={Lock} title="Bloqueas la unidad" body="Pulsas el botón y dejas un pequeño depósito (100-300€). La retiramos del escaparate solo para ti." tag="Inventario" />
            <Step n={2} icon={MessageSquare} title="Hablamos por WhatsApp" body="Un comercial te escribe en minutos. Resolvéis dudas, planificáis prueba o entrega." tag="Buzón" />
            <Step n={3} icon={CheckCircle2} title="Cierras o liberas" body="En 12h decides. Si cierras, el depósito va a cuenta. Si no, vuelve al escaparate como liberado." tag="Dashboard" />
          </div>

          <div id="confianza" className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-12">
            <Stat n="14 días" l="Garantía mecánica" />
            <Stat n="+1.200" l="Coches vendidos" />
            <Stat n="4,8/5" l="Reseñas Google" />
            <Stat n="0€" l="Comisiones ocultas" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A3D6E] text-white/60 py-10 px-6 text-center text-sm">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="text-white font-extrabold text-lg">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </div>
          <p>Concesionario de coches de ocasión · Madrid · <a className="text-[#EE7B22] hover:underline" href="mailto:hola@pujamostucoche.es">hola@pujamostucoche.es</a></p>
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Pujamostucoche. Todos los derechos reservados.</p>
        </div>
      </footer>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>
    </div>
  );
}

const BRANDS = ["Audi", "BMW", "Mercedes", "Volkswagen", "Toyota", "Renault", "Seat", "Hyundai", "Kia", "Ford", "Peugeot", "Citroën"];

function QuickAction({ icon: Icon, title, desc, href, tag }: { icon: React.ElementType; title: string; desc: string; href: string; tag?: string }) {
  return (
    <a href={href} className="block text-center p-6 rounded-xl border border-stone-200 bg-white hover:border-[#EE7B22] hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="h-12 w-12 mx-auto rounded-full bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-extrabold text-stone-900">{title}</div>
      <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
      {tag && <div className="mt-3 inline-block text-[10px] uppercase tracking-widest text-[#C4621A] bg-[#EE7B22]/10 px-2 py-0.5 rounded-full font-bold">→ {tag}</div>}
    </a>
  );
}

function Step({ n, icon: Icon, title, body, tag }: { n: number; icon: React.ElementType; title: string; body: string; tag: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-[#EE7B22] text-stone-900 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold text-[#EE7B22]/80 uppercase tracking-widest">Paso {n}</span>
      </div>
      <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">{body}</p>
      <div className="mt-4 inline-block text-[10px] uppercase tracking-widest text-[#EE7B22] bg-[#EE7B22]/15 px-2 py-0.5 rounded-full font-bold">SaaS · {tag}</div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black text-[#EE7B22]">{n}</div>
      <div className="text-xs uppercase tracking-widest text-white/50 mt-1">{l}</div>
    </div>
  );
}

function timeUntilLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "0h";
  const h = Math.floor(ms / 3600_000);
  if (h >= 24) return `${Math.floor(h / 24)} días`;
  return `${h}h`;
}

function parseOriginal(notes: string | null | undefined): number | null {
  if (!notes) return null;
  const m = notes.match(/Precio original\s+(\d+)€/i);
  return m ? Number(m[1]) : null;
}
