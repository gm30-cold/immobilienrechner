import type { Kaufkosten } from "@/types/case";
import type { NebenkostenResult } from "./types";

export function berechneNebenkosten(k: Kaufkosten): NebenkostenResult {
  const p = k.kaufpreis;
  const grunderwerbsteuer = p * (k.nebenkosten.grunderwerbsteuerProzent / 100);
  const notar = p * (k.nebenkosten.notarProzent / 100);
  const grundbuch = p * (k.nebenkosten.grundbuchProzent / 100);
  const makler = p * (k.nebenkosten.maklerProzent / 100);
  const summe = grunderwerbsteuer + notar + grundbuch + makler;
  const summeProzent = p > 0 ? (summe / p) * 100 : 0;

  return { grunderwerbsteuer, notar, grundbuch, makler, summe, summeProzent };
}

/**
 * Gesamtinvestition = Kaufpreis + Nebenkosten + Sanierungsbudget.
 * Sanierungsbudget zählt zur Investitionssumme, unabhängig von steuerlicher Behandlung.
 */
export function berechneGesamtinvestition(k: Kaufkosten): number {
  const nk = berechneNebenkosten(k);
  const sanierung = k.sanierung.reduce((s, p) => s + p.betrag, 0);
  return k.kaufpreis + nk.summe + sanierung;
}

/**
 * Aufteilung Grund / Gebäude. Gebäudewert ist AfA-Basis.
 * Anschaffungsnaher Herstellungsaufwand wird auf Gebäudewert aktiviert.
 */
export function berechneWertaufteilung(k: Kaufkosten): {
  bodenwert: number;
  gebaeudewert: number;
  aktivierteSanierung: number;
} {
  const bodenwert = k.kaufpreis * (k.aufteilung.grundProzent / 100);
  const gebaeudewertBasis = k.kaufpreis * (k.aufteilung.gebaeudeProzent / 100);
  const aktivierteSanierung = k.sanierung
    .filter((p) => p.typ === "anschaffungsnah")
    .reduce((s, p) => s + p.betrag, 0);
  return {
    bodenwert,
    gebaeudewert: gebaeudewertBasis + aktivierteSanierung,
    aktivierteSanierung,
  };
}
