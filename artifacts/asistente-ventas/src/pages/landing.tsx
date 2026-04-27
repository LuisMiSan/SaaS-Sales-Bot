import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import {
  CreditCard,
  Clock,
  ArrowRight,
  Lock,
  Eye,
  MessageSquare,
  CheckCircle2,
  LayoutDashboard,
  Car as CarIcon,
  Menu,
  X,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { WhatsappWidget, buildWhatsappUrl } from "@/components/whatsapp-widget";
import { BodyTypePicker, BrandPicker, inferBodyType } from "@/components/car-pickers";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: undefined, label: "Todos" },
  { value: "hot" as const, label: "Termina hoy" },
  { value: "normal" as const, label: "Quedan 2 días" },
  { value: "hard" as const, label: "Quedan 3 días" },
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
  const [bodyFilter, setBodyFilter] = useState<string | undefined>(undefined);
  const [brandFilter, setBrandFilter] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const cars = useMemo(() => {
    let open = (allCars ?? []).filter((c) => c.status !== "sold");
    if (filter) open = open.filter((c) => c.attractiveness === filter);
    if (bodyFilter) open = open.filter((c) => inferBodyType(c.make, c.model) === bodyFilter);
    if (brandFilter) open = open.filter((c) => c.make.toLowerCase() === brandFilter.toLowerCase());
    return open.slice(0, 15);
  }, [allCars, filter, bodyFilter, brandFilter]);

  const onPickBody = (value: string | undefined) => {
    setBodyFilter(value);
    if (value && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("catalogo-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const onPickBrand = (value: string | undefined) => {
    setBrandFilter(value);
    if (value && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("catalogo-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const { d, h, m, s } = useWeekCountdown();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => { document.documentElement.classList.add("dark"); };
  }, []);

  return (
    <div className="bg-[#f5f7fa] text-[#222] font-jakarta min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
          <Link href="/tienda" className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <a href="#catalogo" className="hover:text-[#EE7B22]">Ver coches</a>
            <a href="#proceso" className="hover:text-[#EE7B22]">Cómo funciona</a>
            <a href="#sobre-nosotros" className="hover:text-[#EE7B22]">Sobre nosotros</a>
            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white normal-case tracking-normal text-[11px]">
              <LayoutDashboard className="h-3.5 w-3.5" /> Panel comercial
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden h-9 w-9 -mr-1 inline-flex items-center justify-center rounded-md text-stone-700 hover:bg-stone-100"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <nav className="px-4 py-3 flex flex-col gap-1 text-sm font-semibold text-stone-700">
              <a href="#catalogo" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-stone-100">Ver coches</a>
              <a href="#proceso" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-stone-100">Cómo funciona</a>
              <a href="#sobre-nosotros" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-stone-100">Sobre nosotros</a>
              <Link href="/" onClick={() => setMenuOpen(false)} className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-stone-900 text-white text-sm">
                <LayoutDashboard className="h-4 w-4" /> Panel comercial
              </Link>
            </nav>
          </div>
        )}
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
              Miércoles a sábado. Bloqueas la unidad 2 horas sin pagar nada. Ningún precio sube. Lo que pierdes es la oportunidad.
            </p>
            <a href="#catalogo" className="mt-8 inline-flex items-center gap-2 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold px-7 py-3.5 rounded-md transition-colors">
              Ver ofertas Flash <ArrowRight className="h-4 w-4" />
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

      {/* CATÁLOGO — 15 coches (justo debajo del Hero) */}
      <section id="catalogo" className="bg-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Selectores de búsqueda — carrocerías + marcas */}
          <div className="space-y-8 mb-10 sm:mb-12">
            <BodyTypePicker active={bodyFilter} onSelect={onPickBody} />
            <BrandPicker active={brandFilter} onSelect={onPickBrand} />
          </div>

          <div id="catalogo-grid" className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10 scroll-mt-24">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Outlet de la <em className="not-italic text-[#EE7B22]">semana</em>
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {bodyFilter || brandFilter
                  ? `${cars.length} coches que coinciden con tu búsqueda.`
                  : "15 coches con ventana de oportunidad. Pulsa \"Bloquear unidad\" y queda reservada 2h para ti, sin pagar nada."}
              </p>
              {(bodyFilter || brandFilter) && (
                <button
                  type="button"
                  onClick={() => { setBodyFilter(undefined); setBrandFilter(undefined); }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#EE7B22] hover:underline"
                >
                  Quitar filtros y ver todos
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "shrink-0 px-4 py-1.5 text-xs font-semibold rounded-full border-2 transition-all whitespace-nowrap",
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

          {cars.length === 0 ? (
            <div className="border-2 border-dashed border-stone-200 rounded-xl py-12 px-6 text-center">
              <CarIcon className="h-10 w-10 mx-auto text-stone-300" />
              <p className="mt-3 text-sm font-semibold text-stone-700">
                Ningún coche del outlet coincide con esta búsqueda esta semana.
              </p>
              <p className="text-xs text-stone-500 mt-1">Prueba a cambiar de carrocería o marca, o quita los filtros.</p>
              <button
                type="button"
                onClick={() => { setBodyFilter(undefined); setBrandFilter(undefined); setFilter(undefined); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#EE7B22] hover:bg-[#C4621A] text-white text-xs font-extrabold transition-colors"
              >
                Quitar todos los filtros
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {cars.map((car, idx) => {
              const original = parseOriginal(car.notes);
              const discount = original ? Math.round(((original - car.price) / original) * 100) : null;
              const isLocked = car.status === "locked";
              return (
                <Link key={car.id} href={`/tienda/coche/${car.id}`}>
                  <article
                    className={cn(
                      "bg-white border rounded-xl overflow-hidden h-full flex flex-col transition-all",
                      isLocked
                        ? "border-stone-200 opacity-90 cursor-pointer hover:shadow-md"
                        : "border-stone-200 cursor-pointer hover:shadow-xl hover:border-[#EE7B22] hover:-translate-y-1",
                    )}
                  >
                    <div className="relative">
                      <CarThumb
                        make={car.make}
                        model={car.model}
                        imageUrl={car.imageUrl}
                        className={cn("h-44 w-full", isLocked && "grayscale")}
                      />
                      {isLocked ? (
                        <span className="absolute top-3 left-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Reservado
                        </span>
                      ) : (
                        <>
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
                        </>
                      )}
                      {!isLocked && discount && discount > 0 && (
                        <span className="absolute top-3 right-3 bg-[#27AE60] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          -{discount}%
                        </span>
                      )}
                      {!isLocked && (
                        <span className="absolute bottom-3 right-3 bg-black/45 backdrop-blur text-white text-[10px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {car.viewersNow} viendo
                        </span>
                      )}
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
                        <span className={cn("text-2xl font-black tabular-nums", isLocked && "text-stone-500")}>{formatPrice(car.price)}</span>
                        {!isLocked && original && (
                          <span className="text-sm text-stone-400 line-through tabular-nums">{formatPrice(original)}</span>
                        )}
                      </div>
                      {isLocked ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-600 font-bold">
                          <Lock className="h-3.5 w-3.5" />
                          Vuelve al outlet en {timeUntilLabel(car.lockedUntil ?? car.availableUntil)}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#E74C3C] font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          Quedan {timeUntilLabel(car.availableUntil)}
                        </div>
                      )}
                      {isLocked ? (
                        <button
                          disabled
                          className="mt-4 w-full py-2.5 rounded-lg bg-stone-200 text-stone-500 font-extrabold text-sm cursor-not-allowed"
                        >
                          Reservado por otro cliente
                        </button>
                      ) : (
                        <button className="mt-4 w-full py-2.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors">
                          Bloquear unidad
                        </button>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ATAJOS — recorridos típicos del comprador */}
      <section className="bg-white py-14 px-6 border-t border-stone-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          <QuickAction icon={CarIcon} title="Ver coches" desc="15 oportunidades esta semana" href="#catalogo" />
          <QuickAction icon={Lock} title="Cómo funciona" desc="Bloqueo gratis 2h, sin compromiso" href="#proceso" />
          <QuickAction
            icon={MessageSquare}
            title="Habla por WhatsApp"
            desc="Te respondemos en minutos"
            href={
              buildWhatsappUrl(
                "Hola, vengo del outlet de Pujamostucoche.es y me gustaría que me ayudéis a encontrar coche.",
              ) ?? "#proceso"
            }
            external={Boolean(
              buildWhatsappUrl(
                "Hola, vengo del outlet de Pujamostucoche.es y me gustaría que me ayudéis a encontrar coche.",
              ),
            )}
          />
          <QuickAction icon={CreditCard} title="Financiación" desc="Planes a tu medida" href="#sobre-nosotros" />
        </div>
      </section>

      {/* MARCAS */}
      <section className="py-14 px-6" style={{ background: "#eef2f7" }}>
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Marcas <em className="not-italic text-[#EE7B22]">disponibles</em>
        </h2>
        <p className="text-center text-sm text-stone-500 mt-1">Las mejores marcas del mercado pasan por el escaparate</p>
        <div className="mt-10 max-w-7xl mx-auto bg-white rounded-xl overflow-hidden">
          <div className="flex items-center gap-16 py-10 px-8 overflow-hidden">
            <div className="flex items-center gap-16 animate-[scroll_30s_linear_infinite] shrink-0">
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <div key={i} className="shrink-0 h-12 flex items-center justify-center min-w-[90px] text-stone-400 hover:text-stone-700 transition-colors" title={b.name}>
                  <img
                    src={`https://cdn.simpleicons.org/${b.slug}/9CA3AF`}
                    alt={b.name}
                    className="h-9 w-auto opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
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
              Una ventana de <em className="not-italic text-[#EE7B22]">2 horas</em>
            </h2>
            <p className="mt-3 text-white/60 max-w-xl mx-auto">
              Aquí no sube el precio. Aquí pierdes la oportunidad. Bloqueas la unidad sin pagar nada, hablamos por WhatsApp y decides con calma.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Step n={1} icon={Lock} title="Bloqueas la unidad" body="Pulsas el botón y la unidad queda reservada solo para ti durante 2h. Sin pagar nada. Sin compromiso." />
            <Step n={2} icon={MessageSquare} title="Hablamos por WhatsApp" body="Un comercial te escribe en minutos. Resolvéis dudas, planificáis prueba o entrega." />
            <Step n={3} icon={CheckCircle2} title="Cierras la compra" body="Tienes 2h para cerrar (visita, financiación o transferencia). Si no cierras, vuelve al escaparate como liberada." />
          </div>

          <div id="sobre-nosotros" className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-12">
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

      <WhatsappWidget
        message="Hola, vengo del outlet de Pujamostucoche.es y me gustaría que me ayudéis a encontrar coche."
        label="Habla con nosotros"
      />

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>
    </div>
  );
}

const BRANDS = [
  { name: "Seat", slug: "seat" },
  { name: "Volkswagen", slug: "volkswagen" },
  { name: "Renault", slug: "renault" },
  { name: "Peugeot", slug: "peugeot" },
  { name: "Citroën", slug: "citroen" },
  { name: "Ford", slug: "ford" },
  { name: "Toyota", slug: "toyota" },
  { name: "Hyundai", slug: "hyundai" },
  { name: "Kia", slug: "kia" },
  { name: "Dacia", slug: "dacia" },
  { name: "Opel", slug: "opel" },
  { name: "Fiat", slug: "fiat" },
];

function QuickAction({
  icon: Icon,
  title,
  desc,
  href,
  external,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
}) {
  const externalProps = external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};
  return (
    <a
      href={href}
      {...externalProps}
      className="group block text-center p-6 rounded-xl border border-stone-200 bg-white hover:border-[#EE7B22] hover:shadow-lg hover:-translate-y-1 transition-all"
    >
      <div className="h-12 w-12 mx-auto rounded-full bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center mb-3 group-hover:bg-[#EE7B22] group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-extrabold text-stone-900">{title}</div>
      <div className="text-xs text-stone-500 mt-1">{desc}</div>
    </a>
  );
}

function Step({ n, icon: Icon, title, body }: { n: number; icon: React.ElementType; title: string; body: string }) {
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
