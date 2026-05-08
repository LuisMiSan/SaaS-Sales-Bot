import { useEffect, useState, useCallback } from "react";
import {
  Save, Phone, AlertCircle, Wifi, WifiOff, Copy, Check,
  ExternalLink, KeyRound, Webhook, ListOrdered, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStoredToken } from "@/lib/staff-auth";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface WaStatus {
  enabled: boolean;
  mode: "live" | "sandbox";
  phoneNumberId: string | null;
  verifyTokenConfigured: boolean;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-3 py-2">
        <span className="flex-1 font-mono text-xs break-all text-foreground">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [waNumber, setWaNumber] = useState("");
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [waStatus, setWaStatus] = useState<WaStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { toast } = useToast();

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
  const verifyToken = "asistente-ventas-verify";

  const fetchStatus = useCallback(() => {
    setStatusLoading(true);
    const token = getStoredToken();
    fetch(`${BASE}/api/whatsapp/status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d: WaStatus) => setWaStatus(d))
      .catch(() => setWaStatus(null))
      .finally(() => setStatusLoading(false));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    fetch(`${BASE}/api/settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        const num = data.whatsapp_number ?? "";
        setWaNumber(num);
        setOriginal(num);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchStatus();
  }, [fetchStatus]);

  const dirty = waNumber !== original;
  const valid = /^\d{9,15}$/.test(waNumber.replace(/\s/g, ""));

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      const token = getStoredToken();
      const res = await fetch(`${BASE}/api/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ whatsapp_number: waNumber }),
      });
      if (!res.ok) throw new Error();
      setOriginal(waNumber);
      toast({ title: "Ajustes guardados", description: "El número de WhatsApp se ha actualizado." });
    } catch {
      toast({ title: "Error al guardar", description: "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const isLive = waStatus?.enabled && waStatus?.mode === "live";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Plataforma</p>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuración general del negocio.</p>
      </div>

      <div className="flex-1 p-6 max-w-2xl space-y-6">

        {/* WhatsApp number */}
        {loading ? (
          <div className="h-28 bg-secondary animate-pulse rounded-xl" />
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Número de WhatsApp del negocio</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Número al que se dirigen los botones de WhatsApp de la web pública. Prefijo internacional sin espacios ni el símbolo +. Ejemplo: <span className="font-mono">34600000000</span>
            </p>
            <input
              type="tel"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="34600000000"
              className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {waNumber && !valid && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                El número debe tener entre 9 y 15 dígitos, solo números.
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || !valid || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : dirty ? "Guardar" : "Sin cambios"}
            </button>
          </div>
        )}

        {/* WhatsApp Cloud API — estado */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Conexión WhatsApp Cloud API (Meta)</span>
            </div>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={statusLoading}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Actualizar estado"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Status badge */}
          {statusLoading ? (
            <div className="h-10 bg-secondary animate-pulse rounded-lg" />
          ) : waStatus ? (
            <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${isLive ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
              {isLive
                ? <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                : <WifiOff className="h-4 w-4 text-amber-500 shrink-0" />
              }
              <div>
                <p className={`text-sm font-semibold ${isLive ? "text-green-400" : "text-amber-400"}`}>
                  {isLive ? "Conectado — modo real" : "Sandbox — sin credenciales de Meta"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLive
                    ? `Phone Number ID: ${waStatus.phoneNumberId ?? "—"}`
                    : "Los mensajes entrantes y salientes se simulan en local. Configura las variables para activar el modo real."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" /> No se pudo obtener el estado.
            </div>
          )}

          {/* Datos del webhook */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Webhook className="h-3.5 w-3.5" /> Datos del webhook
            </div>
            <CodeRow label="URL del webhook (pégala en Meta Business)" value={webhookUrl} />
            <CodeRow label="Token de verificación" value={verifyToken} />
          </div>

          {/* Variables de entorno */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" /> Variables de entorno requeridas
            </div>
            <p className="text-xs text-muted-foreground">
              Añádelas en <span className="font-semibold text-foreground">Replit → Secrets</span> y reinicia el servidor.
            </p>
            <div className="space-y-2">
              {[
                { name: "WHATSAPP_TOKEN", desc: "Token permanente de la app de Meta (no el token temporal)" },
                { name: "WHATSAPP_PHONE_NUMBER_ID", desc: "ID del número emisor en Meta Business Suite" },
                { name: "WHATSAPP_APP_SECRET", desc: "App Secret de la app de Meta (para verificar la firma del webhook)" },
              ].map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-secondary/40 border border-border rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold text-foreground">{name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <CopyButton value={name} />
                </div>
              ))}
            </div>
          </div>

          {/* Pasos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ListOrdered className="h-3.5 w-3.5" /> Pasos para activar
            </div>
            <ol className="space-y-2.5">
              {[
                <>Entra en <strong>Meta for Developers</strong> → tu app → <strong>WhatsApp → Configuración</strong>.</>,
                <>Copia el <strong>Token de acceso permanente</strong> y el <strong>Phone Number ID</strong>. Pégalos en Replit Secrets como <code className="text-[10px] font-mono bg-secondary px-1 rounded">WHATSAPP_TOKEN</code> y <code className="text-[10px] font-mono bg-secondary px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code>.</>,
                <>En la sección <strong>Configuración de la app</strong> copia el <strong>App Secret</strong> y guárdalo como <code className="text-[10px] font-mono bg-secondary px-1 rounded">WHATSAPP_APP_SECRET</code>.</>,
                <>En <strong>WhatsApp → Configuración → Webhooks</strong> pulsa <strong>Editar</strong>, pega la URL del webhook de arriba y el Token de verificación. Selecciona los eventos: <strong>messages</strong>.</>,
                <>Reinicia el servidor API en Replit. El estado de arriba cambiará a <span className="text-green-400 font-semibold">Conectado</span>.</>,
                <>Haz una prueba: envía un mensaje de WhatsApp desde tu móvil al número de negocio y comprueba que aparece en el <strong>Buzón</strong> del cockpit.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-1"
            >
              <ExternalLink className="h-3 w-3" /> Abrir Meta for Developers
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
