// ---------------------------------------------------------------------------
// Ergebnis-Typen des Rechenkerns. Werden live aus dem Case abgeleitet, nie persistiert.
// ---------------------------------------------------------------------------

import type { Ampel } from "@/types/case";

export interface NebenkostenResult {
  grunderwerbsteuer: number;
  notar: number;
  grundbuch: number;
  makler: number;
  summe: number;
  summeProzent: number;
}

export interface TilgungsZeile {
  monat: number;         // 1-basiert vom Start
  jahr: number;          // 1-basiert
  zins: number;          // €
  tilgung: number;       // €
  annuitaet: number;     // €
  restschuld: number;    // am Ende der Periode
  darlehenId: string;
}

export interface TilgungsplanErgebnis {
  zeilen: TilgungsZeile[];        // pro Darlehen und Monat
  aggregiertJahr: {
    jahr: number;
    zins: number;
    tilgung: number;
    annuitaet: number;
    restschuldEnde: number;
  }[];
  restschuldNachZinsbindung: number; // aggregiert, am Ende der längsten Zinsbindung
  laufzeitJahreMax: number;
}

export interface AfAErgebnis {
  linear: number;                  // p.a.
  sonder7b: number;                // p.a. (nur erste 4 Jahre)
  denkmal7i: number;               // p.a. je nach Jahr
  proJahr: (jahr: number) => number;
}

export interface BewirtschaftungErgebnisJahr {
  verwaltung: number;
  versicherung: number;
  sonstige: number;
  mietausfallwagnis: number;
  instandhaltungRuecklage: number;
  einmaligeAusgaben: number;        // anschaffungsnah ODER direkt abzugsfähig
  summe: number;
  // Aufteilung nach steuerlicher Behandlung
  sofortAbzugsfaehig: number;       // Erhaltungsaufwand + laufende Kosten
  aktiviertViaAfA: number;          // anschaffungsnaher Herstellungsaufwand
}

export interface MieteProJahr {
  jahr: number;
  kaltmiete: number;                // effektiv abzüglich Leerstand
  bruttoKaltmiete: number;          // vor Leerstand
  leerstandAbzug: number;
}

export interface CashflowZeile {
  jahr: number;
  einnahmenKaltmiete: number;
  zins: number;
  tilgung: number;
  bewirtschaftung: number;
  einmaligeAusgaben: number;
  afa: number;
  steuerpflichtigerGewinn: number;  // V+V Einkünfte
  steuerEffekt: number;             // + = Mehr-Steuer, − = Erstattung
  cashflowVorSteuer: number;
  cashflowNachSteuer: number;
  kumulierterCashflowNachSteuer: number;
  restschuldEnde: number;
}

export interface KpiResult {
  bruttomietrenditeProzent: number;
  nettomietrenditeProzent: number;
  eigenkapitalrenditeNachSteuernProzent: number;
  cashflowNachSteuernProMonat: number;
  breakEvenJahr: number | null;
  restschuldNachZinsbindung: number;
  gesamtinvestition: number;
  eigenkapitalQuoteProzent: number;
  kaufpreisFaktor: number;          // Kaufpreis / Jahreskaltmiete
  tilgungAnfaenglichProzent: number; // gewichteter Durchschnitt
}

export interface ExitResult {
  haltedauerJahre: number;
  verkaufspreis: number;
  restschuldBeiExit: number;
  kumulierteAfA: number;
  veraeusserungsgewinn: number;
  spekulationssteuerFaellig: boolean;
  spekulationssteuer: number;
  nettoerloes: number;              // Verkaufspreis − Restschuld − Speku
  irrProzent: number | null;
}

export interface AmpelBewertung {
  gesamt: Ampel;
  gruende: { ampel: Ampel; text: string }[];
}

export interface CaseResult {
  nebenkosten: NebenkostenResult;
  gesamtinvestition: number;
  gebaeudewert: number;
  bodenwert: number;
  tilgung: TilgungsplanErgebnis;
  afa: AfAErgebnis;
  miete: MieteProJahr[];
  bewirtschaftung: BewirtschaftungErgebnisJahr[];
  cashflow: CashflowZeile[];
  kpi: KpiResult;
  exit: ExitResult;
  ampel: AmpelBewertung;
  grenzsteuersatzEffektiv: number;   // inkl. Soli + KiSt
}

export interface MonatsBreakdownZeile {
  kaltmiete: number;
  zins: number;
  tilgung: number;
  bewirtschaftung: number;
  steuerRuecklage: number;
  cashflowVorSteuer: number;
  cashflowNachSteuer: number;
}
