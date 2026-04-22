import type { Case, Ampel } from "@/types/case";
import type { AmpelBewertung, CashflowZeile, KpiResult } from "./types";

/**
 * Ampel-Bewertung basierend auf Renditen, Cashflow, Tilgung und Kaufpreisfaktor.
 * Die schlechteste Einzelbewertung bestimmt das Gesamturteil.
 */
export function bewerteAmpel(
  c: Case,
  kpi: KpiResult,
  cashflow: CashflowZeile[],
): AmpelBewertung {
  const gruende: { ampel: Ampel; text: string }[] = [];

  // Nettomietrendite
  if (kpi.nettomietrenditeProzent < 2) {
    gruende.push({ ampel: "rot", text: `Nettomietrendite nur ${kpi.nettomietrenditeProzent.toFixed(2)}% — unter 2% sehr knapp.` });
  } else if (kpi.nettomietrenditeProzent < 3) {
    gruende.push({ ampel: "gelb", text: `Nettomietrendite ${kpi.nettomietrenditeProzent.toFixed(2)}% — solide, aber dünn.` });
  } else {
    gruende.push({ ampel: "gruen", text: `Nettomietrendite ${kpi.nettomietrenditeProzent.toFixed(2)}% — stark.` });
  }

  // Monatlicher Cashflow nach Steuern
  const cfM = kpi.cashflowNachSteuernProMonat;
  if (cfM < -300) {
    gruende.push({ ampel: "rot", text: `Monatliche Unterdeckung > 300 € nach Steuern — Stresstest nötig.` });
  } else if (cfM < 0) {
    gruende.push({ ampel: "gelb", text: `Leichte Unterdeckung (${Math.round(cfM)} €/Mo.) — trägt sich nicht ganz selbst.` });
  } else {
    gruende.push({ ampel: "gruen", text: `Monatlicher Cashflow ${Math.round(cfM)} € nach Steuern positiv.` });
  }

  // Tilgungsquote
  if (kpi.tilgungAnfaenglichProzent < 1.5) {
    gruende.push({ ampel: "rot", text: `Anfangstilgung unter 1,5% — Restschuld-Risiko nach Zinsbindung.` });
  } else if (kpi.tilgungAnfaenglichProzent < 2) {
    gruende.push({ ampel: "gelb", text: `Anfangstilgung ${kpi.tilgungAnfaenglichProzent.toFixed(1)}% — eher niedrig.` });
  }

  // Kaufpreisfaktor
  if (kpi.kaufpreisFaktor > 30) {
    gruende.push({ ampel: "rot", text: `Kaufpreisfaktor ${kpi.kaufpreisFaktor.toFixed(1)}× — sehr hoch, Rendite stark abhängig von Wertsteigerung.` });
  } else if (kpi.kaufpreisFaktor > 25) {
    gruende.push({ ampel: "gelb", text: `Kaufpreisfaktor ${kpi.kaufpreisFaktor.toFixed(1)}× — leicht erhöht.` });
  }

  // EK-Quote
  if (kpi.eigenkapitalQuoteProzent < 10) {
    gruende.push({ ampel: "gelb", text: `EK-Quote ${kpi.eigenkapitalQuoteProzent.toFixed(1)}% — sehr niedrig, hohes Finanzierungsrisiko.` });
  }

  // Break-Even
  if (!kpi.breakEvenJahr || kpi.breakEvenJahr > 25) {
    gruende.push({ ampel: "gelb", text: `Break-Even erst spät (${kpi.breakEvenJahr ?? ">30"} Jahre) — lange Durststrecke.` });
  }

  // Spekulationsfrist-Flag (Hinweis, nicht Ampel)
  if (c.exit.haltedauerJahre < 10) {
    gruende.push({
      ampel: "gelb",
      text: `Haltedauer ${c.exit.haltedauerJahre} Jahre < 10 — Verkauf löst Spekulationssteuer aus.`,
    });
  }

  // Schlechtestes Urteil bestimmt gesamt
  const rank: Record<Ampel, number> = { gruen: 0, gelb: 1, rot: 2 };
  const gesamt = gruende.reduce<Ampel>(
    (w, g) => (rank[g.ampel] > rank[w] ? g.ampel : w),
    "gruen",
  );

  return { gesamt, gruende };
}
