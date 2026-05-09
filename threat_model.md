# Threat Model

## Project Overview

Pujamostucoche.es is a pnpm monorepo with an Express 5 API (`artifacts/api-server`), a React/Vite frontend (`artifacts/asistente-ventas`), shared Zod/OpenAPI client packages, and a PostgreSQL database via Drizzle. The application serves two audiences in production: a public storefront under `/tienda` where customers browse cars, and an internal sales cockpit under `/staff/*` for dealership staff. The backend also contains OpenAI-powered message drafting/import flows and dormant WhatsApp integration code that is present in the repo but is not currently mounted in `src/routes/index.ts`.

Production assumptions for future scans: `NODE_ENV=production`; TLS is handled by the platform; `artifacts/mockup-sandbox` is dev-only and should be ignored unless separately exposed; `.agents`, attached assets, and local skill artifacts are not production application surfaces unless code under `artifacts/api-server` or `artifacts/asistente-ventas` makes them reachable.

## Assets

- **Lead and customer data** — names, phone numbers, chat transcripts, lead stages, unread counts, and inferred sales status in `leads` and `messages`. Exposure would leak PII and active sales conversations.
- **Inventory and sales state** — car availability, lock windows, released/sold state, and internal pricing/support metadata. Unauthorized modification can directly disrupt sales operations and misrepresent stock.
- **Operational settings and AI guidance** — records in `settings` influence agent behavior and system prompts. Tampering can alter customer-facing messages and internal business workflow.
- **WhatsApp integration trust** — inbound webhook events and outbound sender configuration determine whether a message is genuinely from Meta/customer traffic or is spoofed.
- **Server-side network reachability** — the backend can fetch external URLs during bulk import and can call third-party APIs. Any user-controlled server-side fetch is a potential bridge into internal network resources.

## Trust Boundaries

- **Browser to API** — all frontend requests cross from an untrusted browser into `/api`. Public storefront users and internet attackers can reach these endpoints unless the server enforces authentication and authorization.
- **Public storefront to internal cockpit** — `/tienda` is intentionally public, while the dashboard/inbox/inventory/settings surfaces are internal business tooling. This boundary must be enforced server-side, not just by route naming or UI placement.
- **Customer public chat to lead records** — `/api/leads/:id/thread?token=...` exposes a limited conversation channel guarded by a per-lead token. That token boundary must not be bypassable through other lead/message endpoints, and possession of one valid token must not grant unlimited AI-triggering abuse.
- **Browser to shared staff bearer secret** — staff access is currently represented by a single `STAFF_API_KEY` bearer token entered into the browser. Compromise of that shared secret collapses the entire internal authorization boundary.
- **API to PostgreSQL** — the API has broad authority over cars, leads, messages, activity, and settings. Missing authorization or unsafe query composition here yields full data compromise.
- **Meta/WhatsApp to webhook endpoint** — `src/routes/whatsapp.ts` contains an internet-facing webhook design, but it is currently unmounted in production. If it is mounted later, the server must distinguish authentic Meta-signed traffic from attacker-crafted POSTs.
- **API to external URLs / OpenAI** — bulk import fetches arbitrary pages and forwards extracted content into AI parsing. This boundary is high risk for SSRF, unintended data disclosure, and resource abuse.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`, mounted route files under `artifacts/api-server/src/routes/*.ts`, `artifacts/asistente-ventas/src/App.tsx`, public pages under `artifacts/asistente-ventas/src/pages/landing*.tsx`.
- **Highest-risk areas:** `src/middleware/auth.ts`, `src/routes/leads.ts`, `src/routes/cars.ts`, `src/routes/settings.ts`, `src/lib/import-ai.ts`, `src/lib/draft.ts`.
- **Public surfaces:** `/tienda`, `/tienda/coche/:id`, `POST /api/leads`, `GET/POST /api/leads/:id/thread`, `GET /api/cars`, `GET /api/cars/:id`, `GET /api/config`, `GET /api/healthz`.
- **Internal surfaces that must be protected:** `/staff/*` pages; `/api/dashboard/*`, `/api/leads*` except public thread endpoints, mutating `/api/cars*`, `/api/staff/cars*`, `/api/settings`, `/api/admin/*`.
- **Dormant but security-sensitive code:** `src/routes/whatsapp.ts` and `src/lib/whatsapp.ts` should be rescanned immediately if the router is mounted in `src/routes/index.ts`.
- **Usually dev-only / out of scope:** `artifacts/mockup-sandbox`, `.agents`, attached assets, local skills, generated scanner noise outside production paths.

## Threat Categories

### Spoofing

This project currently accepts customer input through public lead creation and token-guarded lead threads, while staff APIs rely on a shared bearer secret. The system must ensure that only the holder of a valid per-lead public token can access a public customer thread, and internal sales tooling must require a real authenticated staff identity rather than mere possession of a long-lived shared secret. If the dormant WhatsApp webhook is mounted later, only genuine Meta deliveries must be accepted.

### Tampering

Cars, leads, stages, lock windows, settings, and outbound AI messaging behavior are all mutable business-critical state. The server must enforce who may change each field and must validate relationships such as which lead is allowed to lock which car. Bulk import must not let untrusted users drive arbitrary server-side network requests or mutate the inventory without authorization.

### Information Disclosure

The API stores and serves PII, sales conversations, internal inventory metadata, and configuration values. Only the minimum fields required for each public route should be exposed, and public catalog endpoints must use storefront-safe serializers rather than reusing internal inventory views. Internal endpoints must not be reachable anonymously. Error responses and logs must avoid leaking secrets, auth material, or full query strings.

### Denial of Service

Publicly reachable lead creation, polling, and chat endpoints, webhook ingestion, and AI-backed drafting can consume database, network, and model resources. The production system must bound request sizes, transcript growth, iteration counts, and traffic rates so public users or token holders cannot mint unlimited fresh chat tokens, exhaust AI/network budgets, or force unbounded auto-reply work.

### Elevation of Privilege

The most important guarantee is that public users must never gain access to the internal sales cockpit or its backing APIs. All admin and staff actions must be enforced server-side. User-controlled URLs must never let an attacker pivot the backend into internal services, and public lead/chat flows must not reuse internal serializers or other back-office response shapes that reveal staff-only vehicle metadata.
