"use client";

import type { Case, SanierungPosten, SanierungTyp } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  TextInput,
  CurrencyInput,
  PercentInput,
  Select,
  Section,
  RadioGroup,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { berechneNebenkosten, berechneGesamtinvestition } from "@/lib/calc";
import { formatCurrency } from "@/lib/cn";
import { Plus, Trash2 } from "lucide-react";

export function KaufkostenView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const nk = berechneNebenkosten(caseItem.kaufkosten);
  const gesamt = berechneGesamtinvestition(caseItem.kaufkosten);

  const addSanierung = () =>
    upd((c) => {
      c.kaufkosten.sanierung.push({
        id: crypto.randomUUID(),
        bezeichnung: "Neue Maßnahme",
        betrag: 0,
        typ: "erhaltungsaufwand",
        verteilungJahre: 1,
      });
    });

  const removeSanierung = (id: string) =>
    upd((c) => {
      c.kaufkosten.sanierung = c.kaufkosten.sanierung.filter((s) => s.id !== id);
    });

  const updateSanierung = (id: string, patch: Partial<SanierungPosten>) =>
    upd((c) => {
      const idx = c.kaufkosten.sanierung.findIndex((s) => s.id === id);
      if (idx >= 0) c.kaufkosten.sanierung[idx] = { ...c.kaufkosten.sanierung[idx], ...patch };
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section title="Kaufpreis & Nebenkosten">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Kaufpreis"
              tooltip="Reiner Kaufpreis der Immobilie ohne Nebenkosten. Grundlage für Grunderwerbsteuer und Makler-Courtage."
              className="sm:col-span-2"
            >
              <CurrencyInput
                value={caseItem.kaufkosten.kaufpreis}
                onChange={(v) => upd((c) => { c.kaufkosten.kaufpreis = v; })}
              />
            </Field>
            <Field
              label="Grunderwerbsteuer"
              tooltip="Automatisch aus dem Bundesland gesetzt (Stammdaten → Bundesland). Kann überschrieben werden, falls du zu einem anderen Satz gerechnet werden soll."
            >
              <PercentInput
                value={caseItem.kaufkosten.nebenkosten.grunderwerbsteuerProzent}
                onChange={(v) => upd((c) => { c.kaufkosten.nebenkosten.grunderwerbsteuerProzent = v; })}
              />
            </Field>
            <Field
              label="Notar"
              tooltip="Beurkundungskosten. Standard: ~1,5% vom Kaufpreis."
            >
              <PercentInput
                value={caseItem.kaufkosten.nebenkosten.notarProzent}
                onChange={(v) => upd((c) => { c.kaufkosten.nebenkosten.notarProzent = v; })}
              />
            </Field>
            <Field
              label="Grundbuch"
              tooltip="Eintragungskosten Grundbuchamt. Standard: ~0,5% vom Kaufpreis."
            >
              <PercentInput
                value={caseItem.kaufkosten.nebenkosten.grundbuchProzent}
                onChange={(v) => upd((c) => { c.kaufkosten.nebenkosten.grundbuchProzent = v; })}
              />
            </Field>
            <Field
              label="Makler"
              tooltip="Gesetzliche Obergrenze seit 2020: max. 3,57% inkl. MwSt. für den Käufer (hälftige Teilung mit Verkäufer). Trage 0 ein, wenn provisionsfrei gekauft wird."
            >
              <PercentInput
                value={caseItem.kaufkosten.nebenkosten.maklerProzent}
                onChange={(v) => upd((c) => { c.kaufkosten.nebenkosten.maklerProzent = v; })}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Aufteilung Grund & Gebäude"
          description="Steuerlich kritisch — nur der Gebäudeanteil ist AfA-fähig. Höherer Gebäudeanteil = mehr AfA = weniger Steuer."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Grundanteil"
              tooltip="Der Boden ist nicht abnutzbar und wird nicht abgeschrieben. Default 20% ist konservativ — in Großstädten oft deutlich höher. Bei eigenem Gutachten kannst du einen besseren Wert ansetzen."
            >
              <PercentInput
                value={caseItem.kaufkosten.aufteilung.grundProzent}
                onChange={(v) => upd((c) => {
                  c.kaufkosten.aufteilung.grundProzent = v;
                  c.kaufkosten.aufteilung.gebaeudeProzent = Math.max(0, 100 - v);
                })}
              />
            </Field>
            <Field
              label="Gebäudeanteil"
              tooltip="Dieser Anteil des Kaufpreises wird über die AfA jährlich abgeschrieben. Ergänzt sich automatisch mit Grundanteil zu 100%."
            >
              <PercentInput
                value={caseItem.kaufkosten.aufteilung.gebaeudeProzent}
                onChange={(v) => upd((c) => {
                  c.kaufkosten.aufteilung.gebaeudeProzent = v;
                  c.kaufkosten.aufteilung.grundProzent = Math.max(0, 100 - v);
                })}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Anfangs-Sanierung"
          description="Maßnahmen, die direkt nach Kauf anfallen. Wichtig: steuerliche Einordnung!"
        >
          <div className="space-y-3">
            {caseItem.kaufkosten.sanierung.length === 0 && (
              <p className="text-xs text-[var(--fg-muted)]">Keine Posten erfasst.</p>
            )}
            {caseItem.kaufkosten.sanierung.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <TextInput
                    value={s.bezeichnung}
                    onChange={(e) => updateSanierung(s.id, { bezeichnung: e.target.value })}
                    className="max-w-[260px] !font-sans"
                  />
                  <button
                    onClick={() => removeSanierung(s.id)}
                    className="rounded-md border border-white/5 bg-white/[0.02] p-1.5 text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--accent-rose)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Betrag">
                    <CurrencyInput
                      value={s.betrag}
                      onChange={(v) => updateSanierung(s.id, { betrag: v })}
                    />
                  </Field>
                  <Field
                    label="Steuerliche Einordnung"
                    tooltip="Anschaffungsnaher Herstellungsaufwand (§6 Abs. 1 Nr. 1a EStG) liegt vor, wenn die Sanierungen innerhalb 3 Jahren nach Kauf 15% der Anschaffungskosten übersteigen — dann aktiviert und via AfA abgeschrieben. Sonst Erhaltungsaufwand, sofort abzugsfähig."
                  >
                    <Select<SanierungTyp>
                      value={s.typ}
                      onChange={(v) => updateSanierung(s.id, { typ: v })}
                      options={[
                        { value: "erhaltungsaufwand", label: "Erhaltungsaufwand" },
                        { value: "anschaffungsnah", label: "Anschaffungsnah" },
                      ]}
                    />
                  </Field>
                  <Field
                    label="Verteilung (§82b)"
                    tooltip="Erhaltungsaufwand kann über 1–5 Jahre verteilt werden (§82b EStDV). Bei hohen Sanierungen oft besser, weil der jährliche Steuervorteil planbarer wird."
                  >
                    <Select<string>
                      value={String(s.verteilungJahre ?? 1)}
                      onChange={(v) => updateSanierung(s.id, { verteilungJahre: Number(v) as 1 | 2 | 3 | 4 | 5 })}
                      options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} Jahr${n > 1 ? "e" : ""}` }))}
                      disabled={s.typ === "anschaffungsnah"}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              onClick={addSanierung}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs text-[var(--fg-secondary)] hover:border-white/20 hover:text-[var(--fg-primary)]"
            >
              <Plus className="size-3.5" />
              Maßnahme hinzufügen
            </button>
          </div>
        </Section>
      </div>

      {/* Sticky Summary */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Zusammenfassung
          </h3>
          <dl className="space-y-2 text-sm">
            <Row label="Kaufpreis" value={formatCurrency(caseItem.kaufkosten.kaufpreis)} />
            <Row label="Grunderwerbsteuer" value={formatCurrency(nk.grunderwerbsteuer)} muted />
            <Row label="Notar" value={formatCurrency(nk.notar)} muted />
            <Row label="Grundbuch" value={formatCurrency(nk.grundbuch)} muted />
            <Row label="Makler" value={formatCurrency(nk.makler)} muted />
            <div className="my-2 h-px bg-white/5" />
            <Row
              label="Nebenkosten"
              value={`${formatCurrency(nk.summe)} · ${nk.summeProzent.toFixed(1)}%`}
            />
            <Row
              label="Sanierung"
              value={formatCurrency(caseItem.kaufkosten.sanierung.reduce((a, s) => a + s.betrag, 0))}
            />
            <div className="my-2 h-px bg-white/5" />
            <Row label="Gesamtinvestition" value={formatCurrency(gesamt)} bold />
          </dl>
        </GlassCard>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-[var(--fg-muted)] text-xs" : "text-[var(--fg-secondary)]"}>{label}</dt>
      <dd className={`font-mono ${bold ? "text-base font-semibold" : ""} ${muted ? "text-xs text-[var(--fg-muted)]" : ""}`}>{value}</dd>
    </div>
  );
}
