import { openai } from "@workspace/integrations-openai-ai-server";
import type { Car as DbCar, Lead as DbLead, Message as DbMessage } from "@workspace/db";
import { eurFormatter } from "./format";

const INTENT_GUIDES: Record<string, string> = {
  first_response:
    "Primera respuesta cuando el cliente acaba de pulsar 'Bloquear unidad' y entra por WhatsApp. Confirmar disponibilidad, explicar el bloqueo de 12h y mencionar el depósito (sin presionar). Tono firme pero cercano.",
  ask_deposit:
    "El cliente ha dicho que sigue interesado. Pasarle los datos para hacer el depósito (Bizum / transferencia). Explicar que en cuanto pague, retiramos la unidad del escaparate durante 12h.",
  confirm_lock:
    "El cliente ha hecho el depósito. Confirmar bloqueo de 12h, retirada del escaparate, y proponer ver detalles con calma para cerrar.",
  handle_doubt:
    "El cliente duda. NO presionar agresivamente. Reconocer la duda, recordar que si otro cliente bloquea antes deja de estar disponible, ofrecer asegurar la unidad sin agobiar.",
  post_release:
    "Han pasado las 12h y el cliente no ha cerrado. La unidad ha sido liberada. Avisar con naturalidad, generar un FOMO sutil mencionando que sigue disponible si encaja, sin sonar desesperado.",
  custom:
    "Responder al cliente siguiendo las instrucciones específicas que se indican.",
};

const SYSTEM_PROMPT = `Eres un asistente de ventas para un concesionario español de coches de ocasión.
Tu trabajo es redactar mensajes de WhatsApp en nombre del comercial, en español de España, siguiendo esta metodología:

REGLAS DEL SISTEMA:
- Aquí no sube el precio. Aquí pierdes la oportunidad.
- Bloqueo de unidad dura 12h, requiere depósito (100-300€).
- Si no compra en 12h, el coche vuelve a "Ventana abierta" como "Liberado recientemente".
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

export async function generateDraft(args: {
  intent: string;
  instructions?: string | null;
  car: DbCar;
  lead: DbLead;
  history: DbMessage[];
}): Promise<{ content: string; rationale: string }> {
  const { intent, instructions, car, lead, history } = args;

  const guide = INTENT_GUIDES[intent] ?? INTENT_GUIDES.custom;
  const carLine = `${car.make} ${car.model} ${car.year} (${eurFormatter.format(Number(car.price))})`;
  const depositEuros = (car.depositCents / 100).toFixed(0);

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
- Depósito sugerido: ${depositEuros}€
- Depósito pagado: ${lead.depositPaid ? "sí" : "no"}

CONVERSACIÓN HASTA AHORA:
${transcript || "(aún no hay mensajes)"}

INTENCIÓN DEL MENSAJE A REDACTAR: ${intent}
GUÍA: ${guide}
${instructions ? `INSTRUCCIONES ADICIONALES DEL COMERCIAL: ${instructions}` : ""}

Redacta ahora el mensaje de WhatsApp.`;

  let content = "";
  let rationale = `Mensaje "${intent}" basado en la metodología (bloqueo 12h, depósito ${depositEuros}€, sin subir precio).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
  const carLine = `${car.make} ${car.model} ${car.year} (${eurFormatter.format(Number(car.price))})`;
  const dep = (car.depositCents / 100).toFixed(0);
  const name = lead.name.split(" ")[0];

  switch (intent) {
    case "first_response":
      return `Hola ${name}, sí, el ${carLine} sigue disponible.\nPuedo bloqueártelo 12h para que nadie más acceda mientras decides.\nPara hacerlo pedimos un pequeño depósito de ${dep}€ que asegura la unidad.\nSi quieres te explico el proceso en un minuto.`;
    case "ask_deposit":
      return `Perfecto.\nEn cuanto haces el depósito (${dep}€) la retiramos del escaparate y queda solo para ti durante 12h.\nTe paso ahora los datos para bloquearla.`;
    case "confirm_lock":
      return `Listo, unidad bloqueada.\nDurante las próximas 12h nadie más puede acceder a ella.\nVamos viendo contigo los detalles para cerrar con calma.`;
    case "handle_doubt":
      return `Sin problema, ${name}.\nSolo ten en cuenta que si otro cliente la bloquea antes, deja de estar disponible.\nSi quieres asegurarla, aún estás a tiempo.`;
    case "post_release":
      return `La unidad ha sido liberada nuevamente.\nSi sigue encajando contigo, aún puedes acceder si no se bloquea otra vez.`;
    default:
      return `Hola ${name}, te respondo enseguida sobre el ${carLine}.`;
  }
}
