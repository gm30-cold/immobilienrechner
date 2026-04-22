import { cn } from "@/lib/cn";
import type { Ampel as AmpelType } from "@/types/case";

interface AmpelProps {
  state: AmpelType;
  label?: string;
  className?: string;
}

const config: Record<AmpelType, { dot: string; ring: string; label: string; text: string }> = {
  gruen: {
    dot: "bg-[var(--accent-emerald)]",
    ring: "ring-[var(--accent-emerald)]/30",
    label: "Solide",
    text: "text-[var(--accent-emerald)]",
  },
  gelb: {
    dot: "bg-[var(--accent-amber)]",
    ring: "ring-[var(--accent-amber)]/30",
    label: "Prüfen",
    text: "text-[var(--accent-amber)]",
  },
  rot: {
    dot: "bg-[var(--accent-rose)]",
    ring: "ring-[var(--accent-rose)]/30",
    label: "Kritisch",
    text: "text-[var(--accent-rose)]",
  },
};

export function Ampel({ state, label, className }: AmpelProps) {
  const c = config[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1",
        "bg-white/[0.03] ring-inset",
        c.ring,
        c.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {label ?? c.label}
    </span>
  );
}
