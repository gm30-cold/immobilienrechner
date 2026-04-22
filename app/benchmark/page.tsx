import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Map } from "lucide-react";

export default function BenchmarkPage() {
  return (
    <div>
      <PageHeader
        title="Markt-Benchmark"
        subtitle="Durchschnittsmieten, Bodenrichtwerte, Kaufpreis-Multiplikatoren."
      />
      <div className="p-8">
        <GlassCard className="flex flex-col items-start gap-3 p-8">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
            <Map className="size-4 text-[var(--fg-muted)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Phase 2</h2>
            <p className="mt-1 text-sm text-[var(--fg-secondary)]">
              Toggle zwischen EFH / MFH / ETW, Heatmap-Karte, Benchmark-Overlay für
              eigene Case-Annahmen. Datenquellen noch festzulegen.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
