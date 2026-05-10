import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import sitemapRouter from "./routes/sitemap";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust Replit's reverse proxy so req.ip reflects the real client address
// from the rightmost non-trusted entry in X-Forwarded-For rather than the
// proxy's own socket IP. An attacker cannot spoof this because the Replit
// proxy appends the real client IP; only that appended value is trusted.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigins: Set<string> = buildAllowedOrigins();

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    for (const d of domains.split(",")) {
      const trimmed = d.trim();
      if (trimmed) {
        origins.add(`https://${trimmed}`);
      }
    }
  }
  origins.add("http://localhost");
  origins.add("http://localhost:80");
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    origins.add(`https://${devDomain}`);
  }
  return origins;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "8kb",
    verify(_req, _res, buf) {
      (_req as import("express").Request).rawBody = buf;
    },
  }),
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(sitemapRouter);
app.use("/api", router);

export default app;
