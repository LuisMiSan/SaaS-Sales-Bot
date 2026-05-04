import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, LayoutDashboard, Car, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  title: string;
  content: string;
}

interface Manual {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  sections: Section[];
}

const MANUALES: Manual[] = [
  {
    id: "panel",
    title: "Panel de gestión (Cockpit)",
    description: "Login, dashboard, inbox, pipeline y conversaciones con el asistente IA.",
    icon: LayoutDashboard,
    sections: [
      {
        title: "1. Acceso y login",
        content: `Ve a pujamostucoche.es/staff e introduce la clave de acceso que te ha proporcionado el administrador. La clave se guarda en el navegador y no tendrás que volver a introducirla en ese dispositivo.

Para cerrar sesión: ve a Ajustes → Cerrar sesión.

La clave de acceso es confidencial. No la compartas ni la escribas en chats o correos.`,
      },
      {
        title: "2. Dashboard — Visión general",
        content: `Al entrar verás el panel principal con:
- Resumen de leads activos: cuántos están en proceso, bloqueados o perdidos hoy
- Actividad reciente: últimas acciones del sistema
- Indicadores clave: coches disponibles, leads nuevos hoy, ventas cerradas

El dashboard se actualiza automáticamente cada 30 segundos.`,
      },
      {
        title: "3. Bandeja de entrada (Inbox)",
        content: `Ruta: /staff/inbox

Aquí aparecen todos los leads nuevos que han rellenado el formulario de bloqueo. Cada tarjeta muestra el nombre y teléfono del cliente, el coche que quiere bloquear, el tiempo desde que entró y el estado actual.

Acciones disponibles:
- Ver conversación: leer el historial de mensajes
- Enviar mensaje: escribir al cliente (llega por WhatsApp)
- Generar respuesta IA: el asistente redacta una respuesta sugerida
- Bloquear unidad: cuando el cliente confirma que quiere reservar
- Mover a pipeline: para hacer seguimiento de la operación

Flujo recomendado:
Lead nuevo → Leer conversación → Llamar o WhatsApp → Si confirma → Bloquear unidad → Mover a pipeline`,
      },
      {
        title: "4. Pipeline de ventas",
        content: `Ruta: /staff/pipeline

Vista kanban con las etapas de cada operación:
- Nuevo: lead recién llegado, sin contactar
- Dudando: cliente interesado pero con dudas
- Bloqueado: unidad reservada 2h, operación en curso
- Liberado: el bloqueo expiró sin cerrar
- Cerrado: venta completada
- Perdido: cliente descartado

El temporizador de bloqueo muestra un contador regresivo de 2 horas. Si expira sin cerrar la venta, el sistema libera la unidad automáticamente.`,
      },
      {
        title: "5. Conversación con el lead",
        content: `Al hacer clic en un lead se abre la vista de conversación donde puedes:
- Leer todos los mensajes del hilo (WhatsApp + chat web)
- Escribir un mensaje manual que se enviará por WhatsApp
- Usar el asistente IA para generar borradores contextualizados

El asistente tiene en cuenta el historial completo, el coche y el estado del lead para generar respuestas naturales. Revisa siempre el texto antes de enviarlo.`,
      },
      {
        title: "6. Buenas prácticas",
        content: `- Revisa el inbox al menos cada 2 horas en horario comercial
- Contacta siempre en los primeros 5 minutos tras recibir un lead nuevo
- Usa el asistente IA como punto de partida, pero personaliza siempre el mensaje
- Cuando cierres una venta, márcala como "Cerrado" en el pipeline
- Al final del día, revisa los leads en estado "Dudando" y envía un seguimiento`,
      },
    ],
  },
  {
    id: "coches",
    title: "Subida y gestión de coches",
    description: "Cómo añadir, editar y gestionar el inventario de vehículos.",
    icon: Car,
    sections: [
      {
        title: "1. Estados de un coche",
        content: `- Ventana abierta: disponible para bloquear. Visible en tienda.
- En proceso: un lead está interesado. Visible en tienda.
- Bloqueado: reservado 2h por un cliente. Visible en tienda como reservado.
- Liberado: bloqueo expirado, vuelve al outlet. Visible en tienda.
- Vendido: operación cerrada. No aparece en la tienda.

Solo aparecen en la tienda pública los coches que tienen al menos una foto.`,
      },
      {
        title: "2. Importación por IA (recomendado)",
        content: `La forma más rápida: pega la URL del anuncio de cualquier portal (Wallapop, Milanuncios, Coches.net…) y el sistema extrae todos los datos automáticamente.

Pasos:
1. Ve a Inventario → botón "Importar con IA"
2. Pega una URL o describe el coche en texto libre (ej: "Ford Focus 2019 120cv gasolina 85.000km Madrid 8.500€")
3. Pulsa Importar
4. Revisa los datos generados y ajusta lo necesario

Para importar en lote, pega hasta 50 URLs o descripciones, una por línea.

La IA extrae automáticamente: marca, modelo, año, km, precio, combustible, cambio, potencia, fotos y descripción.`,
      },
      {
        title: "3. Formulario manual",
        content: `1. Ve a Inventario → botón "Nuevo coche"
2. Rellena los campos obligatorios: Marca, Modelo, Año, Kilómetros, Precio, Combustible, Cambio, Ubicación y Atractivo
3. Añade al menos una foto (URL de imagen)
4. Pulsa Guardar — el coche aparece inmediatamente en la tienda`,
      },
      {
        title: "4. El campo Atractivo",
        content: `Determina cuánto tiempo estará visible el coche antes de que su ventana se cierre:

- Hot → 24 horas: precio muy por debajo de mercado, alta demanda
- Normal → 48 horas: precio competitivo, coche estándar
- Difícil → 72 horas: coche de nicho, precio más ajustado al mercado`,
      },
      {
        title: "5. Buenas prácticas",
        content: `- Añade siempre al menos 3 fotos — los coches sin fotos no aparecen en la tienda
- La foto principal debe ser de frente, con buena luz
- Usa el campo de descripción para destacar extras y valor añadido
- Revisa el precio de mercado antes de publicar
- Si un coche lleva más de 72h sin leads, baja el precio o cambia el atractivo a "Hot"`,
      },
    ],
  },
  {
    id: "leads",
    title: "Experiencia del cliente (Lead)",
    description: "Cómo navega el cliente en la tienda pública y qué experimenta.",
    icon: Users,
    sections: [
      {
        title: "1. Llegada a la tienda",
        content: `El cliente llega a pujamostucoche.es y ve:
- Hero con temporizador FOMO: un contador de 2 horas que muestra su ventana de oportunidad
- Carrusel de marcas disponibles
- Catálogo de coches con foto, precio, kilómetros y estado

Solo aparecen los coches con estado "Ventana abierta" o "Liberado" que tengan al menos una foto.`,
      },
      {
        title: "2. Ficha del coche",
        content: `Al hacer clic en un coche, el cliente ve:
- Galería de fotos con carrusel y miniaturas
- Precio y datos clave (año, km, combustible, cambio)
- Ficha técnica completa
- Descripción comercial
- Formulario de bloqueo gratuito
- Sección "Cómo funciona" con los 3 pasos del proceso`,
      },
      {
        title: "3. Bloqueo de la unidad",
        content: `El cliente introduce su nombre y teléfono WhatsApp y pulsa "Bloquear unidad 2h".

Tras el bloqueo:
- La unidad queda reservada exclusivamente para ese cliente durante 2 horas
- Aparece un chat en la ficha donde puede escribir al comercial
- El equipo de staff recibe notificación del nuevo lead
- El asistente IA puede enviar una primera respuesta automática por WhatsApp

Si la unidad ya está bloqueada, el cliente ve un mensaje de reservado con enlace a otros coches.`,
      },
      {
        title: "4. Expiración del bloqueo",
        content: `Si transcurren 2 horas sin cerrar la venta:
- El sistema libera automáticamente la unidad
- El coche vuelve a aparecer en la tienda como disponible
- El lead pasa al estado "Liberado" en el pipeline
- El chat del cliente en la ficha desaparece automáticamente

El cliente puede volver a bloquear la misma unidad si sigue disponible.`,
      },
      {
        title: "5. Lo que el cliente NO puede hacer",
        content: `- Ver el precio de otros leads o saber cuántos hay interesados en un coche
- Extender el bloqueo más allá de 2h sin contactar al comercial
- Acceder a ninguna parte del panel de staff
- Ver datos de otros clientes`,
      },
    ],
  },
  {
    id: "problemas",
    title: "Solución de problemas",
    description: "Qué hacer cuando algo falla y cómo recuperar el servicio.",
    icon: AlertTriangle,
    sections: [
      {
        title: "1. La web no carga o está caída",
        content: `Diagnóstico rápido:
1. Comprueba si responde: pujamostucoche.es
2. Revisa las notificaciones de UptimeRobot

Solución — Reiniciar desde el móvil (Android):
1. Abre la app HTTP Shortcuts
2. Pulsa el atajo "Reiniciar Pujamos"
3. Confirma la acción
4. Espera 10-15 segundos y recarga la web

Alternativa: entra a Replit → Workflows → reinicia "API Server".`,
      },
      {
        title: "2. Los coches no aparecen en la tienda",
        content: `Causas y soluciones:
- El coche no tiene fotos → añade al menos una foto en el inventario
- El coche está en estado "Vendido" → si es un error, cámbialo a "Ventana abierta"
- El servidor está caído → reinicia el servidor (ver punto 1)

Verificación: abre pujamostucoche.es/api/cars — si devuelve una lista, el problema es del frontend; si da error, es del servidor.`,
      },
      {
        title: "3. El chat del cliente no funciona",
        content: `Causas y soluciones:
- El servidor está caído → reiniciar servidor
- El lead expiró (más de 2h) → el chat se limpia automáticamente, es el comportamiento correcto
- Error de red del cliente → pedir que recargue la página`,
      },
      {
        title: "4. El asistente IA no genera respuestas",
        content: `Causas y soluciones:
- Clave de OpenAI agotada o inválida → revisar la clave en los secretos de Replit
- El servidor está caído → reiniciar servidor
- Error temporal de OpenAI → esperar unos minutos y volver a intentarlo`,
      },
      {
        title: "5. La importación de coches por IA falla",
        content: `Causas y soluciones:
- URL inaccesible o con captcha → introducir los datos manualmente
- Datos incorrectos generados por IA → editar la ficha manualmente después de importar
- URL de portal no soportado → copiar el texto del anuncio y pegarlo directamente en lugar de la URL`,
      },
      {
        title: "6. Un coche no se libera automáticamente",
        content: `El sistema comprueba los bloqueos expirados cada 60 segundos. Si un coche sigue bloqueado tras 2h:
1. Ve a Inventario en el cockpit
2. Abre el coche bloqueado
3. Pulsa "Liberar manualmente"`,
      },
      {
        title: "7. Checklist de arranque diario",
        content: `Antes de empezar la jornada comercial:
- Comprobar que la web carga en pujamostucoche.es
- Revisar el inbox del cockpit — ¿hay leads nuevos de la noche?
- Verificar que UptimeRobot no ha enviado alertas de caída
- Comprobar que hay coches con estado "Ventana abierta" en el inventario
- Revisar leads en estado "Dudando" del día anterior y enviar seguimiento`,
      },
      {
        title: "8. Contacto de soporte técnico",
        content: `- Errores en el código o bugs: IADivision — pujamostucoche@gmail.com
- Problemas con la infraestructura de Replit: replit.com/support
- Problemas con el dominio (DNS): panel de tu proveedor de dominios
- Estado de OpenAI: status.openai.com`,
      },
    ],
  },
];

function AccordionItem({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <span>{section.title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-border bg-background">
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function ManualesPage() {
  const [activeManual, setActiveManual] = useState<string>(MANUALES[0].id);

  const current = MANUALES.find((m) => m.id === activeManual) ?? MANUALES[0];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 py-5 border-b border-border bg-background">
        <div className="flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">Manuales de uso</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Guías de referencia para el equipo comercial y administradores.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-muted/20 flex-col py-3 px-2 gap-0.5 overflow-y-auto">
          {MANUALES.map((m) => {
            const Icon = m.icon;
            const isActive = m.id === activeManual;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveManual(m.id)}
                className={cn(
                  "flex items-start gap-3 w-full text-left px-3 py-3 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="leading-snug">{m.title}</span>
              </button>
            );
          })}
        </aside>

        <div className="flex-1 overflow-y-auto">
          <div className="md:hidden flex gap-2 px-4 pt-4 pb-2 overflow-x-auto">
            {MANUALES.map((m) => {
              const Icon = m.icon;
              const isActive = m.id === activeManual;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveManual(m.id)}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {m.title.split(" ")[0]}
                </button>
              );
            })}
          </div>

          <div className="px-4 md:px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <current.icon className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">{current.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{current.description}</p>

            <div className="space-y-2">
              {current.sections.map((section) => (
                <AccordionItem key={section.title} section={section} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
