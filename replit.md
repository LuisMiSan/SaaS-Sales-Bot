# Asistente Ventas WhatsApp

Cockpit comercial para concesionario de coches de ocasión. El equipo gestiona desde aquí los leads que pulsan "Bloquear unidad" en la web, redacta respuestas de WhatsApp asistidas por IA y controla el inventario con sus ventanas de bloqueo de 12 horas.

## Stack
- Monorepo pnpm (`pnpm-workspace`).
- Backend: `artifacts/api-server` (Express 5, Drizzle, PostgreSQL).
- Frontend: `artifacts/asistente-ventas` (React 19 + Vite + Tailwind v4 + shadcn/ui + wouter).
- IA: integración Replit AI (`@workspace/integrations-openai-ai-server`), modelo `gpt-5.2`.
- Spec: `lib/api-spec/openapi.yaml` → `@workspace/api-client-react` (orval) + `@workspace/api-zod`.
- Esquema BD: `lib/db/src/schema/cars.ts` (cars, leads, messages, activity).

## Convenciones
- Idioma de la UI y los mensajes: español de España. Sin emojis.
- Modo oscuro por defecto (gris grafito + acento ámbar).
- Estados coche: `open | locking | locked | released | sold`. Estados lead: `new | awaiting_deposit | locked | doubting | released | won | lost`.
- Atractividad coche: `hot` (24h), `normal` (48h), `hard` (72h).
- El servidor siembra datos demo si la base está vacía (`src/lib/seed.ts`).

## Pantallas
- `/` Dashboard con KPIs, pipeline, inventario por estado y actividad reciente.
- `/inbox` y `/inbox/:id` Buzón estilo WhatsApp con composer + 5 botones de borrador IA + "Personalizado" + "Simular mensaje entrante".
- `/inventory` Tarjetas con estado, precio, atractivo, viewers y countdown vivo.
- `/cars/:id` Detalle de coche con acciones (liberar, vender, editar) y leads relacionados.

## Integración WhatsApp (Cloud API de Meta)
- Cliente: `artifacts/api-server/src/lib/whatsapp.ts` (`sendWhatsAppText`, `parseIncomingWebhook`).
- Rutas: `artifacts/api-server/src/routes/whatsapp.ts` montadas bajo `/api`.
  - `GET  /api/whatsapp/webhook` — verificación (echo del `hub.challenge`).
  - `POST /api/whatsapp/webhook` — recepción de mensajes; crea lead automáticamente por número (o lo enlaza si ya existe), registra el mensaje como `incoming` y suma `unreadCount`.
  - `GET  /api/whatsapp/status` — devuelve `enabled` y `mode` (`live` | `sandbox`).
  - `POST /api/whatsapp/sandbox/inbound` — `{ phone, name?, text }` simula mensaje entrante para pruebas locales.
- Envío saliente: `POST /api/leads/:id/messages` ahora también dispara `sendWhatsAppText`. Si falla la entrega se registra warning pero el mensaje queda guardado.
- Variables (todas opcionales en sandbox):
  - `WHATSAPP_TOKEN` — token permanente de la app de Meta.
  - `WHATSAPP_PHONE_NUMBER_ID` — id del número emisor (Meta Business).
  - `WHATSAPP_VERIFY_TOKEN` — string que se introduce al configurar el webhook (por defecto `asistente-ventas-verify`).
  - `WHATSAPP_GRAPH_VERSION` — opcional, por defecto `v21.0`.
- Sin token configurado → modo **sandbox**: los envíos solo se loguean. Permite probar el cockpit completo antes de tener credenciales reales.
- URL del webhook a registrar en Meta una vez desplegado: `https://<dominio>/api/whatsapp/webhook`.

## Carga masiva de coches (UI: "Subir en lote" en /inventory)
- Backend: `POST /api/cars/bulk-import` body `{ text: string }`. Una línea por coche; máx. 50.
- Cada línea puede ser texto libre, fila CSV, anuncio entero, o **URL de un anuncio**.
- Helper `lib/import-ai.ts`:
  - `isUrl(line)` detecta `http(s)://…`.
  - `fetchCarPage(url)` descarga con `User-Agent` realista, extrae `<title>`, `og:title`, `og:description`, meta description y los primeros 5.000 caracteres de texto (HTML stripped).
  - `parseCarLine(payload)` llama a `gpt-5.2` con `response_format: json_object` y devuelve `{ make, model, year, price, km, fuel, transmission, location, attractiveness, depositCents, notes }`. La IA estima campos faltantes con criterio de mercado español y redacta la ficha comercial sin inventar equipamiento.
- Errores aislados por línea: si una URL falla (403 anti-bot, 404, timeout) o el JSON sale corrupto, esa línea entra en `failed[]` con el motivo y el resto se procesan.
- Caveats: portales con Cloudflare agresivo (coches.net) pueden devolver 403; en ese caso el comercial pega el texto del anuncio en vez de la URL.
