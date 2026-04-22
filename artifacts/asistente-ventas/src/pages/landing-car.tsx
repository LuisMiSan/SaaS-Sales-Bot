import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useGetCar, useCreateLead, useListCars } from "@workspace/api-client-react";
import {
  ArrowLeft,
  Clock,
  Eye,
  Lock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Gauge,
  Fuel,
  Settings2,
  Calendar,
} from "lucide-react";
import { CarThumb } from "@/components/car-thumb";
import { formatDeposit, formatPrice } from "@/lib/format";

export default function LandingCarPage() {
  const [, params] = useRoute("/tienda/coche/:id");
  const id = params ? Number(params.id) : 0;
  const { data: car } = useGetCar(id, { query: { enabled: !!id } });
  const { data: allCars } = useListCars();
  const create = useCreateLead();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState<{ leadId: number } | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => { document.documentElement.classList.add("dark"); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!car) {
    return <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center text-stone-500 font-jakarta">Cargando ficha…</div>;
  }

  const original = parseOriginal(car.notes);
  const discount = original ? Math.round(((original - car.price) / original) * 100) : null;
  const others = (allCars ?? []).filter((c) => c.id !== car.id && c.status !== "sold").slice(0, 4);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted || !name.trim() || !phone.trim()) return;
    create.mutate(
      { data: { name: name.trim(), phone: phone.trim(), carId: car.id } },
      { onSuccess: (lead) => setDone({ leadId: lead.id }) },
    );
  };

  return (
    <div className="bg-[#f5f7fa] text-[#222] font-jakarta min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/tienda" className="text-xl font-extrabold tracking-tight">
            Pujamos<span className="text-[#EE7B22]">tu</span>coche.es
          </Link>
          <Link href="/tienda" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-[#EE7B22]">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al outlet
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-stone-500 mb-5">
            <Link href="/tienda" className="hover:text-[#EE7B22]">Outlet</Link>
            <span className="mx-2">/</span>
            <span>{car.make}</span>
            <span className="mx-2">/</span>
            <span className="text-stone-800 font-semibold">{car.model}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* GALLERY + INFO */}
            <div className="lg:col-span-3 space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm">
                <CarThumb make={car.make} model={car.model} imageUrl={car.imageUrl} className="w-full h-[360px] md:h-[440px]" />
                {discount && discount > 0 && (
                  <span className="absolute top-4 left-4 bg-[#27AE60] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    -{discount}% outlet
                  </span>
                )}
                <span className="absolute top-4 right-4 bg-black/45 backdrop-blur text-white text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> {car.viewersNow} viendo ahora
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SpecCard icon={Calendar} label="Año" value={String(car.year)} />
                <SpecCard icon={Gauge} label="Kilómetros" value={`${(car.km / 1000).toFixed(0)}k km`} />
                <SpecCard icon={Fuel} label="Combustible" value={car.fuel} />
                <SpecCard icon={Settings2} label="Cambio" value={car.transmission} />
              </div>

              <section className="bg-white rounded-2xl p-7 shadow-sm">
                <h2 className="text-xl font-extrabold mb-3">Sobre este coche</h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {car.notes ?? `${car.make} ${car.model} en perfecto estado, mantenimiento al día y revisión multipunto pasada en nuestro taller. Listo para entregar con garantía mecánica de 14 días.`}
                </p>
                <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                  <Bullet>Revisión multipunto y limpieza profesional</Bullet>
                  <Bullet>Garantía mecánica de 14 días incluida</Bullet>
                  <Bullet>Documentación y transferencia gestionadas</Bullet>
                  <Bullet>Financiación a tu medida disponible</Bullet>
                </div>
              </section>

              {/* PROCESO — corresponde a Buzón del SaaS */}
              <section className="bg-white rounded-2xl p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-extrabold">Cómo funciona el bloqueo</h2>
                  <span className="text-[10px] uppercase tracking-widest text-[#C4621A] bg-[#EE7B22]/10 px-2 py-0.5 rounded-full font-bold">Buzón · SaaS</span>
                </div>
                <ol className="space-y-3 text-sm">
                  <Process n={1} icon={Lock}>Dejas {formatDeposit(car.depositCents)} de depósito y la unidad sale del escaparate solo para ti.</Process>
                  <Process n={2} icon={MessageSquare}>En minutos un comercial te escribe por WhatsApp. Resolvéis dudas, organizáis prueba o entrega.</Process>
                  <Process n={3} icon={CheckCircle2}>En 12h decides. Si cierras, el depósito va a cuenta. Si no, se devuelve y la unidad vuelve al outlet.</Process>
                </ol>
              </section>
            </div>

            {/* SIDEBAR — bloqueo */}
            <aside className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl p-7 shadow-sm border border-stone-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{car.make}</div>
                  <h1 className="text-2xl font-extrabold mt-1 leading-tight">{car.model}</h1>
                  <div className="text-xs text-stone-500 mt-1.5 inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{car.location}</div>

                  <div className="mt-5 flex items-baseline gap-3">
                    <div className="text-4xl font-black tabular-nums">{formatPrice(car.price)}</div>
                    {original && (
                      <div className="text-base text-stone-400 line-through tabular-nums">{formatPrice(original)}</div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-stone-500">Depósito reembolsable: <strong className="text-stone-800 font-bold">{formatDeposit(car.depositCents)}</strong></div>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#E74C3C] font-bold">
                    <Clock className="h-4 w-4" />
                    Quedan {timeUntilLabel(car.availableUntil)} de outlet
                  </div>

                  {done ? (
                    <div className="mt-6 p-5 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/30 text-sm text-stone-800">
                      <div className="font-extrabold text-[#27AE60] flex items-center gap-2 mb-1.5">
                        <CheckCircle2 className="h-5 w-5" /> Solicitud recibida
                      </div>
                      <p>Hemos creado tu petición de bloqueo. Un comercial te escribirá por WhatsApp al <strong>{phone}</strong> en los próximos minutos.</p>
                      <Link href={`/inbox/${done.leadId}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#C4621A] hover:underline">
                        Ver conversación en el panel comercial →
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="mt-6 space-y-3">
                      <Field label="Tu nombre">
                        <input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: María García"
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </Field>
                      <Field label="Teléfono (WhatsApp)">
                        <input
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 ..."
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
                        />
                      </Field>
                      <label className="flex items-start gap-2 text-xs text-stone-500 cursor-pointer">
                        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
                        <span>Acepto que un comercial me contacte por WhatsApp y entiendo que reservo {formatDeposit(car.depositCents)} durante 12h.</span>
                      </label>
                      <button
                        type="submit"
                        disabled={!accepted || create.isPending}
                        className="w-full py-3.5 rounded-lg bg-[#EE7B22] hover:bg-[#C4621A] text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        {create.isPending ? "Enviando…" : "Bloquear unidad 12h"}
                      </button>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#27AE60]" /> Pago seguro · Cancelas cuando quieras
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

          {/* OTROS COCHES — corresponde a Inventario */}
          {others.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Otros coches del <em className="not-italic text-[#EE7B22]">outlet</em>
                </h2>
                <Link href="/tienda" className="text-xs font-bold uppercase tracking-widest text-[#C4621A] hover:underline">
                  Ver los 15 →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {others.map((o) => (
                  <Link key={o.id} href={`/tienda/coche/${o.id}`}>
                    <article className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#EE7B22] hover:-translate-y-1 transition-all">
                      <CarThumb make={o.make} model={o.model} imageUrl={o.imageUrl} className="h-32 w-full" />
                      <div className="p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#EE7B22]">{o.make}</div>
                        <div className="text-sm font-extrabold leading-tight mt-0.5 line-clamp-1">{o.model}</div>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-stone-600">
      <CheckCircle2 className="h-4 w-4 text-[#27AE60] shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function Process({ n, icon: Icon, children }: { n: number; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-[#EE7B22]/10 text-[#EE7B22] flex items-center justify-center font-black">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-stone-600 leading-relaxed pt-1.5">
        <strong className="text-stone-900 font-bold">Paso {n}.</strong> {children}
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 mb-1.5">{label}</label>
      {children}
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
