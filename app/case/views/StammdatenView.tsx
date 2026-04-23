"use client";

import { BUNDESLAENDER, BUNDESLAND_LABEL, GRUNDERWERBSTEUER } from "@/data/bundeslaender";
import type { Bundesland, Case, Einheit, EinheitStatus, Objekttyp } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  TextInput,
  NumberInput,
  CurrencyInput,
  Select,
  Section,
} from "@/components/forms/inputs";
import { formatCurrency, formatNumber } from "@/lib/cn";
import { Plus, Trash2 } from "lucide-react";

export function StammdatenView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);

  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const addEinheit = () =>
    upd((c) => {
      c.stammdaten.einheiten.push({
        id: crypto.randomUUID(),
        bezeichnung: `WE ${c.stammdaten.einheiten.length + 1}`,
        qm: 50,
        geschoss: 1,
        kaltmiete: 700,
        status: "vermietet",
      });
    });

  const removeEinheit = (id: string) =>
    upd((c) => {
      c.stammdaten.einheiten = c.stammdaten.einheiten.filter((e) => e.id !== id);
    });

  const updateEinheit = (id: string, patch: Partial<Einheit>) =>
    upd((c) => {
      const idx = c.stammdaten.einheiten.findIndex((e) => e.id === id);
      if (idx >= 0) c.stammdaten.einheiten[idx] = { ...c.stammdaten.einheiten[idx], ...patch };
    });

  const gesamtQm = caseItem.stammdaten.einheiten.reduce((a, e) => a + e.qm, 0);
  const gesamtMiete = caseItem.stammdaten.einheiten.reduce((a, e) => a + e.kaltmiete, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Objekt" description="Name, Typ, Baujahr und Adresse.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Case-Name" className="sm:col-span-2">
            <TextInput
              value={caseItem.name}
              onChange={(e) => upd((c) => { c.name = e.target.value; })}
            />
          </Field>

          <Field label="Objekttyp" tooltip="ETW = Eigentumswohnung (WEG), EFH = Einfamilienhaus, MFH = Mehrfamilienhaus.">
            <Select<Objekttyp>
              value={caseItem.stammdaten.objekttyp}
              onChange={(v) => upd((c) => { c.stammdaten.objekttyp = v; })}
              options={[
                { value: "ETW", label: "Eigentumswohnung (ETW)" },
                { value: "EFH", label: "Einfamilienhaus (EFH)" },
                { value: "MFH", label: "Mehrfamilienhaus (MFH)" },
              ]}
            />
          </Field>

          <Field
            label="Baujahr"
            tooltip="Bestimmt den AfA-Satz: 3% Neubau ab 2023, 2,5% Altbau vor 1925, sonst 2%."
          >
            <NumberInput
              value={caseItem.stammdaten.baujahr}
              onChange={(v) => upd((c) => { c.stammdaten.baujahr = Math.round(v); })}
              min={1800}
              max={new Date().getFullYear() + 3}
            />
          </Field>

          <Field label="Straße & Nr." className="sm:col-span-2">
            <TextInput
              value={caseItem.stammdaten.adresse.strasse}
              onChange={(e) => upd((c) => { c.stammdaten.adresse.strasse = e.target.value; })}
              placeholder="Musterstraße 1"
            />
          </Field>

          <Field label="PLZ">
            <TextInput
              value={caseItem.stammdaten.adresse.plz}
              onChange={(e) => upd((c) => { c.stammdaten.adresse.plz = e.target.value; })}
              placeholder="40210"
            />
          </Field>

          <Field label="Ort">
            <TextInput
              value={caseItem.stammdaten.adresse.ort}
              onChange={(e) => upd((c) => { c.stammdaten.adresse.ort = e.target.value; })}
              placeholder="Düsseldorf"
            />
          </Field>

          <Field
            label="Bundesland"
            tooltip="Steuert die Grunderwerbsteuer. Änderung setzt die Grunderwerbsteuer automatisch auf den Landes-Satz."
            className="sm:col-span-2"
          >
            <Select<Bundesland>
              value={caseItem.stammdaten.adresse.bundesland}
              onChange={(v) =>
                upd((c) => {
                  c.stammdaten.adresse.bundesland = v;
                  c.kaufkosten.nebenkosten.grunderwerbsteuerProzent = GRUNDERWERBSTEUER[v];
                })
              }
              options={BUNDESLAENDER.map((b) => ({
                value: b,
                label: `${BUNDESLAND_LABEL[b]} (${GRUNDERWERBSTEUER[b]}% GrESt)`,
              }))}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Einheiten"
        description={`${caseItem.stammdaten.einheiten.length} ${caseItem.stammdaten.einheiten.length === 1 ? "Einheit" : "Einheiten"} · ${formatNumber(gesamtQm)} m² · ${formatCurrency(gesamtMiete)}/Mo.`}
      >
        <div className="space-y-3">
          {caseItem.stammdaten.einheiten.map((e, i) => (
            <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <TextInput
                  value={e.bezeichnung}
                  onChange={(ev) => updateEinheit(e.id, { bezeichnung: ev.target.value })}
                  className="max-w-[200px] !font-sans"
                />
                {caseItem.stammdaten.einheiten.length > 1 && (
                  <button
                    onClick={() => removeEinheit(e.id)}
                    className="rounded-md border border-white/5 bg-white/[0.02] p-1.5 text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--accent-rose)]"
                    title="Einheit entfernen"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Fläche" tooltip="Wohnfläche nach WoFlV">
                  <NumberInput
                    value={e.qm}
                    onChange={(v) => updateEinheit(e.id, { qm: v })}
                    unit="m²"
                    min={0}
                    decimals={1}
                  />
                </Field>
                <Field label="Geschoss">
                  <NumberInput
                    value={e.geschoss}
                    onChange={(v) => updateEinheit(e.id, { geschoss: Math.round(v) })}
                  />
                </Field>
                <Field label="Kaltmiete/Mo.">
                  <CurrencyInput
                    value={e.kaltmiete}
                    onChange={(v) => updateEinheit(e.id, { kaltmiete: v })}
                  />
                </Field>
                <Field label="Status">
                  <Select<EinheitStatus>
                    value={e.status}
                    onChange={(v) => updateEinheit(e.id, { status: v })}
                    options={[
                      { value: "vermietet", label: "vermietet" },
                      { value: "leer", label: "leer" },
                      { value: "eigengenutzt", label: "eigengenutzt" },
                    ]}
                  />
                </Field>
              </div>
            </div>
          ))}

          <button
            onClick={addEinheit}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs text-[var(--fg-secondary)] transition-colors hover:border-white/20 hover:text-[var(--fg-primary)]"
          >
            <Plus className="size-3.5" />
            Einheit hinzufügen
          </button>
        </div>
      </Section>
    </div>
  );
}
