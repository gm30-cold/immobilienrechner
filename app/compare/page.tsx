import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { GitCompare } from "lucide-react";

export default function ComparePage() {
  return (
    <div>
      <PageHeader
        title="Vergleich"
        subtitle="Bis zu 3 Cases nebeneinander."
      />
      <div className="p-8">
        <GlassCard className="flex flex-col items-start gap-3 p-8">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
            <GitCompare className="size-4 text-[var(--fg-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Vergleichs-Modus</h2>
            <p className="mt-1 text-sm text-[var(--fg-secondary)]">
              Kommt in Etappe 4: Nebeneinander-KPIs, kombinierte Cashflow-Kurve, Radar.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
