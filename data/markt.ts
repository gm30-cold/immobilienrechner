import type { Bundesland, Objekttyp } from "@/types/case";

// ---------------------------------------------------------------------------
// Markt-Benchmark-Datensatz für ~40 deutsche Städte (Stand 2025).
// Werte sind aggregierte Mittelwerte aus öffentlich berichteten Quellen:
// LBS Wohnatlas, Bulwiengesa, JLL/CBRE Marktberichte, Statista, Postbank
// Wohnatlas, Gutachterausschuss-Berichte. Für lagegenaue Einschätzung
// immer den aktuellen örtlichen Bodenrichtwert (BORIS-D) und Mietspiegel prüfen.
// Zahlen sind pro m².
// ---------------------------------------------------------------------------

export interface MarktDatensatz {
  ort: string;
  bundesland: Bundesland;
  miete: { ETW: number; EFH: number; MFH: number };     // €/m² Nettokaltmiete
  kaufpreis: { ETW: number; EFH: number; MFH: number }; // €/m² Kaufpreis
  bodenrichtwert: number;                                // €/m² (mittlerer Lagenwert)
  tier: "A" | "B" | "C" | "D";                           // A-Städte, B, C, D
}

export const MARKT_DATA: MarktDatensatz[] = [
  // A-Städte (Top 7 Metropolen)
  { ort: "München", bundesland: "BY", miete: { ETW: 22.0, EFH: 18.0, MFH: 19.0 }, kaufpreis: { ETW: 9800, EFH: 10500, MFH: 9200 }, bodenrichtwert: 4500, tier: "A" },
  { ort: "Frankfurt/Main", bundesland: "HE", miete: { ETW: 17.0, EFH: 15.0, MFH: 16.0 }, kaufpreis: { ETW: 7200, EFH: 7800, MFH: 7000 }, bodenrichtwert: 2400, tier: "A" },
  { ort: "Hamburg", bundesland: "HH", miete: { ETW: 16.5, EFH: 15.5, MFH: 15.0 }, kaufpreis: { ETW: 6800, EFH: 7200, MFH: 6600 }, bodenrichtwert: 2200, tier: "A" },
  { ort: "Berlin", bundesland: "BE", miete: { ETW: 14.0, EFH: 14.0, MFH: 13.5 }, kaufpreis: { ETW: 5800, EFH: 6400, MFH: 5600 }, bodenrichtwert: 1800, tier: "A" },
  { ort: "Stuttgart", bundesland: "BW", miete: { ETW: 16.0, EFH: 14.5, MFH: 15.0 }, kaufpreis: { ETW: 6400, EFH: 7000, MFH: 6200 }, bodenrichtwert: 2100, tier: "A" },
  { ort: "Düsseldorf", bundesland: "NW", miete: { ETW: 15.0, EFH: 13.5, MFH: 14.0 }, kaufpreis: { ETW: 6200, EFH: 6800, MFH: 6000 }, bodenrichtwert: 2000, tier: "A" },
  { ort: "Köln", bundesland: "NW", miete: { ETW: 14.0, EFH: 13.0, MFH: 13.5 }, kaufpreis: { ETW: 5400, EFH: 6000, MFH: 5200 }, bodenrichtwert: 1700, tier: "A" },

  // B-Städte (Regionale Zentren)
  { ort: "Nürnberg", bundesland: "BY", miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1400, tier: "B" },
  { ort: "Hannover", bundesland: "NI", miete: { ETW: 11.0, EFH: 11.0, MFH: 10.5 }, kaufpreis: { ETW: 3600, EFH: 4200, MFH: 3400 }, bodenrichtwert: 1000, tier: "B" },
  { ort: "Bremen", bundesland: "HB", miete: { ETW: 10.0, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 900, tier: "B" },
  { ort: "Dresden", bundesland: "SN", miete: { ETW: 10.0, EFH: 11.0, MFH: 9.5 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 900, tier: "B" },
  { ort: "Leipzig", bundesland: "SN", miete: { ETW: 9.0, EFH: 10.0, MFH: 9.0 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "B" },
  { ort: "Bonn", bundesland: "NW", miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 5000, EFH: 5600, MFH: 4800 }, bodenrichtwert: 1600, tier: "B" },
  { ort: "Wiesbaden", bundesland: "HE", miete: { ETW: 14.0, EFH: 13.5, MFH: 13.5 }, kaufpreis: { ETW: 5400, EFH: 6000, MFH: 5200 }, bodenrichtwert: 1700, tier: "B" },
  { ort: "Münster", bundesland: "NW", miete: { ETW: 13.0, EFH: 12.0, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1500, tier: "B" },
  { ort: "Karlsruhe", bundesland: "BW", miete: { ETW: 12.0, EFH: 11.5, MFH: 11.5 }, kaufpreis: { ETW: 4400, EFH: 5000, MFH: 4200 }, bodenrichtwert: 1300, tier: "B" },

  // Universitätsstädte & Premium
  { ort: "Freiburg", bundesland: "BW", miete: { ETW: 15.0, EFH: 14.0, MFH: 14.0 }, kaufpreis: { ETW: 5800, EFH: 6400, MFH: 5600 }, bodenrichtwert: 1800, tier: "B" },
  { ort: "Heidelberg", bundesland: "BW", miete: { ETW: 15.0, EFH: 14.5, MFH: 14.5 }, kaufpreis: { ETW: 6000, EFH: 6600, MFH: 5800 }, bodenrichtwert: 1900, tier: "B" },
  { ort: "Regensburg", bundesland: "BY", miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1500, tier: "B" },
  { ort: "Mainz", bundesland: "RP", miete: { ETW: 13.0, EFH: 12.0, MFH: 12.5 }, kaufpreis: { ETW: 4600, EFH: 5200, MFH: 4400 }, bodenrichtwert: 1400, tier: "B" },
  { ort: "Darmstadt", bundesland: "HE", miete: { ETW: 13.5, EFH: 13.0, MFH: 13.0 }, kaufpreis: { ETW: 5000, EFH: 5600, MFH: 4800 }, bodenrichtwert: 1500, tier: "B" },
  { ort: "Augsburg", bundesland: "BY", miete: { ETW: 12.5, EFH: 12.0, MFH: 12.0 }, kaufpreis: { ETW: 4600, EFH: 5200, MFH: 4400 }, bodenrichtwert: 1300, tier: "B" },
  { ort: "Mannheim", bundesland: "BW", miete: { ETW: 11.0, EFH: 10.5, MFH: 10.5 }, kaufpreis: { ETW: 3800, EFH: 4400, MFH: 3600 }, bodenrichtwert: 1100, tier: "B" },

  // C-Städte (Mittelzentren)
  { ort: "Dortmund", bundesland: "NW", miete: { ETW: 9.0, EFH: 9.5, MFH: 9.0 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C" },
  { ort: "Essen", bundesland: "NW", miete: { ETW: 9.0, EFH: 9.5, MFH: 9.0 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C" },
  { ort: "Bochum", bundesland: "NW", miete: { ETW: 8.5, EFH: 9.0, MFH: 8.0 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 650, tier: "C" },
  { ort: "Kiel", bundesland: "SH", miete: { ETW: 10.5, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 900, tier: "C" },
  { ort: "Lübeck", bundesland: "SH", miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "C" },
  { ort: "Rostock", bundesland: "MV", miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "C" },
  { ort: "Paderborn", bundesland: "NW", miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C" },
  { ort: "Osnabrück", bundesland: "NI", miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 850, tier: "C" },
  { ort: "Erfurt", bundesland: "TH", miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 600, tier: "C" },

  // D-Städte (günstig, oft mit hoher Rendite)
  { ort: "Duisburg", bundesland: "NW", miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2400, EFH: 3000, MFH: 2200 }, bodenrichtwert: 500, tier: "D" },
  { ort: "Gelsenkirchen", bundesland: "NW", miete: { ETW: 6.5, EFH: 7.0, MFH: 6.0 }, kaufpreis: { ETW: 1800, EFH: 2400, MFH: 1600 }, bodenrichtwert: 350, tier: "D" },
  { ort: "Magdeburg", bundesland: "ST", miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2200, EFH: 2800, MFH: 2000 }, bodenrichtwert: 400, tier: "D" },
  { ort: "Halle/Saale", bundesland: "ST", miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2200, EFH: 2800, MFH: 2000 }, bodenrichtwert: 400, tier: "D" },
  { ort: "Chemnitz", bundesland: "SN", miete: { ETW: 7.0, EFH: 7.5, MFH: 6.5 }, kaufpreis: { ETW: 2000, EFH: 2600, MFH: 1800 }, bodenrichtwert: 350, tier: "D" },
  { ort: "Saarbrücken", bundesland: "SL", miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 600, tier: "D" },
];

// Berechne Bruttomietrendite-Benchmark für Kombination Ort/Objekttyp
export function benchmarkBruttorendite(d: MarktDatensatz, typ: Objekttyp): number {
  return (d.miete[typ] * 12 / d.kaufpreis[typ]) * 100;
}

// Gesamter Datensatz-Mittelwert je Metric / Typ — für Durchschnittslinie
export function bundesMittel(typ: Objekttyp) {
  const n = MARKT_DATA.length;
  const miete = MARKT_DATA.reduce((s, d) => s + d.miete[typ], 0) / n;
  const kaufpreis = MARKT_DATA.reduce((s, d) => s + d.kaufpreis[typ], 0) / n;
  const bodenrichtwert = MARKT_DATA.reduce((s, d) => s + d.bodenrichtwert, 0) / n;
  const bruttorendite = (miete * 12 / kaufpreis) * 100;
  return { miete, kaufpreis, bodenrichtwert, bruttorendite };
}
