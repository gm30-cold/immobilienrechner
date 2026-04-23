"use client";

import type { Case, Darlehen } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  TextInput,
  CurrencyInput,
  PercentInput,
  NumberInput,
  Section,
  Checkbox,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { berechneGesamtinvestition, berechneTilgungsplan } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/cn";
import { Plus, Trash2 } from "lucide-react";

const MAX_DARLEHEN = 3;

export function FinanzierungView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const addDarlehen = () =>
    upd((c) => {
      if (c.finanzierung.darlehen.length >= MAX_DARLEHEN) return;
      c.finanzierung.darlehen.push({
        id: crypto.randomUUID(),
        bezeichnung: `Darlehen ${c.finanzierung.darlehen.length + 1}`,
        betrag: 100000,
        sollzinsProzent: 3.5,
        tilgungAnfaenglichProzent: 2,
        sollzinsbindungJahre: 10,
      });
    });

  const removeDarlehen = (id: string) =>
    upd((c) => {
      c.finanzierung.darlehen = c.finanzierung.darlehen.filter((d) => d.id !== id);
    });

  const updateDarlehen = (id: string, patch: Partial<Darlehen>) =>
    upd((c) => {
      const idx = c.finanzierung.darlehen.findIndex((d) => d.id === id);
      if (idx >= 0) c.finanzierung.darlehen[idx] = { ...c.finanzierung.darlehen[idx], ...patch };
    });

  const gesamtinvestition = berechneGesamtinvestition(caseItem.kaufkosten);
  const darlehenSumme = caseItem.finanzierung.darlehen.reduce((a, d) => a + d.betrag, 0);
  const finanzierungssumme = caseItem.finanzierung.eigenkapital + darlehenSumme;
  const luecke = gesamtinvestition - finanzierungssumme;
  const ekQuote = gesamtinvestition > 0 ? (caseItem.finanzierung.eigenkapital / gesamtinvestition) * 100 : 0;

  const plan = berechneTilgungsplan(caseItem.finanzierung);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section title="Eigenkapital">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Eingesetztes Eigenkapital"
              tooltip="Dein Cash, das du in das Objekt einbringst (inkl. Nebenkosten-Deckung). Je höher das EK, desto geringer der Finanzierungsbedarf und der Zinsaufwand — aber auch die Eigenkapitalrendite sinkt."
              className="sm:col-span-2"
            >
              <CurrencyInput
                value={caseItem.finanzierung.eigenkapital}
                onChange={(v) => upd((c) => { c.finanzierung.eigenkapital = v; })}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Darlehen"
          description={`${caseItem.finanzierung.darlehen.length}/${MAX_DARLEHEN} Darlehen — z.B. Bank-Annuität + KfW 261 + Privatdarlehen`}
        >
          <div className="space-y-4">
            {caseItem.finanzierung.darlehen.map((d, i) => {
              const hasAnschluss = d.anschlussZinsAnnahmeProzent != null;
              return (
                <div key={d.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <TextInput
                      value={d.bezeichnung}
                      onChange={(e) => updateDarlehen(d.id, { bezeichnung: e.target.value })}
                      className="max-w-[280px] !font-sans"
                    />
                    {caseItem.finanzierung.darlehen.length > 1 && (
                      <button
                        onClick={() => removeDarlehen(d.id)}
                        className="rounded-md border border-white/5 bg-white/[0.02] p-1.5 text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--accent-rose)]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Darlehenssumme">
                      <CurrencyInput
                        value={d.betrag}
                        onChange={(v) => updateDarlehen(d.id, { betrag: v })}
                      />
                    </Field>
                    <Field label="Sollzins" tooltip="Nominalzinssatz p.a. — NICHT effektiver Jahreszins. Aktuell (2026) liegen Immobilienzinsen grob bei 3–4,5%.">
                      <PercentInput
                        value={d.sollzinsProzent}
                        onChange={(v) => updateDarlehen(d.id, { sollzinsProzent: v })}
                      />
                    </Field>
                    <Field label="Anfangstilgung" tooltip="Tilgungssatz im 1. Jahr. Bei konstanter Annuität steigt der Tilgungsanteil über die Zeit automatisch. Empfehlung: min. 2% bei Zinsbindung ≥10 Jahre.">
                      <PercentInput
                        value={d.tilgungAnfaenglichProzent}
                        onChange={(v) => updateDarlehen(d.id, { tilgungAnfaenglichProzent: v })}
                      />
                    </Field>
                    <Field label="Sollzinsbindung" tooltip="Wie lange der Zinssatz festgeschrieben ist. Danach muss die Restschuld anschlussfinanziert werden — zu einem dann gültigen Zinssatz.">
                      <NumberInput
                        value={d.sollzinsbindungJahre}
                        onChange={(v) => updateDarlehen(d.id, { sollzinsbindungJahre: Math.round(v) })}
                        unit="J."
                        min={1}
                        max={40}
                      />
                    </Field>
                    <Field
                      label="Tilgungsfreie Jahre"
                      tooltip="Beispielsweise bei KfW 261: zu Beginn nur Zins zahlen. Standard: 0."
                    >
                      <NumberInput
                        value={d.tilgungsfreieJahre ?? 0}
                        onChange={(v) => updateDarlehen(d.id, { tilgungsfreieJahre: Math.round(v) || undefined })}
                        unit="J."
                        min={0}
                        max={10}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.015] p-3">
                    <Checkbox
                      checked={hasAnschluss}
                      onChange={(v) =>
                        updateDarlehen(d.id, {
                          anschlussZinsAnnahmeProzent: v ? (d.sollzinsProzent + 1) : undefined,
                        })
                      }
                      label="Anschlussfinanzierung simulieren"
                      tooltip="Nach Ablauf der Zinsbindung wird die Restschuld mit einem angenommenen neuen Zinssatz bei gleicher Anfangstilgung weiter getilgt. Stresstest-Empfehlung: +1 bis +2 Prozentpunkte."
                    />
                    {hasAnschluss && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Angenommener Anschlusszins">
                          <PercentInput
                            value={d.anschlussZinsAnnahmeProzent ?? 4.5}
                            onChange={(v) => updateDarlehen(d.id, { anschlussZinsAnnahmeProzent: v })}
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {caseItem.finanzierung.darlehen.length < MAX_DARLEHEN && (
              <button
                onClick={addDarlehen}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs text-[var(--fg-secondary)] hover:border-white/20 hover:text-[var(--fg-primary)]"
              >
                <Plus className="size-3.5" />
                Darlehen hinzufügen
              </button>
            )}
          </div>
        </Section>
      </div>

      {/* Sticky Summary */}
      <div className="xl:sticky xl:top-6 xl:self-start space-y-4">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Finanzierungs-Check
          </h3>
          <dl className="space-y-2 text-sm">
            <Row label="Gesamtinvestition" value={formatCurrency(gesamtinvestition)} muted />
            <Row label="Eigenkapital" value={formatCurrency(caseItem.finanzierung.eigenkapital)} />
            <Row label="Darlehen gesamt" value={formatCurrency(darlehenSumme)} />
            <div className="my-2 h-px bg-white/5" />
            <Row
              label="Finanzierungssumme"
              value={formatCurrency(finanzierungssumme)}
            />
            <Row
              label={luecke > 0 ? "Finanzierungslücke" : luecke < 0 ? "Überdeckung" : "Deckung"}
              value={formatCurrency(luecke)}
              tone={luecke > 0 ? "rose" : luecke < 0 ? "amber" : "emerald"}
              bold
            />
            <div className="my-2 h-px bg-white/5" />
            <Row label="EK-Quote" value={formatPercent(ekQuote)} />
            <Row
              label="Restschuld n. ZB"
              value={formatCurrency(plan.restschuldNachZinsbindung)}
              tooltip="Summe der Restschulden aller Darlehen am Ende der längsten Sollzinsbindung."
            />
          </dl>
        </GlassCard>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  tone?: "emerald" | "rose" | "amber";
  tooltip?: string;
}
function Row({ label, value, bold, muted, tone }: RowProps) {
  const toneClass =
    tone === "emerald"
      ? "text-[var(--accent-emerald)]"
      : tone === "rose"
      ? "text-[var(--accent-rose)]"
      : tone === "amber"
      ? "text-[var(--accent-amber)]"
      : "";
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-[var(--fg-muted)] text-xs" : "text-[var(--fg-secondary)]"}>{label}</dt>
      <dd className={`font-mono ${bold ? "text-base font-semibold" : ""} ${muted ? "text-xs text-[var(--fg-muted)]" : ""} ${toneClass}`}>{value}</dd>
    </div>
  );
}
