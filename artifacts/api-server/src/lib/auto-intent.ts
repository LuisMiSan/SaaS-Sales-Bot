export type AutoIntentArgs = {
  stage: string;
  depositPaid: boolean;
  carStatus: string;
  lastIncoming: string | null;
  hasMessages: boolean;
};

const RE_WANTS_LOCK =
  /bloque[ao]|bloquémelo|bloquéalo|bloquemelo|me lo quedo|lo cojo|lo quiero|reserv|señal|deposit|ya voy|voy para|voy de camino|lo pillo|me interesa cerrarlo/;
const RE_PAYMENT =
  /bizum|transfer|paypal|pago|paga|ingres|cuenta|iban/;
const RE_DOUBT =
  /no sé|duda|pensar|consult|mañana|familia|mujer|marido|hablar|me lo pienso/;

export function pickAutoIntent(args: AutoIntentArgs): string {
  const { stage, depositPaid, carStatus, lastIncoming, hasMessages } = args;
  const text = (lastIncoming ?? "").toLowerCase();

  if (!hasMessages) return "first_response";

  // Keyword detection always wins over status — the customer's last message
  // is the strongest signal of what they want right now.
  if (RE_WANTS_LOCK.test(text)) {
    // If the car/lead was released and they want to re-lock, use the re-lock guide
    // so the AI doesn't generate a "han pasado las 2h" message.
    if (carStatus === "released" || stage === "released") return "confirm_relock";
    return "ask_deposit";
  }

  if (RE_PAYMENT.test(text)) return "confirm_lock";
  if (RE_DOUBT.test(text)) return "handle_doubt";

  // Status-based fallbacks when no strong keyword was detected
  if (depositPaid || stage === "locked" || carStatus === "locked") return "confirm_lock";
  if (stage === "released" || carStatus === "released") return "post_release";
  if (stage === "doubting") return "handle_doubt";
  if (stage === "new") return "first_response";

  return "handle_doubt";
}
