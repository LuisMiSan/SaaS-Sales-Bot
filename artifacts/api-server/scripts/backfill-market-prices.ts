import { db, carsTable } from "@workspace/db";
import { eq, isNull, or, sql } from "drizzle-orm";
import { parseCarLine } from "../src/lib/import-ai.ts";

async function main() {
  const targets = await db
    .select()
    .from(carsTable)
    .where(or(isNull(carsTable.marketPriceMin), isNull(carsTable.marketPriceMax)));

  console.log(`Coches a estimar: ${targets.length}`);

  for (const car of targets) {
    const km = (car.km / 1000).toFixed(0);
    const line = `${car.make} ${car.model} ${car.year}, ${km}.000 km, ${car.fuel}, ${car.transmission}. Precio outlet ${car.price}€.`;
    try {
      const parsed = await parseCarLine(line);
      const min = parsed.marketPriceMin;
      const max = parsed.marketPriceMax > min ? parsed.marketPriceMax : min + Math.max(500, Math.round(min * 0.1));
      await db
        .update(carsTable)
        .set({ marketPriceMin: min, marketPriceMax: max })
        .where(eq(carsTable.id, car.id));
      const flag = car.price < min ? "" : car.price > max ? "  [⚠ por encima del mercado]" : "  [≈ alineado]";
      console.log(`  #${car.id} ${car.make} ${car.model}: ${min}€ – ${max}€  (precio ${Math.round(car.price)}€)${flag}`);
    } catch (err) {
      console.error(`  #${car.id} ERROR:`, (err as Error).message);
    }
  }

  const after = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(carsTable)
    .where(or(isNull(carsTable.marketPriceMin), isNull(carsTable.marketPriceMax)));
  console.log(`Quedan sin estimar: ${after[0]?.n ?? 0}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
