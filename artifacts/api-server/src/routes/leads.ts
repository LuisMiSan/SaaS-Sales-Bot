import { Router, type IRouter } from "express";
import { requireStaffAuth } from "../middleware/auth";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { db, leadsTable, carsTable, messagesTable, activityTable } from "@workspace/db";
import {
  ListLeadsQueryParams,
  CreateLeadBody,
  GetLeadParams,
  UpdateLeadParams,
  UpdateLeadBody,
  ListLeadMessagesParams,
  SendLeadMessageParams,
  SendLeadMessageBody,
  DraftLeadReplyParams,
  DraftLeadReplyBody,
  SimulateIncomingMessageParams,
  SimulateIncomingMessageBody,
} from "@workspace/api-zod";
import { serializeLead, serializeCar, serializePublicCar, serializeMessage } from "../lib/format";
import { generateDraft } from "../lib/draft";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const AVATAR_COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

async function getLastMessage(leadId: number) {
  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.leadId, leadId)).orderBy(desc(messagesTable.createdAt)).limit(1);
  return msg ?? null;
}

router.get("/leads", requireStaffAuth, async (req, res): Promise<void> => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = parsed.data.stage
    ? await db.select().from(leadsTable).where(eq(leadsTable.stage, parsed.data.stage)).orderBy(desc(leadsTable.updatedAt))
    : await db.select().from(leadsTable).orderBy(desc(leadsTable.updatedAt));

  if (rows.length === 0) {
    res.json([]);
    return;
  }

  // Batch-fetch all related cars and messages in two queries instead of N+1
  const carIds = [...new Set(rows.map((l) => l.carId))];
  const leadIds = rows.map((l) => l.id);

  const [allCars, allMessages] = await Promise.all([
    db.select().from(carsTable).where(inArray(carsTable.id, carIds)),
    db.select().from(messagesTable).where(inArray(messagesTable.leadId, leadIds)).orderBy(desc(messagesTable.createdAt)),
  ]);

  const carById = new Map(allCars.map((c) => [c.id, c]));

  // Keep only the most-recent message per lead
  const lastMessageByLead = new Map<number, typeof allMessages[number]>();
  for (const msg of allMessages) {
    if (!lastMessageByLead.has(msg.leadId)) {
      lastMessageByLead.set(msg.leadId, msg);
    }
  }

  const out = rows.map((lead) => {
    const car = carById.get(lead.carId);
    const last = lastMessageByLead.get(lead.id) ?? null;
    return { ...serializeLead(lead, last), car: car ? serializeCar(car) : null };
  });

  res.json(out);
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Use req.ip which Express derives from the trusted proxy chain (trust proxy: 1
  // is set in app.ts), so the value cannot be spoofed via a forged header.
  const clientIp = req.ip ?? "unknown";
  const rateLimited = await isIpLeadRateLimited(clientIp);
  if (rateLimited) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const [lead] = await db
    .insert(leadsTable)
    .values({ ...parsed.data, avatarColor: color, clientIp })
    .returning();
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
  await db.insert(activityTable).values({
    kind: "new_lead",
    text: `Nuevo lead ${lead.name} interesado en ${car.make} ${car.model}`,
    leadName: lead.name,
    carLabel: `${car.make} ${car.model}`,
  });
  const [welcome] = await db
    .insert(messagesTable)
    .values({
      leadId: lead.id,
      direction: "outgoing",
      content: `Hola ${lead.name}, soy del equipo de Pujamostucoche.es. He visto que te interesa el ${car.make} ${car.model}. ¿Quieres que te lo bloquee 2h sin compromiso? También puedo ayudarte con financiación.`,
      aiGenerated: true,
    })
    .returning();

  // Call n8n to qualify the lead and get the WhatsApp redirect link
  let waLink: string | null = null;
  try {
    const n8nRes = await fetch("https://n8n.iadivisionmadrid.es/webhook/pujamostucoche-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        carInterest: `${car.make} ${car.model} ${car.year}`,
        email: lead.email ?? undefined,
      }),
    });
    if (n8nRes.ok) {
      const n8nData = (await n8nRes.json()) as { ok?: boolean; waLink?: string };
      if (n8nData.ok && n8nData.waLink) waLink = n8nData.waLink;
    }
  } catch (err) {
    req.log.warn({ err }, "n8n webhook call failed — lead registered but no waLink");
  }

  res.status(201).json({ ...serializeLead(lead, welcome), car: serializePublicCar(car), waLink });
});

// Atomically increments a fixed-window counter and returns true if the limit is exceeded.
// Uses ON CONFLICT DO UPDATE so the increment and read are a single atomic DB operation,
// preventing race conditions under parallel requests.
const RATE_LIMIT_WINDOW_MS = 10 * 60_000; // 10 minutes

async function incrementAndCheck(scope: string, ip: string, limit: number): Promise<boolean> {
  if (ip === "unknown") return false;
  const windowStart = new Date(Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS);
  const key = `${scope}:${ip}`;
  const result = await db.execute<{ count: number }>(
    sql`INSERT INTO rate_limit_windows (key, window_start, count)
        VALUES (${key}, ${windowStart}, 1)
        ON CONFLICT (key, window_start)
        DO UPDATE SET count = rate_limit_windows.count + 1
        RETURNING count`,
  );
  const count = result.rows[0]?.count ?? 1;
  return count > limit;
}

// Per-IP lead creation: max 10 per IP per 10-min window.
async function isIpLeadRateLimited(ip: string): Promise<boolean> {
  return incrementAndCheck("lead_create", ip, 10);
}

// Periodically delete expired rate_limit_windows rows to prevent unbounded growth.
setInterval(
  () => {
    const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS * 2);
    db.execute(sql`DELETE FROM rate_limit_windows WHERE window_start < ${cutoff}`).catch((err) => {
      logger.warn({ err }, "rate_limit_windows cleanup failed");
    });
  },
  15 * 60_000, // every 15 minutes
).unref();


router.get("/leads/:id", requireStaffAuth, async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.leadId, lead.id)).orderBy(messagesTable.createdAt);
  const last = messages[messages.length - 1] ?? null;
  await db.update(leadsTable).set({ unreadCount: 0 }).where(eq(leadsTable.id, lead.id));
  res.json({
    ...serializeLead({ ...lead, unreadCount: 0 }, last),
    car: serializeCar(car),
    messages: messages.map(serializeMessage),
  });
});

router.patch("/leads/:id", requireStaffAuth, async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateLeadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [lead] = await db.update(leadsTable).set(body.data).where(eq(leadsTable.id, params.data.id)).returning();
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
  const last = await getLastMessage(lead.id);
  res.json({ ...serializeLead(lead, last), car: serializeCar(car) });
});

router.get("/leads/:id/messages", requireStaffAuth, async (req, res): Promise<void> => {
  const params = ListLeadMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.leadId, params.data.id)).orderBy(messagesTable.createdAt);
  res.json(messages.map(serializeMessage));
});

router.post("/leads/:id/messages", requireStaffAuth, async (req, res): Promise<void> => {
  const params = SendLeadMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendLeadMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [msg] = await db
    .insert(messagesTable)
    .values({
      leadId: params.data.id,
      direction: "outgoing",
      content: body.data.content,
      aiGenerated: body.data.aiGenerated ?? false,
      intent: body.data.intent ?? null,
    })
    .returning();
  await db.update(leadsTable).set({ updatedAt: sql`now()` }).where(eq(leadsTable.id, params.data.id));

  res.status(201).json(serializeMessage(msg));
});

router.post("/leads/:id/incoming", requireStaffAuth, async (req, res): Promise<void> => {
  const params = SimulateIncomingMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SimulateIncomingMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [msg] = await db
    .insert(messagesTable)
    .values({
      leadId: params.data.id,
      direction: "incoming",
      content: body.data.content,
      aiGenerated: false,
    })
    .returning();
  await db.update(leadsTable).set({ unreadCount: sql`${leadsTable.unreadCount} + 1`, updatedAt: sql`now()` }).where(eq(leadsTable.id, params.data.id));
  res.status(201).json(serializeMessage(msg));
});

router.post("/leads/:id/draft", requireStaffAuth, async (req, res): Promise<void> => {
  const params = DraftLeadReplyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = DraftLeadReplyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
  const history = await db.select().from(messagesTable).where(eq(messagesTable.leadId, lead.id)).orderBy(messagesTable.createdAt);
  const draft = await generateDraft({
    intent: body.data.intent,
    instructions: body.data.instructions,
    car,
    lead,
    history,
  });
  await db.insert(activityTable).values({
    kind: "draft",
    text: `Borrador IA "${body.data.intent}" para ${lead.name}`,
    leadName: lead.name,
    carLabel: `${car.make} ${car.model}`,
  });
  res.json({ intent: body.data.intent, content: draft.content, rationale: draft.rationale });
});

router.delete("/staff/leads/:id", requireStaffAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(messagesTable).where(eq(messagesTable.leadId, id));
  const [deleted] = await db.delete(leadsTable).where(eq(leadsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Lead not found" }); return; }
  res.status(204).end();
});

export default router;
