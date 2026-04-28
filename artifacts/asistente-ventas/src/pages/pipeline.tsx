import { useState } from "react";
import { Link } from "wouter";
import { useListLeads, useUpdateLead } from "@workspace/api-client-react";
import { LeadStage, LeadWithCar } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatRelative, formatPrice, stageLabel } from "@/lib/format";
import { MessageSquare, ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Column definitions ─────────────────────────────────── */

const ACTIVE_COLUMNS: { stage: LeadStage; label: string; color: string; bar: string }[] = [
  { stage: LeadStage.new, label: "Nuevo", color: "bg-sky-100 text-sky-800 border-sky-300", bar: "bg-sky-500" },
  { stage: LeadStage.awaiting_deposit, label: "Esperando señal", color: "bg-amber-100 text-amber-800 border-amber-300", bar: "bg-amber-500" },
  { stage: LeadStage.locked, label: "Bloqueado", color: "bg-rose-100 text-rose-800 border-rose-300", bar: "bg-rose-500" },
  { stage: LeadStage.doubting, label: "Con dudas", color: "bg-violet-100 text-violet-800 border-violet-300", bar: "bg-violet-500" },
];

const CLOSED_COLUMNS: { stage: LeadStage; label: string; dot: string }[] = [
  { stage: LeadStage.released, label: "Liberado", dot: "bg-sky-400" },
  { stage: LeadStage.won, label: "Cerrado", dot: "bg-emerald-500" },
  { stage: LeadStage.lost, label: "Perdido", dot: "bg-zinc-400" },
];

const ALL_STAGES: { value: LeadStage; label: string }[] = [
  { value: LeadStage.new, label: "Nuevo" },
  { value: LeadStage.awaiting_deposit, label: "Esperando señal" },
  { value: LeadStage.locked, label: "Bloqueado" },
  { value: LeadStage.doubting, label: "Con dudas" },
  { value: LeadStage.released, label: "Liberado" },
  { value: LeadStage.won, label: "Cerrado" },
  { value: LeadStage.lost, label: "Perdido" },
];

/* ─── Lead card ─────────────────────────────────────────── */

function LeadCard({ lead }: { lead: LeadWithCar }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { mutate: updateLead, isPending } = useUpdateLead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/leads"] });
        setOpen(false);
      },
    },
  });

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-2 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: lead.avatarColor }}
          >
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{lead.name}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0" />
              {lead.phone}
            </div>
          </div>
        </div>
        <Link
          href={`/inbox/${lead.id}`}
          className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Abrir conversación"
        >
          <MessageSquare className="h-4 w-4" />
        </Link>
      </div>

      {/* Car */}
      {lead.car && (
        <div className="text-[11px] bg-secondary/60 rounded-md px-2 py-1.5 leading-snug">
          <span className="font-medium">{lead.car.make} {lead.car.model}</span>
          {lead.car.price != null && (
            <span className="text-muted-foreground ml-1">· {formatPrice(lead.car.price)}</span>
          )}
        </div>
      )}

      {/* Last message */}
      {lead.lastMessagePreview && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
          "{lead.lastMessagePreview}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-muted-foreground">{formatRelative(lead.lastMessageAt ?? lead.updatedAt)}</span>

        {/* Stage mover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-secondary hover:bg-accent transition-colors disabled:opacity-50"
          >
            Mover <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <div className="absolute bottom-full right-0 mb-1 z-10 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
              {ALL_STAGES.filter((s) => s.value !== lead.stage).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateLead({ id: lead.id, data: { stage: s.value } })}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pipeline page ─────────────────────────────────────── */

export default function PipelinePage() {
  const { data: leads = [], isLoading } = useListLeads();

  const byStage = (stage: LeadStage) => leads.filter((l) => l.stage === stage);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Comercial</p>
        <h1 className="text-2xl font-bold">Pipeline de clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {leads.length} cliente{leads.length !== 1 ? "s" : ""} en seguimiento
        </p>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${ACTIVE_COLUMNS.length * 280 + 40}px` }}>
          {ACTIVE_COLUMNS.map((col) => {
            const colLeads = byStage(col.stage);
            return (
              <div key={col.stage} className="flex flex-col w-64 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", col.bar)} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", col.color)}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {isLoading && (
                    <>
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-card border border-border rounded-lg h-28 animate-pulse" />
                      ))}
                    </>
                  )}
                  {!isLoading && colLeads.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-8 border-2 border-dashed border-border rounded-lg">
                      Sin clientes aquí
                    </div>
                  )}
                  {colLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed deals strip */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Cerrados / Liberados</p>
        <div className="flex gap-6 flex-wrap">
          {CLOSED_COLUMNS.map((col) => {
            const colLeads = byStage(col.stage);
            return (
              <div key={col.stage} className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", col.dot)} />
                <span className="text-sm font-medium">{col.label}</span>
                <span className="text-sm text-muted-foreground font-semibold">{colLeads.length}</span>
                {colLeads.length > 0 && (
                  <div className="flex -space-x-1 ml-1">
                    {colLeads.slice(0, 4).map((l) => (
                      <Link
                        key={l.id}
                        href={`/inbox/${l.id}`}
                        title={l.name}
                        className="h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-white text-[9px] font-bold hover:z-10 transition-transform hover:scale-110"
                        style={{ backgroundColor: l.avatarColor }}
                      >
                        {l.name.charAt(0).toUpperCase()}
                      </Link>
                    ))}
                    {colLeads.length > 4 && (
                      <div className="h-6 w-6 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
                        +{colLeads.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
