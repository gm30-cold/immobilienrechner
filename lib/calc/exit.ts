import type { Case } from "@/types/case";
import type { CashflowZeile, ExitResult } from "./types";
import { berechneGesamtinvestition } from "./nebenkosten";
import { berechneAfA } from "./afa";

/**
 * Newton-Bisection-IRR auf Basis jährlicher Cashflows.
 * cashflows[0] = negative EK-Einlage; cashflows[k] = Jahres-CF + ggf. Exit-Erlös im Exit-Jahr.
 */
export function irr(cashflows: number[], guess = 0.05): number | null {
  if (cashflows.length < 2) return null;
  const npv = (r: number) =>
    cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);

  let lo = -0.5;
  let hi = 1.0;
  let fLo = npv(lo);
  let fHi = npv(hi);
  if (fLo * fHi > 0) {
    // Erweitere Range
    for (let i = 0; i < 20 && fLo * fHi > 0; i++) {
      hi *= 1.5;
      fHi = npv(hi);
    }
    if (fLo * fHi > 0) return null;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 0.5) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export function berechneExit(
  c: Case,
  cashflow: CashflowZeile[],
  grenzsteuer: number,
): ExitResult {
  const haltedauer = Math.max(1, Math.min(c.exit.haltedauerJahre, cashflow.length));
  const ekEinlage = c.finanzierung.eigenkapital;

  // Verkaufspreis
  let verkaufspreis: number;
  if (c.exit.verkaufspreisModus === "fixWert") {
    verkaufspreis = c.exit.verkaufspreisFix ?? c.kaufkosten.kaufpreis;
  } else {
    const steigerung = (c.exit.wertsteigerungProzentPA ?? 0) / 100;
    verkaufspreis = c.kaufkosten.kaufpreis * Math.pow(1 + steigerung, haltedauer);
  }

  const restschuldBeiExit = cashflow[haltedauer - 1]?.restschuldEnde ?? 0;

  // Kumulierte AfA im Haltedauer-Zeitraum
  const afa = berechneAfA(c);
  let kumAfA = 0;
  for (let j = 1; j <= haltedauer; j++) kumAfA += afa.proJahr(j);

  // Veräußerungsgewinn (§23 EStG): Verkaufspreis − (Anschaffungskosten + NK − AfA)
  const gesamtinv = berechneGesamtinvestition(c.kaufkosten);
  const buchwert = gesamtinv - kumAfA;
  const veraeusserungsgewinn = verkaufspreis - buchwert;

  // Spekulationssteuer: nur wenn <10 Jahre Haltedauer UND nicht eigengenutzt
  const spekuFaellig = haltedauer < 10 && veraeusserungsgewinn > 0;
  const spekulationssteuer = spekuFaellig ? veraeusserungsgewinn * grenzsteuer : 0;

  const nettoerloes = verkaufspreis - restschuldBeiExit - spekulationssteuer;

  // IRR über Haltedauer
  const flows: number[] = [-ekEinlage];
  for (let j = 0; j < haltedauer; j++) {
    let cf = cashflow[j].cashflowNachSteuer;
    if (j === haltedauer - 1) cf += nettoerloes;
    flows.push(cf);
  }
  const r = irr(flows);
  const irrProzent = r != null ? r * 100 : null;

  return {
    haltedauerJahre: haltedauer,
    verkaufspreis,
    restschuldBeiExit,
    kumulierteAfA: kumAfA,
    veraeusserungsgewinn,
    spekulationssteuerFaellig: spekuFaellig,
    spekulationssteuer,
    nettoerloes,
    irrProzent,
  };
}
