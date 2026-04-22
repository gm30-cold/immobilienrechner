import type { Case, InstandhaltungsEvent, SanierungPosten } from "@/types/case";
import type { BewirtschaftungErgebnisJahr } from "./types";
import { berechneWertaufteilung } from "./nebenkosten";

/**
 * Peterssche Formel (vereinfacht):
 *   Instandhaltung p.a. ≈ 1,5 × Herstellungskosten / 80 Jahre
 *   = Gebäudewert × 0,01875
 *
 * Dies ist eine konservative Annahme und typischerweise höher als die
 * gängige Faustregel von 1%. Wir nutzen den Gebäudewert als Proxy für
 * Herstellungskosten.
 */
export function peterschesche(gebaeudewert: number): number {
  return gebaeudewert * 0.01875;
}

/** Jahresrücklage für Instandhaltung je nach gewähltem Modus. */
export function berechneRuecklageProJahr(c: Case): number {
  const { gebaeudewert } = berechneWertaufteilung(c.kaufkosten);
  if (c.bewirtschaftung.ruecklageModus === "peterssche") {
    return peterschesche(gebaeudewert);
  }
  const prozent = c.bewirtschaftung.ruecklageProzentGebaeudewert ?? 1.0;
  return gebaeudewert * (prozent / 100);
}

/**
 * Verteilt einen Erhaltungsaufwand nach §82b EStDV gleichmäßig auf N Jahre.
 * Gibt ein Array [jahr → abzugsfähiger Betrag] zurück, ab Startjahr 1.
 */
export function verteileErhaltungsaufwand(
  betrag: number,
  verteilungJahre: number,
  startJahr: number,
): Map<number, number> {
  const m = new Map<number, number>();
  if (verteilungJahre <= 1) {
    m.set(startJahr, betrag);
    return m;
  }
  const jeJahr = betrag / verteilungJahre;
  for (let j = 0; j < verteilungJahre; j++) {
    m.set(startJahr + j, jeJahr);
  }
  return m;
}

export interface EinmaligeAufwendungenJahr {
  cashAusgabe: number;           // tatsächlicher Geldabfluss in diesem Jahr
  sofortAbzugsfaehig: number;    // steuerlich sofort oder verteilt (§82b) abzugsfähig
  aktiviertViaAfA: number;       // anschaffungsnah → AfA-Basis, hier nur zur Info
}

/**
 * Bündelt alle einmaligen Ausgaben (Anfangs-Sanierung + Instandhaltungs-Events)
 * in ein Jahres-Bucket. Cash fließt im Ereignis-Jahr, steuerliche Wirkung ggf. verteilt.
 */
export function einmaligeAufwendungenProJahr(c: Case, jahreMax: number): EinmaligeAufwendungenJahr[] {
  const result: EinmaligeAufwendungenJahr[] = Array.from({ length: jahreMax + 1 }, () => ({
    cashAusgabe: 0,
    sofortAbzugsfaehig: 0,
    aktiviertViaAfA: 0,
  }));

  const addPosten = (p: SanierungPosten | InstandhaltungsEvent, jahr: number) => {
    if (jahr < 1 || jahr > jahreMax) return;
    result[jahr].cashAusgabe += p.betrag;
    if (p.typ === "anschaffungsnah") {
      result[jahr].aktiviertViaAfA += p.betrag;
    } else {
      const verteil = p.verteilungJahre ?? 1;
      const m = verteileErhaltungsaufwand(p.betrag, verteil, jahr);
      for (const [j, v] of m) {
        if (j <= jahreMax) result[j].sofortAbzugsfaehig += v;
      }
    }
  };

  // Anfangs-Sanierung fällt in Jahr 1
  for (const p of c.kaufkosten.sanierung) addPosten(p, 1);
  for (const e of c.bewirtschaftung.instandhaltungsEvents) addPosten(e, e.jahr);

  return result;
}

export function berechneBewirtschaftungProJahr(c: Case, jahreMax: number): BewirtschaftungErgebnisJahr[] {
  const einheitenCount = c.stammdaten.einheiten.length;
  const verwaltungPA = c.bewirtschaftung.hausverwaltungProMonatJeEinheit * 12 * einheitenCount;
  const versicherungPA = c.bewirtschaftung.versicherungProJahr;
  const sonstigePA = c.bewirtschaftung.sonstigeKostenProJahr;
  const ruecklagePA = berechneRuecklageProJahr(c);
  const mawProzent = c.bewirtschaftung.mietausfallwagnisProzent / 100;

  const einmaligeJ = einmaligeAufwendungenProJahr(c, jahreMax);
  const jahresKaltmiete = c.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0) * 12;

  return Array.from({ length: jahreMax }, (_, i) => {
    const jahr = i + 1;
    const ein = einmaligeJ[jahr];
    const mietausfallwagnis = jahresKaltmiete * mawProzent;
    return {
      verwaltung: verwaltungPA,
      versicherung: versicherungPA,
      sonstige: sonstigePA,
      mietausfallwagnis,
      instandhaltungRuecklage: ruecklagePA,
      einmaligeAusgaben: ein.cashAusgabe,
      summe:
        verwaltungPA +
        versicherungPA +
        sonstigePA +
        mietausfallwagnis +
        ruecklagePA +
        ein.cashAusgabe,
      sofortAbzugsfaehig:
        verwaltungPA +
        versicherungPA +
        sonstigePA +
        mietausfallwagnis +
        ruecklagePA +
        ein.sofortAbzugsfaehig,
      aktiviertViaAfA: ein.aktiviertViaAfA,
    };
  });
}
