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
