# Pujamostucoche.es — Asistente de Ventas WhatsApp

Plataforma de outlet flash de vehículos de ocasión con cockpit de gestión de leads integrado y asistente de ventas por WhatsApp.

**URL pública:** https://pujamostucoche.es  
**Panel de gestión (staff):** https://pujamostucoche.es/staff  
**Stack:** React + Vite · Express · PostgreSQL · GPT-4.1 · Tailwind CSS  

---

## Arquitectura

```
pujamostucoche.es/          → Tienda pública (landing + fichas de coches)
pujamostucoche.es/staff/    → Cockpit de gestión (requiere STAFF_API_KEY)
pujamostucoche.es/api/      → API REST (Express + Drizzle ORM)
```

El proyecto es un monorepo pnpm con tres paquetes principales:

| Paquete | Descripción |
|---|---|
| `artifacts/asistente-ventas` | Frontend React (Vite + Tailwind + wouter) |
| `artifacts/api-server` | Backend Express + Drizzle ORM |
| `lib/db` | Esquema y conexión PostgreSQL compartida |

---

## Documentación operativa (SOPs)

| Documento | Contenido |
|---|---|
| [Panel de Staff](docs/sop-panel-staff.md) | Login, dashboard, inbox y pipeline de leads |
| [Subida de Coches](docs/sop-subida-coches.md) | Cómo añadir y gestionar el inventario |
| [Experiencia del Lead](docs/sop-experiencia-lead.md) | Flujo del cliente en la tienda pública |
| [Solución de Problemas](docs/sop-solucion-problemas.md) | Qué hacer cuando algo falla |

---

## Desarrollo local

### Requisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL (o usar la base de datos de Replit)

### Instalación

```bash
pnpm install
```

### Variables de entorno necesarias

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL |
| `STAFF_API_KEY` | Clave de acceso al panel de staff |
| `SESSION_SECRET` | Secreto para sesiones |
| `OPENAI_API_KEY` | Clave de OpenAI (GPT-4.1) |

### Arrancar en desarrollo

Los workflows de Replit arrancan automáticamente los servicios. En local:

```bash
# API (puerto 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (puerto 21004)
pnpm --filter @workspace/asistente-ventas run dev
```

### Typecheck completo

```bash
pnpm run typecheck
```

---

## Despliegue

La aplicación se despliega en **Replit Autoscale**. El proceso de publicación es:

1. Hacer cambios en el código
2. Pulsar **Republish** en el panel de Replit
3. Replit construye y despliega automáticamente

El dominio personalizado `pujamostucoche.es` apunta a la IP de Replit mediante registro A.

---

## Contacto técnico

Desarrollado por IADivision · pujamostucoche@gmail.com
