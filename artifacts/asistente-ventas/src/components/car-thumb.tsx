import { Car as CarIcon } from "lucide-react";
import { sanitizePhotoUrl } from "@/lib/format";

function resolveImage(url: string): string {
  url = sanitizePhotoUrl(url);
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  const base = import.meta.env.BASE_URL || "/";
  const trimmed = url.startsWith("/") ? url.slice(1) : url;
  return base.endsWith("/") ? base + trimmed : base + "/" + trimmed;
}

export function CarThumb({
  make,
  model,
  imageUrl,
  photos,
  className = "h-32 w-full",
  bg = "bg-[#0a1628]",
}: {
  make: string;
  model: string;
  imageUrl?: string | null;
  photos?: string[] | null;
  className?: string;
  bg?: string;
}) {
  const displayUrl = imageUrl || (photos && photos.length > 0 ? photos[0] : null);
  if (displayUrl) {
    return (
      <div className={`${className} ${bg} rounded-md overflow-hidden flex items-center justify-center`}>
        <img
          src={resolveImage(displayUrl)}
          alt={`${make} ${model}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }
  // Deterministic color from make
  const hash = (make + model).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return (
    <div
      className={`${className} rounded-md flex items-center justify-center relative overflow-hidden border border-border`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 35% 18%), hsl(${(hue + 40) % 360} 30% 10%))`,
      }}
    >
      <div className="absolute inset-0 bg-grid opacity-30" />
      <CarIcon className="h-10 w-10 text-white/40 relative z-10" />
      <div className="absolute bottom-1.5 left-2 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
        {make}
      </div>
    </div>
  );
}
