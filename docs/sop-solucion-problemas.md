# SOP — Solución de Problemas

**Audiencia:** Administradores y personal técnico  
**Contacto técnico:** IADivision · pujamostucoche@gmail.com

---

## 1. La web no carga o está caída

### Diagnóstico rápido

1. Comprueba si la web responde en: https://pujamostucoche.es
2. Revisa el monitor de uptime en **UptimeRobot** — recibirás una notificación push si hay caída

### Solución — Reiniciar el servidor desde el móvil

Tienes configurado un atajo de Android (HTTP Shortcuts) con el nombre **"Reiniciar Pujamos"**:

1. Abre la app **HTTP Shortcuts** en tu Android
2. Pulsa el atajo **"Reiniciar Pujamos"**
3. Confirma la acción
4. Espera 10-15 segundos y recarga la web

El endpoint de reinicio es:
```
POST https://pujamostucoche.es/api/admin/restart
Authorization: Bearer [STAFF_API_KEY]
```

Si el atajo falla, también puedes reiniciarlo desde el panel de Replit:
1. Abre Replit en el navegador
2. Ve a la sección **Workflows**
3. Reinicia el workflow **"API Server"**

---

## 2. Los coches no aparecen en la tienda

### Causas posibles

| Causa | Solución |
|---|---|
| El coche no tiene fotos | Añade al menos una foto en el inventario |
| El coche está en estado "Vendido" | Correcto, no debe aparecer. Si es un error, cámbialo a "Ventana abierta" |
| El API server está caído | Reinicia el servidor (ver punto 1) |
| El frontend está caído | Reinicia el workflow "web" desde Replit |

### Verificación rápida

Abre en el navegador: `https://pujamostucoche.es/api/cars`  
Si devuelve una lista JSON de coches, el problema es del frontend. Si da error, el problema es del servidor.

---

## 3. Las fichas de los coches no cargan

### Síntomas
- La ficha muestra "Cargando ficha…" indefinidamente
- Pantalla en blanco al entrar a `/coche/[id]`

### Solución
1. Verifica que el API responde: `https://pujamostucoche.es/api/cars/[id]`
2. Si el API responde pero el frontend no muestra nada, fuerza una recarga: `Ctrl+Shift+R`
3. Si el problema persiste, reinicia ambos workflows desde Replit

---

## 4. El chat del cliente no funciona

### Síntomas
- El cliente dice que no puede enviar mensajes en la ficha
- Los mensajes no llegan al cockpit

### Causas y soluciones

| Causa | Solución |
|---|---|
| El servidor está caído | Reiniciar servidor (punto 1) |
| El lead expiró (más de 2h) | El chat se limpia automáticamente al expirar el bloqueo. Es el comportamiento correcto |
| Error de red del cliente | Pedir al cliente que recargue la página |

---

## 5. El asistente IA no genera respuestas

### Síntomas
- Al pulsar "Generar respuesta" en el cockpit no pasa nada
- Aparece un error en el botón de IA

### Causas y soluciones

| Causa | Solución |
|---|---|
| Clave de OpenAI agotada o inválida | Revisar la clave en los secretos de Replit |
| El servidor está caído | Reiniciar servidor |
| Error temporal de OpenAI | Esperar unos minutos y volver a intentarlo |

---

## 6. La importación de coches por IA falla

### Síntomas
- Al pegar una URL y pulsar Importar, aparece un error
- La ficha se crea vacía o con datos incorrectos

### Soluciones

| Problema | Solución |
|---|---|
| URL inaccesible o con captcha | Introducir los datos del coche manualmente |
| Datos incorrectos generados por IA | Editar la ficha manualmente después de importar |
| Límite de importaciones alcanzado | Esperar 1 hora (límite: 5 importaciones por hora por usuario) |
| URL de portal no soportado | Copiar el texto del anuncio y pegarlo directamente en lugar de la URL |

---

## 7. Un coche no se libera automáticamente tras 2 horas

El sistema comprueba los bloqueos expirados **cada 60 segundos**. Si un coche sigue bloqueado tras 2h:

1. Ve a **Inventario** en el cockpit
2. Abre el coche bloqueado
3. Pulsa **Liberar manualmente**

---

## 8. Un lead no recibe el mensaje de WhatsApp

### Verificación

1. Comprueba que el número de teléfono está en formato correcto (+34...)
2. Verifica que el número de WhatsApp Business está bien configurado en **Ajustes**
3. Comprueba que el cliente tiene WhatsApp instalado y activo en ese número

### Si el sistema de mensajes automáticos falla

Contacta directamente al cliente desde tu WhatsApp personal usando el número que dejó en el formulario. El número siempre está visible en el cockpit.

---

## 9. Error de base de datos

### Síntoma
Los logs muestran: `error: terminating connection due to administrator command`

### Contexto
Es un comportamiento normal en Replit: la base de datos puede terminar conexiones idle por mantenimiento. El sistema está configurado para recuperarse automáticamente sin caerse.

### Si el error persiste
Reinicia el servidor desde el móvil o desde Replit (punto 1).

---

## 10. Cómo ver los logs en producción

1. Abre Replit en el navegador
2. Ve a **Deployments** → selecciona el deployment activo
3. Haz clic en **Logs** para ver los registros del servidor en tiempo real

Los errores aparecen marcados con `[Error]`. Los accesos normales con `[Info]`.

---

## 11. Contacto de soporte técnico

| Tipo de problema | Contacto |
|---|---|
| Error en el código / bug | IADivision — pujamostucoche@gmail.com |
| Problema con Replit (infraestructura) | https://replit.com/support |
| Problema con el dominio (DNS) | Panel de tu proveedor de dominios |
| Problema con OpenAI | https://status.openai.com |
| Problema con UptimeRobot | https://uptimerobot.com |

---

## 12. Checklist de arranque diario

Antes de empezar la jornada comercial:

- [ ] Comprobar que la web carga correctamente en https://pujamostucoche.es
- [ ] Revisar el inbox del cockpit — ¿hay leads nuevos de la noche?
- [ ] Verificar que UptimeRobot no ha enviado alertas de caída
- [ ] Comprobar que hay coches con estado "Ventana abierta" en el inventario
- [ ] Revisar leads en estado "Dudando" del día anterior y enviar seguimiento
