import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send } from "lucide-react";

type Props = {
  leadId: number;
  publicToken: string;
  customerName: string;
};

type ApiMessage = {
  id: number;
  leadId: number;
  direction: string;
  content: string;
  createdAt: string;
};

function formatHHmm(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const threadKey = (leadId: number) => ["public-thread", leadId] as const;

export function CustomerChat({ leadId, publicToken, customerName }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ApiMessage[]>({
    queryKey: threadKey(leadId),
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/thread?token=${encodeURIComponent(publicToken)}`);
      if (!res.ok) throw new Error("No se pudo cargar la conversación");
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const send = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/leads/${leadId}/thread?token=${encodeURIComponent(publicToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("No se pudo enviar el mensaje");
      return res.json() as Promise<ApiMessage>;
    },
    onSuccess: () => {
      setText("");
      setSendError(null);
      qc.invalidateQueries({ queryKey: threadKey(leadId) });
    },
    onError: () => {
      setSendError("No se pudo enviar el mensaje. Inténtalo de nuevo.");
    },
  });

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    send.mutate(content);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
      <header className="px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-[#0A3D6E] to-[#0A3D6E]/90 text-white">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#EE7B22] flex items-center justify-center text-white text-sm font-bold">
            PT
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold leading-tight truncate">Pujamostucoche · Comercial</div>
            <div className="text-[11px] text-white/70 inline-flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#27AE60]" /> En línea · te respondemos en minutos
            </div>
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="px-4 py-4 bg-[#f5f7fa] space-y-2 overflow-y-auto"
        style={{ maxHeight: "420px", minHeight: "240px" }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="text-center text-xs text-stone-500 py-8 inline-flex items-center justify-center gap-2 w-full">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando conversación…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-stone-500 py-8">Aún no hay mensajes. Te escribiremos en minutos.</div>
        ) : (
          messages.map((m) => {
            if (m.direction === "system") {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="text-[11px] text-stone-500 bg-stone-200/70 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-[#27AE60]" /> {m.content}
                  </span>
                </div>
              );
            }
            const fromCustomer = m.direction === "incoming";
            return (
              <div key={m.id} className={fromCustomer ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    fromCustomer
                      ? "max-w-[78%] bg-[#DCF8C6] text-stone-900 rounded-2xl rounded-br-sm px-3.5 py-2 shadow-sm"
                      : "max-w-[78%] bg-white text-stone-900 rounded-2xl rounded-bl-sm px-3.5 py-2 shadow-sm border border-stone-200"
                  }
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  <div className="text-[10px] text-stone-500 mt-1 text-right">{formatHHmm(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="px-3 py-3 border-t border-stone-100 bg-white flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Escribe como ${customerName}…`}
            className="flex-1 px-3 py-2.5 text-sm border border-stone-200 rounded-full focus:outline-none focus:border-[#EE7B22] focus:ring-2 focus:ring-[#EE7B22]/15"
          />
          <button
            type="submit"
            disabled={send.isPending || !text.trim()}
            className="h-10 w-10 rounded-full bg-[#EE7B22] hover:bg-[#C4621A] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Enviar"
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {sendError ? <div className="text-[11px] text-red-600 px-2">{sendError}</div> : null}
      </form>
    </div>
  );
}
