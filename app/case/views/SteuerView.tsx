"use client";

import type { Case, GrenzsteuersatzModus, Veranlagung } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  CurrencyInput,
  PercentInput,
  Section,
  RadioGroup,
  Checkbox,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { effektiverGrenzsteuersatz, linearerAfASatz, berechneAfA } from "@/lib/calc";
import { schaetzeZvE } from "@/data/tarif";
import { formatCurrency, formatPercent } from "@/lib/cn";

export function SteuerView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const modus = caseItem.steuer.grenzsteuersatzModus;
  const veranlagung = caseItem.steuer.veranlagung;

  const grenz = effektiverGrenzsteuersatz(caseItem);
  const afaSatz = linearerAfASatz(caseItem.stammdaten.baujahr);
  const afaResult = berechneAfA(caseItem);

  // Vorschau für Schätzungsmodus
  const schaetzzvE =
    modus === "schaetzung"
      ? schaetzeZvE(caseItem.steuer.bruttoEhegatte1 ?? 0) +
        schaetzeZvE(caseItem.steuer.bruttoEhegatte2 ?? 0)
      : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section
          title="Grenzsteuersatz-Wizard"
          description="Bestimmt, wie stark Vermietungs-Gewinne oder -Verluste die Gesamtsteuer beeinflussen."
        >
          <div className="space-y-5">
            <Field label="Modus" tooltip="Drei Wege zum Grenzsteuersatz: (1) Wert aus letztem Einkommensteuerbescheid eintragen — exakt. (2) Aus Brutto schätzen — ±5% ungenau. (3) Satz direkt eintragen — wenn du ihn sicher kennst.">
              <RadioGroup<GrenzsteuersatzModus>
                value={modus}
                onChange={(v) => upd((c) => { c.steuer.grenzsteuersatzModus = v; })}
                options={[
                  { value: "bescheid", label: "Bescheid zur Hand" },
                  { value: "schaetzung", label: "Aus Brutto schätzen" },
                  { value: "direkt", label: "Direkt eintragen" },
                ]}
              />
            </Field>

            <Field label="Veranlagung">
              <RadioGroup<Veranlagung>
                value={veranlagung}
                onChange={(v) => upd((c) => { c.steuer.veranlagung = v; })}
                options={[
                  { value: "einzeln", label: "Einzelveranlagung" },
                  { value: "zusammen", label: "Zusammenveranlagung" },
                ]}
              />
            </Field>

            <Field label="Kirchensteuer">
              <RadioGroup<string>
                value={String(caseItem.steuer.kirchensteuerSatz)}
                onChange={(v) => upd((c) => { c.steuer.kirchensteuerSatz = Number(v) as 0 | 0.08 | 0.09; })}
                options={[
                  { value: "0", label: "Keine" },
                  { value: "0.08", label: "8% (BY/BW)" },
                  { value: "0.09", label: "9% (Rest)" },
                ]}
              />
            </Field>

            {modus === "bescheid" && (
              <Field
                label="Zu versteuerndes Einkommen (z.v.E.)"
                tooltip="Aus dem letzten Einkommensteuerbescheid — Zeile 'zu versteuerndes Einkommen'. Bei gemeinsamer Veranlagung ist das bereits der Gesamtwert beider Ehegatten."
              >
                <CurrencyInput
                  value={caseItem.steuer.zvE ?? 0}
                  onChange={(v) => upd((c) => { c.steuer.zvE = v; })}
                />
              </Field>
            )}

            {modus === "schaetzung" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Bruttojahresgehalt Person 1"
                  tooltip="Bruttogehalt p.a. aus Lohnsteuerbescheinigung. Tool schätzt daraus z.v.E. (−Sozialabgaben, −Werbungskostenpauschale, −Vorsorgepauschale)."
                >
                  <CurrencyInput
                    value={caseItem.steuer.bruttoEhegatte1 ?? 0}
                    onChange={(v) => upd((c) => { c.steuer.bruttoEhegatte1 = v; })}
                  />
                </Field>
                <Field
                  label="Bruttojahresgehalt Person 2"
                  tooltip="Nur bei gemeinsamer Veranlagung. Sonst 0 lassen."
                >
                  <CurrencyInput
                    value={caseItem.steuer.bruttoEhegatte2 ?? 0}
                    onChange={(v) => upd((c) => { c.steuer.bruttoEhegatte2 = v; })}
                    disabled={veranlagung === "einzeln"}
                  />
                </Field>
                <div className="sm:col-span-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] text-[var(--fg-secondary)]">
                  <span className="font-mono text-amber-200">Hinweis:</span>{" "}
                  Schätzung ist ±5% ungenau. Für ein Finanzierungsgespräch bitte den exakten
                  Wert aus dem ESt-Bescheid nutzen. Geschätztes z.v.E. (vereinfacht):{" "}
                  <span className="font-mono text-[var(--fg-primary)]">{formatCurrency(schaetzzvE)}</span>
                </div>
              </div>
            )}

            {modus === "direkt" && (
              <Field
                label="Grenzsteuersatz (Einkommensteuer)"
                tooltip="ESt-Grenzsatz ohne Soli und KiSt — die werden automatisch addiert. Häufige Werte: 14% (Einstieg), 32–42% (Mittelstand), 45% (Reichensteuer ab ~278k z.v.E. einzeln)."
              >
                <PercentInput
                  value={caseItem.steuer.grenzsteuersatzDirektProzent ?? 42}
                  onChange={(v) => upd((c) => { c.steuer.grenzsteuersatzDirektProzent = v; })}
                />
              </Field>
            )}
          </div>
        </Section>

        <Section title="AfA — Abschreibung" description="Wird automatisch aus dem Baujahr gewählt.">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">
                  Baujahr {caseItem.stammdaten.baujahr} → linearer AfA-Satz
                </span>
                <span className="font-mono font-semibold">{afaSatz.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-muted)] text-xs">Gebäudewert als AfA-Basis</span>
                <span className="font-mono text-xs text-[var(--fg-muted)]">
                  {formatCurrency(caseItem.kaufkosten.kaufpreis * (caseItem.kaufkosten.aufteilung.gebaeudeProzent / 100))}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-[var(--fg-primary)]">Lineare AfA p.a.</span>
                <span className="font-mono font-semibold text-[var(--accent-emerald)]">
                  {formatCurrency(afaResult.linear)}
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Spezielle AfA (optional)"
          description="Sonder- und Denkmal-AfA nur aktivieren, wenn du die Voraussetzungen erfüllst."
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <Checkbox
                checked={caseItem.steuer.sonderAfA?.aktiv ?? false}
                onChange={(v) =>
                  upd((c) => {
                    c.steuer.sonderAfA = v
                      ? { aktiv: true, qualifizierenderBetrag: c.steuer.sonderAfA?.qualifizierenderBetrag ?? 0 }
                      : undefined;
                  })
                }
                label="Sonder-AfA §7b EStG (Mietwohnungsneubau)"
                tooltip="Zusätzliche Abschreibung für Neubau-Mietwohnungen, die Effizienzstandard EH40 mit QNG-Siegel erfüllen. 5% p.a. über 4 Jahre ZUSÄTZLICH zur linearen AfA. Maximale Bemessungsgrundlage: 4.000 €/qm. Voraussetzungen eng — prüfe, ob du förderberechtigt bist."
              />
              {caseItem.steuer.sonderAfA?.aktiv && (
                <div className="mt-4">
                  <Field label="Qualifizierender Betrag">
                    <CurrencyInput
                      value={caseItem.steuer.sonderAfA.qualifizierenderBetrag}
                      onChange={(v) =>
                        upd((c) => {
                          if (c.steuer.sonderAfA) c.steuer.sonderAfA.qualifizierenderBetrag = v;
                        })
                      }
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <Checkbox
                checked={caseItem.steuer.denkmalAfA?.aktiv ?? false}
                onChange={(v) =>
                  upd((c) => {
                    c.steuer.denkmalAfA = v
                      ? { aktiv: true, qualifizierenderBetrag: c.steuer.denkmalAfA?.qualifizierenderBetrag ?? 0 }
                      : undefined;
                  })
                }
                label="Denkmal-AfA §7i EStG"
                tooltip="Modernisierungsaufwendungen an Baudenkmälern: 8 Jahre × 9% + 4 Jahre × 7% = 100% über 12 Jahre. Nur für NACH Kauf entstandene Modernisierungskosten (nicht der Kaufpreis selbst). Benötigt Bescheinigung der Denkmalschutzbehörde."
              />
              {caseItem.steuer.denkmalAfA?.aktiv && (
                <div className="mt-4">
                  <Field label="Qualifizierender Betrag (Modernisierungskosten)">
                    <CurrencyInput
                      value={caseItem.steuer.denkmalAfA.qualifizierenderBetrag}
                      onChange={(v) =>
                        upd((c) => {
                          if (c.steuer.denkmalAfA) c.steuer.denkmalAfA.qualifizierenderBetrag = v;
                        })
                      }
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Effektiver Grenzsteuersatz
          </h3>
          <div className="mb-4">
            <div className="font-mono text-3xl font-semibold text-[var(--accent-emerald)]">
              {formatPercent(grenz * 100)}
            </div>
            <p className="mt-1 text-xs text-[var(--fg-secondary)]">
              inkl. Soli 5,5% {caseItem.steuer.kirchensteuerSatz > 0 && ` + KiSt ${(caseItem.steuer.kirchensteuerSatz * 100).toFixed(0)}%`}
            </p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-[var(--fg-secondary)]">
            Bei Vermietungsverlusten spart das Finanzamt dir{" "}
            <span className="font-mono text-[var(--accent-emerald)]">
              {formatPercent(grenz * 100)}
            </span>{" "}
            vom Verlust — bei Gewinnen entsprechend extra Steuer.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
