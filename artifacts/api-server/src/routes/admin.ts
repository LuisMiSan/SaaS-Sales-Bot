import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/admin/restart", requireAdminAuth, (_req, res) => {
  logger.warn("Manual restart requested via admin endpoint — shutting down in 2s");
  res.json({ ok: true, message: "Reiniciando servidor en 2 segundos..." });
  setTimeout(() => process.exit(0), 2000);
});

export default router;
