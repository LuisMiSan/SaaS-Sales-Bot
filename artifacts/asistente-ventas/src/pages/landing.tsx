import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import {
  ArrowRight,
  Lock,
  MessageSquare,
  CheckCircle2,
  Car as CarIcon,
  Menu,
  X,
  ShieldCheck,
  Users,
  Star,
  ChevronRight,
  TrendingDown,
  Search,
  Award,
  Pencil,
  Sparkles,
  Settings,
  RotateCcw,
  Droplets,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { WhatsappWidget, buildWhatsappUrl, useWhatsappNumber } from "@/components/whatsapp-widget";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_CARS_SHOWN = 15;

const COMPARE_ROWS = [
  ["Precio de compra", "Precio oficial (+15-25%)", "Precio mayorista real"],
  ["Transparencia de costes", "Limitada", "Total, sin letra pequeña"],
  ["Comisiones ocultas", "Frecuentes", "Nunca"],
  ["Acceso a subastas privadas", "Sin acceso", "Acceso directo"],
  ["Trámites de transferencia", "Coste extra", "Siempre incluidos"],
  ["Presión de venta", "Habitual", "Ninguna"],
  ["Revisión previa del vehículo", "No siempre", "Siempre"],
];

export default function LandingPage() {
  const { data: allCars, isLoading: carsLoading, isError: carsError, refetch: refetchCars } = useListCars();
  const [menuOpen, setMenuOpen] = useState(false);
  const waNumber = useWhatsappNumber();

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const cars = useMemo(
    () =>
      (allCars ?? [])
        .filter((c) => c.status === "open")
        .slice(0, MAX_CARS_SHOWN),
    [allCars],
  );

  const featuredCar = useMemo(
    () => (allCars ?? []).find((c) => c.status === "open") ?? allCars?.[0],
    [allCars],
  );

  useEffect(() => { document.documentElement.classList.remove("dark"); }, []);

  const waHeroUrl = buildWhatsappUrl(waNumber, "Hola, me gustaría consultar los coches disponibles hoy en Pujamostucoche.es.");

  return (
    <div className="bg-white text-[#0A0A1A] font-jakarta min-h-screen">

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#070711]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="text-base sm:text-xl font-extrabold tracking-tight whitespace-nowrap text-white">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-white/60">
            <a href="#catalogo" className="hover:text-[#EE7B22] transition-colors">Ver coches</a>
            <a href="#como-funciona" className="hover:text-[#EE7B22] transition-colors">Cómo funciona</a>
            <a href="#nosotros" className="hover:text-[#EE7B22] transition-colors">Nosotros</a>
            <a href="#catalogo" className="ml-2 px-4 py-2 rounded-md bg-[#EE7B22] hover:bg-[#C4621A] text-white transition-colors">
              Ver coches
            </a>
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden h-9 w-9 -mr-1 inline-flex items-center justify-center rounded-md text-white/70 hover:bg-white/10"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#070711]">
            <nav className="px-4 py-3 flex flex-col gap-1 text-sm font-semibold text-white/70">
              <a href="#catalogo" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-white/5 hover:text-white">Ver coches</a>
              <a href="#como-funciona" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-white/5 hover:text-white">Cómo funciona</a>
              <a href="#nosotros" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-white/5 hover:text-white">Nosotros</a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-16 bg-[#070711] text-white">
        <div className="relative overflow-hidden px-6 py-28 md:py-40 text-center">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,255,255,1) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,1) 80px)`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 60%,rgba(238,123,34,0.10) 0%,transparent 65%)" }}
          />
          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#EE7B22] border border-[#EE7B22]/30 bg-[#EE7B22]/10 mb-7">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE7B22] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EE7B22]" />
              </span>
              Coches disponibles ahora
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Deja de pagar el margen<br className="hidden sm:block" /> de los{" "}
              <em className="not-italic text-[#EE7B22]">concesionarios.</em>
            </h1>
            <p className="mt-7 text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed">
              Compramos directamente a mayoristas y subastas. Sin intermediarios.
              Sin margen inflado. Solo el precio <strong className="text-white font-extrabold">justo</strong>.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold px-8 py-4 rounded-md transition-colors text-base"
              >
                Consultar coche disponible hoy <ArrowRight className="h-4 w-4" />
              </a>
              {waHeroUrl && (
                <a
                  href={waHeroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold px-8 py-4 rounded-md transition-colors text-base"
                >
                  <MessageSquare className="h-4 w-4" /> Hablar por WhatsApp
                </a>
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-white/40">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#EE7B22] text-[#EE7B22]" />
                ))}
                <span className="ml-1 text-white/60">4,8 en Google</span>
              </div>
              <span className="text-white/20">·</span>
              <span className="text-white/60">+1.200 coches vendidos</span>
              <span className="text-white/20">·</span>
              <span className="text-white/60">0 € comisiones ocultas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ¿SABES LO QUE...? */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            ¿Sabes lo que ningún concesionario<br className="hidden sm:block" /> te dirá jamás?
          </h2>
          <div className="mt-6 space-y-4 text-stone-500 leading-relaxed text-lg">
            <p>
              El margen medio de un concesionario en un coche de ocasión es del{" "}
              <strong className="text-[#0A0A1A]">15 al 25%</strong> sobre el precio real de mercado.
              Eso significa que en un coche de 15.000 €, estás pagando entre{" "}
              <strong className="text-[#0A0A1A]">2.250 € y 3.750 € de más</strong>, solo por el nombre en la fachada.
            </p>
            <p>
              Nosotros accedemos directamente a subastas de flotas y mayoristas. Sin escaparates de lujo.
              Sin vendedores a comisión. Sin ese margen.
            </p>
          </div>
          <a href="#catalogo" className="mt-8 inline-flex items-center gap-1.5 text-[#EE7B22] font-bold text-sm hover:underline">
            <ChevronRight className="h-4 w-4" /> Ver coches disponibles hoy
          </a>
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="bg-[#f5f7fa] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Nosotros vs. Ellos.{" "}
              <em className="not-italic text-[#EE7B22]">Sin rodeos.</em>
            </h2>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200">
            <div className="grid grid-cols-3 bg-[#070711] text-xs font-extrabold uppercase tracking-widest">
              <div className="px-4 sm:px-6 py-4 text-white/30">Característica</div>
              <div className="px-4 sm:px-6 py-4 text-center text-white/50">Concesionario</div>
              <div className="px-4 sm:px-6 py-4 text-center text-[#EE7B22]">Pujamostucoche</div>
            </div>
            {COMPARE_ROWS.map(([feat, them, us], i) => (
              <div key={i} className={cn("grid grid-cols-3 border-t border-stone-100", i % 2 === 1 && "bg-stone-50")}>
                <div className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold text-stone-600">{feat}</div>
                <div className="px-4 sm:px-6 py-3.5 text-center text-xs sm:text-sm text-stone-400">{them}</div>
                <div className="px-4 sm:px-6 py-3.5 text-center text-xs sm:text-sm font-bold text-[#EE7B22]">{us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EJEMPLO REAL */}
      {featuredCar && (
        <section className="bg-white py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold">
                Un ejemplo real.{" "}
                <em className="not-italic text-[#EE7B22]">Con números reales.</em>
              </h2>
            </div>

            <div className="bg-[#f5f7fa] border border-stone-200 rounded-2xl overflow-hidden">
              {/* Car header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-200 bg-white">
                <div className="w-10 h-8 bg-[#EE7B22] rounded flex items-center justify-center shrink-0">
                  <CarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-stone-900">
                    {featuredCar.make} {featuredCar.model} {featuredCar.year}
                  </div>
                  <div className="text-xs text-stone-400">
                    {featuredCar.km.toLocaleString("es-ES")} km · {featuredCar.fuel} · {featuredCar.transmission}
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="px-6 py-4 space-y-0">
                {[
                  { label: "Precio mayorista AUTO1", value: featuredCar.price - 1730, bold: false },
                  { label: "Fees de compra profesional", value: 280, bold: false },
                  { label: "Transporte hasta entrega", value: 200, bold: false },
                  { label: "Gastos administrativos", value: 250, bold: false },
                  { label: "Total pagado al mayorista", value: featuredCar.price - 1000, bold: true },
                  { label: "Fee Pujamostucoche (gestión)", value: 1000, bold: false },
                ].map(({ label, value, bold }) => (
                  <div key={label} className={`flex justify-between items-center py-2.5 border-b border-stone-100 last:border-0 text-sm ${bold ? "font-extrabold text-stone-900" : "text-stone-600"}`}>
                    <span>{label}</span>
                    <span className={bold ? "tabular-nums" : "tabular-nums text-stone-700"}>{formatPrice(value)}</span>
                  </div>
                ))}
              </div>

              {/* Total final */}
              <div className="mx-4 mb-4 bg-[#EE7B22] rounded-xl px-5 py-4 flex items-center justify-between">
                <span className="text-white font-extrabold text-sm uppercase tracking-wider">Precio total final</span>
                <span className="text-white font-black text-2xl tabular-nums">{formatPrice(featuredCar.price)}</span>
              </div>

              {/* Market comparison */}
              <div className="px-6 pb-6 text-center space-y-1.5">
                <div className="text-sm font-semibold text-stone-700">
                  Este mismo coche en el mercado tradicional:{" "}
                  <span className="line-through text-stone-400">
                    {formatPrice(Math.round(featuredCar.price * 1.12))} — {formatPrice(Math.round(featuredCar.price * 1.25))}
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Coches.net · Milanuncios · Concesionarios de ocasión — verificado hoy
                </div>
                <div className="text-[#EE7B22] font-extrabold text-sm">
                  Tu ahorro real: entre {formatPrice(Math.round(featuredCar.price * 0.12))} y {formatPrice(Math.round(featuredCar.price * 0.25))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href={`/coche/${featuredCar.id}`}
                className="inline-flex items-center gap-2 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold px-7 py-3.5 rounded-xl transition-colors text-sm"
              >
                Ver este {featuredCar.make} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* MODO IKEA */}
      <section className="bg-[#f5f7fa] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900">
            📦 Modo IKEA
          </h2>
          <p className="mt-3 text-base text-stone-500">
            Tú decides el estado final de tu coche.
          </p>

          <div className="mt-8 bg-white rounded-2xl border border-stone-200 shadow-sm p-7 text-left space-y-6">
            <p className="text-sm text-stone-600 leading-relaxed">
              Recibes el vehículo directamente desde la campa mayorista, tal como está. Sin pintura
              de camuflaje. Sin ruedas nuevas que ya pagaste sin saberlo. Sin retoque cosmético inflado.
            </p>

            <div>
              <p className="text-sm font-bold text-stone-800 mb-4">
                Si quieres mejorarlo, tú eliges qué y cuánto:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Pencil, label: "Retoques de pintura" },
                  { icon: RotateCcw, label: "Cambio de ruedas" },
                  { icon: Sparkles, label: "Detailing profesional" },
                  { icon: Droplets, label: "Cambio de aceites y puesta a punto" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
                    <div className="h-8 w-8 rounded-lg bg-[#EE7B22]/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-[#EE7B22]" />
                    </div>
                    <span className="text-sm text-stone-700 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm font-bold text-stone-900">
              Tú tienes el control total de la inversión.
            </p>

            <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-[#EE7B22] shrink-0 mt-0.5" />
              <p className="text-sm text-stone-600">
                La gran mayoría de los vehículos que gestionamos solo necesitan una{" "}
                <strong className="text-stone-900">limpieza profesional</strong> para estar listos para rodar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISIÓN */}
      <section id="nosotros" className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Nuestra misión: que pagues{" "}
              <em className="not-italic text-[#EE7B22]">solo lo justo.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <ValueCard
              icon={ShieldCheck}
              title="Transparencia total"
              body="Precio fijo, sin sorpresas ni cargos ocultos. Lo que ves en pantalla es lo que pagas, sin letra pequeña."
            />
            <ValueCard
              icon={TrendingDown}
              title="Precios mayoristas"
              body="Compramos directamente a subastas y flotas empresariales. Sin intermediarios, sin margen de concesionario."
            />
            <ValueCard
              icon={Users}
              title="Trato personal"
              body="Un comercial real te atiende por WhatsApp. Sin bots, sin centralitas, sin esperas interminables."
            />
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="bg-[#f5f7fa] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Así de simple.{" "}
              <em className="not-italic text-[#EE7B22]">Así de distinto.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              n={1}
              icon={Search}
              title="Nos dices qué buscas"
              body="Elige entre los coches disponibles o escríbenos por WhatsApp con lo que necesitas. Respondemos en minutos."
            />
            <StepCard
              n={2}
              icon={Lock}
              title="Bloqueas la unidad 2h gratis"
              body="Reservas sin pagar nada. Tienes 2 horas para decidir con calma, sin presión de ningún tipo."
            />
            <StepCard
              n={3}
              icon={CheckCircle2}
              title="Cierras a precio justo"
              body="Sin sorpresas de última hora. El precio que ves es lo que pagas. Los trámites siempre incluidos."
            />
          </div>
        </div>
      </section>

      {/* CATÁLOGO — coches reales */}
      <section id="catalogo" className="bg-[#0E1A2E] py-20 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#EE7B22] mb-2">Inventario en directo</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Coches disponibles hoy —{" "}
                <em className="not-italic text-[#EE7B22]">Precio mayorista verificado</em>
              </h2>
            </div>
            {!carsLoading && (
              <div className="text-white/40 text-sm shrink-0">{cars.length} unidades esta semana</div>
            )}
          </div>

          {carsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/10" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-7 w-24 bg-white/10 rounded mt-3" />
                    <div className="h-9 w-full bg-white/5 rounded-lg mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : carsError ? (
            <div className="border-2 border-dashed border-white/10 rounded-xl py-14 px-6 text-center">
              <CarIcon className="h-10 w-10 mx-auto text-white/20" />
              <p className="mt-3 text-sm font-semibold text-white/60">No se han podido cargar los coches.</p>
              <button
                type="button"
                onClick={() => void refetchCars()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#EE7B22] text-white text-xs font-extrabold"
              >
                Volver a intentarlo
              </button>
            </div>
          ) : cars.length === 0 ? (
            <div className="border-2 border-dashed border-white/10 rounded-xl py-14 px-6 text-center">
              <CarIcon className="h-10 w-10 mx-auto text-white/20" />
              <p className="mt-3 text-sm font-semibold text-white/60">
                No hay coches disponibles en este momento. Vuelve pronto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {cars.map((car) => {
                const isLocked = car.status === "locked";
                return (
                  <Link key={car.id} href={`/coche/${car.id}`}>
                    <article
                      className={cn(
                        "bg-[#162033] border rounded-xl overflow-hidden h-full flex flex-col transition-all",
                        isLocked
                          ? "border-white/5 opacity-70 cursor-pointer"
                          : "border-white/10 cursor-pointer hover:border-[#EE7B22]/50 hover:shadow-2xl hover:-translate-y-1",
                      )}
                    >
                      <div className="relative">
                        <CarThumb
                          make={car.make}
                          model={car.model}
                          imageUrl={car.imageUrl}
                          photos={car.photos}
                          className={cn("h-44 w-full", isLocked && "grayscale opacity-50")}
                        />
                        {isLocked ? (
                          <span className="absolute top-3 left-3 bg-stone-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Reservado
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 bg-[#EE7B22] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            Disponible
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">
                          {car.make}
                        </div>
                        <div className="text-sm font-extrabold leading-tight mt-0.5 text-white line-clamp-1">
                          {car.model}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="bg-white/5 text-white/40 text-[11px] px-2 py-0.5 rounded">{car.year}</span>
                          <span className="bg-white/5 text-white/40 text-[11px] px-2 py-0.5 rounded">
                            {(car.km / 1000).toFixed(0)}k km
                          </span>
                          <span className="bg-white/5 text-white/40 text-[11px] px-2 py-0.5 rounded">{car.fuel}</span>
                        </div>
                        <div className="mt-3">
                          <span className="text-2xl font-black tabular-nums text-white">
                            {formatPrice(car.price)}
                          </span>
                        </div>
                        {isLocked ? (
                          <button
                            disabled
                            className="mt-4 w-full py-2.5 rounded-lg bg-white/5 text-white/25 font-extrabold text-sm cursor-not-allowed"
                          >
                            Reservado por otro cliente
                          </button>
                        ) : (
                          <button className="mt-4 w-full py-2.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors">
                            Ver este coche
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

      {/* FOOTER CTA */}
      <section className="bg-[#070711] py-20 px-6 text-center text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            En este sector, la transparencia<br /> es una{" "}
            <em className="not-italic text-[#EE7B22]">revolución.</em>
          </h2>
          <p className="mt-5 text-white/45 text-lg max-w-xl mx-auto">
            Compramos directamente a mayoristas para que tú pagues el precio real. Sin margen de
            escaparate, sin presión, sin sorpresas.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold px-8 py-4 rounded-md transition-colors"
            >
              Ver coches disponibles hoy <ArrowRight className="h-4 w-4" />
            </a>
            {waHeroUrl && (
              <a
                href={waHeroUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold px-8 py-4 rounded-md transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Consultar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#040408] text-white/25 py-10 px-6 text-center text-sm border-t border-white/5">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="text-white font-extrabold text-lg">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </div>
          <p>
            Concesionario de coches de ocasión · Madrid ·{" "}
            <a className="text-[#EE7B22] hover:underline" href="mailto:pujamostucoche@gmail.com">
              pujamostucoche@gmail.com
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-white/20 flex-wrap">
            <Link href="/privacidad" className="hover:text-white/50 transition-colors">Política de Privacidad</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-white/50 transition-colors">Política de Cookies</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-white/50 transition-colors">Aviso Legal y Términos</Link>
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Pujamostucoche. Todos los derechos reservados.</p>
        </div>
      </footer>

      <WhatsappWidget
        message="Hola, vengo de Pujamostucoche.es y me gustaría información sobre los coches disponibles."
        label="Habla con nosotros"
      />

      <style>{`
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>
    </div>
  );
}

function ValueCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="bg-[#f5f7fa] border border-stone-200 rounded-2xl p-8 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="h-12 w-12 rounded-xl bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({ n, icon: Icon, title, body }: { n: number; icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-4 p-7 rounded-2xl bg-white border border-stone-200 hover:shadow-lg hover:-translate-y-1 transition-all">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#EE7B22] text-white flex items-center justify-center font-black text-lg shrink-0">
          {n}
        </div>
        <div className="h-10 w-10 rounded-lg bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
    </div>
  );
}
