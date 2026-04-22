import type { Case } from "@/types/case";
import type {
  CashflowZeile,
  CaseResult,
  KpiResult,
} from "./types";
import { berechneNebenkosten, berechneGesamtinvestition, berechneWertaufteilung } from "./nebenkosten";
import { berechneTilgungsplan, gewichteteTilgungAnfaenglich } from "./tilgung";
import { berechneAfA } from "./afa";
import { berechneBewirtschaftungProJahr, einmaligeAufwendungenProJahr } from "./bewirtschaftung";
import { berechneMietprojektion } from "./miete";
import { effektiverGrenzsteuersatz } from "./steuer";
import { berechneExit } from "./exit";
import { bewerteAmpel } from "./ampel";

const JAHRE_MAX_DEFAULT = 30;

export function computeCase(c: Case, jahreMax: number = JAHRE_MAX_DEFAULT): CaseResult {
  const nebenkosten = berechneNebenkosten(c.kaufkosten);
  const gesamtinvestition = berechneGesamtinvestition(c.kaufkosten);
  const { bodenwert, gebaeudewert } = berechneWertaufteilung(c.kaufkosten);

  const tilgung = berechneTilgungsplan(c.finanzierung);
  const afa = berechneAfA(c);
  const miete = berechneMietprojektion(c, jahreMax);
  const bewirtschaftung = berechneBewirtschaftungProJahr(c, jahreMax);
  const einmalige = einmaligeAufwendungenProJahr(c, jahreMax);
  const grenzsteuer = effektiverGrenzsteuersatz(c);

  // ---- Cashflow-Projektion pro Jahr ----
  const cashflow: CashflowZeile[] = [];
  let kumCFNach = 0;

  for (let i = 0; i < jahreMax; i++) {
    const jahr = i + 1;
    const m = miete[i];
    const b = bewirtschaftung[i];
    const ein = einmalige[jahr];
    const afaJ = afa.proJahr(jahr);

    const tilgungJ = tilgung.aggregiertJahr.find((t) => t.jahr === jahr);
    const zinsJ = tilgungJ?.zins ?? 0;
    const tilgJ = tilgungJ?.tilgung ?? 0;
    const restschuldJ = tilgungJ?.restschuldEnde ?? 0;

    // V+V Einkünfte (§21 EStG): Einnahmen − Werbungskosten
    // Werbungskosten: Zins + AfA + laufende Bewirtschaftung + direkt/verteilt abzugsfähige Aufwendungen.
    // Tilgung ist KEINE Werbungskosten.
    const wk =
      zinsJ +
      afaJ +
      b.verwaltung +
      b.versicherung +
      b.sonstige +
      b.mietausfallwagnis +
      b.instandhaltungRuecklage +
      (ein?.sofortAbzugsfaehig ?? 0);
    const steuerpflichtigerGewinn = m.kaltmiete - wk;
    const steuerEffekt = steuerpflichtigerGewinn * grenzsteuer;

    // Cashflow (Kasse): Kaltmiete effektiv − Zins − Tilgung − laufende Bewirtschaftung − Cash einmalig − Steuer
    const laufendeBewirtschaftungCash =
      b.verwaltung + b.versicherung + b.sonstige + b.mietausfallwagnis + b.instandhaltungRuecklage;

    const cashflowVor =
      m.kaltmiete - zinsJ - tilgJ - laufendeBewirtschaftungCash - (ein?.cashAusgabe ?? 0);
    const cashflowNach = cashflowVor - steuerEffekt;
    kumCFNach += cashflowNach;

    cashflow.push({
      jahr,
      einnahmenKaltmiete: m.kaltmiete,
      zins: zinsJ,
      tilgung: tilgJ,
      bewirtschaftung: laufendeBewirtschaftungCash,
      einmaligeAusgaben: ein?.cashAusgabe ?? 0,
      afa: afaJ,
      steuerpflichtigerGewinn,
      steuerEffekt,
      cashflowVorSteuer: cashflowVor,
      cashflowNachSteuer: cashflowNach,
      kumulierterCashflowNachSteuer: kumCFNach,
      restschuldEnde: restschuldJ,
    });
  }

  // ---- KPIs (basierend auf Jahr 1) ----
  const jahr1 = cashflow[0];
  const jahresKaltmiete1 = miete[0]?.bruttoKaltmiete ?? 0;
  const brutto =
    c.kaufkosten.kaufpreis > 0
      ? (jahresKaltmiete1 / c.kaufkosten.kaufpreis) * 100
      : 0;

  const bewirtPA1 = bewirtschaftung[0]?.summe ?? 0;
  const netto =
    gesamtinvestition > 0
      ? ((jahresKaltmiete1 - bewirtPA1) / gesamtinvestition) * 100
      : 0;

  const ekRendite =
    c.finanzierung.eigenkapital > 0
      ? ((jahr1.cashflowNachSteuer + jahr1.tilgung) / c.finanzierung.eigenkapital) * 100
      : 0;

  const breakEven = cashflow.find((z) => z.kumulierterCashflowNachSteuer >= 0)?.jahr ?? null;

  const ekQuote = gesamtinvestition > 0 ? (c.finanzierung.eigenkapital / gesamtinvestition) * 100 : 0;

  const kpi: KpiResult = {
    bruttomietrenditeProzent: brutto,
    nettomietrenditeProzent: netto,
    eigenkapitalrenditeNachSteuernProzent: ekRendite,
    cashflowNachSteuernProMonat: jahr1.cashflowNachSteuer / 12,
    breakEvenJahr: breakEven,
    restschuldNachZinsbindung: tilgung.restschuldNachZinsbindung,
    gesamtinvestition,
    eigenkapitalQuoteProzent: ekQuote,
    kaufpreisFaktor: jahresKaltmiete1 > 0 ? c.kaufkosten.kaufpreis / jahresKaltmiete1 : 0,
    tilgungAnfaenglichProzent: gewichteteTilgungAnfaenglich(c.finanzierung),
  };

  const exit = berechneExit(c, cashflow, grenzsteuer);
  const ampel = bewerteAmpel(c, kpi, cashflow);

  return {
    nebenkosten,
    gesamtinvestition,
    gebaeudewert,
    bodenwert,
    tilgung,
    afa,
    miete,
    bewirtschaftung,
    cashflow,
    kpi,
    exit,
    ampel,
    grenzsteuersatzEffektiv: grenzsteuer,
  };
}

/**
 * Monatlicher Breakdown für Chart 1 ("Trägt sich das selbst?").
 * Basiert auf Jahr 1 / 12. Steuerrücklage = Steuereffekt / 12 (wenn > 0).
 */
export function monatsBreakdownJahr1(result: CaseResult) {
  const j1 = result.cashflow[0];
  return {
    kaltmiete: j1.einnahmenKaltmiete / 12,
    zins: j1.zins / 12,
    tilgung: j1.tilgung / 12,
    bewirtschaftung: j1.bewirtschaftung / 12,
    steuerRuecklage: Math.max(0, j1.steuerEffekt) / 12,
    steuerErstattung: Math.max(0, -j1.steuerEffekt) / 12,
    cashflowVorSteuer: j1.cashflowVorSteuer / 12,
    cashflowNachSteuer: j1.cashflowNachSteuer / 12,
  };
}
