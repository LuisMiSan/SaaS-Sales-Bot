import { formatDistanceToNowStrict, format } from "date-fns";
import { es } from "date-fns/locale";

export const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(n: number) {
  return eur.format(n);
}

export function formatDeposit(cents: number) {
  return eur.format(cents / 100);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return `hace ${formatDistanceToNowStrict(new Date(iso), { locale: es })}`;
  } catch {
    return "";
  }
}

export function formatTime(iso: string) {
  return format(new Date(iso), "HH:mm", { locale: es });
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), "d MMM HH:mm", { locale: es });
}

export function statusLabel(s: string): string {
  switch (s) {
    case "open": return "Ventana abierta";
    case "locking": return "En proceso";
    case "locked": return "Bloqueado";
    case "released": return "Liberado";
    case "sold": return "Vendido";
    default: return s;
  }
}

export function stageLabel(s: string): string {
  switch (s) {
    case "new": return "Nuevo";
    case "locked": return "Bloqueado";
    case "doubting": return "Duda";
    case "released": return "Liberado";
    case "won": return "Cerrado";
    case "lost": return "Perdido";
    default: return s;
  }
}

export function attractivenessLabel(a: string): string {
  if (a === "hot") return "Atractiva 24h";
  if (a === "hard") return "Difícil 72h";
  return "Normal 48h";
}

export function intentLabel(intent: string): string {
  switch (intent) {
    case "first_response": return "Primera respuesta";
    case "ask_deposit": return "Pedir depósito";
    case "confirm_lock": return "Confirmar bloqueo";
    case "confirm_relock": return "Re-bloquear";
    case "nudge_closing": return "Nudge cierre";
    case "handle_doubt": return "Cliente duda";
    case "post_release": return "Post liberación";
    case "custom": return "Personalizado";
    default: return intent;
  }
}

export function initials(name: string) {
  return name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * Unwrap Next.js /_next/image proxy URLs so images load cross-origin.
 * e.g. https://site.com/_next/image?url=https%3A%2F%2Fcdn.com%2Fphoto.jpg&w=3840&q=75
 *   → https://cdn.com/photo.jpg
 */
export function sanitizePhotoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/_next/image") {
      const inner = parsed.searchParams.get("url");
      if (inner) return inner.startsWith("http") ? inner : new URL(inner, url).href;
    }
  } catch { /* return original */ }
  return url;
}
