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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CarThumb } from "@/components/car-thumb";
import { StatusBadge, StageBadge } from "@/components/badges";
import { Countdown } from "@/components/countdown";
import { attractivenessLabel, formatPrice, formatRelative } from "@/lib/format";
import { ArrowLeft, Check, Eye, Images, MapPin, MessageSquare, Pencil, Trash2, Unlock } from "lucide-react";

export default function CarDetailPage() {
  const [, params] = useRoute("/cars/:id");
  const id = params ? Number(params.id) : 0;
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data: car } = useGetCarStaff(id, { query: { enabled: !!id, queryKey: getGetCarStaffQueryKey(id) } });
  const { data: leads } = useListLeads();

  const release = useReleaseCar();
  const sell = useMarkCarSold();
  const update = useUpdateCar();
  const deleteCar = useDeleteCar();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetCarStaffQueryKey(id) });
    qc.invalidateQueries({ queryKey: getListCarsStaffQueryKey() });
    qc.invalidateQueries({ queryKey: getListLeadsQueryKey() });
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!car) {
    return <div className="p-4 md:p-8 text-sm text-muted-foreground">Cargando…</div>;
  }

  const target = car.status === "locked" ? car.lockedUntil : car.availableUntil;
  const variant = car.status === "locked" ? "lock" : "open";
  const carLeads = (leads ?? []).filter((l) => l.carId === car.id);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-5 md:space-y-6">
        <Link href="/inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>

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
                <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-1"><MapPin className="h-3.5 w-3.5" /> {car.location}</div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-semibold tabular-nums">{formatPrice(car.price)}</div>
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
                <div className="text-sm text-foreground/80 border-l-2 border-primary/40 pl-3 py-1">{car.notes}</div>
              )}

              <div className="flex flex-wrap gap-2 mt-auto pt-3">
                {car.status === "locked" && (
                  <Button
                    variant="secondary"
                    onClick={() => release.mutate({ id: car.id }, { onSuccess: invalidate })}
                    disabled={release.isPending}
                  >
                    <Unlock className="h-4 w-4 mr-1.5" /> Liberar unidad
                  </Button>
                )}
                {car.status !== "sold" && (
                  <Button
                    onClick={() => sell.mutate({ id: car.id }, { onSuccess: invalidate })}
                    disabled={sell.isPending}
                  >
                    <Check className="h-4 w-4 mr-1.5" /> Marcar vendida
                  </Button>
                )}
                <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (o) { setEditPrice(String(car.price)); setEditNotes(car.notes ?? ""); } }}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Pencil className="h-4 w-4 mr-1.5" /> Editar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar coche</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <label className="block text-xs text-muted-foreground">Precio (€)</label>
                      <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" />
                      <label className="block text-xs text-muted-foreground">Notas</label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
                      <Button
                        onClick={() => {
                          update.mutate(
                            { id: car.id, data: { price: Number(editPrice), notes: editNotes } },
                            { onSuccess: () => { invalidate(); setEditOpen(false); } },
                          );
                        }}
                        disabled={update.isPending}
                      >Guardar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
                                navigate("/inventory");
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

        {car.photos && car.photos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Images className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Fotos del anuncio ({car.photos.length})</h2>
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

        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Leads interesados ({carLeads.length})</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {carLeads.map((l) => (
              <Link key={l.id} href={`/inbox/${l.id}`}>
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
