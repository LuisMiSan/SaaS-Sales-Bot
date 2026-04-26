import { TrendingDown, BadgeCheck, Equal } from "lucide-react";
import { formatPrice } from "@/lib/format";

interface MarketPriceCardProps {
  ourPrice: number;
  marketMin: number | null | undefined;
  marketMax: number | null | undefined;
}

export function MarketPriceCard({ ourPrice, marketMin, marketMax }: MarketPriceCardProps) {
  if (!marketMin || !marketMax || marketMax <= marketMin) return null;

  const lo = Math.min(ourPrice, marketMin);
  const hi = Math.max(marketMax, ourPrice);
  const range = hi - lo || 1;
  const ourPct = ((ourPrice - lo) / range) * 100;
  const minPct = ((marketMin - lo) / range) * 100;
  const maxPct = ((marketMax - lo) / range) * 100;

  const mid = (marketMin + marketMax) / 2;
  const isBelow = ourPrice < marketMin;
  const isAbove = ourPrice > marketMax;
  const savings = Math.max(0, Math.round(mid - ourPrice));
  const savingsPct = mid > 0 ? Math.round((savings / mid) * 100) : 0;

  return (
    <section className="bg-white rounded-2xl p-7 shadow-sm border border-stone-200">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500">
            Precio vs mercado
          </div>
          <h2 className="text-xl font-extrabold mt-1">
            ¿Cuánto cuesta este coche en{" "}
            <em className="not-italic text-[#EE7B22]">otros portales</em>?
          </h2>
        </div>
        {isBelow && savings > 0 ? (
          <div className="shrink-0 bg-[#27AE60]/10 border border-[#27AE60]/30 text-[#1F8B4C] rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest font-bold">Ahorras</div>
            <div className="text-lg font-black tabular-nums leading-none mt-0.5">
              {formatPrice(savings)}
            </div>
            <div className="text-[10px] font-semibold mt-0.5">≈ {savingsPct}% sobre la media</div>
          </div>
        ) : isAbove ? (
          <div className="shrink-0 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest font-bold">Por encima del rango</div>
            <div className="text-xs font-semibold mt-1">Incluye revisión y garantía</div>
          </div>
        ) : (
          <div className="shrink-0 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest font-bold inline-flex items-center gap-1">
              <Equal className="h-3 w-3" /> En mercado
            </div>
            <div className="text-xs font-semibold mt-1">Precio alineado con portales</div>
          </div>
        )}
      </div>

      <div className="relative pt-10 pb-12">
        <div className="absolute inset-x-0 top-10 h-2.5 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-[#0E4F8E]/40 via-[#0E4F8E]/55 to-[#0E4F8E]/40"
            style={{ left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%` }}
          />
        </div>

        <Marker pct={minPct} top label="Mín. portales" value={formatPrice(marketMin)} color="#0E4F8E" />
        <Marker pct={maxPct} top label="Máx. portales" value={formatPrice(marketMax)} color="#0E4F8E" align="end" />

        <div
          className="absolute"
          style={{ left: `${Math.min(98, Math.max(2, ourPct))}%`, top: "30px" }}
        >
          <div className="w-1 h-7 bg-[#EE7B22] rounded-full -translate-x-1/2" />
          <div
            className="mt-1.5 bg-[#EE7B22] text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shadow-md whitespace-nowrap inline-flex items-center gap-1"
            style={{
              transform:
                ourPct < 18
                  ? "translateX(-12px)"
                  : ourPct > 82
                    ? "translateX(calc(-100% + 12px))"
                    : "translateX(-50%)",
            }}
          >
            <BadgeCheck className="h-3 w-3" /> Nuestro precio · {formatPrice(ourPrice)}
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        <Stat label="Mínimo" value={formatPrice(marketMin)} sub="Coches.net, AutoScout24…" />
        <Stat label="Tú pagas" value={formatPrice(ourPrice)} highlight />
        <Stat label="Máximo" value={formatPrice(marketMax)} sub="mismo modelo y año" />
      </div>

      <div className="mt-5 flex items-start gap-2.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-3">
        {isBelow ? (
          <TrendingDown className="h-4 w-4 text-[#27AE60] shrink-0 mt-0.5" />
        ) : (
          <Equal className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
        )}
        <span>
          {isBelow
            ? "Estimación basada en unidades comparables (mismo modelo, año y kilometraje aproximado) publicadas en los principales portales españoles. Por ser una unidad de outlet, sale por debajo del mínimo que verás esta semana en el mercado."
            : isAbove
              ? "Esta unidad está por encima de la media de mercado: incluye revisión multipunto, garantía mecánica de 14 días y trámites cubiertos. Si te encaja en presupuesto, pulsa Bloquear y lo hablamos por WhatsApp."
              : "Precio dentro del rango habitual de portales para esta misma versión y kilometraje. Lo que sumamos: revisión multipunto, 14 días de garantía mecánica y trámites cubiertos."}
        </span>
      </div>
    </section>
  );
}

function Marker({
  pct,
  label,
  value,
  color,
  align = "start",
  top: _top,
}: {
  pct: number;
  label: string;
  value: string;
  color: string;
  align?: "start" | "end";
  top?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const isNearLeft = clamped < 18;
  const isNearRight = clamped > 82;
  const transform = isNearLeft
    ? "translateX(-12px)"
    : isNearRight
      ? "translateX(calc(-100% + 12px))"
      : align === "end"
        ? "translateX(-50%)"
        : "translateX(-50%)";
  return (
    <div className="absolute" style={{ left: `${clamped}%`, top: "0px" }}>
      <div className="w-px h-4 absolute left-0 top-7 -translate-x-1/2" style={{ backgroundColor: color }} />
      <div style={{ transform }}>
        <div
          className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
          style={{ color }}
        >
          {label}
        </div>
        <div className="text-xs font-extrabold tabular-nums mt-0.5" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-[#EE7B22]/40 bg-[#EE7B22]/5" : "border-stone-200 bg-stone-50/50"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest font-bold text-stone-500">{label}</div>
      <div
        className={`text-base font-black tabular-nums mt-1 ${
          highlight ? "text-[#EE7B22]" : "text-stone-800"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}
