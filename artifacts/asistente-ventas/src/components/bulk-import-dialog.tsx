import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getListCarsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { Sparkles, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const PLACEHOLDER = `Un coche por línea. Acepta texto libre o URL del anuncio (coches.net, autoscout24, milanuncios, wallapop…). La IA rellena el resto.

Audi Q3 35 TFSI S line 2020 92.000km gasolina automático 22500€ Madrid
BMW Serie 1 118d 2019 110000km diesel manual 17800€ Barcelona
https://www.coches.net/audi-a4-avant-2-0-tdi-2019-madrid-id-12345.htm
https://www.autoscout24.es/anuncios/tesla-model-3-electrico-cd-1234567
Renault Captur 1.3 TCe Zen 2021 45000km gasolina manual 16900€`;

interface ImportResult {
  created: Array<{ id: number; make: string; model: string; year: number; price: number; notes: string | null; attractiveness: string }>;
  failed: Array<{ line: string; error: string }>;
}

export function BulkImportDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const lineCount = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#")).length;

  const onImport = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const res = await fetch(`${base}api/cars/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as ImportResult | { error: string };
      if (!res.ok) {
        setResult({ created: [], failed: [{ line: "(petición)", error: (json as { error: string }).error }] });
        return;
      }
      setResult(json as ImportResult);
      qc.invalidateQueries({ queryKey: getListCarsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      qc.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    } catch (err) {
      setResult({ created: [], failed: [{ line: "(red)", error: (err as Error).message }] });
    } finally {
      setLoading(false);
    }
  };

  const onClose = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) {
      setText("");
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" /> Subir en lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Carga masiva con IA
          </DialogTitle>
          <DialogDescription>
            Pega un coche por línea: texto libre del proveedor, una línea de Excel, o directamente la URL del anuncio (coches.net, autoscout24, milanuncios, wallapop…). La IA descarga la página, extrae todos los campos y redacta la ficha comercial.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={12}
              className="font-mono text-xs resize-none"
              disabled={loading}
            />
            <div className="text-[11px] text-muted-foreground">
              {lineCount} {lineCount === 1 ? "coche" : "coches"} detectados · máx. 50 por lote · {"~"}3-6s por línea de texto, {"~"}5-12s por URL
            </div>
          </>
        )}

        {result && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {result.created.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" /> {result.created.length} {result.created.length === 1 ? "coche cargado" : "coches cargados"}
                </div>
                {result.created.map((c) => (
                  <div key={c.id} className="rounded border border-border bg-secondary/30 p-3 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-semibold">{c.make} {c.model}</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">{c.year} · {c.price.toLocaleString("es-ES")} €</div>
                    </div>
                    {c.notes && <div className="text-[11px] text-muted-foreground italic">{c.notes}</div>}
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Atractivo: {c.attractiveness}</div>
                  </div>
                ))}
              </div>
            )}
            {result.failed.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold inline-flex items-center gap-1.5 text-amber-500">
                  <AlertTriangle className="h-4 w-4" /> {result.failed.length} {result.failed.length === 1 ? "línea fallida" : "líneas fallidas"}
                </div>
                {result.failed.map((f, i) => (
                  <div key={i} className="rounded border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                    <div className="text-[11px] font-mono text-foreground/80">{f.line}</div>
                    <div className="text-[11px] text-amber-500">{f.error}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result && (
            <>
              <Button variant="ghost" onClick={() => onClose(false)} disabled={loading}>Cancelar</Button>
              <Button onClick={onImport} disabled={loading || lineCount === 0}>
                {loading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Procesando…</> : <><Sparkles className="h-4 w-4 mr-1.5" /> Cargar {lineCount > 0 ? `(${lineCount})` : ""}</>}
              </Button>
            </>
          )}
          {result && (
            <>
              <Button variant="ghost" onClick={() => { setResult(null); setText(""); }}>Cargar más</Button>
              <Button onClick={() => onClose(false)}>Hecho</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
