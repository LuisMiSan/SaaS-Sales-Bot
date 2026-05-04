import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCarStaff,
  useListLeads,
  useReleaseCar,
  useMarkCarSold,
  useUpdateCar,
  useDeleteCar,
  getGetCarStaffQueryKey,
  getListCarsStaffQueryKey,
  getListLeadsQueryKey,
} from "@workspace/api-client-react";
import type { Car } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CarThumb } from "@/components/car-thumb";
import { StatusBadge, StageBadge } from "@/components/badges";
import { Countdown } from "@/components/countdown";
import { attractivenessLabel, formatPrice, formatRelative } from "@/lib/format";
import { ArrowLeft, Check, Eye, Images, MapPin, MessageSquare, Pencil, Trash2, Unlock, Video } from "lucide-react";

interface EditState {
  make: string;
  model: string;
  year: string;
  price: string;
  km: string;
  fuel: string;
  transmission: string;
  location: string;
  color: string;
  bodyType: string;
  doors: string;
  seats: string;
  horsepower: string;
  engineCc: string;
  co2: string;
  consumptionUrban: string;
  consumptionHighway: string;
  consumptionMixed: string;
  description: string;
  notes: string;
  marketPriceMin: string;
  marketPriceMax: string;
  imageUrl: string;
  videoUrl: string;
  photos: string;
}

function toEditState(car: Car): EditState {
  return {
    make: car.make,
    model: car.model,
    year: String(car.year),
    price: String(car.price),
    km: String(car.km),
    fuel: car.fuel,
    transmission: car.transmission,
    location: car.location,
    color: car.color ?? "",
    bodyType: car.bodyType ?? "",
    doors: car.doors != null ? String(car.doors) : "",
    seats: car.seats != null ? String(car.seats) : "",
    horsepower: car.horsepower != null ? String(car.horsepower) : "",
    engineCc: car.engineCc != null ? String(car.engineCc) : "",
    co2: car.co2 != null ? String(car.co2) : "",
    consumptionUrban: car.consumptionUrban != null ? String(car.consumptionUrban) : "",
    consumptionHighway: car.consumptionHighway != null ? String(car.consumptionHighway) : "",
    consumptionMixed: car.consumptionMixed != null ? String(car.consumptionMixed) : "",
    description: car.description ?? "",
    notes: car.notes ?? "",
    marketPriceMin: car.marketPriceMin != null ? String(car.marketPriceMin) : "",
    marketPriceMax: car.marketPriceMax != null ? String(car.marketPriceMax) : "",
    imageUrl: car.imageUrl ?? "",
    videoUrl: car.videoUrl ?? "",
    photos: (car.photos ?? []).join("\n"),
  };
}

function nullInt(s: string): number | null {
  const n = parseInt(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function nullFloat(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function nullStr(s: string): string | null {
  return s.trim() || null;
}

function editPayload(e: EditState) {
  return {
    make: e.make.trim(),
    model: e.model.trim(),
    year: parseInt(e.year) || 0,
    price: parseFloat(e.price) || 0,
    km: parseInt(e.km) || 0,
    fuel: e.fuel,
    transmission: e.transmission,
    location: e.location.trim(),
    color: nullStr(e.color),
    bodyType: nullStr(e.bodyType),
    doors: nullInt(e.doors),
    seats: nullInt(e.seats),
    horsepower: nullInt(e.horsepower),
    engineCc: nullInt(e.engineCc),
    co2: nullInt(e.co2),
    consumptionUrban: nullFloat(e.consumptionUrban),
    consumptionHighway: nullFloat(e.consumptionHighway),
    consumptionMixed: nullFloat(e.consumptionMixed),
    description: nullStr(e.description),
    notes: nullStr(e.notes),
    marketPriceMin: nullInt(e.marketPriceMin),
    marketPriceMax: nullInt(e.marketPriceMax),
    imageUrl: nullStr(e.imageUrl),
    videoUrl: nullStr(e.videoUrl),
    photos: e.photos
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean),
  };
}

type Section = "ficha" | "tecnica" | "consumo" | "media" | "comercial";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "ficha", label: "Ficha" },
  { id: "tecnica", label: "Técnica" },
  { id: "consumo", label: "Consumo" },
  { id: "media", label: "Fotos/Vídeo" },
  { id: "comercial", label: "Comercial" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function EditDialog({ car, onSave }: { car: Car; onSave: (data: ReturnType<typeof editPayload>) => void }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>("ficha");
  const [e, setE] = useState<EditState>(toEditState(car));
  const update = useUpdateCar();

  const set = (key: keyof EditState) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setE((prev) => ({ ...prev, [key]: ev.target.value }));

  const handleOpen = (o: boolean) => {
    if (o) setE(toEditState(car));
    setOpen(o);
  };

  const handleSave = () => {
    const payload = editPayload(e);
    update.mutate(
      { id: car.id, data: payload },
      {
        onSuccess: () => {
          onSave(payload);
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="h-4 w-4 mr-1.5" /> Editar ficha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar ficha — {car.make} {car.model} {car.year}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border pb-2 flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                section === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
          {section === "ficha" && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca"><Input value={e.make} onChange={set("make")} /></Field>
                <Field label="Modelo"><Input value={e.model} onChange={set("model")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Año"><Input type="number" value={e.year} onChange={set("year")} /></Field>
                <Field label="Kilómetros"><Input type="number" value={e.km} onChange={set("km")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Combustible">
                  <select value={e.fuel} onChange={set("fuel")} className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background">
                    {["Diésel","Gasolina","Híbrido","Eléctrico","GLP","GNC"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Cambio">
                  <select value={e.transmission} onChange={set("transmission")} className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background">
                    <option>Manual</option>
                    <option>Automático</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color exterior"><Input value={e.color} onChange={set("color")} placeholder="Ej: Blanco" /></Field>
                <Field label="Carrocería"><Input value={e.bodyType} onChange={set("bodyType")} placeholder="Ej: SUV, Berlina" /></Field>
              </div>
              <Field label="Ubicación"><Input value={e.location} onChange={set("location")} /></Field>
            </div>
          )}

          {section === "tecnica" && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Potencia (CV)"><Input type="number" value={e.horsepower} onChange={set("horsepower")} placeholder="Ej: 120" /></Field>
                <Field label="Cilindrada (cc)"><Input type="number" value={e.engineCc} onChange={set("engineCc")} placeholder="Ej: 1500" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Puertas"><Input type="number" value={e.doors} onChange={set("doors")} placeholder="Ej: 5" /></Field>
                <Field label="Plazas"><Input type="number" value={e.seats} onChange={set("seats")} placeholder="Ej: 5" /></Field>
              </div>
            </div>
          )}

          {section === "consumo" && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Consumo urbano (L/100)"><Input type="number" step="0.1" value={e.consumptionUrban} onChange={set("consumptionUrban")} placeholder="Ej: 7.5" /></Field>
                <Field label="Consumo carretera (L/100)"><Input type="number" step="0.1" value={e.consumptionHighway} onChange={set("consumptionHighway")} placeholder="Ej: 5.2" /></Field>
                <Field label="Consumo mixto (L/100)"><Input type="number" step="0.1" value={e.consumptionMixed} onChange={set("consumptionMixed")} placeholder="Ej: 6.1" /></Field>
              </div>
              <Field label="Emisiones CO2 (g/km)"><Input type="number" value={e.co2} onChange={set("co2")} placeholder="Ej: 138" /></Field>
            </div>
          )}

          {section === "media" && (
            <div className="space-y-3 py-2">
              <Field label="URL imagen principal">
                <Input value={e.imageUrl} onChange={set("imageUrl")} placeholder="https://..." />
              </Field>
              <Field label="URL vídeo (YouTube / mp4)">
                <Input value={e.videoUrl} onChange={set("videoUrl")} placeholder="https://..." />
              </Field>
              <Field label="Fotos adicionales (una URL por línea)">
                <Textarea value={e.photos} onChange={set("photos")} rows={8} placeholder={"https://foto1.jpg\nhttps://foto2.jpg"} className="font-mono text-xs" />
              </Field>
              {e.photos.split(/\r?\n/).filter(Boolean).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {e.photos.split(/\r?\n/).filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="" className="h-20 w-28 object-cover rounded flex-shrink-0 border border-border" onError={(ev) => ((ev.target as HTMLImageElement).style.display = "none")} />
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "comercial" && (
            <div className="space-y-3 py-2">
              <Field label="Precio de venta (€)">
                <Input type="number" value={e.price} onChange={set("price")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio mercado mínimo (€)"><Input type="number" value={e.marketPriceMin} onChange={set("marketPriceMin")} placeholder="Ej: 9000" /></Field>
                <Field label="Precio mercado máximo (€)"><Input type="number" value={e.marketPriceMax} onChange={set("marketPriceMax")} placeholder="Ej: 11500" /></Field>
              </div>
              <Field label="Descripción pública">
                <Textarea value={e.description} onChange={set("description")} rows={5} placeholder="Descripción que se mostrará en la ficha pública del vehículo…" />
              </Field>
              <Field label="Notas internas (solo staff)">
                <Textarea value={e.notes} onChange={set("notes")} rows={3} placeholder="Notas para el comercial, no visibles al cliente…" />
              </Field>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function CarDetailPage() {
  const [, params] = useRoute("/staff/cars/:id");
  const id = params ? Number(params.id) : 0;
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data: car } = useGetCarStaff(id, { query: { enabled: !!id, queryKey: getGetCarStaffQueryKey(id) } });
  const { data: leads } = useListLeads();

  const release = useReleaseCar();
  const sell = useMarkCarSold();
  const deleteCar = useDeleteCar();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetCarStaffQueryKey(id) });
    qc.invalidateQueries({ queryKey: getListCarsStaffQueryKey() });
    qc.invalidateQueries({ queryKey: getListLeadsQueryKey() });
  };

  if (!car) {
    return <div className="p-4 md:p-8 text-sm text-muted-foreground">Cargando…</div>;
  }

  const target = car.status === "locked" ? car.lockedUntil : car.availableUntil;
  const variant = car.status === "locked" ? "lock" : "open";
  const carLeads = (leads ?? []).filter((l) => l.carId === car.id);

  const hasConsumption = car.consumptionUrban != null || car.consumptionHighway != null || car.consumptionMixed != null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5 md:space-y-6">
        <Link href="/staff/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>

        {/* HERO CARD */}
        <Card className="overflow-hidden bg-card border-border">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative">
              <CarThumb make={car.make} model={car.model} imageUrl={car.imageUrl} photos={car.photos} className="h-72 w-full md:h-full" />
              <div className="absolute top-3 left-3"><StatusBadge status={car.status} /></div>
              <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 backdrop-blur text-[11px] text-white">
                <Eye className="h-3 w-3" /> {car.viewersNow} viendo
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{attractivenessLabel(car.attractiveness)}</div>
                <h1 className="text-2xl font-semibold tracking-tight">{car.make} {car.model}</h1>
                <div className="text-sm text-muted-foreground">{car.year} · {(car.km/1000).toFixed(0)}k km · {car.fuel} · {car.transmission}</div>
                {car.bodyType && <div className="text-sm text-muted-foreground">{car.bodyType}{car.color ? ` · ${car.color}` : ""}</div>}
                <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-1"><MapPin className="h-3.5 w-3.5" /> {car.location}</div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-semibold tabular-nums">{formatPrice(car.price)}</div>
                {(car.marketPriceMin || car.marketPriceMax) && (
                  <div className="text-xs text-muted-foreground">
                    Mercado: {car.marketPriceMin ? formatPrice(car.marketPriceMin) : "—"} – {car.marketPriceMax ? formatPrice(car.marketPriceMax) : "—"}
                  </div>
                )}
              </div>

              {car.status !== "sold" && (
                <div className="flex items-center gap-2">
                  <Countdown target={target} variant={variant} />
                  {car.status === "released" && car.releasedAt && (
                    <span className="text-xs text-sky-400">Liberado {formatRelative(car.releasedAt)}</span>
                  )}
                </div>
              )}

              {car.notes && (
                <div className="text-sm text-foreground/80 border-l-2 border-primary/40 pl-3 py-1 italic">{car.notes}</div>
              )}

              <div className="flex flex-wrap gap-2 mt-auto pt-3">
                {car.status === "locked" && (
                  <Button variant="secondary" onClick={() => release.mutate({ id: car.id }, { onSuccess: invalidate })} disabled={release.isPending}>
                    <Unlock className="h-4 w-4 mr-1.5" /> Liberar unidad
                  </Button>
                )}
                {car.status !== "sold" && (
                  <Button onClick={() => sell.mutate({ id: car.id }, { onSuccess: invalidate })} disabled={sell.isPending}>
                    <Check className="h-4 w-4 mr-1.5" /> Marcar vendida
                  </Button>
                )}

                <EditDialog car={car} onSave={() => invalidate()} />

                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-1.5" /> Eliminar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar del inventario</DialogTitle>
                      <DialogDescription>
                        ¿Seguro que quieres eliminar <strong>{car.make} {car.model} {car.year}</strong> del inventario? Esta acción no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                      <Button
                        variant="destructive"
                        disabled={deleteCar.isPending}
                        onClick={() => {
                          deleteCar.mutate(
                            { id: car.id },
                            {
                              onSuccess: () => {
                                qc.invalidateQueries({ queryKey: getListCarsStaffQueryKey() });
                                navigate("/staff/inventory");
                              },
                            },
                          );
                        }}
                      >
                        {deleteCar.isPending ? "Eliminando…" : "Sí, eliminar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>

        {/* DESCRIPTION */}
        {car.description && (
          <Card className="p-5 bg-card border-border">
            <h2 className="text-sm font-semibold mb-2">Descripción pública</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{car.description}</p>
          </Card>
        )}

        {/* SPECS */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-card border-border">
            <h2 className="text-sm font-semibold mb-3">Datos básicos</h2>
            <SpecRow label="Año" value={String(car.year)} />
            <SpecRow label="Kilómetros" value={`${car.km.toLocaleString("es-ES")} km`} />
            <SpecRow label="Combustible" value={car.fuel} />
            <SpecRow label="Cambio" value={car.transmission} />
            <SpecRow label="Carrocería" value={car.bodyType} />
            <SpecRow label="Color" value={car.color} />
            <SpecRow label="Puertas" value={car.doors != null ? String(car.doors) : null} />
            <SpecRow label="Plazas" value={car.seats != null ? String(car.seats) : null} />
            <SpecRow label="Ubicación" value={car.location} />
          </Card>

          <Card className="p-5 bg-card border-border">
            <h2 className="text-sm font-semibold mb-3">Ficha técnica</h2>
            <SpecRow label="Potencia" value={car.horsepower != null ? `${car.horsepower} CV` : null} />
            <SpecRow label="Cilindrada" value={car.engineCc != null ? `${car.engineCc} cc` : null} />
            {hasConsumption && (
              <>
                <SpecRow label="Consumo urbano" value={car.consumptionUrban != null ? `${car.consumptionUrban} L/100` : null} />
                <SpecRow label="Consumo carretera" value={car.consumptionHighway != null ? `${car.consumptionHighway} L/100` : null} />
                <SpecRow label="Consumo mixto" value={car.consumptionMixed != null ? `${car.consumptionMixed} L/100` : null} />
              </>
            )}
            <SpecRow label="Emisiones CO2" value={car.co2 != null ? `${car.co2} g/km` : null} />
            {!car.horsepower && !hasConsumption && !car.co2 && (
              <div className="text-xs text-muted-foreground">Sin datos técnicos. Añade los datos pulsando «Editar ficha» → Técnica.</div>
            )}
          </Card>
        </div>

        {/* GALLERY */}
        {car.photos && car.photos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Images className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Galería de fotos ({car.photos.length})</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {car.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img
                    src={url}
                    alt={`Foto ${i + 1} de ${car.make} ${car.model}`}
                    className="h-40 w-60 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO */}
        {car.videoUrl && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Vídeo del vehículo</h2>
            </div>
            <a href={car.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{car.videoUrl}</a>
          </div>
        )}

        {/* LEADS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Leads interesados ({carLeads.length})</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {carLeads.map((l) => (
              <Link key={l.id} href={`/staff/inbox/${l.id}`}>
                <Card className="p-4 bg-card border-border hover:border-primary/40 cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.phone}</div>
                    </div>
                    <StageBadge stage={l.stage} />
                  </div>
                  {l.lastMessagePreview && (
                    <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{l.lastMessagePreview}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-2">{formatRelative(l.lastMessageAt)}</div>
                </Card>
              </Link>
            ))}
            {carLeads.length === 0 && (
              <div className="text-sm text-muted-foreground">Aún no hay leads para este coche.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
