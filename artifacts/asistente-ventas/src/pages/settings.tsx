import { useEffect, useState } from "react";
import { Save, RotateCcw, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getStoredToken } from "@/lib/staff-auth";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const GUIDES_META: { key: string; label: string; button: string; description: string }[] = [
  {
    key: "first_response",
    button: "Borrador IA · Auto",
    label: "Primera respuesta",
    description: "Se activa cuando el cliente acaba de entrar por WhatsApp tras pulsar Bloquear. Es el primer contacto del agente.",
  },
  {
    key: "ask_deposit",
    button: "Pedir señal",
    label: "Avanzar hacia el cierre",
    description: "El cliente sigue interesado y quieres proponer los siguientes pasos para cerrar la compra.",
  },
  {
    key: "confirm_lock",
    button: "Confirmar bloqueo",
    label: "Confirmar bloqueo",
    description: "Confirmas al cliente que la unidad está reservada para él durante 2h.",
  },
  {
    key: "handle_doubt",
    button: "Manejar duda",
    label: "Manejar una duda",
    description: "El cliente duda o no responde. El agente debe reconocer la situación sin presionar.",
  },
  {
    key: "post_release",
    button: "Post-liberación",
    label: "Después de la liberación",
    description: "Han pasado 2h y el cliente no cerró. La unidad ha sido liberada. Mensaje de seguimiento.",
  },
];

const DEFAULT_GUIDES: Record<string, string> = {
  first_response:
    "Primera respuesta cuando el cliente acaba de pulsar 'Bloquear unidad' y entra por WhatsApp. Confirmar disponibilidad y explicar que el bloqueo es totalmente gratuito y dura 2h sin compromiso. Tono firme pero cercano.",
  ask_deposit:
    "El cliente sigue interesado y quiere avanzar. Confirmar que la unidad está bloqueada para él y proponer cerrar la compra (visita al concesionario, financiación o transferencia bancaria) dentro de la ventana de 2h. NO pedir ningún pago previo para reservar.",
  confirm_lock:
    "Confirmar al cliente que la unidad está reservada para él durante 2h sin coste y proponer los siguientes pasos para cerrar (visita, financiación o transferencia).",
  handle_doubt:
    "El cliente duda. NO presionar agresivamente. Reconocer la duda, recordar que si otro cliente bloquea antes deja de estar disponible, ofrecer asegurar la unidad sin agobiar.",
  post_release:
    "Han pasado las 2h y el cliente no ha cerrado. La unidad ha sido liberada. Avisar con naturalidad, generar un FOMO sutil mencionando que sigue disponible si encaja, sin sonar desesperado.",
};

export default function SettingsPage() {
  const [guides, setGuides] = useState<Record<string, string>>({ ...DEFAULT_GUIDES });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSystem, setShowSystem] = useState(false);
  const [waNumber, setWaNumber] = useState("");
  const [waDirty, setWaDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = getStoredToken();
    fetch(`${BASE}/api/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const loaded: Record<string, string> = { ...DEFAULT_GUIDES };
        for (const key of Object.keys(DEFAULT_GUIDES)) {
          if (data[`guide_${key}`]) loaded[key] = data[`guide_${key}`];
        }
        setGuides(loaded);
        if (typeof data.whatsapp_number === "string") setWaNumber(data.whatsapp_number);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleChange(key: string, value: string) {
    setGuides((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  }

  function handleReset(key: string) {
    setGuides((prev) => ({ ...prev, [key]: DEFAULT_GUIDES[key] }));
    setDirty((prev) => new Set(prev).add(key));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const key of Object.keys(guides)) {
        body[`guide_${key}`] = guides[key];
      }
      body.whatsapp_number = waNumber;
      const token = getStoredToken();
      const res = await fetch(`${BASE}/api/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setDirty(new Set());
      setWaDirty(false);
      toast({ title: "Configuración guardada", description: "El agente usará estos guiones a partir de ahora." });
    } catch {
      toast({ title: "Error al guardar", description: "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Configuración</p>
          <h1 className="text-2xl font-bold">Guiones del agente IA</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Aquí defines qué estrategia y tono debe usar el agente para cada uno de los 5 botones del buzón.
            El agente siempre tiene en cuenta el historial de conversación, los datos del cliente y el coche, pero
            estas instrucciones guían su intención en cada momento.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (dirty.size === 0 && !waDirty)}
          className={cn(
            "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            dirty.size > 0 || waDirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground cursor-not-allowed",
          )}
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : (dirty.size > 0 || waDirty) ? "Guardar cambios" : "Sin cambios"}
        </button>
      </div>

      <div className="flex-1 p-6 space-y-5 max-w-4xl">
        {/* Número de WhatsApp */}
        <Card className="p-5 border-2 border-border space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Número de WhatsApp del negocio</span>
            {waDirty && <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Modificado</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Es el número al que irán los botones de WhatsApp de la web pública. Incluye prefijo internacional, sin espacios. Ej: 34600000000
          </p>
          <input
            type="tel"
            value={waNumber}
            onChange={(e) => { setWaNumber(e.target.value); setWaDirty(true); }}
            placeholder="34600000000"
            className="w-full sm:w-64 text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {waNumber && !/^\d{9,15}$/.test(waNumber.replace(/\s/g, "")) && (
            <p className="text-xs text-destructive">El número debe tener entre 9 y 15 dígitos, solo números.</p>
          )}
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          GUIDES_META.map((meta) => {
            const isModified = dirty.has(meta.key);
            return (
              <Card key={meta.key} className={cn("p-5 space-y-3 border-2", isModified ? "border-primary/40" : "border-border")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded-md text-muted-foreground border border-border">
                        Botón: {meta.button}
                      </span>
                      {isModified && (
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Modificado</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                  {isModified && (
                    <button
                      type="button"
                      onClick={() => handleReset(meta.key)}
                      className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Restaurar el texto original"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </button>
                  )}
                </div>
                <textarea
                  value={guides[meta.key] ?? ""}
                  onChange={(e) => handleChange(meta.key, e.target.value)}
                  rows={4}
                  className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2.5 resize-y leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Escribe aquí las instrucciones para este botón..."
                />
              </Card>
            );
          })
        )}

        {/* System prompt (collapsible, advanced) */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSystem((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-secondary/50 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-semibold">Personalidad base del agente</div>
              <div className="text-xs text-muted-foreground">Reglas de formato, tono y metodología que el agente siempre sigue. Solo editar si sabes lo que haces.</div>
            </div>
            {showSystem ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showSystem && (
            <div className="px-5 pb-5 bg-secondary/20">
              <p className="text-xs text-muted-foreground py-3">
                Para cambiar la personalidad base del agente, ponte en contacto con tu desarrollador o edita directamente el archivo
                <code className="mx-1 px-1.5 py-0.5 bg-secondary rounded text-[11px]">artifacts/api-server/src/lib/draft.ts</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
