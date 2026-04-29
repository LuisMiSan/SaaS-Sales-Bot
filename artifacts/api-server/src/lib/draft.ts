import { openai } from "@workspace/integrations-openai-ai-server";
import type { Car as DbCar, Lead as DbLead, Message as DbMessage } from "@workspace/db";
import { db, settingsTable } from "@workspace/db";
import { eurFormatter } from "./format";

export const DEFAULT_INTENT_GUIDES: Record<string, string> = {
  first_response:
    "Primera respuesta cuando el cliente acaba de pulsar 'Bloquear unidad' y entra por WhatsApp. Confirmar disponibilidad y explicar que el bloqueo es totalmente gratuito y dura 2h sin compromiso. Tono firme pero cercano.",
  ask_deposit:
    "El cliente sigue interesado y quiere avanzar. Confirmar que la unidad está bloqueada para él y proponer cerrar la compra (visita al concesionario, financiación o transferencia bancaria) dentro de la ventana de 2h. NO pedir ningún pago previo para reservar.",
  confirm_lock:
    "Confirmar al cliente que la unidad está reservada para él durante 2h sin coste y proponer los siguientes pasos para cerrar (visita, financiación o transferencia).",
  handle_doubt:
    "El cliente duda. NO presionar agresivamente. Reconocer la duda, recordar que si otro cliente bloquea antes deja de estar disponible, ofrecer asegurar la unidad sin agobiar.",
  post_release:
    "Han pasado las 2h y el cliente no ha cerrado. La unidad ha sido liberada. Avisar con naturalidad, generar un FOMO sutil mencionando que sigue disponible si encaja, sin sonar desesperado.",
  custom:
    "Responder al cliente siguiendo las instrucciones específicas que se indican.",
};

export const DEFAULT_SYSTEM_PROMPT = `Eres un asistente de ventas para un concesionario español de coches de ocasión.
Tu trabajo es redactar mensajes de WhatsApp en nombre del comercial, en español de España, siguiendo esta metodología:

REGLAS DEL SISTEMA:
- Aquí no sube el precio. Aquí pierdes la oportunidad.
- El bloqueo de unidad dura 2h, es totalmente gratuito y sin compromiso. Basta con bloquearla para reservar la compra durante esa ventana.
- Si no compra en 2h, el coche vuelve a "Ventana abierta" como "Liberado recientemente".
- PROHIBIDO mencionar cualquier pago para reservar (ni señal, ni Bizum, ni transferencia previa, ni ningún tipo de cantidad para asegurar la unidad). El bloqueo es siempre gratis.
- Si el cliente pregunta "¿hay que pagar algo para reservar?", responder claramente que no, que el bloqueo es gratuito.
- Sin presión agresiva. La urgencia viene de tiempo + disponibilidad real, nunca de marketing barato.
- Tono: profesional, cercano, directo. Como un comercial bueno de toda la vida, no como un call-center.

REGLAS DE FORMATO:
- WhatsApp real: frases cortas, saltos de línea naturales.
- NUNCA uses emojis.
- NUNCA uses asteriscos, negritas, viñetas, ni markdown.
- 2-5 frases máximo. Como mucho 6.
- Trata al cliente de tú salvo que el contexto pida usted.
- No inventes nombres ni datos que no estén en el contexto.

DEVUELVES SOLO el texto del mensaje de WhatsApp listo para enviar. Nada más.`;

async function loadSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(settingsTable);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}

function carLabel(car: DbCar): string {
  return `${car.make} ${car.model} ${car.year} (${eurFormatter.format(Number(car.price))})`;
}

export async function generateDraft(args: {
  intent: string;
  instructions?: string | null;
  car: DbCar;
  lead: DbLead;
  history: DbMessage[];
}): Promise<{ content: string; rationale: string }> {
  const { intent, instructions, car, lead, history } = args;

  const settings = await loadSettings();
  const systemPrompt = settings["system_prompt"] ?? DEFAULT_SYSTEM_PROMPT;
  const intentGuides = { ...DEFAULT_INTENT_GUIDES };
  for (const key of Object.keys(DEFAULT_INTENT_GUIDES)) {
    if (settings[`guide_${key}`]) intentGuides[key] = settings[`guide_${key}`];
  }

  const guide = intentGuides[intent] ?? intentGuides.custom;
  const carLine = carLabel(car);

  const transcript = history
    .slice(-12)
    .map((m) => {
      if (m.direction === "incoming") return `Cliente: ${m.content}`;
      if (m.direction === "outgoing") return `Comercial: ${m.content}`;
      return `Sistema: ${m.content}`;
    })
    .join("\n");

  const userPrompt = `CONTEXTO DEL LEAD:
- Cliente: ${lead.name}
- Teléfono: ${lead.phone}
- Coche de interés: ${carLine}
- Estado del coche: ${car.status}
- Estado del lead: ${lead.stage}

CONVERSACIÓN HASTA AHORA:
${transcript || "(aún no hay mensajes)"}

INTENCIÓN DEL MENSAJE A REDACTAR: ${intent}
GUÍA: ${guide}
${instructions ? `INSTRUCCIONES ADICIONALES DEL COMERCIAL: ${instructions}` : ""}

Redacta ahora el mensaje de WhatsApp.`;

  let content = "";
  let rationale = `Mensaje "${intent}" basado en la metodología (bloqueo gratuito de 2h, sin subir precio).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    content = response.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    content = fallbackDraft(intent, lead, car);
    rationale = `Borrador generado con plantilla local (sin IA): ${(err as Error).message}`;
  }

  if (!content) {
    content = fallbackDraft(intent, lead, car);
  }

  return { content, rationale };
}

function fallbackDraft(intent: string, lead: DbLead, car: DbCar): string {
  const carLine = carLabel(car);
  const name = lead.name.split(" ")[0];

  switch (intent) {
    case "first_response":
      return `Hola ${name}, sí, el ${carLine} sigue disponible.\nLo tienes bloqueado 2h sin pagar nada para que nadie más acceda mientras decides.\nDime qué prefieres: una llamada rápida, venir a verlo o cerrar por aquí.`;
    case "ask_deposit":
      return `Perfecto, ${name}.\nLa unidad está reservada para ti durante 2h sin coste.\nSi te encaja, vamos cerrando: financiación, visita o reserva por transferencia, lo que prefieras.`;
    case "confirm_lock":
      return `Listo, unidad bloqueada para ti durante 2h.\nNadie más puede acceder a ella en esa ventana.\nDime cómo quieres cerrar: pasarte por el concesionario, financiación o transferencia.`;
    case "handle_doubt":
      return `Sin problema, ${name}.\nSolo ten en cuenta que si otro cliente la bloquea antes, deja de estar disponible.\nSi quieres asegurarla, aún estás a tiempo y no te cuesta nada.`;
    case "post_release":
      return `La unidad ha sido liberada nuevamente.\nSi sigue encajando contigo, aún puedes acceder si no se bloquea otra vez.`;
    default:
      return `Hola ${name}, te respondo enseguida sobre el ${carLine}.`;
  }
}
