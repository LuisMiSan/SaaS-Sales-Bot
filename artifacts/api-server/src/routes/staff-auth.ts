import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  destroyAllSessionsForUser,
  requireStaffAuth,
  requireAdminAuth,
} from "../middleware/auth";
import { verifyPassword, hashPassword } from "../lib/password";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

// ---------------------------------------------------------------------------
// POST /api/staff/login
// ---------------------------------------------------------------------------
router.post("/staff/login", async (req, res) => {
  const { username, password } = req.body as { username?: unknown; password?: unknown };
  if (typeof username !== "string" || !username.trim()) {
    res.status(400).json({ error: "Usuario requerido." });
    return;
  }
  if (typeof password !== "string" || !password) {
    res.status(400).json({ error: "Contraseña requerida." });
    return;
  }

  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username.trim().toLowerCase()))
    .limit(1);

  if (!user || !user.isActive) {
    req.log.warn({ username: username.trim() }, "Failed staff login: unknown or disabled user");
    // Constant-time response to prevent user enumeration
    await verifyPassword(password, "invalid:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    res.status(401).json({ error: "Credenciales incorrectas." });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    req.log.warn({ userId: user.id, username: user.username }, "Failed staff login: wrong password");
    res.status(401).json({ error: "Credenciales incorrectas." });
    return;
  }

  const token = createSession({ userId: user.id, username: user.username, role: user.role });
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
  req.log.info({ userId: user.id, username: user.username }, "Staff session created");
  res.json({ ok: true, username: user.username, role: user.role });
});

// ---------------------------------------------------------------------------
// POST /api/staff/logout
// ---------------------------------------------------------------------------
router.post("/staff/logout", requireStaffAuth, (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /api/staff/session
// ---------------------------------------------------------------------------
router.get("/staff/session", requireStaffAuth, (req, res) => {
  res.json({ ok: true, username: req.staffUser?.username, role: req.staffUser?.role });
});

// ---------------------------------------------------------------------------
// Admin: list staff users
// GET /api/staff/users
// ---------------------------------------------------------------------------
router.get("/staff/users", requireAdminAuth, async (_req, res) => {
  const users = await db
    .select({
      id: staffUsersTable.id,
      username: staffUsersTable.username,
      role: staffUsersTable.role,
      isActive: staffUsersTable.isActive,
      createdAt: staffUsersTable.createdAt,
    })
    .from(staffUsersTable)
    .orderBy(staffUsersTable.id);
  res.json(users);
});

// ---------------------------------------------------------------------------
// Admin: create staff user
// POST /api/staff/users
// ---------------------------------------------------------------------------
router.post("/staff/users", requireAdminAuth, async (req, res) => {
  const { username, password, role } = req.body as { username?: unknown; password?: unknown; role?: unknown };

  if (typeof username !== "string" || !username.trim()) {
    res.status(400).json({ error: "Usuario requerido." });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    return;
  }
  const resolvedRole = role === "admin" ? "admin" : "staff";

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(staffUsersTable)
    .values({ username: username.trim().toLowerCase(), passwordHash, role: resolvedRole })
    .returning({ id: staffUsersTable.id, username: staffUsersTable.username, role: staffUsersTable.role, isActive: staffUsersTable.isActive });

  req.log.info({ createdBy: req.staffUser?.username, newUser: created.username }, "Staff user created");
  res.status(201).json(created);
});

// ---------------------------------------------------------------------------
// Admin: disable / re-enable a staff user
// PATCH /api/staff/users/:id
// ---------------------------------------------------------------------------
router.patch("/staff/users/:id", requireAdminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "ID inválido." });
    return;
  }

  const { isActive, password } = req.body as { isActive?: unknown; password?: unknown };
  const updates: Partial<{ isActive: boolean; passwordHash: string }> = {};

  if (typeof isActive === "boolean") {
    updates.isActive = isActive;
    if (!isActive) {
      destroyAllSessionsForUser(id);
    }
  }
  if (typeof password === "string" && password.length >= 8) {
    updates.passwordHash = await hashPassword(password);
    destroyAllSessionsForUser(id);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nada que actualizar." });
    return;
  }

  const [updated] = await db
    .update(staffUsersTable)
    .set(updates)
    .where(eq(staffUsersTable.id, id))
    .returning({ id: staffUsersTable.id, username: staffUsersTable.username, role: staffUsersTable.role, isActive: staffUsersTable.isActive });

  if (!updated) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }

  req.log.info({ updatedBy: req.staffUser?.username, targetUser: updated.username, changes: Object.keys(updates) }, "Staff user updated");
  res.json(updated);
});

export default router;
