import { db, carsTable, leadsTable, messagesTable, activityTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { generateDraft } from "./draft";
import { logger } from "./logger";

// How long of silence (last message outgoing, no client reply) before nudging.
const NUDGE_SILENCE_MS = 25 * 60_000; // 25 minutes

// In-memory set: lead IDs that already received a nudge in the current lock window.
// Cleared automatically when a lead is no longer locked.
// Acceptable within a 2-hour lock window; a server restart may send a second nudge — harmless.
const nudgedLeads = new Set<number>();

export async function checkAndNudgeLockedLeads(): Promise<void> {
  // Get all leads currently in 'locked' stage
  const lockedLeads = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.stage, "locked"));

  // Clean up in-memory set for leads that are no longer locked
  for (const id of nudgedLeads) {
    if (!lockedLeads.find((l) => l.id === id)) {
      nudgedLeads.delete(id);
    }
  }

  for (const lead of lockedLeads) {
    if (nudgedLeads.has(lead.id)) continue;

    // Get the last message of this conversation
    const [lastMsg] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.leadId, lead.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    if (!lastMsg) continue;

    // Only nudge when the agent spoke last (client has gone quiet)
    if (lastMsg.direction !== "outgoing") continue;

    const silenceMs = Date.now() - lastMsg.createdAt.getTime();
    if (silenceMs < NUDGE_SILENCE_MS) continue;

    // Double-check the car is still locked
    const [car] = await db
      .select()
      .from(carsTable)
      .where(and(eq(carsTable.id, lead.carId), eq(carsTable.status, "locked")));
    if (!car) continue;

    // Mark as nudged before generating to avoid duplicate sends on slow AI calls
    nudgedLeads.add(lead.id);

    try {
      const allMessages = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.leadId, lead.id))
        .orderBy(messagesTable.createdAt);

      const draft = await generateDraft({
        intent: "nudge_closing",
        car,
        lead,
        history: allMessages,
      });

      await db.insert(messagesTable).values({
        leadId: lead.id,
        direction: "outgoing",
        content: draft.content,
        aiGenerated: true,
        intent: "nudge_closing",
      });
      await db
        .update(leadsTable)
        .set({ updatedAt: sql`now()` })
        .where(eq(leadsTable.id, lead.id));
      await db.insert(activityTable).values({
        kind: "auto_reply",
        text: `Agente IA envió nudge de cierre a ${lead.name} (silencio >25 min con unidad bloqueada)`,
        leadName: lead.name,
        carLabel: `${car.make} ${car.model}`,
      });

      logger.info({ leadId: lead.id, silenceMs }, "Nudge de cierre enviado");
    } catch (err) {
      // Allow retry on next cycle if the draft generation failed
      nudgedLeads.delete(lead.id);
      logger.error({ err, leadId: lead.id }, "Error enviando nudge de cierre");
    }
  }
}
