import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";
import { db, carsTable, leadsTable, activityTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import { windowHoursForAttractiveness } from "./lib/format";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function autoReleaseExpiredLocks(): Promise<void> {
  const now = new Date();
  const expired = await db
    .select()
    .from(carsTable)
    .where(and(eq(carsTable.status, "locked"), lt(carsTable.lockedUntil, now)));

  for (const car of expired) {
    const wHours = windowHoursForAttractiveness(car.attractiveness);
    await db
      .update(carsTable)
      .set({
        status: "released",
        lockedUntil: null,
        releasedAt: now,
        availableUntil: new Date(now.getTime() + wHours * 3600_000),
      })
      .where(eq(carsTable.id, car.id));

    await db
      .update(leadsTable)
      .set({ stage: "lost" })
      .where(and(eq(leadsTable.carId, car.id), eq(leadsTable.stage, "locked")));

    await db.insert(activityTable).values({
      kind: "release",
      text: `${car.make} ${car.model} liberado automáticamente (2h expiradas)`,
      carLabel: `${car.make} ${car.model}`,
    });

    logger.info({ carId: car.id }, "Auto-released expired lock");
  }
}

setInterval(() => {
  autoReleaseExpiredLocks().catch((err) => {
    logger.error({ err }, "Auto-release check failed");
  });
}, 60_000).unref();


app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  try {
    await seedIfEmpty();
  } catch (e) {
    logger.error({ err: e }, "Seed failed");
  }

  autoReleaseExpiredLocks().catch((err) => {
    logger.error({ err }, "Initial auto-release check failed");
  });
});
