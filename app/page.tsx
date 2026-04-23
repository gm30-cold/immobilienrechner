"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Ampel } from "@/components/ui/Ampel";
import { useCasesStore } from "@/lib/store";
import { makeDefaultCase } from "@/lib/defaultCase";
import { formatCurrency, formatPercent } from "@/lib/cn";
import { computeCase } from "@/lib/calc";
import type { Case } from "@/types/case";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Sparkles } from "lucide-react";

export default function Home() {
  const cases = useCasesStore((s) => s.cases);
  const addCase = useCasesStore((s) => s.addCase);
  const router = useRouter();

  const createCase = () => {
    const c = makeDefaultCase(`Case ${cases.length + 1}`);
    addCase(c);
    router.push(`/case?id=${c.id}&tab=stammdaten`);
  };

  return (
    <div>
      <PageHeader
        title="Übersicht"
        subtitle="Alle Investmentcases auf einen Blick."
        actions={
          <button
            onClick={createCase}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/10 hover:from-emerald-500 hover:to-emerald-600"
          >
            <Plus className="size-4" />
            Neuer Case
          </button>
        }
      />

      <div className="p-8">
        {cases.length === 0 ? (
          <EmptyState onCreate={createCase} />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((c) => (
              <CaseCard key={c.id} caseItem={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <GlassCard className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 overflow-hidden p-12 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(52,211,153,0.12),transparent_60%)]" />
      <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-sky-400/20 ring-1 ring-white/10">
        <Sparkles className="size-5 text-[var(--accent-emerald)]" />
      </div>
      <div className="relative space-y-2">
        <h2 className="text-xl font-semibold">Starte deinen ersten Case</h2>
        <p className="text-sm text-[var(--fg-secondary)]">
          Trage Kaufpreis, Finanzierung und Miete ein — der Rechner zeigt dir
          Rendite, Cashflow und Break-Even in Echtzeit.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="relative flex items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/10 hover:from-emerald-500 hover:to-emerald-600"
      >
        <Plus className="size-4" />
        Neuen Case anlegen
      </button>
    </GlassCard>
  );
}

function CaseCard({ caseItem }: { caseItem: Case }) {
  const result = useMemo(() => computeCase(caseItem, 30), [caseItem]);
  const monatsmiete = caseItem.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0);

  return (
    <a href={`/case?id=${caseItem.id}`} className="group relative block">
      <GlassCard className="relative h-full overflow-hidden p-5 transition-transform group-hover:-translate-y-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_100%_0%,rgba(167,139,250,0.08),transparent_60%)]" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">{caseItem.name}</h3>
            <p className="mt-0.5 truncate text-xs text-[var(--fg-secondary)]">
              {caseItem.stammdaten.adresse.ort || "—"} · {caseItem.stammdaten.adresse.bundesland}
            </p>
          </div>
          <Ampel state={result.ampel.gesamt} />
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              Kaufpreis
            </div>
            <div className="mt-1 font-mono text-base font-semibold">
              {formatCurrency(caseItem.kaufkosten.kaufpreis)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
              Nettorendite
            </div>
            <div className="mt-1 font-mono text-base font-semibold text-[var(--accent-emerald)]">
              {formatPercent(result.kpi.nettomietrenditeProzent)}
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-[var(--fg-muted)]">
          <span>
            CF {formatCurrency(result.kpi.cashflowNachSteuernProMonat)}/Mo.
          </span>
          <ArrowRight className="size-3.5 text-[var(--fg-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--fg-primary)]" />
        </div>
      </GlassCard>
    </a>
  );
}
