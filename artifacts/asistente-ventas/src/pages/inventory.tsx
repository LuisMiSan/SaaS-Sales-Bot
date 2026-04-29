import { useState } from "react";
import { Link } from "wouter";
import { useListCarsStaff } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { CarThumb } from "@/components/car-thumb";
import { StatusBadge } from "@/components/badges";
import { Countdown } from "@/components/countdown";
import { attractivenessLabel, formatPrice, formatRelative, statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Eye, Fuel, Gauge, MapPin, Settings2 } from "lucide-react";
import { BulkImportDialog } from "@/components/bulk-import-dialog";

const FILTERS = [
  { value: undefined, label: "Todos" },
  { value: "open" as const, label: "Ventana abierta" },
  { value: "locked" as const, label: "Bloqueado" },
  { value: "released" as const, label: "Liberado" },
  { value: "sold" as const, label: "Vendido" },
];

export default function InventoryPage() {
  const [status, setStatus] = useState<"open" | "locked" | "released" | "sold" | undefined>(undefined);
  const { data: cars, isLoading } = useListCarsStaff(status ? { status } : undefined);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-5 md:space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Escaparate</div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Inventario</h1>
            <p className="text-sm text-muted-foreground mt-1">Cada coche con su ventana de oportunidad.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-md overflow-x-auto max-w-full">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setStatus(f.value)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                    status === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <BulkImportDialog />
          </div>
        </header>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Cargando inventario…</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(cars ?? []).map((car) => {
            const target = car.status === "locked" ? car.lockedUntil : car.availableUntil;
            const variant = car.status === "locked" ? "lock" : "open";
            return (
              <Link key={car.id} href={`/cars/${car.id}`}>
                <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-colors cursor-pointer group">
                  <div className="relative">
                    <CarThumb make={car.make} model={car.model} imageUrl={car.imageUrl} photos={car.photos} className="h-40 w-full" />
                    <div className="absolute top-2 left-2"><StatusBadge status={car.status} /></div>
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 backdrop-blur text-[10px] text-white/90">
                      <Eye className="h-3 w-3" /> {car.viewersNow}
                    </div>
                    {car.status === "released" && car.releasedAt && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-sky-500/30 backdrop-blur text-[10px] text-sky-100">
                        Liberado {formatRelative(car.releasedAt)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold text-sm leading-tight truncate">
                        {car.make} {car.model}
                      </div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">{car.year}</div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-lg font-semibold tabular-nums">{formatPrice(car.price)}</div>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {attractivenessLabel(car.attractiveness)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1"><Gauge className="h-3 w-3" /> {(car.km / 1000).toFixed(0)}k km</span>
                      <span className="inline-flex items-center gap-1"><Fuel className="h-3 w-3" /> {car.fuel}</span>
                      <span className="inline-flex items-center gap-1"><Settings2 className="h-3 w-3" /> {car.transmission}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {car.location}</span>
                      {car.status !== "sold" && <Countdown target={target} variant={variant} />}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {(cars ?? []).length === 0 && !isLoading && (
          <Card className="p-12 text-center text-sm text-muted-foreground bg-card border-border">
            No hay coches en el filtro <span className="text-foreground">{statusLabel(status ?? "open")}</span>.
          </Card>
        )}
      </div>
    </div>
  );
}
