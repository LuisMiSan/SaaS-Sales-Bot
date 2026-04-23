import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, leadsTable, carsTable, messagesTable, activityTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { whatsappConfig, parseIncomingWebhook, normalizePhone } from "../lib/whatsapp";

const router: IRouter = Router();

const AVATAR_COLORS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

async function findOrCreateLeadByPhone(phone: string, fallbackName: string): Promise<{ leadId: number; created: boolean }> {
  const normalized = normalizePhone(phone);
  const [existing] = await db
    .select()
    .from(leadsTable)
    .where(sql`regexp_replace(${leadsTable.phone}, '[^0-9]', '', 'g') = ${normalized}`)
    .orderBy(desc(leadsTable.updatedAt))
    .limit(1);
  if (existing) return { leadId: existing.id, created: false };

  const [latestCar] = await db.select().from(carsTable).orderBy(desc(carsTable.publishedAt)).limit(1);
  if (!latestCar) throw new Error("No cars in catalog yet");

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const [lead] = await db
    .insert(leadsTable)
    .values({
      name: fallbackName,
      phone: normalized,
      carId: latestCar.id,
      avatarColor: color,
    })
    .returning();
  await db.insert(activityTable).values({
    kind: "new_lead",
    text: `Nuevo lead por WhatsApp: ${lead.name}`,
    leadName: lead.name,
    carLabel: `${latestCar.make} ${latestCar.model}`,
  });
  return { leadId: lead.id, created: true };
}

async function ingestIncoming(args: { fromPhone: string; profileName: string | null; text: string }): Promise<{ leadId: number; created: boolean }> {
  const name = args.profileName?.trim() || `Cliente ${args.fromPhone.slice(-4)}`;
  const { leadId, created } = await findOrCreateLeadByPhone(args.fromPhone, name);
  await db.insert(messagesTable).values({
    leadId,
    direction: "incoming",
    content: args.text || "(mensaje vacío)",
    aiGenerated: false,
  });
  await db
    .update(leadsTable)
    .set({ unreadCount: sql`${leadsTable.unreadCount} + 1`, updatedAt: sql`now()` })
    .where(eq(leadsTable.id, leadId));
  return { leadId, created };
}

router.get("/whatsapp/webhook", (req, res): void => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === whatsappConfig.verifyToken) {
    logger.info("WhatsApp webhook verified");
    res.status(200).send(String(challenge ?? ""));
    return;
  }
  res.sendStatus(403);
});

router.post("/whatsapp/webhook", async (req, res): Promise<void> => {
  res.sendStatus(200);
  try {
    const incomings = parseIncomingWebhook(req.body);
    for (const inc of incomings) {
      await ingestIncoming({ fromPhone: inc.fromPhone, profileName: inc.profileName, text: inc.text });
    }
  } catch (err) {
    logger.error({ err }, "WhatsApp webhook processing failed");
  }
});

router.get("/whatsapp/status", (_req, res): void => {
  res.json({
    enabled: whatsappConfig.enabled,
    mode: whatsappConfig.enabled ? "live" : "sandbox",
    phoneNumberId: whatsappConfig.phoneNumberId,
    verifyTokenConfigured: Boolean(whatsappConfig.verifyToken),
  });
});

router.post("/whatsapp/sandbox/inbound", async (req, res): Promise<void> => {
  const body = req.body as { phone?: string; name?: string; text?: string };
  if (!body?.phone || !body?.text) {
    res.status(400).json({ error: "phone and text required" });
    return;
  }
  try {
    const result = await ingestIncoming({
      fromPhone: body.phone,
      profileName: body.name ?? null,
      text: body.text,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
