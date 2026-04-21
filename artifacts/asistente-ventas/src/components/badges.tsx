import { cn } from "@/lib/utils";
import { stageLabel, statusLabel } from "@/lib/format";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(`status-${status}`, "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {statusLabel(status)}
    </span>
  );
}

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  return (
    <span className={cn(`stage-${stage}`, "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", className)}>
      {stageLabel(stage)}
    </span>
  );
}
