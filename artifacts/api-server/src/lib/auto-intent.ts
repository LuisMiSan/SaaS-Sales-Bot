export type AutoIntentArgs = {
  stage: string;
  depositPaid: boolean;
  carStatus: string;
  lastIncoming: string | null;
  hasMessages: boolean;
};

export function pickAutoIntent(args: AutoIntentArgs): string {
  const { stage, depositPaid, carStatus, lastIncoming, hasMessages } = args;
  const text = (lastIncoming ?? "").toLowerCase();

  if (!hasMessages) return "first_response";
  if (depositPaid || stage === "locked" || carStatus === "locked") return "confirm_lock";
  if (stage === "released" || carStatus === "released") return "post_release";
  if (stage === "awaiting_deposit") return "ask_deposit";

  if (/(bizum|transfer|paypal|pago|paga|ingres|cuenta|iban)/.test(text)) return "confirm_lock";
  if (/(reserv|bloque|deposit|señal|me lo quedo|lo cojo|lo quiero)/.test(text)) return "ask_deposit";
  if (/(no sé|duda|pensar|consult|mañana|familia|mujer|marido|hablar|me lo pienso)/.test(text)) return "handle_doubt";

  if (stage === "doubting") return "handle_doubt";
  if (stage === "new") return "first_response";
  return "handle_doubt";
}
