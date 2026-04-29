import { Router, type IRouter } from "express";
import { requireStaffAuth } from "../middleware/auth";
import { sql, desc } from "drizzle-orm";
import { db, carsTable, leadsTable, activityTable, messagesTable } from "@workspace/db";
import { serializeActivity } from "../lib/format";

const router: IRouter = Router();

router.get("/dashboard/summary", requireStaffAuth, async (_req, res): Promise<void> => {
  const [cars, leads, avgResult] = await Promise.all([
    db.select().from(carsTable),
    db.select().from(leadsTable),
    // Average time (minutes) between an incoming message and the next outgoing reply for the same lead
    db.execute(sql`
      SELECT COALESCE(
        AVG(EXTRACT(EPOCH FROM (reply.created_at - incoming.created_at)) / 60),
        0
      )::float AS avg_minutes
      FROM messages incoming
      JOIN LATERAL (
        SELECT created_at
        FROM messages r
        WHERE r.lead_id = incoming.lead_id
          AND r.direction = 'outgoing'
          AND r.created_at > incoming.created_at
        ORDER BY r.created_at
        LIMIT 1
      ) reply ON true
      WHERE incoming.direction = 'incoming'
    `),
  ]);

  const avgResponseMinutes = Number((avgResult.rows[0] as { avg_minutes: string } | undefined)?.avg_minutes ?? 0);

  const carsByStatus = ["open", "locking", "locked", "released", "sold"].map((status) => ({
    status,
    count: cars.filter((c) => c.status === status).length,
  }));
  const stages = ["new", "awaiting_deposit", "locked", "doubting", "released", "won", "lost"];
  const leadsByStage = stages.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
  }));

  const lockedCount = cars.filter((c) => c.status === "locked").length;
  const depositValueCents = cars.filter((c) => c.status === "locked").reduce((s, c) => s + c.depositCents, 0);

  const sevenDaysAgo = Date.now() - 7 * 24 * 3600_000;
  const wonLast7d = leads.filter((l) => l.stage === "won" && l.updatedAt.getTime() >= sevenDaysAgo).length;

  const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.stage)).length;
  const awaitingDeposit = leads.filter((l) => l.stage === "awaiting_deposit").length;

  const closed = leads.filter((l) => l.stage === "won" || l.stage === "lost").length;
  const won = leads.filter((l) => l.stage === "won").length;
  const conversionRate = closed > 0 ? won / closed : 0;

  res.json({
    openCars: cars.filter((c) => c.status === "open").length,
    lockedCars: lockedCount,
    releasedCars: cars.filter((c) => c.status === "released").length,
    soldCars: cars.filter((c) => c.status === "sold").length,
    activeLeads,
    awaitingDeposit,
    wonLast7d,
    depositValueCents,
    avgResponseMinutes,
    conversionRate,
    leadsByStage,
    carsByStatus,
  });
});

router.get("/dashboard/activity", requireStaffAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(activityTable).orderBy(desc(activityTable.at)).limit(40);
  res.json(rows.map(serializeActivity));
});

export default router;
