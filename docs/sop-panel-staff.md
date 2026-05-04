# SOP — Panel de Gestión (Cockpit de Staff)

**Acceso:** https://pujamostucoche.es/staff  
**Audiencia:** Comerciales y administradores internos

---

## 1. Acceso y login

1. Ve a `https://pujamostucoche.es/staff`
2. Introduce la **clave de acceso** (STAFF_API_KEY) que te ha proporcionado el administrador
3. Pulsa **Entrar** — la clave se guarda en el navegador, no tendrás que volver a introducirla en ese dispositivo
4. Para cerrar sesión: ve a **Ajustes** → **Cerrar sesión**

> La clave de acceso es confidencial. No la compartas ni la escribas en chats o correos.

---

## 2. Dashboard — Visión general

Al entrar verás el panel principal con:

- **Resumen de leads activos:** cuántos leads están en proceso, bloqueados o perdidos hoy
- **Actividad reciente:** últimas acciones del sistema (nuevos leads, bloqueos, liberaciones, ventas)
- **Indicadores clave:** coches disponibles, leads nuevos hoy, ventas cerradas

El dashboard se actualiza automáticamente cada 30 segundos.

---

## 3. Bandeja de entrada (Inbox)

**Ruta:** `/staff/inbox`

Aquí aparecen todos los leads nuevos que han rellenado el formulario de bloqueo en la tienda. Cada tarjeta muestra:

- Nombre y teléfono del cliente
- Coche que quiere bloquear
- Tiempo desde que entró el lead
- Estado actual (nuevo, en proceso, bloqueado...)

### Acciones desde el inbox

| Acción | Cuándo usarla |
|---|---|
| **Ver conversación** | Para leer el historial de mensajes con el cliente |
| **Enviar mensaje** | Para escribir al cliente (el mensaje llega por WhatsApp) |
| **Generar respuesta IA** | Para que el asistente redacte una respuesta sugerida |
| **Bloquear unidad** | Cuando el cliente confirma que quiere reservar |
| **Mover a pipeline** | Para hacer seguimiento de la operación |

### Flujo recomendado

```
Lead nuevo → Leer conversación → Llamar o WhatsApp → 
→ Si cliente confirma → Bloquear unidad → Mover a pipeline
```

---

## 4. Pipeline de ventas

**Ruta:** `/staff/pipeline`

Vista kanban con las etapas de cada operación:

| Columna | Significado |
|---|---|
| **Nuevo** | Lead recién llegado, sin contactar |
| **Dudando** | Cliente interesado pero con dudas |
| **Bloqueado** | Unidad reservada 2h, operación en curso |
| **Liberado** | El bloqueo expiró sin cerrar |
| **Cerrado** | Venta completada |
| **Perdido** | Cliente descartado |

### Mover un lead entre etapas

Haz clic en el botón **"Mover"** dentro de la tarjeta del lead y selecciona la nueva etapa. El sistema registra el cambio en el historial de actividad.

### Temporizador de bloqueo

Cuando una unidad está bloqueada, verás un contador regresivo de 2 horas en la tarjeta. Si expira sin cerrar la venta, el sistema libera la unidad automáticamente y el lead pasa a "Liberado".

---

## 5. Conversación con el lead

Al hacer clic en un lead se abre la vista de conversación. Desde aquí puedes:

1. **Leer todos los mensajes** del hilo (WhatsApp + chat web del cliente)
2. **Escribir un mensaje manual** que se enviará por WhatsApp al cliente
3. **Usar el asistente IA:**
   - Selecciona la intención (primera respuesta, pedir depósito, gestionar duda, nudge de cierre…)
   - El sistema genera un borrador contextualizado
   - Revisa el texto, edítalo si quieres y pulsa **Enviar**

> El asistente IA tiene en cuenta el historial completo de la conversación, el coche y el estado del lead para generar respuestas naturales.

---

## 6. Ajustes

**Ruta:** `/staff/ajustes`

Desde aquí puedes configurar:

- **Número de WhatsApp Business:** el número desde el que el sistema envía mensajes
- **Mensaje de bienvenida:** texto automático que se envía cuando llega un lead nuevo
- **Horario comercial:** rango de horas en el que el asistente responde activamente
- **Cerrar sesión**

---

## 7. Buenas prácticas

- Revisa el inbox **al menos cada 2 horas** en horario comercial — los leads se enfrían rápido
- Contacta siempre en los **primeros 5 minutos** tras recibir un lead nuevo
- Usa el asistente IA como punto de partida, pero **personaliza siempre** el mensaje antes de enviarlo
- Cuando cierres una venta, márcala como **"Cerrado"** en el pipeline para que las métricas sean correctas
- Al final del día, revisa los leads en estado **"Dudando"** y envía un mensaje de seguimiento
