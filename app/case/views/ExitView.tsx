"use client";

import type { Case, VerkaufspreisModus } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  CurrencyInput,
  PercentInput,
  NumberInput,
  Section,
  RadioGroup,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { computeCase } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/cn";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ExitView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const result = useMemo(() => computeCase(caseItem, Math.max(30, caseItem.exit.haltedauerJahre)), [caseItem]);
  const exit = result.exit;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Section title="Haltedauer">
          <Field
            label="Haltedauer"
            tooltip="Nach wievielen Jahren willst du verkaufen? Relevant für IRR-Berechnung und Spekulationssteuer-Prüfung."
          >
            <NumberInput
              value={caseItem.exit.haltedauerJahre}
              onChange={(v) => upd((c) => { c.exit.haltedauerJahre = Math.round(v); })}
              unit="J."
              min={1}
              max={40}
            />
          </Field>
          {caseItem.exit.haltedauerJahre < 10 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-[var(--fg-secondary)]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--accent-amber)]" />
              <span>
                Haltedauer unter 10 Jahren löst bei Vermietung die{" "}
                <span className="font-semibold">Spekulationssteuer</span> auf den
                Veräußerungsgewinn aus (§23 EStG). Nur bei Selbstnutzung entfällt sie —
                hier nicht relevant.
              </span>
            </div>
          )}
          {caseItem.exit.haltedauerJahre >= 10 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-[var(--fg-secondary)]">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--accent-emerald)]" />
              <span>
                Haltedauer ≥ 10 Jahre: Veräußerungsgewinn ist{" "}
                <span className="font-semibold">steuerfrei</span> (außerhalb der
                Spekulationsfrist).
              </span>
            </div>
          )}
        </Section>

        <Section title="Verkaufspreis-Annahme">
          <div className="space-y-4">
            <Field label="Modus">
              <RadioGroup<VerkaufspreisModus>
                value={caseItem.exit.verkaufspreisModus}
                onChange={(v) => upd((c) => { c.exit.verkaufspreisModus = v; })}
                options={[
                  { value: "wertsteigerungProzent", label: "% Wertsteigerung p.a." },
                  { value: "fixWert", label: "Fixer Verkaufspreis" },
                ]}
              />
            </Field>

            {caseItem.exit.verkaufspreisModus === "wertsteigerungProzent" ? (
              <Field
                label="Wertsteigerung p.a."
                tooltip="Konservativ: 1–2%. Langfristiger Immobilien-Durchschnitt Deutschland ~1,5–2,5% real. Lagenabhängig stark unterschiedlich."
              >
                <PercentInput
                  value={caseItem.exit.wertsteigerungProzentPA ?? 1.5}
                  onChange={(v) => upd((c) => { c.exit.wertsteigerungProzentPA = v; })}
                />
              </Field>
            ) : (
              <Field label="Angenommener Verkaufspreis">
                <CurrencyInput
                  value={caseItem.exit.verkaufspreisFix ?? caseItem.kaufkosten.kaufpreis}
                  onChange={(v) => upd((c) => { c.exit.verkaufspreisFix = v; })}
                />
              </Field>
            )}
          </div>
        </Section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start space-y-4">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Exit-Rechnung — Jahr {exit.haltedauerJahre}
          </h3>
          <dl className="space-y-2 text-sm">
            <Row label="Verkaufspreis" value={formatCurrency(exit.verkaufspreis)} bold />
            <Row label="Restschuld bei Exit" value={formatCurrency(-exit.restschuldBeiExit)} muted />
            {exit.spekulationssteuerFaellig && (
              <Row
                label="Spekulationssteuer"
                value={formatCurrency(-exit.spekulationssteuer)}
                tone="rose"
              />
            )}
            <div className="my-2 h-px bg-white/5" />
            <Row label="Nettoerlös" value={formatCurrency(exit.nettoerloes)} bold tone="emerald" />
            <div className="my-2 h-px bg-white/5" />
            <Row label="Veräußerungsgewinn" value={formatCurrency(exit.veraeusserungsgewinn)} muted />
            <Row label="Kumulierte AfA" value={formatCurrency(exit.kumulierteAfA)} muted />
          </dl>
        </GlassCard>

        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            IRR über Haltedauer
          </h3>
          <div className="font-mono text-3xl font-semibold text-[var(--accent-emerald)]">
            {exit.irrProzent != null ? formatPercent(exit.irrProzent) : "—"}
          </div>
          <p className="mt-2 text-xs text-[var(--fg-secondary)]">
            Interner Zinsfuß (IRR) inkl. aller Cashflows und des Nettoerlöses beim
            Verkauf. Vergleichbar mit Anlageklassen-Renditen.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tone?: "emerald" | "rose";
}) {
  const toneClass =
    tone === "emerald" ? "text-[var(--accent-emerald)]" : tone === "rose" ? "text-[var(--accent-rose)]" : "";
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-[var(--fg-muted)] text-xs" : "text-[var(--fg-secondary)]"}>{label}</dt>
      <dd className={`font-mono ${bold ? "text-base font-semibold" : ""} ${muted ? "text-xs text-[var(--fg-muted)]" : ""} ${toneClass}`}>{value}</dd>
    </div>
  );
}
