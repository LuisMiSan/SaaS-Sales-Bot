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
    "Han pasado las 2h y el cliente no ha cerrado. La unidad ha sido liberada. Avisar con naturalidad, generar un FOMO sutil mencionando que sigue disponible si encaja, sin sonar desesperado. NO usar esta guía si el cliente acaba de pedir que le bloquees el coche.",
  confirm_relock:
    "El cliente quiere que le vuelvas a bloquear la unidad después de que el bloqueo anterior expiró. Confirma de forma natural que le vuelves a bloquear ahora mismo o que lo gestionas enseguida. Recuérdale que sigue siendo gratuito y sin compromiso, 2h desde ahora. Tono cercano y resolutivo, sin recrearte en que el anterior bloqueo expiró.",
  nudge_closing:
    "La unidad está bloqueada y el cliente lleva un rato sin dar señales. Momento clave: pregunta de forma natural si tiene alguna duda pendiente sobre el coche o si quiere que le pongas en contacto con un comercial para cerrar la compra antes de que expire la ventana de 2h. Sin presión, pero con urgencia real. Un solo mensaje corto.",
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
- Si el cliente pregunta por financiación, confirmar que sí se puede financiar y que el comercial le explicará las condiciones en detalle.
- Sin presión agresiva. La urgencia viene de tiempo + disponibilidad real, nunca de marketing barato.
- Tono: profesional, cercano, directo. Como un comercial bueno de toda la vida, no como un call-center.
- Usa los datos de la ficha del coche para responder preguntas técnicas. NUNCA inventes datos que no estén en la ficha.

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

function carSpecsBlock(car: DbCar): string {
  const lines: string[] = [
    `Marca y modelo: ${car.make} ${car.model} ${car.year}`,
    `Precio: ${eurFormatter.format(Number(car.price))}`,
  ];
  if (car.km != null) lines.push(`Kilómetros: ${Number(car.km).toLocaleString("es-ES")} km`);
  if (car.fuel) lines.push(`Combustible: ${car.fuel}`);
  if (car.transmission) lines.push(`Cambio: ${car.transmission}`);
  if (car.horsepower != null) lines.push(`Potencia: ${car.horsepower} CV`);
  if (car.doors != null) lines.push(`Puertas: ${car.doors}`);
  if (car.seats != null) lines.push(`Plazas: ${car.seats}`);
  if (car.color) lines.push(`Color: ${car.color}`);
  if (car.bodyType) lines.push(`Carrocería: ${car.bodyType}`);
  if (car.engineCc != null) lines.push(`Cilindrada: ${car.engineCc} cc`);
  const consumptions: string[] = [];
  if (car.consumptionUrban != null) consumptions.push(`urbano ${car.consumptionUrban} L/100km`);
  if (car.consumptionHighway != null) consumptions.push(`carretera ${car.consumptionHighway} L/100km`);
  if (car.consumptionMixed != null) consumptions.push(`mixto ${car.consumptionMixed} L/100km`);
  if (consumptions.length > 0) lines.push(`Consumo: ${consumptions.join(", ")}`);
  if (car.co2 != null) lines.push(`Emisiones CO2: ${car.co2} g/km`);
  if (car.location) lines.push(`Ubicación: ${car.location}`);
  if (car.description) lines.push(`Descripción: ${car.description}`);
  return lines.map((l) => `  - ${l}`).join("\n");
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
- Estado del coche: ${car.status}
- Estado del lead: ${lead.stage}

FICHA TÉCNICA DEL COCHE:
${carSpecsBlock(car)}

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
    case "confirm_relock":
      return `Ahora mismo te la vuelvo a bloquear, ${name}.\nSon otras 2h sin coste, sin compromiso.\nDime si prefieres pasarte por el concesionario o lo cerramos por aquí.`;
    case "nudge_closing":
      return `${name}, ¿todo bien por ahí?\nSi tienes alguna duda sobre el coche, dímela.\nY si quieres que te ponga en contacto con uno de nuestros comerciales para cerrar la compra, solo dímelo.`;
    case "post_release":
      return `La unidad ha sido liberada nuevamente.\nSi sigue encajando contigo, aún puedes acceder si no se bloquea otra vez.`;
    default:
      return `Hola ${name}, te respondo enseguida sobre el ${carLine}.`;
  }
}
