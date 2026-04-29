import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";

function loadStaffApiKey(): string {
  const key = process.env.STAFF_API_KEY;
  if (key && key.trim().length > 0) {
    return key.trim();
  }
  if (process.env.NODE_ENV === "production") {
    logger.error("STAFF_API_KEY is not set — refusing to start in production without a stable credential.");
    process.exit(1);
  }
  const generated = crypto.randomUUID();
  logger.warn(
    "STAFF_API_KEY is not set — a random key has been generated for this process. " +
      "Set STAFF_API_KEY in your environment to use a stable credential.",
  );
  return generated;
}

const STAFF_API_KEY: string = loadStaffApiKey();

export function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token === STAFF_API_KEY) {
      next();
      return;
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}
