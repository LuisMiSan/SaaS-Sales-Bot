import { db, staffUsersTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { hashPassword } from "./password";
import { loadBootstrapPassword } from "../middleware/auth";
import { logger } from "./logger";

export async function bootstrapAdminIfNeeded(): Promise<void> {
  const [row] = await db.select({ count: count() }).from(staffUsersTable);
  if (row && row.count > 0) {
    return;
  }

  const password = loadBootstrapPassword();
  if (!password) {
    logger.warn("No staff users exist and STAFF_API_KEY is not set — the cockpit will be inaccessible until an admin is created manually.");
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staffUsersTable).values({
    username: "admin",
    passwordHash,
    role: "admin",
    isActive: true,
  });
  logger.info("Created initial admin user from STAFF_API_KEY (username: admin). Change the password or create individual user accounts.");
}
