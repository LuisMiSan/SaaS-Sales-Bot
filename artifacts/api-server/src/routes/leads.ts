import { Router, type IRouter } from "express";
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
import { sendWhatsAppText } from "../lib/whatsapp";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const AVATAR_COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

async function getLastMessage(leadId: number) {
  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.leadId, leadId)).orderBy(desc(messagesTable.createdAt)).limit(1);
  return msg ?? null;
}

router.get("/leads", async (req, res): Promise<void> => {
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
  res.status(201).json({ ...serializeLead(lead, null), car: serializeCar(car) });
});

router.get("/leads/:id", async (req, res): Promise<void> => {
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

router.patch("/leads/:id", async (req, res): Promise<void> => {
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

router.get("/leads/:id/messages", async (req, res): Promise<void> => {
  const params = ListLeadMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db.select().from(messagesTable).where(eq(messagesTable.leadId, params.data.id)).orderBy(messagesTable.createdAt);
  res.json(messages.map(serializeMessage));
});

router.post("/leads/:id/messages", async (req, res): Promise<void> => {
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

router.post("/leads/:id/incoming", async (req, res): Promise<void> => {
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

router.post("/leads/:id/draft", async (req, res): Promise<void> => {
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
