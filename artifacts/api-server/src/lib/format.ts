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
