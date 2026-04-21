import { Car as CarIcon } from "lucide-react";

export function CarThumb({ make, model, imageUrl, className = "h-32 w-full" }: { make: string; model: string; imageUrl?: string | null; className?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={`${make} ${model}`} className={`${className} object-cover rounded-md`} />;
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
