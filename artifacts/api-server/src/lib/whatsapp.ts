import { logger } from "./logger";

const WHATSAPP_TOKEN = process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];
const WHATSAPP_VERIFY_TOKEN = process.env["WHATSAPP_VERIFY_TOKEN"] ?? "asistente-ventas-verify";
const GRAPH_VERSION = process.env["WHATSAPP_GRAPH_VERSION"] ?? "v21.0";

export const whatsappConfig = {
  enabled: Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
  verifyToken: WHATSAPP_VERIFY_TOKEN,
  phoneNumberId: WHATSAPP_PHONE_NUMBER_ID ?? null,
};

export function normalizePhone(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; sandbox: boolean; messageId?: string; error?: string }> {
  const phone = normalizePhone(to);
  if (!whatsappConfig.enabled) {
    logger.info({ to: phone, body }, "[WhatsApp sandbox] outgoing message (no WHATSAPP_TOKEN configured)");
    return { ok: true, sandbox: true };
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body },
      }),
    });
    const json = (await res.json()) as { messages?: Array<{ id: string }>; error?: { message?: string } };
    if (!res.ok) {
      logger.error({ status: res.status, json }, "WhatsApp send failed");
      return { ok: false, sandbox: false, error: json?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, sandbox: false, messageId: json.messages?.[0]?.id };
  } catch (err) {
    logger.error({ err }, "WhatsApp send threw");
    return { ok: false, sandbox: false, error: (err as Error).message };
  }
}

export interface ParsedIncoming {
  fromPhone: string;
  profileName: string | null;
  text: string;
  waMessageId: string;
  timestamp: number;
}

export function parseIncomingWebhook(body: unknown): ParsedIncoming[] {
  const out: ParsedIncoming[] = [];
  const root = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: Array<{
            from?: string;
            id?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
            button?: { text?: string };
            interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
          }>;
        };
      }>;
    }>;
  };
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      const contacts = value.contacts ?? [];
      for (const msg of value.messages) {
        if (!msg.from || !msg.id) continue;
        const contact = contacts.find((c) => c.wa_id === msg.from);
        let text = "";
        if (msg.type === "text") text = msg.text?.body ?? "";
        else if (msg.type === "button") text = msg.button?.text ?? "";
        else if (msg.type === "interactive") text = msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? "";
        else text = `[${msg.type ?? "media"}]`;
        out.push({
          fromPhone: normalizePhone(msg.from),
          profileName: contact?.profile?.name ?? null,
          text,
          waMessageId: msg.id,
          timestamp: msg.timestamp ? Number(msg.timestamp) * 1000 : Date.now(),
        });
      }
    }
  }
  return out;
}
