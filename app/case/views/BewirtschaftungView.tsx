"use client";

import type { Case, InstandhaltungsEvent, SanierungTyp } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  TextInput,
  CurrencyInput,
  PercentInput,
  NumberInput,
  Section,
  RadioGroup,
  Select,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { berechneRuecklageProJahr, peterschesche } from "@/lib/calc";
import { berechneWertaufteilung } from "@/lib/calc";
import { formatCurrency } from "@/lib/cn";
import { Plus, Trash2 } from "lucide-react";

export function BewirtschaftungView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const { gebaeudewert } = berechneWertaufteilung(caseItem.kaufkosten);
  const peterssche = peterschesche(gebaeudewert);
  const ruecklageAktuell = berechneRuecklageProJahr(caseItem);

  const addEvent = () =>
    upd((c) => {
      c.bewirtschaftung.instandhaltungsEvents.push({
        id: crypto.randomUUID(),
        jahr: 10,
        bezeichnung: "Neue Maßnahme",
        betrag: 20000,
        typ: "erhaltungsaufwand",
        verteilungJahre: 1,
      });
    });

  const removeEvent = (id: string) =>
    upd((c) => {
      c.bewirtschaftung.instandhaltungsEvents = c.bewirtschaftung.instandhaltungsEvents.filter(
        (e) => e.id !== id,
      );
    });

  const updateEvent = (id: string, patch: Partial<InstandhaltungsEvent>) =>
    upd((c) => {
      const idx = c.bewirtschaftung.instandhaltungsEvents.findIndex((e) => e.id === id);
      if (idx >= 0)
        c.bewirtschaftung.instandhaltungsEvents[idx] = {
          ...c.bewirtschaftung.instandhaltungsEvents[idx],
          ...patch,
        };
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section
          title="Instandhaltungsrücklage"
          description="Reserve für zukünftige Reparaturen, laufend verteilt über die Haltedauer."
        >
          <div className="space-y-4">
            <Field
              label="Berechnungsmodus"
              tooltip="Peterssche Formel: 1,5× Herstellungskosten über 80 Jahre → ~1,875% vom Gebäudewert p.a. Konservativ, gut für Altbau und 30-Jahres-Betrachtungen. Oder: fester %-Satz vom Gebäudewert."
            >
              <RadioGroup
                value={caseItem.bewirtschaftung.ruecklageModus}
                onChange={(v) => upd((c) => { c.bewirtschaftung.ruecklageModus = v; })}
                options={[
                  { value: "peterssche", label: "Peterssche Formel" },
                  { value: "prozent", label: "% vom Gebäudewert" },
                ]}
              />
            </Field>

            {caseItem.bewirtschaftung.ruecklageModus === "prozent" && (
              <Field label="Rücklage p.a.">
                <PercentInput
                  value={caseItem.bewirtschaftung.ruecklageProzentGebaeudewert ?? 1.0}
                  onChange={(v) => upd((c) => { c.bewirtschaftung.ruecklageProzentGebaeudewert = v; })}
                />
              </Field>
            )}

            <div className="rounded-lg border border-white/5 bg-white/[0.015] p-3 text-xs">
              <div className="mb-1 font-medium text-[var(--fg-secondary)]">Ergebnis:</div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <span className="text-[var(--fg-muted)]">Peterssche (Referenz)</span>
                <span className="text-right">{formatCurrency(peterssche)} p.a.</span>
                <span className="text-[var(--fg-muted)]">Aktiver Modus</span>
                <span className="text-right font-semibold">{formatCurrency(ruecklageAktuell)} p.a.</span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Laufende Bewirtschaftung">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Hausverwaltung"
              tooltip="Bei WEG Standard: 25–40 €/Mo. je Einheit. Bei MFH mit WEG-Verwaltung ähnlich, bei Selbstverwaltung 0."
            >
              <CurrencyInput
                value={caseItem.bewirtschaftung.hausverwaltungProMonatJeEinheit}
                onChange={(v) => upd((c) => { c.bewirtschaftung.hausverwaltungProMonatJeEinheit = v; })}
              />
              <span className="text-[11px] text-[var(--fg-muted)]">pro Einheit und Monat</span>
            </Field>
            <Field
              label="Mietausfallwagnis"
              tooltip="Pauschaler %-Satz der Jahreskaltmiete für Zahlungsausfälle, Leerstand zwischen Mietern, Mietminderungen. Typisch: 2% (WEG), bis 5% bei Problem-Lagen."
            >
              <PercentInput
                value={caseItem.bewirtschaftung.mietausfallwagnisProzent}
                onChange={(v) => upd((c) => { c.bewirtschaftung.mietausfallwagnisProzent = v; })}
              />
            </Field>
            <Field
              label="Versicherung"
              tooltip="Gebäude- und Haftpflichtversicherung (Eigentümer-Anteil, nicht umlagefähig)."
            >
              <CurrencyInput
                value={caseItem.bewirtschaftung.versicherungProJahr}
                onChange={(v) => upd((c) => { c.bewirtschaftung.versicherungProJahr = v; })}
              />
              <span className="text-[11px] text-[var(--fg-muted)]">pro Jahr</span>
            </Field>
            <Field
              label="Sonstige Kosten"
              tooltip="Kontoführung, Steuerberater-Anteil, Mitgliedschaften (Haus & Grund), kleinere laufende Kosten."
            >
              <CurrencyInput
                value={caseItem.bewirtschaftung.sonstigeKostenProJahr}
                onChange={(v) => upd((c) => { c.bewirtschaftung.sonstigeKostenProJahr = v; })}
              />
              <span className="text-[11px] text-[var(--fg-muted)]">pro Jahr</span>
            </Field>
          </div>
        </Section>

        <Section
          title="Instandhaltungs-Events"
          description="Einmalige größere Maßnahmen (z.B. neues Dach in Jahr 12, Heizungstausch)."
        >
          <div className="space-y-3">
            {caseItem.bewirtschaftung.instandhaltungsEvents.length === 0 && (
              <p className="text-xs text-[var(--fg-muted)]">Keine Events geplant.</p>
            )}
            {caseItem.bewirtschaftung.instandhaltungsEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <TextInput
                    value={e.bezeichnung}
                    onChange={(ev) => updateEvent(e.id, { bezeichnung: ev.target.value })}
                    className="max-w-[260px] !font-sans"
                  />
                  <button
                    onClick={() => removeEvent(e.id)}
                    className="rounded-md border border-white/5 bg-white/[0.02] p-1.5 text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--accent-rose)]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Jahr">
                    <NumberInput
                      value={e.jahr}
                      onChange={(v) => updateEvent(e.id, { jahr: Math.round(v) })}
                      min={1}
                      max={30}
                    />
                  </Field>
                  <Field label="Betrag">
                    <CurrencyInput
                      value={e.betrag}
                      onChange={(v) => updateEvent(e.id, { betrag: v })}
                    />
                  </Field>
                  <Field label="Einordnung">
                    <Select<SanierungTyp>
                      value={e.typ}
                      onChange={(v) => updateEvent(e.id, { typ: v })}
                      options={[
                        { value: "erhaltungsaufwand", label: "Erhaltung" },
                        { value: "anschaffungsnah", label: "Anschaffungsnah" },
                      ]}
                    />
                  </Field>
                  <Field label="Verteilung">
                    <Select<string>
                      value={String(e.verteilungJahre ?? 1)}
                      onChange={(v) => updateEvent(e.id, { verteilungJahre: Number(v) as 1 | 2 | 3 | 4 | 5 })}
                      options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} J.` }))}
                      disabled={e.typ === "anschaffungsnah"}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              onClick={addEvent}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs text-[var(--fg-secondary)] hover:border-white/20 hover:text-[var(--fg-primary)]"
            >
              <Plus className="size-3.5" />
              Event hinzufügen
            </button>
          </div>
        </Section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Hinweis
          </h3>
          <p className="text-xs leading-relaxed text-[var(--fg-secondary)]">
            Die Peterssche Formel setzt die Instandhaltungsrücklage konservativ an
            (~1,9% vom Gebäudewert p.a.) — sie berücksichtigt, dass über 80 Jahre
            Lebensdauer ca. 1,5× die Herstellungskosten an Reparaturen anfallen.
            Für Neubau ist 1% oft realistischer — dann RadioGroup auf Prozent-Modus
            stellen.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
