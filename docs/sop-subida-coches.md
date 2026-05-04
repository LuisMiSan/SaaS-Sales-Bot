# SOP — Subida y Gestión de Coches

**Ruta:** `/staff/inventario`  
**Audiencia:** Administradores y gestores de inventario

---

## 1. Acceder al inventario

Desde el panel de staff, haz clic en **Inventario** en el menú lateral. Verás todos los coches del catálogo con su estado actual.

### Estados de un coche

| Estado | Descripción | Visible en tienda |
|---|---|---|
| **Ventana abierta** | Disponible para bloquear | Sí |
| **En proceso** | Un lead está interesado | Sí |
| **Bloqueado** | Reservado 2h por un cliente | Sí (como reservado) |
| **Liberado** | Bloqueo expirado, vuelve al outlet | Sí |
| **Vendido** | Operación cerrada | No |

> Solo aparecen en la tienda pública los coches que tienen al menos una foto.

---

## 2. Añadir un coche — Importación por IA (recomendado)

La forma más rápida es pegar la **URL del anuncio** de cualquier portal (Wallapop, Milanuncios, Coches.net, web del concesionario…) y el sistema extrae todos los datos automáticamente.

### Pasos

1. Ve a **Inventario** → botón **Importar con IA**
2. Pega una URL o describe el coche en texto libre (ejemplo: `"Ford Focus 2019 120cv gasolina 85.000km Madrid 8.500€"`)
3. Pulsa **Importar**
4. El sistema analiza la información con IA y crea la ficha en segundos
5. Revisa los datos generados y ajusta lo que sea necesario

### Importación en lote

Puedes pegar hasta **50 URLs o descripciones** en el área de texto, una por línea, y el sistema las procesará todas de una vez.

### Qué extrae la IA automáticamente

- Marca, modelo, año, kilómetros, precio
- Combustible, cambio, potencia, puertas, plazas, color, carrocería
- Descripción comercial
- Fotos del anuncio (hasta 20 imágenes)
- Rango de precio de mercado (para mostrar el ahorro al cliente)
- Nivel de atractivo (determina la duración de la ventana de disponibilidad)

---

## 3. Añadir un coche — Formulario manual

1. Ve a **Inventario** → botón **Nuevo coche**
2. Rellena los campos del formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| Marca | Sí | Ej: Ford, Toyota, BMW |
| Modelo | Sí | Ej: Focus, Aygo, Serie 3 |
| Año | Sí | Año de matriculación |
| Kilómetros | Sí | km actuales |
| Precio | Sí | Precio de venta en euros |
| Combustible | Sí | Gasolina, Diésel, Híbrido, Eléctrico |
| Cambio | Sí | Manual o Automático |
| Ubicación | Sí | Ciudad donde está el coche |
| Atractivo | Sí | Hot (24h), Normal (48h), Difícil (72h) |
| Fotos | Recomendado | URL de imágenes del coche |
| Descripción | Recomendado | Texto comercial del vehículo |
| Precio de mercado (min/max) | Opcional | Para mostrar el ahorro |

3. Pulsa **Guardar** — el coche aparece inmediatamente en la tienda

---

## 4. El campo "Atractivo"

Este campo determina cuánto tiempo estará visible el coche en la tienda antes de que su ventana se cierre:

| Valor | Ventana de disponibilidad | Cuándo usarlo |
|---|---|---|
| **Hot** | 24 horas | Precio muy por debajo de mercado, alta demanda |
| **Normal** | 48 horas | Precio competitivo, coche estándar |
| **Difícil** | 72 horas | Coche de nicho, precio más ajustado al mercado |

---

## 5. Editar un coche

1. En **Inventario**, haz clic en el coche que quieres editar
2. Modifica los campos necesarios
3. Pulsa **Guardar cambios**

Puedes actualizar cualquier dato: precio, fotos, descripción, estado, etc.

---

## 6. Marcar como vendido

1. Abre la ficha del coche en Inventario
2. Pulsa **Marcar como vendido**
3. El coche desaparece de la tienda pública y queda registrado en el historial

---

## 7. Eliminar un coche

1. Abre la ficha del coche en Inventario
2. Pulsa **Eliminar** (acción irreversible)
3. El coche y todos sus datos se borran del sistema

> Usa "Marcar como vendido" en lugar de eliminar si quieres conservar el historial de ventas.

---

## 8. Buenas prácticas

- Añade siempre **al menos 3 fotos** — los coches sin fotos no aparecen en la tienda
- La foto principal debe ser **de frente, con buena luz** — es lo primero que ve el cliente
- Usa el campo de descripción para destacar el estado del coche, extras y cualquier valor añadido
- Revisa el precio de mercado antes de publicar para que el ahorro sea visible y real
- Cuando un coche lleve más de 72h sin leads, considera bajar el precio o cambiar el atractivo a "Hot"
