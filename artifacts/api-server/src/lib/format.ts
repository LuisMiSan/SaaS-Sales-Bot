import type { Car as DbCar, Lead as DbLead, Message as DbMessage, Activity as DbActivity } from "@workspace/db";

export const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function priceLabel(price: number): string {
  return eurFormatter.format(price);
}

export function windowHoursForAttractiveness(a: string): number {
  if (a === "hot") return 24;
  if (a === "hard") return 72;
  return 48;
}

function extendedSpecFields(car: DbCar) {
  return {
    description: car.description ?? null,
    videoUrl: car.videoUrl ?? null,
    horsepower: car.horsepower ?? null,
    doors: car.doors ?? null,
    seats: car.seats ?? null,
    color: car.color ?? null,
    bodyType: car.bodyType ?? null,
    engineCc: car.engineCc ?? null,
    co2: car.co2 ?? null,
    consumptionUrban: car.consumptionUrban ?? null,
    consumptionHighway: car.consumptionHighway ?? null,
    consumptionMixed: car.consumptionMixed ?? null,
  };
}

export function serializeCar(car: DbCar) {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    priceLabel: priceLabel(Number(car.price)),
    attractiveness: car.attractiveness,
    windowHours: windowHoursForAttractiveness(car.attractiveness),
    status: car.status,
    imageUrl: car.imageUrl,
    photos: car.photos ?? [],
    km: car.km,
    fuel: car.fuel,
    transmission: car.transmission,
    location: car.location,
    depositCents: car.depositCents,
    publishedAt: car.publishedAt.toISOString(),
    availableUntil: car.availableUntil.toISOString(),
    lockedUntil: car.lockedUntil ? car.lockedUntil.toISOString() : null,
    releasedAt: car.releasedAt ? car.releasedAt.toISOString() : null,
    viewersNow: car.viewersNow,
    notes: car.notes,
    marketPriceMin: car.marketPriceMin,
    marketPriceMax: car.marketPriceMax,
    ...extendedSpecFields(car),
  };
}

export function serializePublicCar(car: DbCar) {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: Number(car.price),
    priceLabel: priceLabel(Number(car.price)),
    status: car.status,
    imageUrl: car.imageUrl,
    photos: car.photos ?? [],
    km: car.km,
    fuel: car.fuel,
    transmission: car.transmission,
    location: car.location,
    marketPriceMin: car.marketPriceMin ?? null,
    marketPriceMax: car.marketPriceMax ?? null,
    publishedAt: car.publishedAt.toISOString(),
    ...extendedSpecFields(car),
  };
}

export function serializeLead(lead: DbLead, lastMessage?: DbMessage | null) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    carId: lead.carId,
    stage: lead.stage,
    depositPaid: lead.depositPaid,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    lastMessageAt: lastMessage ? lastMessage.createdAt.toISOString() : null,
    lastMessagePreview: lastMessage ? lastMessage.content.slice(0, 120) : null,
    unreadCount: lead.unreadCount,
    avatarColor: lead.avatarColor,
  };
}

export function serializeMessage(msg: DbMessage) {
  return {
    id: msg.id,
    leadId: msg.leadId,
    direction: msg.direction,
    content: msg.content,
    aiGenerated: msg.aiGenerated,
    intent: msg.intent,
    createdAt: msg.createdAt.toISOString(),
  };
}

export function serializeActivity(a: DbActivity) {
  return {
    id: a.id,
    kind: a.kind,
    text: a.text,
    leadName: a.leadName,
    carLabel: a.carLabel,
    at: a.at.toISOString(),
  };
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.floor(diff / 3_600_000)} h`;
  return `hace ${Math.floor(diff / 86_400_000)} d`;
}

export function attractivenessLabel(a: string): string {
  if (a === "hot") return "Alta demanda";
  if (a === "hard") return "Difícil venta";
  return "Demanda normal";
}
