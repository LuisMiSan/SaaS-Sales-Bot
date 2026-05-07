import { useEffect, useState } from "react";
import { Save, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStoredToken } from "@/lib/staff-auth";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export default function SettingsPage() {
  const [waNumber, setWaNumber] = useState("");
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
  }, []);

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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Plataforma</p>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">Configuración general del negocio.</p>
      </div>

      <div className="flex-1 p-6 max-w-lg space-y-6">
        {loading ? (
          <div className="h-28 bg-secondary animate-pulse rounded-xl" />
        ) : (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Número de WhatsApp del negocio</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Número al que se dirigen los botones de WhatsApp de la web pública. Incluye prefijo internacional sin espacios ni el símbolo +. Ejemplo: <span className="font-mono">34600000000</span>
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
      </div>
    </div>
  );
}
