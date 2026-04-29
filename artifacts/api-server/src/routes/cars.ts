import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, carsTable, leadsTable, activityTable, messagesTable } from "@workspace/db";
import {
  ListCarsQueryParams,
  ListCarsStaffQueryParams,
  CreateCarBody,
  GetCarParams,
  UpdateCarParams,
  UpdateCarBody,
  LockCarParams,
  LockCarBody,
  ReleaseCarParams,
  MarkCarSoldParams,
} from "@workspace/api-zod";
import { serializeCar, serializePublicCar, windowHoursForAttractiveness } from "../lib/format";
import { parseCarLine, fetchCarPage, isUrl, normalizeMarketRange } from "../lib/import-ai";
import { logger } from "../lib/logger";
import { requireStaffAuth } from "../middleware/auth";

const router: IRouter = Router();

const BULK_IMPORT_WINDOW_MS = 60 * 60 * 1000;
const BULK_IMPORT_PER_USER_LIMIT = 5;
const BULK_IMPORT_GLOBAL_LIMIT = 20;
const bulkImportTimestamps = new Map<string, number[]>();
let globalBulkImportTimestamps: number[] = [];

function checkBulkImportRateLimit(userId: string): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const cutoff = now - BULK_IMPORT_WINDOW_MS;

  globalBulkImportTimestamps = globalBulkImportTimestamps.filter((t) => t > cutoff);
  if (globalBulkImportTimestamps.length >= BULK_IMPORT_GLOBAL_LIMIT) {
    const oldest = globalBulkImportTimestamps[0];
    return { allowed: false, retryAfterSecs: Math.ceil((oldest + BULK_IMPORT_WINDOW_MS - now) / 1000) };
  }

  const userTs = (bulkImportTimestamps.get(userId) ?? []).filter((t) => t > cutoff);
  if (userTs.length >= BULK_IMPORT_PER_USER_LIMIT) {
    const oldest = userTs[0];
    return { allowed: false, retryAfterSecs: Math.ceil((oldest + BULK_IMPORT_WINDOW_MS - now) / 1000) };
  }

  userTs.push(now);
  bulkImportTimestamps.set(userId, userTs);
  globalBulkImportTimestamps.push(now);
  return { allowed: true, retryAfterSecs: 0 };
}

interface BulkImportResult {
  created: ReturnType<typeof serializeCar>[];
  failed: Array<{ line: string; error: string }>;
}

router.post("/cars/bulk-import", requireStaffAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers["authorization"] ?? "";
  const userId = authHeader.startsWith("Bearer ") ? authHeader.slice(7, 47) : "unknown";
  const rateCheck = checkBulkImportRateLimit(userId);
  if (!rateCheck.allowed) {
    res.setHeader("Retry-After", String(rateCheck.retryAfterSecs));
    res.status(429).json({ error: "Demasiadas importaciones. Inténtalo más tarde." });
    return;
  }
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  if (!text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  const lines: string[] = text
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    res.status(400).json({ error: "no usable lines" });
    return;
  }
  if (lines.length > 50) {
    res.status(400).json({ error: "max 50 cars per batch" });
    return;
  }

  const result: BulkImportResult = { created: [], failed: [] };

  for (const line of lines) {
    try {
      const payload = isUrl(line) ? await fetchCarPage(line.trim()) : line;
      const parsed = await parseCarLine(payload);
      const hours = windowHoursForAttractiveness(parsed.attractiveness);
      const now = new Date();
      const [car] = await db
        .insert(carsTable)
        .values({
          make: parsed.make,
          model: parsed.model,
          year: parsed.year,
          price: parsed.price,
          attractiveness: parsed.attractiveness,
          km: parsed.km,
          fuel: parsed.fuel,
          transmission: parsed.transmission,
          location: parsed.location,
          depositCents: parsed.depositCents,
          notes: parsed.notes,
          marketPriceMin: parsed.marketPriceMin,
          marketPriceMax: parsed.marketPriceMax,
          status: "open",
          availableUntil: new Date(now.getTime() + hours * 3600_000),
          viewersNow: Math.floor(Math.random() * 8) + 1,
        })
        .returning();
      await db.insert(activityTable).values({
        kind: "new_car",
        text: `Nuevo coche cargado por IA: ${car.make} ${car.model} ${car.year}`,
        carLabel: `${car.make} ${car.model}`,
      });
      result.created.push(serializeCar(car));
    } catch (err) {
      logger.error({ err, line }, "bulk-import line failed");
      result.failed.push({ line, error: (err as Error).message });
    }
  }

  res.status(201).json(result);
});

const PUBLIC_ALLOWED_STATUSES = new Set(["open", "locking", "locked"]);

router.get("/cars", async (req, res): Promise<void> => {
  const parsed = ListCarsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const requestedStatus = parsed.data.status;
  if (requestedStatus && !PUBLIC_ALLOWED_STATUSES.has(requestedStatus)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = requestedStatus
    ? await db.select().from(carsTable).where(eq(carsTable.status, requestedStatus)).orderBy(desc(carsTable.publishedAt))
    : await db
        .select()
        .from(carsTable)
        .where(eq(carsTable.status, "open"))
        .orderBy(desc(carsTable.publishedAt));

  res.json(rows.map(serializePublicCar));
});

router.get("/staff/cars", requireStaffAuth, async (req, res): Promise<void> => {
  const parsed = ListCarsStaffQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = parsed.data.status
    ? await db.select().from(carsTable).where(eq(carsTable.status, parsed.data.status)).orderBy(desc(carsTable.publishedAt))
    : await db.select().from(carsTable).orderBy(desc(carsTable.publishedAt));
  res.json(rows.map(serializeCar));
});

router.get("/staff/cars/:id", requireStaffAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id));
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(serializeCar(car));
});

router.post("/cars", requireStaffAuth, async (req, res): Promise<void> => {
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
      ...normalizeMarketRange(data.marketPriceMin, data.marketPriceMax),
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
  if (!PUBLIC_ALLOWED_STATUSES.has(car.status)) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(serializePublicCar(car));
});

router.patch("/cars/:id", requireStaffAuth, async (req, res): Promise<void> => {
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
  const update = { ...body.data };
  if ("marketPriceMin" in update || "marketPriceMax" in update) {
    const normalized = normalizeMarketRange(update.marketPriceMin, update.marketPriceMax);
    update.marketPriceMin = normalized.marketPriceMin;
    update.marketPriceMax = normalized.marketPriceMax;
  }
  const [car] = await db.update(carsTable).set(update).where(eq(carsTable.id, params.data.id)).returning();
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  res.json(serializeCar(car));
});

router.post("/cars/:id/lock", requireStaffAuth, async (req, res): Promise<void> => {
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
  const lockedUntil = new Date(Date.now() + 2 * 3600_000);
  const [car] = await db
    .update(carsTable)
    .set({ status: "locked", lockedUntil, releasedAt: null })
    .where(eq(carsTable.id, params.data.id))
    .returning();
  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }
  await db.update(leadsTable).set({ stage: "locked" }).where(eq(leadsTable.id, body.data.leadId));
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, body.data.leadId));
  await db.insert(activityTable).values({
    kind: "lock",
    text: `${lead?.name ?? "Lead"} bloqueó ${car.make} ${car.model} por 2h`,
    leadName: lead?.name ?? null,
    carLabel: `${car.make} ${car.model}`,
  });
  await db.insert(messagesTable).values({
    leadId: body.data.leadId,
    direction: "system",
    content: `Unidad bloqueada durante 2h. El cliente puede cerrar la compra dentro de la ventana.`,
    aiGenerated: false,
  });
  res.json(serializeCar(car));
});

router.post("/cars/:id/release", requireStaffAuth, async (req, res): Promise<void> => {
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

router.post("/cars/:id/sell", requireStaffAuth, async (req, res): Promise<void> => {
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
