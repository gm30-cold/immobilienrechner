// ---------------------------------------------------------------------------
// Case model — single source of truth for an investment case
// ---------------------------------------------------------------------------

export type Bundesland =
  | "BW" | "BY" | "BE" | "BB" | "HB" | "HH" | "HE" | "MV"
  | "NI" | "NW" | "RP" | "SL" | "SN" | "ST" | "SH" | "TH";

export type Objekttyp = "ETW" | "EFH" | "MFH";

export type EinheitStatus = "vermietet" | "leer" | "eigengenutzt";

export interface Einheit {
  id: string;
  bezeichnung: string;
  qm: number;
  geschoss: number;
  kaltmiete: number; // €/Monat
  status: EinheitStatus;
}

export interface Stammdaten {
  objekttyp: Objekttyp;
  adresse: {
    strasse: string;
    plz: string;
    ort: string;
    bundesland: Bundesland;
  };
  baujahr: number;
  einheiten: Einheit[];
}

export type SanierungTyp = "anschaffungsnah" | "erhaltungsaufwand";

export interface SanierungPosten {
  id: string;
  bezeichnung: string;
  betrag: number;
  typ: SanierungTyp;
  verteilungJahre?: 1 | 2 | 3 | 4 | 5; // §82b EStDV, nur für Erhaltungsaufwand
}

export interface Kaufkosten {
  kaufpreis: number;
  nebenkosten: {
    grunderwerbsteuerProzent: number; // auto aus Bundesland, überschreibbar
    notarProzent: number;              // default 1.5
    grundbuchProzent: number;          // default 0.5
    maklerProzent: number;             // default 3.57 (max. gesetzlich, hälftig)
  };
  sanierung: SanierungPosten[];
  aufteilung: {
    grundProzent: number;    // default 20
    gebaeudeProzent: number; // default 80
  };
}

export interface Darlehen {
  id: string;
  bezeichnung: string; // "Bank-Annuität" | "KfW 261" | "Privatdarlehen"
  betrag: number;
  sollzinsProzent: number;
  tilgungAnfaenglichProzent: number;
  sollzinsbindungJahre: number;
  tilgungsfreieJahre?: number;
  anschlussZinsAnnahmeProzent?: number; // Szenario nach Bindung
}

export interface Finanzierung {
  eigenkapital: number;
  darlehen: Darlehen[]; // max 3 empfohlen
}

export interface InstandhaltungsEvent {
  id: string;
  jahr: number;
  bezeichnung: string;
  betrag: number;
  typ: SanierungTyp;
  verteilungJahre?: 1 | 2 | 3 | 4 | 5;
}

export type RuecklageModus = "peterssche" | "prozent";

export interface Bewirtschaftung {
  ruecklageModus: RuecklageModus;
  ruecklageProzentGebaeudewert?: number; // wenn 'prozent' — default 1.0
  hausverwaltungProMonatJeEinheit: number;
  mietausfallwagnisProzent: number; // default 2
  versicherungProJahr: number;
  sonstigeKostenProJahr: number;
  instandhaltungsEvents: InstandhaltungsEvent[];
}

export type GrenzsteuersatzModus = "bescheid" | "schaetzung" | "direkt";
export type Veranlagung = "einzeln" | "zusammen";

export interface SteuerAnnahmen {
  grenzsteuersatzModus: GrenzsteuersatzModus;
  veranlagung: Veranlagung;
  kirchensteuerSatz: 0 | 0.08 | 0.09;
  // Mode: bescheid
  zvE?: number;
  // Mode: schaetzung
  bruttoEhegatte1?: number;
  bruttoEhegatte2?: number;
  // Mode: direkt
  grenzsteuersatzDirektProzent?: number;
  // Spezielle AfA (optional)
  sonderAfA?: { aktiv: boolean; qualifizierenderBetrag: number }; // §7b EStG
  denkmalAfA?: { aktiv: boolean; qualifizierenderBetrag: number }; // §7i EStG
}

export interface Mietsteigerung {
  baselineProzentPA: number;          // default 1.5
  mieterwechselAlleJahre: number;     // default 7
  marktmieteUpliftProzent: number;    // % über aktueller Miete bei Neuvermietung
  kappungsgrenzeAktiv: boolean;       // prüft §558 BGB (15%/3J oder 20%/3J)
}

export type VerkaufspreisModus = "fixWert" | "wertsteigerungProzent";

export interface ExitAnnahme {
  haltedauerJahre: number;            // default 15
  verkaufspreisModus: VerkaufspreisModus;
  wertsteigerungProzentPA?: number;   // bei 'wertsteigerungProzent'
  verkaufspreisFix?: number;          // bei 'fixWert'
}

export interface SzenarioAnnahmen {
  leerstandProzent: number;           // default 2
  mietsteigerung: Mietsteigerung;
}

export interface Case {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  schemaVersion: 1;
  stammdaten: Stammdaten;
  kaufkosten: Kaufkosten;
  finanzierung: Finanzierung;
  bewirtschaftung: Bewirtschaftung;
  steuer: SteuerAnnahmen;
  exit: ExitAnnahme;
  szenario: SzenarioAnnahmen;
}

// ---------------------------------------------------------------------------
// Berechnungs-Ergebnisse (werden live aus Case abgeleitet, nicht gespeichert)
// ---------------------------------------------------------------------------

export interface KpiSnapshot {
  bruttomietrenditeProzent: number;
  nettomietrenditeProzent: number;
  eigenkapitalrenditeNachSteuernProzent: number;
  cashflowNachSteuernProMonat: number;
  breakEvenJahr: number | null;
  restschuldNachZinsbindung: number;
  gesamtinvestition: number;
  eigenkapitalQuoteProzent: number;
}

export type Ampel = "gruen" | "gelb" | "rot";

export interface AmpelBewertung {
  gesamt: Ampel;
  gruende: { ampel: Ampel; text: string }[];
}
