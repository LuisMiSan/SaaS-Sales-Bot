import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatRelative, statusLabel } from "@/lib/format";
import { Activity, Car, Lock, Sparkles, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

const STATUSES = ["open", "locking", "locked", "released", "sold"];

const STATUS_TONE: Record<string, string> = {
  open: "bg-emerald-500", locking: "bg-amber-500", locked: "bg-rose-500", released: "bg-sky-500", sold: "bg-zinc-500",
};

const KIND_ICON: Record<string, React.ElementType> = {
  lock: Lock, release: Activity, sale: TrendingUp, new_lead: Users, draft: Sparkles,
};

function Kpi({ icon: Icon, label, value, hint, accent }: { icon: React.ElementType; label: string; value: string; hint?: string; accent?: string }) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${accent ?? "bg-secondary text-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: summary } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity();

  const maxStage = Math.max(1, ...(summary?.leadsByStage.map((s) => s.count) ?? [1]));
  const maxStatus = Math.max(1, ...(summary?.carsByStatus.map((s) => s.count) ?? [1]));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-5 md:space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Panel general</div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Estado del escaparate, leads activos y tiempo de respuesta.</p>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={Car} label="En escaparate" value={String(summary?.openCars ?? "·")} hint="Disponibles para bloquear" accent="bg-emerald-500/15 text-emerald-400" />
          <Kpi icon={Lock} label="Bloqueadas 2h" value={String(summary?.lockedCars ?? "·")} hint="Reservadas ahora mismo" accent="bg-rose-500/15 text-rose-400" />
          <Kpi icon={Users} label="Leads activos" value={String(summary?.activeLeads ?? "·")} hint="Conversaciones abiertas" accent="bg-sky-500/15 text-sky-400" />
          <Kpi icon={TrendingUp} label="Ventas 7 días" value={String(summary?.wonLast7d ?? "·")} hint={summary ? `Conversión ${(summary.conversionRate * 100).toFixed(0)}%` : undefined} accent="bg-primary/15 text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="p-5 lg:col-span-3 bg-card border-border">
            <div className="text-sm font-semibold mb-1">Inventario por estado</div>
            <div className="text-xs text-muted-foreground mb-4">Ahora mismo en el escaparate</div>
            <div className="space-y-2.5">
              {STATUSES.map((status) => {
                const row = summary?.carsByStatus.find((s) => s.status === status);
                const count = row?.count ?? 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-20 sm:w-32 text-xs text-foreground/80 truncate">{statusLabel(status)}</div>
                    <div className="flex-1 h-5 bg-secondary rounded overflow-hidden">
                      <motion.div
                        className={`h-full ${STATUS_TONE[status]} opacity-70`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxStatus) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <div className="w-6 text-xs font-medium tabular-nums text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Actividad reciente</div>
          </div>
          <ul className="divide-y divide-border">
            {(activity ?? []).slice(0, 12).map((item) => {
              const Icon = KIND_ICON[item.kind] ?? Activity;
              return (
                <li key={item.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground/80">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{item.text}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{formatRelative(item.at)}</div>
                </li>
              );
            })}
            {(!activity || activity.length === 0) && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">Aún no hay actividad.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
