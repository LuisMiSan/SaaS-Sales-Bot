import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export const BODY_TYPES = [
  { value: "suv", label: "SUV", image: `${BASE}/body-types/suv.png` },
  { value: "van", label: "Furgoneta / Monovolumen", image: `${BASE}/body-types/van.png` },
  { value: "compact", label: "Compacto", image: `${BASE}/body-types/compact.png` },
  { value: "wagon", label: "Familiar", image: `${BASE}/body-types/wagon.png` },
  { value: "cabrio", label: "Cabrio", image: `${BASE}/body-types/cabrio.png` },
  { value: "sedan", label: "Berlina", image: `${BASE}/body-types/sedan.png` },
  { value: "coupe", label: "Coupé / Sport", image: `${BASE}/body-types/coupe.png` },
  { value: "pickup", label: "Pickup", image: `${BASE}/body-types/pickup.png` },
] as const;

export const POPULAR_BRANDS = [
  { value: "Seat", label: "Seat", slug: "seat" },
  { value: "Volkswagen", label: "Volkswagen", slug: "volkswagen" },
  { value: "Renault", label: "Renault", slug: "renault" },
  { value: "Peugeot", label: "Peugeot", slug: "peugeot" },
  { value: "Citroën", label: "Citroën", slug: "citroen" },
  { value: "Ford", label: "Ford", slug: "ford" },
  { value: "Toyota", label: "Toyota", slug: "toyota" },
  { value: "Hyundai", label: "Hyundai", slug: "hyundai" },
  { value: "Kia", label: "Kia", slug: "kia" },
  { value: "Dacia", label: "Dacia", slug: "dacia" },
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
                "snap-start shrink-0 w-[150px] sm:w-[170px] rounded-xl border-2 overflow-hidden flex flex-col transition-all bg-white",
                isActive
                  ? "border-[#EE7B22] shadow-lg ring-2 ring-[#EE7B22]/20"
                  : "border-stone-200 hover:border-[#EE7B22] hover:shadow-md hover:-translate-y-0.5",
              )}
            >
              <div
                className={cn(
                  "h-20 sm:h-24 w-full flex items-center justify-center overflow-hidden",
                  isActive ? "bg-[#EE7B22]/5" : "bg-stone-50",
                )}
              >
                <img
                  src={b.image}
                  alt={`Vehículo tipo ${b.label}`}
                  className="h-full w-full object-contain object-center"
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <div
                className={cn(
                  "px-2 py-2 text-[12px] font-semibold text-center leading-tight border-t",
                  isActive ? "text-[#0A3D6E] border-[#EE7B22]/30 bg-[#EE7B22]/5" : "text-stone-700 border-stone-100",
                )}
              >
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
