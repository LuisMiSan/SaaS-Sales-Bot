import { Router, type IRouter } from "express";
import { requireStaffAuth } from "../middleware/auth";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/settings", requireStaffAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

router.patch("/settings", requireStaffAuth, async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Body must be a key-value object" });
    return;
  }
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    await db
      .insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value, updatedAt: new Date() },
      });
    req.log.info({ key }, "Setting updated");
  }
  res.json({ ok: true });
});

export default router;
