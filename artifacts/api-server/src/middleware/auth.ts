import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Session store
// ---------------------------------------------------------------------------

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const SESSION_COOKIE = "staff_session";

interface Session {
  token: string;
  userId: number;
  username: string;
  role: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

// Sweep expired sessions every 15 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (session.expiresAt <= now) {
        sessions.delete(token);
      }
    }
  },
  15 * 60 * 1000,
).unref();

export interface SessionInfo {
  userId: number;
  username: string;
  role: string;
}

export function createSession(info: SessionInfo): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { token, ...info, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function destroyAllSessionsForUser(userId: number): void {
  for (const [token, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
}

function validateSessionToken(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      staffUser?: SessionInfo;
    }
  }
}

export function requireStaffAuth(req: Request, res: Response, next: NextFunction): void {
  const cookie = req.cookies?.[SESSION_COOKIE];
  if (typeof cookie === "string" && cookie.length > 0) {
    const session = validateSessionToken(cookie);
    if (session) {
      req.staffUser = { userId: session.userId, username: session.username, role: session.role };
      next();
      return;
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  requireStaffAuth(req, res, () => {
    if (req.staffUser?.role !== "admin") {
      res.status(403).json({ error: "Se requieren privilegios de administrador." });
      return;
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// Bootstrap key (used only to seed the first admin on startup)
// ---------------------------------------------------------------------------

export function loadBootstrapPassword(): string | null {
  const key = process.env.STAFF_API_KEY;
  if (key && key.trim().length > 0) {
    return key.trim();
  }
  if (process.env.NODE_ENV === "production") {
    logger.error("STAFF_API_KEY is not set — cannot seed initial admin in production.");
    process.exit(1);
  }
  logger.warn(
    "STAFF_API_KEY is not set — set it in your environment to create the initial admin account.",
  );
  return null;
}
