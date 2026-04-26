import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export const BODY_TYPES = [
  { value: "suv", label: "SUV" },
  { value: "van", label: "Furgoneta / Monovolumen" },
  { value: "compact", label: "Compacto" },
  { value: "wagon", label: "Familiar" },
  { value: "cabrio", label: "Cabrio" },
  { value: "sedan", label: "Berlina" },
  { value: "coupe", label: "Coupé / Sport" },
  { value: "pickup", label: "Pickup" },
] as const;

export const POPULAR_BRANDS = [
  { value: "Mercedes", label: "Mercedes-Benz", slug: "mercedes" },
  { value: "Toyota", label: "Toyota", slug: "toyota" },
  { value: "Audi", label: "Audi", slug: "audi" },
  { value: "BMW", label: "BMW", slug: "bmw" },
  { value: "Volkswagen", label: "Volkswagen", slug: "volkswagen" },
  { value: "Seat", label: "Seat", slug: "seat" },
  { value: "Hyundai", label: "Hyundai", slug: "hyundai" },
  { value: "Peugeot", label: "Peugeot", slug: "peugeot" },
  { value: "Kia", label: "Kia", slug: "kia" },
  { value: "Renault", label: "Renault", slug: "renault" },
] as const;

export function inferBodyType(make: string, model: string): string {
  const m = `${make} ${model}`.toLowerCase();
  if (/(hilux|ranger|amarok|l200|navara|d-max|gladiator)/.test(m)) return "pickup";
  if (/(cabrio|convertible|roadster|spider|spyder|miata|\bz4\b)/.test(m)) return "cabrio";
  if (/(\btouring\b|\bavant\b|variant|combi|estate|\bsw\b|kombi|caravan|familiar|break)/.test(m)) return "wagon";
  if (/(q2|q3|q5|q7|q8|x1|x2|x3|x4|x5|x6|x7|tiguan|touareg|3008|5008|tucson|sportage|captur|kadjar|kuga|aircross|cayenne|macan|gla|glb|glc|gle|gls|rav4|cr-v|hr-v|kona|seltos|ateca|tarraco|arona|sorento|santa fe|t-cross|t-roc|niro|qashqai|juke|x-trail|grand cherokee|wrangler|defender|range rover|evoque|discovery|terrain|equinox)/.test(m)) return "suv";
  if (/(berlingo|caddy|touran|sharan|galaxy|picasso|scenic|zafira|tourneo|partner|kangoo|combo|verso|s-max|alhambra|espace|multivan|vito|caravelle)/.test(m)) return "van";
  if (/(coupé|coupe|cayman|boxster|\b911\b|\bm2\b|\bm4\b|\bm8\b|\bs5\b|\bs7\b|\brs5\b|\brs7\b|gt3|gtr|gt-r)/.test(m)) return "coupe";
  if (/(\ba4\b|\ba6\b|\ba8\b|serie 3|serie 5|serie 7|clase c|clase e|clase s|insignia|mondeo|passat|superb|laguna|talisman|octavia|320d|320i|520d|520i|c-class|e-class|s-class|jetta|legacy|camry|accord|optima)/.test(m)) {
    return "sedan";
  }
  return "compact";
}

function CarSilhouette({ type }: { type: string }) {
  switch (type) {
    case "suv":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M10 30 L10 23 Q15 14 26 13 L62 13 Q70 13 76 17 L88 22 L92 24 L92 30 L84 30 A6 6 0 0 0 72 30 L34 30 A6 6 0 0 0 22 30 Z" />
          <circle cx="28" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    case "van":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M6 30 L6 13 Q6 9 14 9 L72 9 Q80 9 84 14 L92 24 L92 30 L84 30 A6 6 0 0 0 72 30 L34 30 A6 6 0 0 0 22 30 Z" />
          <circle cx="28" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    case "compact":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M16 30 L16 23 Q18 18 26 16 L42 13 Q52 12 60 14 L72 19 L88 23 L88 30 L80 30 A6 6 0 0 0 68 30 L32 30 A6 6 0 0 0 20 30 Z" />
          <circle cx="26" cy="31" r="5" />
          <circle cx="74" cy="31" r="5" />
        </svg>
      );
    case "wagon":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M6 30 L6 23 Q8 16 18 14 L62 13 Q74 13 82 19 L92 22 L92 30 L84 30 A6 6 0 0 0 72 30 L26 30 A6 6 0 0 0 14 30 Z" />
          <circle cx="20" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    case "cabrio":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M14 30 L14 25 Q16 20 24 19 L76 19 Q86 19 90 25 L90 30 L82 30 A6 6 0 0 0 70 30 L32 30 A6 6 0 0 0 20 30 Z" />
          <path d="M22 19 Q35 12 50 12 Q66 12 78 19" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="3 2" />
          <circle cx="26" cy="31" r="5" />
          <circle cx="74" cy="31" r="5" />
        </svg>
      );
    case "sedan":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M10 30 L10 23 Q14 17 26 15 L42 12 Q54 11 64 14 L78 19 L92 23 L92 30 L84 30 A6 6 0 0 0 72 30 L28 30 A6 6 0 0 0 16 30 Z" />
          <circle cx="22" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    case "coupe":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M8 30 L8 24 Q12 18 28 15 L58 12 Q74 12 86 19 L92 23 L92 30 L84 30 A6 6 0 0 0 72 30 L26 30 A6 6 0 0 0 14 30 Z" />
          <circle cx="20" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    case "pickup":
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M6 30 L6 23 Q10 16 22 14 L42 14 L46 19 L46 22 L88 22 L92 24 L92 30 L84 30 A6 6 0 0 0 72 30 L30 30 A6 6 0 0 0 18 30 Z" />
          <circle cx="24" cy="31" r="5" />
          <circle cx="78" cy="31" r="5" />
        </svg>
      );
    default:
      return null;
  }
}

function HorizontalScroller({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        aria-label={ariaLabel}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Desplazar a la izquierda"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-md border border-stone-200 items-center justify-center text-stone-600 hover:text-[#EE7B22] hover:border-[#EE7B22] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Desplazar a la derecha"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#EE7B22] shadow-md text-white items-center justify-center hover:bg-[#C4621A] transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

type BodyTypePickerProps = {
  active?: string;
  onSelect: (value: string | undefined) => void;
};

export function BodyTypePicker({ active, onSelect }: BodyTypePickerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0A3D6E]">
          Busca por <span className="text-[#EE7B22]">carrocerías populares</span>
        </h3>
        {active && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="text-xs font-semibold text-[#EE7B22] hover:underline"
          >
            Quitar filtro
          </button>
        )}
      </div>
      <HorizontalScroller ariaLabel="Carrocerías populares">
        {BODY_TYPES.map((b) => {
          const isActive = active === b.value;
          return (
            <button
              key={b.value}
              type="button"
              aria-pressed={isActive}
              aria-label={`Filtrar por carrocería ${b.label}`}
              onClick={() => onSelect(isActive ? undefined : b.value)}
              className={cn(
                "snap-start shrink-0 w-[120px] sm:w-[130px] rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all bg-white",
                isActive
                  ? "border-[#EE7B22] shadow-md ring-2 ring-[#EE7B22]/20"
                  : "border-stone-200 hover:border-[#EE7B22] hover:shadow-md hover:-translate-y-0.5",
              )}
            >
              <div
                className={cn(
                  "h-12 w-full flex items-center justify-center rounded-lg",
                  isActive ? "text-[#EE7B22] bg-[#EE7B22]/10" : "text-[#0E4F8E] bg-stone-50",
                )}
              >
                <CarSilhouette type={b.value} />
              </div>
              <div className={cn("text-[11px] font-semibold text-center leading-tight", isActive ? "text-[#0A3D6E]" : "text-stone-700")}>
                {b.label}
              </div>
            </button>
          );
        })}
      </HorizontalScroller>
    </div>
  );
}

type BrandPickerProps = {
  active?: string;
  onSelect: (value: string | undefined) => void;
};

export function BrandPicker({ active, onSelect }: BrandPickerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0A3D6E]">
          Busca por <span className="text-[#EE7B22]">marcas populares</span>
        </h3>
        {active && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="text-xs font-semibold text-[#EE7B22] hover:underline"
          >
            Quitar filtro
          </button>
        )}
      </div>
      <HorizontalScroller ariaLabel="Marcas populares">
        {POPULAR_BRANDS.map((b) => {
          const isActive = active?.toLowerCase() === b.value.toLowerCase();
          return (
            <button
              key={b.value}
              type="button"
              aria-pressed={isActive}
              aria-label={`Filtrar por marca ${b.label}`}
              onClick={() => onSelect(isActive ? undefined : b.value)}
              className={cn(
                "snap-start shrink-0 w-[110px] sm:w-[120px] rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all bg-white",
                isActive
                  ? "border-[#EE7B22] shadow-md ring-2 ring-[#EE7B22]/20"
                  : "border-stone-200 hover:border-[#EE7B22] hover:shadow-md hover:-translate-y-0.5",
              )}
            >
              <div
                className={cn(
                  "h-12 w-full flex items-center justify-center rounded-lg",
                  isActive ? "bg-[#EE7B22]/10" : "bg-stone-50",
                )}
              >
                <img
                  src={`https://cdn.simpleicons.org/${b.slug}/${isActive ? "EE7B22" : "374151"}`}
                  alt={b.label}
                  className="h-7 w-auto"
                  loading="lazy"
                />
              </div>
              <div className={cn("text-[11px] font-semibold text-center leading-tight", isActive ? "text-[#0A3D6E]" : "text-stone-700")}>
                {b.label}
              </div>
            </button>
          );
        })}
      </HorizontalScroller>
    </div>
  );
}
