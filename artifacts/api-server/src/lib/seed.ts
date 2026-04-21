import { db, carsTable, leadsTable, messagesTable, activityTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select().from(carsTable).limit(1);
  if (existing.length > 0) {
    await ensureFifteenCars();
    return;
  }

  logger.info("Seeding initial data");
  const now = new Date();
  const hours = (h: number) => new Date(now.getTime() + h * 3600_000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

  const [c1] = await db.insert(carsTable).values({
    make: "Audi", model: "A4 Avant 2.0 TDI", year: 2020, price: 24500,
    attractiveness: "hot", km: 68000, fuel: "Diésel", transmission: "Automático",
    location: "Madrid Norte", imageUrl: null, depositCents: 30000, status: "open",
    publishedAt: hoursAgo(4), availableUntil: hours(20), viewersNow: 7,
    notes: "Único propietario. Libro de mantenimiento al día.",
  }).returning();

  const [c2] = await db.insert(carsTable).values({
    make: "BMW", model: "Serie 3 320d Touring", year: 2019, price: 22900,
    attractiveness: "normal", km: 84500, fuel: "Diésel", transmission: "Automático",
    location: "Madrid Sur", imageUrl: null, depositCents: 20000, status: "locked",
    publishedAt: hoursAgo(38), availableUntil: hours(10), lockedUntil: hours(8),
    viewersNow: 3,
  }).returning();

  const [c3] = await db.insert(carsTable).values({
    make: "Volkswagen", model: "Golf 1.5 TSI Life", year: 2021, price: 19800,
    attractiveness: "hot", km: 41200, fuel: "Gasolina", transmission: "Manual",
    location: "Madrid Norte", imageUrl: null, depositCents: 20000, status: "open",
    publishedAt: hoursAgo(2), availableUntil: hours(22), viewersNow: 11,
  }).returning();

  const [c4] = await db.insert(carsTable).values({
    make: "Seat", model: "León 1.5 TGI Style", year: 2020, price: 15400,
    attractiveness: "normal", km: 92000, fuel: "GNC", transmission: "Manual",
    location: "Alcalá de Henares", imageUrl: null, depositCents: 15000, status: "released",
    publishedAt: hoursAgo(60), availableUntil: hours(12), releasedAt: hoursAgo(2),
    viewersNow: 4,
  }).returning();

  const [c5] = await db.insert(carsTable).values({
    make: "Mercedes", model: "Clase A 180d", year: 2018, price: 17500,
    attractiveness: "hard", km: 110000, fuel: "Diésel", transmission: "Automático",
    location: "Móstoles", imageUrl: null, depositCents: 20000, status: "open",
    publishedAt: hoursAgo(50), availableUntil: hours(22), viewersNow: 2,
  }).returning();

  const [c6] = await db.insert(carsTable).values({
    make: "Toyota", model: "Yaris Hybrid Active", year: 2022, price: 17900,
    attractiveness: "hot", km: 32400, fuel: "Híbrido", transmission: "Automático",
    location: "Madrid Centro", imageUrl: null, depositCents: 20000, status: "sold",
    publishedAt: hoursAgo(120), availableUntil: hoursAgo(96), viewersNow: 0,
  }).returning();

  const [c7] = await db.insert(carsTable).values({
    make: "Renault", model: "Captur 1.3 TCe Zen", year: 2021, price: 16400,
    attractiveness: "normal", km: 56300, fuel: "Gasolina", transmission: "Manual",
    location: "Getafe", imageUrl: null, depositCents: 20000, status: "open",
    publishedAt: hoursAgo(20), availableUntil: hours(28), viewersNow: 5,
  }).returning();

  const colors = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

  const [l1] = await db.insert(leadsTable).values({
    name: "Marcos García", phone: "+34 612 345 678", carId: c1.id, stage: "awaiting_deposit",
    depositPaid: false, unreadCount: 1, avatarColor: colors[0],
  }).returning();

  const [l2] = await db.insert(leadsTable).values({
    name: "Lucía Fernández", phone: "+34 698 112 233", carId: c2.id, stage: "locked",
    depositPaid: true, unreadCount: 0, avatarColor: colors[1],
  }).returning();

  const [l3] = await db.insert(leadsTable).values({
    name: "Javier Romero", phone: "+34 645 778 901", carId: c3.id, stage: "new",
    depositPaid: false, unreadCount: 2, avatarColor: colors[2],
  }).returning();

  const [l4] = await db.insert(leadsTable).values({
    name: "Sara Pérez", phone: "+34 622 559 012", carId: c4.id, stage: "released",
    depositPaid: false, unreadCount: 0, avatarColor: colors[3],
  }).returning();

  const [l5] = await db.insert(leadsTable).values({
    name: "Pablo Ortega", phone: "+34 656 334 091", carId: c5.id, stage: "doubting",
    depositPaid: false, unreadCount: 1, avatarColor: colors[4],
  }).returning();

  const [l6] = await db.insert(leadsTable).values({
    name: "Cristina Mora", phone: "+34 671 220 558", carId: c7.id, stage: "new",
    depositPaid: false, unreadCount: 1, avatarColor: colors[5],
  }).returning();

  const baseMessages = [
    { leadId: l1.id, dir: "incoming", offset: -45, text: "Hola, quiero bloquear la unidad: Audi A4 Avant 2020 (24.500€). ¿Sigue disponible?" },
    { leadId: l1.id, dir: "outgoing", offset: -42, text: "Sí, sigue disponible ahora mismo.\nTe explico rápido: puedo bloquearla durante 12h para que nadie más acceda mientras decides.\nPara hacerlo, pedimos un pequeño depósito (300€) que asegura la unidad.\nSi quieres, te explico el proceso en 1 minuto.", ai: true, intent: "first_response" },
    { leadId: l1.id, dir: "incoming", offset: -10, text: "Vale, me interesa. ¿Cómo hago el pago?" },

    { leadId: l2.id, dir: "incoming", offset: -180, text: "Quiero bloquear el BMW Serie 3 Touring. Sigue disponible?" },
    { leadId: l2.id, dir: "outgoing", offset: -178, text: "Sí, sigue disponible.\nPuedo bloquearla 12h con un depósito de 200€.\n¿Te paso los datos para el Bizum?", ai: true, intent: "first_response" },
    { leadId: l2.id, dir: "incoming", offset: -170, text: "Listo, hecho el Bizum." },
    { leadId: l2.id, dir: "outgoing", offset: -168, text: "Listo, unidad bloqueada.\nDurante las próximas 12h nadie más puede acceder a ella.\nVamos viendo contigo los detalles para cerrar con calma.", ai: true, intent: "confirm_lock" },
    { leadId: l2.id, dir: "system", offset: -167, text: "Unidad bloqueada durante 12h. Depósito recibido." },

    { leadId: l3.id, dir: "incoming", offset: -25, text: "Hola, quiero bloquear la unidad: Volkswagen Golf 2021 (19.800€). ¿Sigue disponible?" },
    { leadId: l3.id, dir: "incoming", offset: -3, text: "¿Hola?" },

    { leadId: l4.id, dir: "incoming", offset: -1500, text: "Me interesa el Seat León GNC." },
    { leadId: l4.id, dir: "outgoing", offset: -1498, text: "Sí, sigue disponible.\nPuedo bloquearla 12h con un depósito de 150€.", ai: true, intent: "first_response" },
    { leadId: l4.id, dir: "incoming", offset: -1495, text: "Hago el Bizum ahora." },
    { leadId: l4.id, dir: "outgoing", offset: -1493, text: "Listo, unidad bloqueada.", ai: true, intent: "confirm_lock" },
    { leadId: l4.id, dir: "system", offset: -1492, text: "Unidad bloqueada durante 12h." },
    { leadId: l4.id, dir: "system", offset: -130, text: "12h cumplidas. Unidad liberada." },
    { leadId: l4.id, dir: "outgoing", offset: -125, text: "La unidad ha sido liberada nuevamente.\nSi sigue encajando contigo, aún puedes acceder si no se bloquea otra vez.", ai: true, intent: "post_release" },

    { leadId: l5.id, dir: "incoming", offset: -90, text: "Me interesa el Mercedes Clase A pero no estoy seguro." },
    { leadId: l5.id, dir: "outgoing", offset: -88, text: "Sin problema.\nSolo ten en cuenta que si otro cliente la bloquea antes, deja de estar disponible.\nSi quieres asegurarla, aún estás a tiempo.", ai: true, intent: "handle_doubt" },
    { leadId: l5.id, dir: "incoming", offset: -8, text: "Lo voy a pensar esta tarde." },

    { leadId: l6.id, dir: "incoming", offset: -6, text: "Hola, quiero bloquear la unidad: Renault Captur 2021 (16.400€). ¿Sigue disponible?" },
  ];

  for (const m of baseMessages) {
    await db.insert(messagesTable).values({
      leadId: m.leadId,
      direction: m.dir,
      content: m.text,
      aiGenerated: m.ai === true,
      intent: m.intent ?? null,
      createdAt: new Date(now.getTime() + m.offset * 60_000),
    });
  }

  await db.insert(activityTable).values([
    { kind: "lock", text: "Lucía Fernández bloqueó BMW Serie 3 por 12h", leadName: "Lucía Fernández", carLabel: "BMW Serie 3", at: hoursAgo(2.8) },
    { kind: "release", text: "Seat León liberado y vuelve al escaparate", carLabel: "Seat León", at: hoursAgo(2) },
    { kind: "sale", text: "Toyota Yaris Hybrid vendido", carLabel: "Toyota Yaris Hybrid", at: hoursAgo(36) },
    { kind: "new_lead", text: "Nuevo lead Cristina Mora interesada en Renault Captur", leadName: "Cristina Mora", carLabel: "Renault Captur", at: hoursAgo(0.1) },
    { kind: "new_lead", text: "Nuevo lead Javier Romero interesado en VW Golf", leadName: "Javier Romero", carLabel: "VW Golf", at: hoursAgo(0.4) },
    { kind: "draft", text: "Borrador IA \"first_response\" para Marcos García", leadName: "Marcos García", carLabel: "Audi A4 Avant", at: hoursAgo(0.7) },
  ]);

  // Bump updated_at to reflect last message order
  await db.execute(sql`UPDATE leads SET updated_at = (SELECT MAX(created_at) FROM messages WHERE messages.lead_id = leads.id) WHERE EXISTS (SELECT 1 FROM messages WHERE messages.lead_id = leads.id)`);

  await ensureFifteenCars();

  logger.info("Seed complete");
}

const EXTRA_CARS = [
  { make: "Audi", model: "Q3 35 TFSI S line", year: 2021, price: 28900, attractiveness: "hot", km: 52000, fuel: "Gasolina", transmission: "Automático", location: "Madrid Norte", depositCents: 30000, originalPrice: 32500 },
  { make: "BMW", model: "X1 sDrive18d", year: 2020, price: 25400, attractiveness: "normal", km: 71000, fuel: "Diésel", transmission: "Automático", location: "Madrid Sur", depositCents: 25000, originalPrice: 28900 },
  { make: "Volkswagen", model: "Tiguan 2.0 TDI Advance", year: 2019, price: 21900, attractiveness: "normal", km: 96000, fuel: "Diésel", transmission: "Manual", location: "Móstoles", depositCents: 20000, originalPrice: 24900 },
  { make: "Peugeot", model: "3008 1.5 BlueHDi GT Line", year: 2020, price: 19400, attractiveness: "hot", km: 64000, fuel: "Diésel", transmission: "Automático", location: "Getafe", depositCents: 20000, originalPrice: 22500 },
  { make: "Hyundai", model: "Tucson 1.6 CRDi N Line", year: 2021, price: 22500, attractiveness: "hot", km: 38000, fuel: "Diésel", transmission: "Manual", location: "Alcalá de Henares", depositCents: 25000, originalPrice: 25900 },
  { make: "Kia", model: "Sportage 1.6 T-GDi GT-Line", year: 2022, price: 26900, attractiveness: "hot", km: 28000, fuel: "Gasolina", transmission: "Automático", location: "Madrid Centro", depositCents: 30000, originalPrice: 30500 },
  { make: "Ford", model: "Kuga 2.5 PHEV ST-Line", year: 2021, price: 24500, attractiveness: "normal", km: 49000, fuel: "Híbrido enchufable", transmission: "Automático", location: "Madrid Norte", depositCents: 25000, originalPrice: 28900 },
  { make: "Citroën", model: "C5 Aircross 1.5 BlueHDi Shine", year: 2020, price: 18900, attractiveness: "hard", km: 88000, fuel: "Diésel", transmission: "Manual", location: "Leganés", depositCents: 20000, originalPrice: 22400 },
];

async function ensureFifteenCars(): Promise<void> {
  const all = await db.select().from(carsTable);
  if (all.length >= 15) return;

  const have = new Set(all.map((c) => `${c.make.toLowerCase()}-${c.model.toLowerCase()}`));
  const needed = 15 - all.length;
  const toAdd = EXTRA_CARS.filter((c) => !have.has(`${c.make.toLowerCase()}-${c.model.toLowerCase()}`)).slice(0, needed);

  const now = new Date();
  for (let i = 0; i < toAdd.length; i++) {
    const c = toAdd[i];
    const wHours = c.attractiveness === "hot" ? 24 : c.attractiveness === "hard" ? 72 : 48;
    await db.insert(carsTable).values({
      make: c.make,
      model: c.model,
      year: c.year,
      price: c.price,
      attractiveness: c.attractiveness,
      km: c.km,
      fuel: c.fuel,
      transmission: c.transmission,
      location: c.location,
      depositCents: c.depositCents,
      status: "open",
      publishedAt: new Date(now.getTime() - (i + 1) * 3 * 3600_000),
      availableUntil: new Date(now.getTime() + wHours * 3600_000),
      viewersNow: Math.floor(Math.random() * 9) + 1,
      notes: `Precio original ${c.originalPrice}€. Outlet flash de la semana.`,
    });
  }

  logger.info({ added: toAdd.length }, "Extra cars seeded to reach 15");
}
