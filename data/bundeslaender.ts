import type { Bundesland } from "@/types/case";

// Grunderwerbsteuer-Sätze Stand 2026. Werden vom Landesgesetzgeber festgesetzt.
// Bei Änderungen hier anpassen.
export const GRUNDERWERBSTEUER: Record<Bundesland, number> = {
  BW: 5.0,
  BY: 3.5,
  BE: 6.0,
  BB: 6.5,
  HB: 5.0,
  HH: 5.5,
  HE: 6.0,
  MV: 6.0,
  NI: 5.0,
  NW: 6.5,
  RP: 5.0,
  SL: 6.5,
  SN: 5.5,
  ST: 5.0,
  SH: 6.5,
  TH: 5.0,
};

export const BUNDESLAND_LABEL: Record<Bundesland, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export const BUNDESLAENDER: Bundesland[] = [
  "BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV",
  "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH",
];

// Standard-Nebenkostensätze — konservative Defaults, im UI überschreibbar.
export const DEFAULT_NEBENKOSTEN = {
  notarProzent: 1.5,
  grundbuchProzent: 0.5,
  maklerProzentKaeufer: 3.57, // gesetzliche Obergrenze (hälftig seit 2020)
} as const;
