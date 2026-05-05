# Asistente Ventas WhatsApp

Cockpit comercial para concesionario de coches de ocasión. El equipo gestiona desde aquí los leads que pulsan "Bloquear unidad" en la web, redacta respuestas de WhatsApp asistidas por IA y controla el inventario con sus ventanas de bloqueo gratuitas de **2 horas**.

## Ventana de bloqueo (regla de producto)
- Duración: **2 horas** (`artifacts/api-server/src/routes/cars.ts` → POST `/cars/:id/lock`).
- Es **gratuita y sin compromiso**: no se pide señal, fianza, depósito, transferencia ni Bizum para reservar. La columna `cars.depositCents` se mantiene en BD como referencia interna pero NO aparece en la web pública (`/tienda`, `/tienda/coche/:id`) ni en los prompts de la IA (`artifacts/api-server/src/lib/draft.ts`).
- En el cockpit (dashboard, inbox, car-detail) sí se sigue mostrando para uso interno del comercial.

## Web pública "Pujamostucoche.es" (`/` y `/coche/:id`)
- Orden de secciones del landing (rediseño oscuro mayo 2026): Hero oscuro → ¿Sabes lo que...? → Comparativa Nosotros vs. Ellos → Ejemplo real con primer coche disponible → Modo IKEA → Misión → Cómo funciona (3 pasos) → Catálogo coches en sección oscura (hasta 15 unidades) → Footer CTA → Footer legal.
- Paleta: fondo muy oscuro `#070711`, acento naranja `#EE7B22`, tarjetas de coches sobre `#0E1A2E`.
- Widget WhatsApp (`src/components/whatsapp-widget.tsx`): lee el número de BD vía `/api/config` (hook `useWhatsappNumber`). Número configurable en panel staff → Ajustes sin redesplegar. Número actual: `34604928624`. Botones inline en hero + ficha de coche (`landing-car.tsx`).

## Stack
- Monorepo pnpm (`pnpm-workspace`).
- Backend: `artifacts/api-server` (Express 5, Drizzle, PostgreSQL).
- Frontend: `artifacts/asistente-ventas` (React 19 + Vite + Tailwind v4 + shadcn/ui + wouter).
- IA: integración Replit AI (`@workspace/integrations-openai-ai-server`), modelo `gpt-5.2`.
- Spec: `lib/api-spec/openapi.yaml` → `@workspace/api-client-react` (orval) + `@workspace/api-zod`.
- Esquema BD: `lib/db/src/schema/cars.ts` (cars, leads, messages, activity).

## Campos extendidos de vehículo (cars table)
Campos básicos: `make`, `model`, `year`, `price`, `km`, `fuel`, `transmission`, `location`, `imageUrl`, `photos[]`, `videoUrl`, `depositCents`, `status`, `attractiveness`.
Ficha técnica: `description` (texto público), `horsepower`, `doors`, `seats`, `color`, `bodyType`, `engineCc`.
Consumo y emisiones: `consumptionUrban`, `consumptionHighway`, `consumptionMixed` (L/100), `co2` (g/km).
Internos: `notes` (solo staff), `marketPriceMin`, `marketPriceMax`, `viewersNow`.

La IA de importación extrae todos estos campos automáticamente al importar por URL. El editor de ficha staff tiene 5 pestañas: Ficha / Técnica / Consumo / Fotos+Vídeo / Comercial.

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
  - `parseCarLine(payload)` llama a `gpt-5.2` con `response_format: json_object` y devuelve `{ make, model, year, price, km, fuel, transmission, location, attractiveness, depositCents, notes, marketPriceMin, marketPriceMax }`. La IA estima campos faltantes con criterio de mercado español y redacta la ficha comercial sin inventar equipamiento.
- Errores aislados por línea: si una URL falla (403 anti-bot, 404, timeout) o el JSON sale corrupto, esa línea entra en `failed[]` con el motivo y el resto se procesan.
- Caveats: portales con Cloudflare agresivo (coches.net) pueden devolver 403; en ese caso el comercial pega el texto del anuncio en vez de la URL.

## Precio de mercado por coche (`marketPriceMin` / `marketPriceMax`)
- Columnas `cars.market_price_min` y `cars.market_price_max` (integers en euros, nullable).
- Se rellenan automáticamente al importar coches por la IA (basadas en coches.net, AutoScout24, milanuncios, wallapop motor: depreciación, kms, equipamiento, automático). Amplitud típica 15-25%.
- Backfill puntual de coches antiguos: `pnpm dlx tsx artifacts/api-server/scripts/backfill-market-prices.ts` (idempotente, solo procesa los que estén `NULL`).
- Componente UI: `artifacts/asistente-ventas/src/components/market-price-card.tsx`. Renderiza una barra horizontal con rango azul (mín-máx portales), nuestro precio como pin naranja, tres KPIs (mín/tú pagas/máx) y el ahorro vs media. Solo se muestra si ambos campos están presentes y `max > min`.

## Chat público en la ficha de coche (`/tienda/coche/:id`)
- Cuando el cliente rellena el formulario de bloqueo, `POST /api/leads` crea el lead, inserta automáticamente un mensaje `outgoing` de bienvenida (no se envía por WhatsApp, solo queda en BD) y devuelve además `publicToken` (UUID por lead, columna `leads.public_token`).
- El frontend guarda `{leadId, publicToken, name, phone}` en `localStorage` con clave `pujamostucoche.lead.<carId>` y muestra `<CustomerChat>` debajo de la ficha.
- Endpoints públicos blindados por token (no usan los hooks generados):
  - `GET  /api/leads/:id/thread?token=<uuid>` — lista mensajes. 401 si falta token, 404 si token incorrecto.
  - `POST /api/leads/:id/thread?token=<uuid>` body `{content}` — añade mensaje `incoming` (lo verá el comercial en su buzón). Mismas respuestas de error. **Tras guardar el mensaje del cliente, dispara `respondAsAgent(leadId)` (fire-and-forget) que genera y guarda automáticamente una respuesta del agente IA** (mismo `generateDraft` + `pickAutoIntent` que el cockpit). Tiene guarda anti-carrera por lead (`autoReplyInFlight`) y bucle hasta 5 iteraciones para responder a varios mensajes seguidos.
- `<CustomerChat>` (`artifacts/asistente-ventas/src/components/customer-chat.tsx`) hace polling cada 5s con `fetch` directo y muestra burbujas estilo WhatsApp (incoming = verde a la derecha, outgoing dealer = blanco a la izquierda).
- Los endpoints `GET/POST /api/leads/:id/messages` y `POST /api/leads/:id/incoming` siguen siendo del cockpit y no requieren token (uso interno del comercial).
