import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, Lock } from "lucide-react";

function diff(target: string | null | undefined): number {
  if (!target) return 0;
  return new Date(target).getTime() - Date.now();
}

function fmt(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function Countdown({
  target,
  variant = "lock",
  className,
}: {
  target: string | null | undefined;
  variant?: "lock" | "open";
  className?: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = diff(target);
  const hours = ms / 3600_000;

  let tone: string;
  if (ms <= 0) {
    tone = "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  } else if (variant === "lock") {
    if (hours <= 2) tone = "bg-rose-500/20 text-rose-300 border-rose-500/40 pulse-dot";
    else if (hours <= 6) tone = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    else tone = "bg-rose-500/15 text-rose-300 border-rose-500/30";
  } else {
    if (hours <= 6) tone = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    else tone = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  const Icon = variant === "lock" ? Lock : Clock;
  const text = ms <= 0
    ? (variant === "lock" ? "Liberada" : "Cerrada")
    : fmt(ms);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono tabular-nums",
        tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
