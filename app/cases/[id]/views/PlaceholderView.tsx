import { GlassCard } from "@/components/ui/GlassCard";
import { Construction } from "lucide-react";

interface PlaceholderViewProps {
  title: string;
  hint: string;
}

export function PlaceholderView({ title, hint }: PlaceholderViewProps) {
  return (
    <GlassCard className="flex flex-col items-start gap-3 p-8">
      <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
        <Construction className="size-4 text-[var(--fg-muted)]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--fg-secondary)]">
          Kommt in Etappe 3. Geplant: {hint}.
        </p>
      </div>
    </GlassCard>
  );
}
