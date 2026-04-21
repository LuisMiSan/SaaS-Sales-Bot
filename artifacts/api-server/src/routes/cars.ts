import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, carsTable, leadsTable, activityTable, messagesTable } from "@workspace/db";
import {
  ListCarsQueryParams,
  CreateCarBody,
  GetCarParams,
  UpdateCarParams,
  UpdateCarBody,
  LockCarParams,
  LockCarBody,
  ReleaseCarParams,
  MarkCarSoldParams,
} from "@workspace/api-zod";
import { serializeCar, windowHoursForAttractiveness } from "../lib/format";

const router: IRouter = Router();

router.get("/cars", async (req, res): Promise<void> => {
  const parsed = ListCarsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = parsed.data.status
    ? await db.select().from(carsTable).where(eq(carsTable.status, parsed.data.status)).orderBy(desc(carsTable.publishedAt))
    : await db.select().from(carsTable).orderBy(desc(carsTable.publishedAt));

  res.json(rows.map(serializeCar));
});

router.post("/cars", async (req, res): Promise<void> => {
  const parsed = CreateCarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const hours = windowHoursForAttractiveness(data.attractiveness);
  const now = new Date();
  const availableUntil = new Date(now.getTime() + hours * 3600_000);

  const [car] = await db
    .insert(carsTable)
    .values({
      make: data.make,
      model: data.model,
      year: data.year,
      price: data.price,
      attractiveness: data.attractiveness,
      km: data.km,
      fuel: data.fuel,
      transmission: data.transmission,
      location: data.location,
      imageUrl: data.imageUrl ?? null,
      depositCents: data.depositCents,
      notes: data.notes ?? null,
      status: "open",
      availableUntil,
      viewersNow: Math.floor(Math.random() * 8) + 1,
    })
    .returning();

  res.status(201).json(serializeCar(car));
});

router.get("/cars/:id", async (req, res): Promise<void> => {
  const params = GetCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, params.data.id));
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(serializeCar(car));
});

router.patch("/cars/:id", async (req, res): Promise<void> => {
  const params = UpdateCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateCarBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [car] = await db.update(carsTable).set(body.data).where(eq(carsTable.id, params.data.id)).returning();
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(serializeCar(car));
});

router.post("/cars/:id/lock", async (req, res): Promise<void> => {
  const params = LockCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = LockCarBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const lockedUntil = new Date(Date.now() + 12 * 3600_000);
  const [car] = await db
    .update(carsTable)
    .set({ status: "locked", lockedUntil, releasedAt: null })
    .where(eq(carsTable.id, params.data.id))
    .returning();
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  await db.update(leadsTable).set({ stage: "locked", depositPaid: true }).where(eq(leadsTable.id, body.data.leadId));
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, body.data.leadId));
  await db.insert(activityTable).values({
    kind: "lock",
    text: `${lead?.name ?? "Lead"} bloqueó ${car.make} ${car.model} por 12h`,
    leadName: lead?.name ?? null,
    carLabel: `${car.make} ${car.model}`,
  });
  await db.insert(messagesTable).values({
    leadId: body.data.leadId,
    direction: "system",
    content: `Unidad bloqueada durante 12h. Depósito recibido.`,
    aiGenerated: false,
  });
  res.json(serializeCar(car));
});

router.post("/cars/:id/release", async (req, res): Promise<void> => {
  const params = ReleaseCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const now = new Date();
  const hours = 48;
  const [existing] = await db.select().from(carsTable).where(eq(carsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  const wHours = windowHoursForAttractiveness(existing.attractiveness);
  const [car] = await db
    .update(carsTable)
    .set({
      status: "released",
      lockedUntil: null,
      releasedAt: now,
      availableUntil: new Date(now.getTime() + wHours * 3600_000),
    })
    .where(eq(carsTable.id, params.data.id))
    .returning();
  await db.insert(activityTable).values({
    kind: "release",
    text: `${car.make} ${car.model} liberado y vuelve al escaparate`,
    carLabel: `${car.make} ${car.model}`,
  });
  res.json(serializeCar(car));
});

router.post("/cars/:id/sell", async (req, res): Promise<void> => {
  const params = MarkCarSoldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [car] = await db
    .update(carsTable)
    .set({ status: "sold" })
    .where(eq(carsTable.id, params.data.id))
    .returning();
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  const carLeads = await db.select().from(leadsTable).where(and(eq(leadsTable.carId, car.id), eq(leadsTable.stage, "locked")));
  for (const l of carLeads) {
    await db.update(leadsTable).set({ stage: "won" }).where(eq(leadsTable.id, l.id));
  }
  await db.insert(activityTable).values({
    kind: "sale",
    text: `${car.make} ${car.model} vendido`,
    carLabel: `${car.make} ${car.model}`,
  });
  res.json(serializeCar(car));
});

export default router;
