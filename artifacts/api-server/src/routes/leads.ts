import { Router, type IRouter } from "express";
import { requireStaffAuth } from "../middleware/auth";
import { eq, desc, sql } from "drizzle-orm";
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
import { serializeLead, serializeCar, serializeMessage } from "../lib/format";
import { generateDraft } from "../lib/draft";
import { pickAutoIntent } from "../lib/auto-intent";
import { sendWhatsAppText } from "../lib/whatsapp";
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

  const out = await Promise.all(
    rows.map(async (lead) => {
      const last = await getLastMessage(lead.id);
      const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
      return { ...serializeLead(lead, last), car: serializeCar(car) };
    }),
  );
  res.json(out);
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const [lead] = await db
    .insert(leadsTable)
    .values({ ...parsed.data, avatarColor: color })
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
  res.status(201).json({ ...serializeLead(lead, welcome), publicToken: lead.publicToken, car: serializeCar(car) });
});

router.get("/leads/:id/thread", async (req, res): Promise<void> => {
  const params = ListLeadMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead || lead.publicToken !== token) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.leadId, lead.id)).orderBy(messagesTable.createdAt);
  res.json(messages.map(serializeMessage));
});

router.post("/leads/:id/thread", async (req, res): Promise<void> => {
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
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, params.data.id));
  if (!lead || lead.publicToken !== token) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (isPublicMessageRateLimited(lead.id)) {
    res.status(429).json({ error: "Too many messages. Please wait before sending again." });
    return;
  }
  const [msg] = await db
    .insert(messagesTable)
    .values({
      leadId: lead.id,
      direction: "incoming",
      content: body.data.content,
      aiGenerated: false,
    })
    .returning();
  await db.update(leadsTable).set({ unreadCount: sql`${leadsTable.unreadCount} + 1`, updatedAt: sql`now()` }).where(eq(leadsTable.id, lead.id));

  // Fire-and-forget: AI agent responds automatically to the customer.
  // The customer chat polls every 5s and will pick up the reply.
  void respondAsAgent(lead.id).catch((err) => {
    logger.error({ err, leadId: lead.id }, "Auto-respond failed");
  });

  res.status(201).json(serializeMessage(msg));
});

// Per-lead rate limiter for the public chat endpoint.
// Allows at most 5 messages per lead per 60 seconds.
const PUBLIC_RATE_LIMIT_MAX = 5;
const PUBLIC_RATE_LIMIT_WINDOW_MS = 60_000;
const publicMessageTimestamps = new Map<number, number[]>();

function isPublicMessageRateLimited(leadId: number): boolean {
  const now = Date.now();
  const recent = (publicMessageTimestamps.get(leadId) ?? []).filter((t) => now - t < PUBLIC_RATE_LIMIT_WINDOW_MS);
  if (recent.length >= PUBLIC_RATE_LIMIT_MAX) {
    publicMessageTimestamps.set(leadId, recent);
    return true;
  }
  recent.push(now);
  publicMessageTimestamps.set(leadId, recent);
  return false;
}

// Periodically evict expired rate-limit entries to prevent unbounded map growth.
setInterval(
  () => {
    const cutoff = Date.now() - PUBLIC_RATE_LIMIT_WINDOW_MS;
    for (const [leadId, timestamps] of publicMessageTimestamps) {
      const remaining = timestamps.filter((t) => t > cutoff);
      if (remaining.length === 0) {
        publicMessageTimestamps.delete(leadId);
      } else {
        publicMessageTimestamps.set(leadId, remaining);
      }
    }
  },
  5 * 60_000, // run every 5 minutes
).unref();

// Per-lead in-flight guard: prevents two concurrent auto-replies from
// generating duplicate messages when the customer sends quickly.
const autoReplyInFlight = new Map<number, boolean>();

async function respondAsAgent(leadId: number): Promise<void> {
  if (autoReplyInFlight.get(leadId)) return;
  autoReplyInFlight.set(leadId, true);
  try {
    // Loop: keep replying while there are unanswered incoming messages.
    // This covers the case where the customer sends a second message while
    // we're still generating the reply to the first one.
    // Hard cap at 5 iterations as a safety net against runaway loops.
    for (let iter = 0; iter < 5; iter++) {
      const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, leadId));
      if (!lead) return;
      const [car] = await db.select().from(carsTable).where(eq(carsTable.id, lead.carId));
      if (!car) return;
      const history = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.leadId, lead.id))
        .orderBy(messagesTable.createdAt);

      const lastIncoming = [...history].reverse().find((m) => m.direction === "incoming") ?? null;
      const lastOutgoing = [...history].reverse().find((m) => m.direction === "outgoing") ?? null;

      // Nothing to answer, or we already answered after the last incoming.
      if (!lastIncoming) return;
      if (lastOutgoing && lastOutgoing.createdAt >= lastIncoming.createdAt) return;

      const intent = pickAutoIntent({
        stage: lead.stage,
        depositPaid: lead.depositPaid,
        carStatus: car.status,
        lastIncoming: lastIncoming.content,
        hasMessages: history.length > 0,
      });

      const draft = await generateDraft({ intent, car, lead, history });

      await db.insert(messagesTable).values({
        leadId: lead.id,
        direction: "outgoing",
        content: draft.content,
        aiGenerated: true,
      });
      await db
        .update(leadsTable)
        .set({ updatedAt: sql`now()` })
        .where(eq(leadsTable.id, lead.id));
      await db.insert(activityTable).values({
        kind: "auto_reply",
        text: `Agente IA respondió a ${lead.name} (${intent})`,
        leadName: lead.name,
        carLabel: `${car.make} ${car.model}`,
      });
    }
  } finally {
    autoReplyInFlight.delete(leadId);
  }
}

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

  const send = await sendWhatsAppText(lead.phone, body.data.content);
  if (!send.ok) {
    logger.warn({ leadId: lead.id, err: send.error }, "WhatsApp delivery failed (message stored)");
  }

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

export default router;
