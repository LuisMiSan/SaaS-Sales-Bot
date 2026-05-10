import { Router } from "express";
import { db, carsTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const router = Router();

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const cars = await db
    .select({ id: carsTable.id, updatedAt: carsTable.updatedAt })
    .from(carsTable)
    .where(inArray(carsTable.status, ["open", "locking", "locked"]));

  const BASE = "https://pujamostucoche.es";
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: `${BASE}/`, changefreq: "daily", priority: "1.0", lastmod: today },
    { loc: `${BASE}/tienda`, changefreq: "daily", priority: "0.9", lastmod: today },
    { loc: `${BASE}/privacidad`, changefreq: "monthly", priority: "0.3", lastmod: "" },
    { loc: `${BASE}/cookies`, changefreq: "monthly", priority: "0.3", lastmod: "" },
    { loc: `${BASE}/terminos`, changefreq: "monthly", priority: "0.3", lastmod: "" },
  ];

  const carUrls = cars.map((c) => ({
    loc: `${BASE}/tienda/coche/${c.id}`,
    changefreq: "weekly",
    priority: "0.8",
    lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : today,
  }));

  const allUrls = [...staticUrls, ...carUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

export default router;
