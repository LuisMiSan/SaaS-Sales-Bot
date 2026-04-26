import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLeads,
  useGetLead,
  useSendLeadMessage,
  useDraftLeadReply,
  useSimulateIncomingMessage,
  useLockCar,
  getGetLeadQueryKey,
  getListLeadMessagesQueryKey,
  getListLeadsQueryKey,
  getGetCarQueryKey,
  getListCarsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CarThumb } from "@/components/car-thumb";
import { StatusBadge, StageBadge } from "@/components/badges";
import { Countdown } from "@/components/countdown";
import { formatPrice, formatRelative, formatTime, initials, intentLabel, stageLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronDown,
  Lock,
  MessageSquarePlus,
  Search,
  Send,
  Sparkles,
  Phone,
  Wand2,
} from "lucide-react";

const INTENTS = [
  { value: "first_response", label: "Primera respuesta" },
  { value: "ask_deposit", label: "Pedir cierre" },
  { value: "confirm_lock", label: "Confirmar bloqueo" },
  { value: "handle_doubt", label: "Cliente duda" },
  { value: "post_release", label: "Post liberación" },
] as const;

function pickAutoIntent(args: {
  stage: string;
  depositPaid: boolean;
  carStatus: string;
  lastIncoming: string | null;
  hasMessages: boolean;
}): string {
  const { stage, depositPaid, carStatus, lastIncoming, hasMessages } = args;
  const text = (lastIncoming ?? "").toLowerCase();

  if (!hasMessages) return "first_response";
  if (depositPaid || stage === "locked" || carStatus === "locked") return "confirm_lock";
  if (stage === "released" || carStatus === "released") return "post_release";
  if (stage === "awaiting_deposit") return "ask_deposit";

  if (/(bizum|transfer|paypal|pago|paga|ingres|cuenta|iban)/.test(text)) return "confirm_lock";
  if (/(reserv|bloque|deposit|señal|me lo quedo|lo cojo|lo quiero)/.test(text)) return "ask_deposit";
  if (/(no sé|duda|pensar|consult|mañana|familia|mujer|marido|hablar|me lo pienso)/.test(text)) return "handle_doubt";

  if (stage === "doubting") return "handle_doubt";
  if (stage === "new") return "first_response";
  return "handle_doubt";
}

const STAGE_FILTERS = [
  { value: undefined, label: "Todas" },
  { value: "new" as const, label: "Nuevas" },
  { value: "awaiting_deposit" as const, label: "Esperando depósito" },
  { value: "locked" as const, label: "Bloqueadas" },
  { value: "doubting" as const, label: "Dudas" },
  { value: "released" as const, label: "Liberadas" },
];

export default function InboxPage() {
  const [, params] = useRoute("/inbox/:id");
  const selectedId = params ? Number(params.id) : null;
  const [, navigate] = useLocation();

  const [stage, setStage] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: leads } = useListLeads(stage ? { stage: stage as never } : undefined);

  const filtered = (leads ?? []).filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search),
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: lead list — full width on mobile when no selection, hidden when one is open */}
      <aside
        className={cn(
          "w-full lg:w-[340px] shrink-0 border-r border-border bg-card flex-col h-full",
          selectedId ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Conversaciones</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{filtered.length}</span>
          </div>
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin -mx-1 px-1 pb-1">
            {STAGE_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setStage(f.value)}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-md font-medium whitespace-nowrap border",
                  stage === f.value
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.map((lead) => {
            const isSelected = lead.id === selectedId;
            const target = lead.car.status === "locked" ? lead.car.lockedUntil : null;
            return (
              <Link key={lead.id} href={`/inbox/${lead.id}`}>
                <div
                  className={cn(
                    "px-4 py-3 border-b border-border/60 cursor-pointer transition-colors",
                    isSelected ? "bg-secondary/80" : "hover:bg-secondary/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback style={{ backgroundColor: lead.avatarColor + "33", color: lead.avatarColor }}>
                        {initials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">{lead.name}</div>
                        <div className="text-[10px] text-muted-foreground shrink-0">
                          {lead.lastMessageAt ? formatRelative(lead.lastMessageAt) : ""}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {lead.car.make} {lead.car.model}
                      </div>
                      <div className="text-xs text-foreground/70 truncate mt-1">
                        {lead.lastMessagePreview ?? "—"}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <StageBadge stage={lead.stage} />
                        {target && <Countdown target={target} variant="lock" />}
                        {lead.unreadCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5">
                            {lead.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No hay conversaciones que coincidan.
            </div>
          )}
        </div>
      </aside>

      {/* Right: conversation — full width on mobile when a lead is open, hidden when none */}
      <section
        className={cn(
          "flex-1 min-w-0",
          selectedId ? "flex flex-col" : "hidden lg:block",
        )}
      >
        {selectedId ? (
          <Conversation key={selectedId} leadId={selectedId} onClose={() => navigate("/inbox")} />
        ) : (
          <EmptyConversation />
        )}
      </section>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center max-w-sm px-6">
        <div className="h-14 w-14 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
          <MessageSquarePlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">Selecciona una conversación</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cada lead que pulsa "Bloquear unidad" entra aquí. Tienes una ventana corta. Que cuente.
        </p>
      </div>
    </div>
  );
}

function Conversation({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: lead } = useGetLead(leadId, { query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) } });
  const send = useSendLeadMessage();
  const draft = useDraftLeadReply();
  const incoming = useSimulateIncomingMessage();
  const lockCar = useLockCar();

  const [content, setContent] = useState("");
  const [usedIntent, setUsedIntent] = useState<string | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [showSimulate, setShowSimulate] = useState(false);
  const [simulateText, setSimulateText] = useState("");

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [lead?.messages.length]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getGetLeadQueryKey(leadId) });
    qc.invalidateQueries({ queryKey: getListLeadMessagesQueryKey(leadId) });
    qc.invalidateQueries({ queryKey: getListLeadsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
  };

  if (!lead) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando conversación…</div>;
  }

  const car = lead.car;
  const target = car.status === "locked" ? car.lockedUntil : car.availableUntil;
  const variant = car.status === "locked" ? "lock" : "open";

  const onSend = () => {
    if (!content.trim()) return;
    send.mutate(
      { id: leadId, data: { content: content.trim(), aiGenerated: !!usedIntent, intent: usedIntent ?? undefined } },
      {
        onSuccess: () => {
          setContent("");
          setUsedIntent(null);
          setRationale(null);
          invalidateAll();
        },
      },
    );
  };

  const onDraft = (intent: string, extraInstructions?: string) => {
    draft.mutate(
      { id: leadId, data: { intent: intent as never, instructions: extraInstructions } },
      {
        onSuccess: (res) => {
          setContent(res.content);
          setUsedIntent(res.intent);
          setRationale(res.rationale);
        },
      },
    );
  };

  const onSimulate = () => {
    if (!simulateText.trim()) return;
    incoming.mutate(
      { id: leadId, data: { content: simulateText.trim() } },
      { onSuccess: () => { setSimulateText(""); setShowSimulate(false); invalidateAll(); } },
    );
  };

  const onLock = () => {
    lockCar.mutate(
      { id: car.id, data: { leadId } },
      { onSuccess: () => { invalidateAll(); qc.invalidateQueries({ queryKey: getGetCarQueryKey(car.id) }); qc.invalidateQueries({ queryKey: getListCarsQueryKey() }); } },
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Conversation header */}
      <header className="px-3 sm:px-5 py-3 border-b border-border flex items-center gap-3 bg-card">
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Volver al buzón"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback style={{ backgroundColor: lead.avatarColor + "33", color: lead.avatarColor }}>
            {initials(lead.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{lead.name}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {lead.phone}
          </div>
        </div>
        <StageBadge stage={lead.stage} />
      </header>

      {/* Pinned car card */}
      <div className="px-3 sm:px-5 pt-4">
        <Card className="bg-card border-border overflow-hidden">
          <div className="flex gap-4 p-3">
            <Link href={`/cars/${car.id}`} className="shrink-0">
              <CarThumb make={car.make} model={car.model} imageUrl={car.imageUrl} className="h-20 w-28" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/cars/${car.id}`} className="font-medium text-sm hover:text-primary truncate block">
                    {car.make} {car.model} <span className="text-muted-foreground text-xs">{car.year}</span>
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {(car.km / 1000).toFixed(0)}k km · {car.fuel} · {car.transmission}
                  </div>
                </div>
                <StatusBadge status={car.status} />
              </div>
              <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <div className="text-base font-semibold tabular-nums">{formatPrice(car.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {car.status !== "sold" && <Countdown target={target} variant={variant} />}
                  {(car.status === "open" || car.status === "released") && lead.depositPaid === false && (
                    <Button size="sm" variant="secondary" onClick={onLock} disabled={lockCar.isPending}>
                      <Lock className="h-3.5 w-3.5 mr-1.5" /> Bloquear 2h
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-5 py-4 space-y-1.5">
        {lead.messages.map((m) => {
          if (m.direction === "system") {
            return (
              <div key={m.id} className="text-center my-3">
                <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full">
                  {m.content} · {formatTime(m.createdAt)}
                </span>
              </div>
            );
          }
          const isOutgoing = m.direction === "outgoing";
          return (
            <div key={m.id} className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-snug shadow-sm",
                  isOutgoing
                    ? "bg-primary/85 text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm",
                )}
              >
                <div>{m.content}</div>
                <div className={cn("text-[10px] mt-1 inline-flex items-center gap-1", isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {m.aiGenerated && <Sparkles className="h-2.5 w-2.5" />}
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        {lead.messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Aún no hay mensajes. Empieza con una primera respuesta.
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card px-3 sm:px-4 py-3 space-y-2.5">
        {/* AI quick actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Borrador IA
          </span>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={() => {
              const incomingMsgs = lead.messages.filter((m) => m.direction === "incoming");
              const lastIncoming = incomingMsgs[incomingMsgs.length - 1]?.content ?? null;
              const intent = pickAutoIntent({
                stage: lead.stage,
                depositPaid: lead.depositPaid,
                carStatus: car.status,
                lastIncoming,
                hasMessages: lead.messages.length > 0,
              });
              onDraft(intent);
            }}
            disabled={draft.isPending}
          >
            <Wand2 className="h-3 w-3" /> Auto
          </Button>
          {INTENTS.map((it) => (
            <Button
              key={it.value}
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => onDraft(it.value)}
              disabled={draft.isPending}
            >
              {it.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setShowCustom((s) => !s)}
          >
            Personalizado
          </Button>
        </div>

        {showCustom && (
          <div className="flex gap-2">
            <Input
              placeholder="Instrucciones para el borrador (p.ej. mencionar la garantía 12 meses)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onDraft("custom", instructions)}
              disabled={draft.isPending || !instructions.trim()}
            >
              Generar
            </Button>
          </div>
        )}

        {rationale && (
          <Collapsible>
            <CollapsibleTrigger className="text-[10px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <ChevronDown className="h-3 w-3" /> Por qué este borrador {usedIntent ? `(${intentLabel(usedIntent)})` : ""}
            </CollapsibleTrigger>
            <CollapsibleContent className="text-[11px] text-muted-foreground bg-secondary/40 rounded p-2 mt-1">
              {rationale}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            placeholder={`Mensaje para ${lead.name.split(" ")[0]}…`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
            }}
            rows={3}
            className="resize-none text-sm flex-1"
          />
          <Button onClick={onSend} disabled={send.isPending || !content.trim()} className="self-stretch">
            <Send className="h-4 w-4 mr-1.5" /> Enviar
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">
            ⌘/Ctrl + Enter para enviar · {stageLabel(lead.stage)}
          </div>
          <button
            onClick={() => setShowSimulate((s) => !s)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            {showSimulate ? "Ocultar" : "Simular mensaje entrante"}
          </button>
        </div>

        {showSimulate && (
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Texto del cliente (para demo)"
              value={simulateText}
              onChange={(e) => setSimulateText(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={onSimulate}
              disabled={incoming.isPending || !simulateText.trim()}
            >
              Inyectar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
