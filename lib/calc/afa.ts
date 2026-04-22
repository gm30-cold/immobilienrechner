import type { Case } from "@/types/case";
import type { AfAErgebnis } from "./types";
import { berechneWertaufteilung } from "./nebenkosten";

/**
 * Linearer AfA-Satz nach Baujahr:
 *   Baujahr ≥ 2023: 3,0% (§7 Abs. 4 Nr. 2a EStG i.d.F. ab 2023)
 *   Baujahr < 1925:  2,5%
 *   Sonst:           2,0%
 */
export function linearerAfASatz(baujahr: number): number {
  if (baujahr >= 2023) return 3.0;
  if (baujahr < 1925) return 2.5;
  return 2.0;
}

/**
 * Sonder-AfA §7b EStG (Mietwohnungsneubau): 5% p.a. über 4 Jahre
 * ZUSÄTZLICH zur linearen AfA. Im Modell bereits qualifizierender Betrag gegeben.
 */
function sonder7bProJahr(qualBetrag: number, jahr: number): number {
  return jahr >= 1 && jahr <= 4 ? qualBetrag * 0.05 : 0;
}

/**
 * Denkmal-AfA §7i EStG (Modernisierungskosten an Baudenkmälern):
 *   Jahr 1-8: 9% p.a.
 *   Jahr 9-12: 7% p.a.
 * Gesamt 100% über 12 Jahre.
 */
function denkmal7iProJahr(qualBetrag: number, jahr: number): number {
  if (jahr >= 1 && jahr <= 8) return qualBetrag * 0.09;
  if (jahr >= 9 && jahr <= 12) return qualBetrag * 0.07;
  return 0;
}

export function berechneAfA(c: Case): AfAErgebnis {
  const { gebaeudewert } = berechneWertaufteilung(c.kaufkosten);
  const satz = linearerAfASatz(c.stammdaten.baujahr);
  const linear = gebaeudewert * (satz / 100);

  const sonderBetrag = c.steuer.sonderAfA?.aktiv
    ? c.steuer.sonderAfA.qualifizierenderBetrag
    : 0;
  const denkmalBetrag = c.steuer.denkmalAfA?.aktiv
    ? c.steuer.denkmalAfA.qualifizierenderBetrag
    : 0;

  const sonder7b = sonderBetrag * 0.05; // Jahr 1 als Referenz
  const denkmal7i = denkmalBetrag * 0.09; // Jahr 1 als Referenz

  return {
    linear,
    sonder7b,
    denkmal7i,
    proJahr: (jahr: number) =>
      linear + sonder7bProJahr(sonderBetrag, jahr) + denkmal7iProJahr(denkmalBetrag, jahr),
  };
}
