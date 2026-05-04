import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function useWhatsappNumber(): string | null {
  const { data } = useQuery<string | null>({
    queryKey: ["public-config"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/config`);
      if (!r.ok) return null;
      const d = (await r.json()) as { whatsappNumber?: string | null };
      return d.whatsappNumber ?? null;
    },
    staleTime: 5 * 60_000,
  });
  return data ?? null;
}

export function buildWhatsappUrl(number: string | null | undefined, message: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

interface WhatsappWidgetProps {
  message: string;
  label?: string;
}

export function WhatsappWidget({ message, label = "Chatea por WhatsApp" }: WhatsappWidgetProps) {
  const number = useWhatsappNumber();
  const href = buildWhatsappUrl(number, message);
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
