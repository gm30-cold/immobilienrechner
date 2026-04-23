import type { Bundesland, Objekttyp } from "@/types/case";

// ---------------------------------------------------------------------------
// Markt-Benchmark-Datensatz für deutsche Städte und Ballungsraum-Bezirke
// (Stand 2025). Aggregierte Mittelwerte aus öffentlichen Quellen:
// LBS Wohnatlas, Postbank Wohnatlas, Bulwiengesa, JLL/CBRE Marktberichte,
// Gutachterausschuss-Berichte (BORIS-D). Alle Zahlen pro m².
// Lat/Lng: grobe Stadtmitten (OSM-Nominatim-Stichproben).
// ---------------------------------------------------------------------------

export interface MarktDatensatz {
  ort: string;
  bundesland: Bundesland;
  lat: number;
  lng: number;
  miete: { ETW: number; EFH: number; MFH: number };     // €/m² Nettokaltmiete
  kaufpreis: { ETW: number; EFH: number; MFH: number }; // €/m² Kaufpreis
  bodenrichtwert: number;                                // €/m²
  tier: "A" | "B" | "C" | "D";
  einwohner?: number;                                    // grob, in Tausend
}

export const MARKT_DATA: MarktDatensatz[] = [
  // ===================== A-Städte (Top 7 Metropolen) =====================
  { ort: "München", bundesland: "BY", lat: 48.1371, lng: 11.5754, miete: { ETW: 22.0, EFH: 18.0, MFH: 19.0 }, kaufpreis: { ETW: 9800, EFH: 10500, MFH: 9200 }, bodenrichtwert: 4500, tier: "A", einwohner: 1512 },
  { ort: "München-Bogenhausen", bundesland: "BY", lat: 48.1516, lng: 11.6238, miete: { ETW: 24.5, EFH: 22.0, MFH: 21.5 }, kaufpreis: { ETW: 11500, EFH: 13000, MFH: 10800 }, bodenrichtwert: 5800, tier: "A" },
  { ort: "München-Schwabing", bundesland: "BY", lat: 48.1667, lng: 11.5833, miete: { ETW: 24.0, EFH: 21.0, MFH: 21.0 }, kaufpreis: { ETW: 11000, EFH: 12500, MFH: 10500 }, bodenrichtwert: 5500, tier: "A" },
  { ort: "Frankfurt/Main", bundesland: "HE", lat: 50.1109, lng: 8.6821, miete: { ETW: 17.0, EFH: 15.0, MFH: 16.0 }, kaufpreis: { ETW: 7200, EFH: 7800, MFH: 7000 }, bodenrichtwert: 2400, tier: "A", einwohner: 773 },
  { ort: "Frankfurt-Westend", bundesland: "HE", lat: 50.1196, lng: 8.6701, miete: { ETW: 21.0, EFH: 19.0, MFH: 19.5 }, kaufpreis: { ETW: 9200, EFH: 10500, MFH: 8800 }, bodenrichtwert: 3800, tier: "A" },
  { ort: "Hamburg", bundesland: "HH", lat: 53.5511, lng: 9.9937, miete: { ETW: 16.5, EFH: 15.5, MFH: 15.0 }, kaufpreis: { ETW: 6800, EFH: 7200, MFH: 6600 }, bodenrichtwert: 2200, tier: "A", einwohner: 1906 },
  { ort: "Hamburg-Eppendorf", bundesland: "HH", lat: 53.5898, lng: 9.9790, miete: { ETW: 19.5, EFH: 17.5, MFH: 18.0 }, kaufpreis: { ETW: 8800, EFH: 10000, MFH: 8400 }, bodenrichtwert: 3500, tier: "A" },
  { ort: "Berlin", bundesland: "BE", lat: 52.5200, lng: 13.4050, miete: { ETW: 14.0, EFH: 14.0, MFH: 13.5 }, kaufpreis: { ETW: 5800, EFH: 6400, MFH: 5600 }, bodenrichtwert: 1800, tier: "A", einwohner: 3850 },
  { ort: "Berlin-Mitte", bundesland: "BE", lat: 52.5200, lng: 13.4050, miete: { ETW: 18.0, EFH: 16.5, MFH: 16.5 }, kaufpreis: { ETW: 7500, EFH: 8200, MFH: 7200 }, bodenrichtwert: 3200, tier: "A" },
  { ort: "Berlin-Prenzlauer Berg", bundesland: "BE", lat: 52.5386, lng: 13.4234, miete: { ETW: 17.5, EFH: 16.0, MFH: 16.0 }, kaufpreis: { ETW: 7200, EFH: 8000, MFH: 7000 }, bodenrichtwert: 2900, tier: "A" },
  { ort: "Berlin-Charlottenburg", bundesland: "BE", lat: 52.5159, lng: 13.3045, miete: { ETW: 17.0, EFH: 16.0, MFH: 15.5 }, kaufpreis: { ETW: 6900, EFH: 7600, MFH: 6700 }, bodenrichtwert: 2600, tier: "A" },
  { ort: "Stuttgart", bundesland: "BW", lat: 48.7758, lng: 9.1829, miete: { ETW: 16.0, EFH: 14.5, MFH: 15.0 }, kaufpreis: { ETW: 6400, EFH: 7000, MFH: 6200 }, bodenrichtwert: 2100, tier: "A", einwohner: 634 },
  { ort: "Düsseldorf", bundesland: "NW", lat: 51.2277, lng: 6.7735, miete: { ETW: 15.0, EFH: 13.5, MFH: 14.0 }, kaufpreis: { ETW: 6200, EFH: 6800, MFH: 6000 }, bodenrichtwert: 2000, tier: "A", einwohner: 629 },
  { ort: "Düsseldorf-Oberkassel", bundesland: "NW", lat: 51.2330, lng: 6.7450, miete: { ETW: 18.0, EFH: 16.5, MFH: 16.5 }, kaufpreis: { ETW: 7800, EFH: 8800, MFH: 7500 }, bodenrichtwert: 3000, tier: "A" },
  { ort: "Köln", bundesland: "NW", lat: 50.9375, lng: 6.9603, miete: { ETW: 14.0, EFH: 13.0, MFH: 13.5 }, kaufpreis: { ETW: 5400, EFH: 6000, MFH: 5200 }, bodenrichtwert: 1700, tier: "A", einwohner: 1085 },

  // ===================== B-Städte (Regionalzentren) =====================
  { ort: "Nürnberg", bundesland: "BY", lat: 49.4521, lng: 11.0767, miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1400, tier: "B", einwohner: 518 },
  { ort: "Hannover", bundesland: "NI", lat: 52.3759, lng: 9.7320, miete: { ETW: 11.0, EFH: 11.0, MFH: 10.5 }, kaufpreis: { ETW: 3600, EFH: 4200, MFH: 3400 }, bodenrichtwert: 1000, tier: "B", einwohner: 538 },
  { ort: "Bremen", bundesland: "HB", lat: 53.0793, lng: 8.8017, miete: { ETW: 10.0, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 900, tier: "B", einwohner: 570 },
  { ort: "Dresden", bundesland: "SN", lat: 51.0504, lng: 13.7373, miete: { ETW: 10.0, EFH: 11.0, MFH: 9.5 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 900, tier: "B", einwohner: 556 },
  { ort: "Leipzig", bundesland: "SN", lat: 51.3397, lng: 12.3731, miete: { ETW: 9.0, EFH: 10.0, MFH: 9.0 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "B", einwohner: 617 },
  { ort: "Bonn", bundesland: "NW", lat: 50.7374, lng: 7.0982, miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 5000, EFH: 5600, MFH: 4800 }, bodenrichtwert: 1600, tier: "B", einwohner: 336 },
  { ort: "Wiesbaden", bundesland: "HE", lat: 50.0826, lng: 8.2400, miete: { ETW: 14.0, EFH: 13.5, MFH: 13.5 }, kaufpreis: { ETW: 5400, EFH: 6000, MFH: 5200 }, bodenrichtwert: 1700, tier: "B", einwohner: 283 },
  { ort: "Münster", bundesland: "NW", lat: 51.9607, lng: 7.6261, miete: { ETW: 13.0, EFH: 12.0, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1500, tier: "B", einwohner: 320 },
  { ort: "Karlsruhe", bundesland: "BW", lat: 49.0069, lng: 8.4037, miete: { ETW: 12.0, EFH: 11.5, MFH: 11.5 }, kaufpreis: { ETW: 4400, EFH: 5000, MFH: 4200 }, bodenrichtwert: 1300, tier: "B", einwohner: 308 },
  { ort: "Freiburg", bundesland: "BW", lat: 47.9990, lng: 7.8421, miete: { ETW: 15.0, EFH: 14.0, MFH: 14.0 }, kaufpreis: { ETW: 5800, EFH: 6400, MFH: 5600 }, bodenrichtwert: 1800, tier: "B", einwohner: 237 },
  { ort: "Heidelberg", bundesland: "BW", lat: 49.3988, lng: 8.6724, miete: { ETW: 15.0, EFH: 14.5, MFH: 14.5 }, kaufpreis: { ETW: 6000, EFH: 6600, MFH: 5800 }, bodenrichtwert: 1900, tier: "B", einwohner: 162 },
  { ort: "Regensburg", bundesland: "BY", lat: 49.0134, lng: 12.1016, miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1500, tier: "B", einwohner: 153 },
  { ort: "Mainz", bundesland: "RP", lat: 49.9929, lng: 8.2473, miete: { ETW: 13.0, EFH: 12.0, MFH: 12.5 }, kaufpreis: { ETW: 4600, EFH: 5200, MFH: 4400 }, bodenrichtwert: 1400, tier: "B", einwohner: 218 },
  { ort: "Darmstadt", bundesland: "HE", lat: 49.8728, lng: 8.6512, miete: { ETW: 13.5, EFH: 13.0, MFH: 13.0 }, kaufpreis: { ETW: 5000, EFH: 5600, MFH: 4800 }, bodenrichtwert: 1500, tier: "B", einwohner: 160 },
  { ort: "Augsburg", bundesland: "BY", lat: 48.3705, lng: 10.8978, miete: { ETW: 12.5, EFH: 12.0, MFH: 12.0 }, kaufpreis: { ETW: 4600, EFH: 5200, MFH: 4400 }, bodenrichtwert: 1300, tier: "B", einwohner: 296 },
  { ort: "Mannheim", bundesland: "BW", lat: 49.4875, lng: 8.4660, miete: { ETW: 11.0, EFH: 10.5, MFH: 10.5 }, kaufpreis: { ETW: 3800, EFH: 4400, MFH: 3600 }, bodenrichtwert: 1100, tier: "B", einwohner: 311 },
  { ort: "Potsdam", bundesland: "BB", lat: 52.3906, lng: 13.0645, miete: { ETW: 13.0, EFH: 13.0, MFH: 12.5 }, kaufpreis: { ETW: 5000, EFH: 5800, MFH: 4800 }, bodenrichtwert: 1600, tier: "B", einwohner: 185 },
  { ort: "Ingolstadt", bundesland: "BY", lat: 48.7665, lng: 11.4258, miete: { ETW: 12.5, EFH: 12.0, MFH: 12.0 }, kaufpreis: { ETW: 4500, EFH: 5100, MFH: 4300 }, bodenrichtwert: 1200, tier: "B" },
  { ort: "Erlangen", bundesland: "BY", lat: 49.5896, lng: 11.0078, miete: { ETW: 13.5, EFH: 12.5, MFH: 13.0 }, kaufpreis: { ETW: 4900, EFH: 5500, MFH: 4700 }, bodenrichtwert: 1400, tier: "B" },
  { ort: "Rosenheim", bundesland: "BY", lat: 47.8562, lng: 12.1250, miete: { ETW: 13.0, EFH: 13.0, MFH: 12.0 }, kaufpreis: { ETW: 5200, EFH: 5800, MFH: 5000 }, bodenrichtwert: 1400, tier: "B" },

  // ===================== C-Städte (Mittelzentren) =====================
  { ort: "Dortmund", bundesland: "NW", lat: 51.5136, lng: 7.4653, miete: { ETW: 9.0, EFH: 9.5, MFH: 9.0 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C", einwohner: 586 },
  { ort: "Essen", bundesland: "NW", lat: 51.4556, lng: 7.0116, miete: { ETW: 9.0, EFH: 9.5, MFH: 9.0 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C", einwohner: 583 },
  { ort: "Bochum", bundesland: "NW", lat: 51.4818, lng: 7.2162, miete: { ETW: 8.5, EFH: 9.0, MFH: 8.0 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 650, tier: "C", einwohner: 365 },
  { ort: "Kiel", bundesland: "SH", lat: 54.3233, lng: 10.1228, miete: { ETW: 10.5, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 900, tier: "C", einwohner: 247 },
  { ort: "Lübeck", bundesland: "SH", lat: 53.8655, lng: 10.6866, miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "C", einwohner: 217 },
  { ort: "Rostock", bundesland: "MV", lat: 54.0887, lng: 12.1403, miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 800, tier: "C", einwohner: 210 },
  { ort: "Paderborn", bundesland: "NW", lat: 51.7189, lng: 8.7575, miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 3000, EFH: 3600, MFH: 2800 }, bodenrichtwert: 700, tier: "C" },
  { ort: "Osnabrück", bundesland: "NI", lat: 52.2799, lng: 8.0472, miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3200, EFH: 3800, MFH: 3000 }, bodenrichtwert: 850, tier: "C" },
  { ort: "Erfurt", bundesland: "TH", lat: 50.9848, lng: 11.0299, miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 600, tier: "C", einwohner: 215 },
  { ort: "Aachen", bundesland: "NW", lat: 50.7753, lng: 6.0839, miete: { ETW: 11.5, EFH: 11.0, MFH: 11.0 }, kaufpreis: { ETW: 3800, EFH: 4400, MFH: 3600 }, bodenrichtwert: 950, tier: "C" },
  { ort: "Braunschweig", bundesland: "NI", lat: 52.2689, lng: 10.5268, miete: { ETW: 10.5, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 850, tier: "C" },
  { ort: "Göttingen", bundesland: "NI", lat: 51.5413, lng: 9.9158, miete: { ETW: 10.5, EFH: 10.5, MFH: 10.0 }, kaufpreis: { ETW: 3400, EFH: 4000, MFH: 3200 }, bodenrichtwert: 850, tier: "C" },
  { ort: "Ulm", bundesland: "BW", lat: 48.4011, lng: 9.9876, miete: { ETW: 12.0, EFH: 11.5, MFH: 11.5 }, kaufpreis: { ETW: 4200, EFH: 4800, MFH: 4000 }, bodenrichtwert: 1200, tier: "C" },
  { ort: "Tübingen", bundesland: "BW", lat: 48.5216, lng: 9.0576, miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 4800, EFH: 5400, MFH: 4600 }, bodenrichtwert: 1400, tier: "C" },
  { ort: "Konstanz", bundesland: "BW", lat: 47.6603, lng: 9.1758, miete: { ETW: 13.0, EFH: 12.5, MFH: 12.5 }, kaufpreis: { ETW: 5000, EFH: 5600, MFH: 4800 }, bodenrichtwert: 1500, tier: "C" },
  { ort: "Oldenburg", bundesland: "NI", lat: 53.1435, lng: 8.2146, miete: { ETW: 10.0, EFH: 10.0, MFH: 9.5 }, kaufpreis: { ETW: 3300, EFH: 3900, MFH: 3100 }, bodenrichtwert: 800, tier: "C" },
  { ort: "Saarbrücken", bundesland: "SL", lat: 49.2401, lng: 6.9969, miete: { ETW: 9.0, EFH: 9.5, MFH: 8.5 }, kaufpreis: { ETW: 2800, EFH: 3400, MFH: 2600 }, bodenrichtwert: 600, tier: "C", einwohner: 181 },

  // ===================== D-Städte (günstig, Cashflow-Lagen) =====================
  { ort: "Duisburg", bundesland: "NW", lat: 51.4344, lng: 6.7623, miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2400, EFH: 3000, MFH: 2200 }, bodenrichtwert: 500, tier: "D", einwohner: 498 },
  { ort: "Gelsenkirchen", bundesland: "NW", lat: 51.5177, lng: 7.0857, miete: { ETW: 6.5, EFH: 7.0, MFH: 6.0 }, kaufpreis: { ETW: 1800, EFH: 2400, MFH: 1600 }, bodenrichtwert: 350, tier: "D" },
  { ort: "Magdeburg", bundesland: "ST", lat: 52.1205, lng: 11.6276, miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2200, EFH: 2800, MFH: 2000 }, bodenrichtwert: 400, tier: "D", einwohner: 237 },
  { ort: "Halle/Saale", bundesland: "ST", lat: 51.4969, lng: 11.9688, miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2200, EFH: 2800, MFH: 2000 }, bodenrichtwert: 400, tier: "D", einwohner: 239 },
  { ort: "Chemnitz", bundesland: "SN", lat: 50.8279, lng: 12.9214, miete: { ETW: 7.0, EFH: 7.5, MFH: 6.5 }, kaufpreis: { ETW: 2000, EFH: 2600, MFH: 1800 }, bodenrichtwert: 350, tier: "D", einwohner: 243 },
  { ort: "Hamm", bundesland: "NW", lat: 51.6806, lng: 7.8142, miete: { ETW: 7.5, EFH: 8.0, MFH: 7.0 }, kaufpreis: { ETW: 2200, EFH: 2800, MFH: 2000 }, bodenrichtwert: 450, tier: "D" },
  { ort: "Mülheim/Ruhr", bundesland: "NW", lat: 51.4184, lng: 6.8710, miete: { ETW: 8.0, EFH: 8.5, MFH: 7.5 }, kaufpreis: { ETW: 2600, EFH: 3200, MFH: 2400 }, bodenrichtwert: 600, tier: "D" },
  { ort: "Cottbus", bundesland: "BB", lat: 51.7563, lng: 14.3329, miete: { ETW: 7.0, EFH: 7.5, MFH: 6.5 }, kaufpreis: { ETW: 2000, EFH: 2600, MFH: 1800 }, bodenrichtwert: 350, tier: "D" },
  { ort: "Kassel", bundesland: "HE", lat: 51.3127, lng: 9.4797, miete: { ETW: 9.5, EFH: 9.5, MFH: 9.0 }, kaufpreis: { ETW: 2900, EFH: 3500, MFH: 2700 }, bodenrichtwert: 700, tier: "D", einwohner: 203 },
];

// ---------------------------------------------------------------------------

export function benchmarkBruttorendite(d: MarktDatensatz, typ: Objekttyp): number {
  return (d.miete[typ] * 12 / d.kaufpreis[typ]) * 100;
}

export function bundesMittel(typ: Objekttyp) {
  const n = MARKT_DATA.length;
  const miete = MARKT_DATA.reduce((s, d) => s + d.miete[typ], 0) / n;
  const kaufpreis = MARKT_DATA.reduce((s, d) => s + d.kaufpreis[typ], 0) / n;
  const bodenrichtwert = MARKT_DATA.reduce((s, d) => s + d.bodenrichtwert, 0) / n;
  const bruttorendite = (miete * 12 / kaufpreis) * 100;
  return { miete, kaufpreis, bodenrichtwert, bruttorendite };
}

/** Findet den Datensatz mit geringster geografischer Distanz (Haversine). */
export function nearestDatensatz(lat: number, lng: number): { d: MarktDatensatz; distanceKm: number } {
  let best: MarktDatensatz = MARKT_DATA[0];
  let bestDist = Infinity;
  for (const d of MARKT_DATA) {
    const dist = haversine(lat, lng, d.lat, d.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return { d: best, distanceKm: bestDist };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
