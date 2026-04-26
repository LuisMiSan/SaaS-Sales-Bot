import { MessageCircle } from "lucide-react";

const RAW_NUMBER = import.meta.env.VITE_WHATSAPP_PUBLIC_NUMBER as string | undefined;

export function getWhatsappNumber(): string | null {
  if (!RAW_NUMBER) return null;
  const cleaned = RAW_NUMBER.replace(/[^\d]/g, "");
  return cleaned.length >= 9 ? cleaned : null;
}

export function buildWhatsappUrl(message: string): string | null {
  const number = getWhatsappNumber();
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

interface WhatsappWidgetProps {
  message: string;
  label?: string;
}

export function WhatsappWidget({ message, label = "Chatea por WhatsApp" }: WhatsappWidgetProps) {
  const href = buildWhatsappUrl(message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-50 group inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1FBA57] text-white font-bold rounded-full shadow-xl shadow-[#25D366]/30 transition-all hover:scale-105 px-4 py-3.5 md:py-3"
    >
      <span className="relative flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-white/25 animate-ping" aria-hidden="true" />
        <MessageCircle className="relative h-6 w-6" strokeWidth={2.5} />
      </span>
      <span className="hidden md:inline pr-1.5 text-sm">{label}</span>
    </a>
  );
}
