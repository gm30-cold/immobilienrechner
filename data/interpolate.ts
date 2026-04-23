import type { Objekttyp } from "@/types/case";
import { MARKT_DATA, type MarktDatensatz } from "./markt";

// ---------------------------------------------------------------------------
// Inverse-Distance-Weighting (IDW) Interpolation.
// Für eine beliebige Koordinate werden die K nächsten Städte unseres curated
// Datasets gefunden und ihre Werte mit 1/d² gewichtet gemittelt.
// ---------------------------------------------------------------------------

const K_NEAREST = 4;

export interface InterpolatedValues {
  miete: { ETW: number; EFH: number; MFH: number };
  kaufpreis: { ETW: number; EFH: number; MFH: number };
  bodenrichtwert: number;
  bruttorendite: { ETW: number; EFH: number; MFH: number };
  /** Referenzstädte, aus denen interpoliert wurde, mit Gewichtung */
  quellen: { ort: string; distanceKm: number; weight: number }[];
  /** Maximale Distanz zur nächsten Quelle — gibt Hinweis auf Genauigkeit */
  nearestDistanceKm: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function interpolateValues(lat: number, lng: number, k = K_NEAREST): InterpolatedValues {
  // Berechne Distanzen zu allen Markt-Datensätzen
  const withDist = MARKT_DATA.map((d) => ({
    d,
    distanceKm: haversineKm(lat, lng, d.lat, d.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = withDist.slice(0, k);
  const nearestDistanceKm = nearest[0].distanceKm;

  // IDW: wenn exakt auf Datensatz → deren Werte nehmen
  if (nearestDistanceKm < 0.5) {
    const d = nearest[0].d;
    return {
      miete: d.miete,
      kaufpreis: d.kaufpreis,
      bodenrichtwert: d.bodenrichtwert,
      bruttorendite: {
        ETW: (d.miete.ETW * 12 / d.kaufpreis.ETW) * 100,
        EFH: (d.miete.EFH * 12 / d.kaufpreis.EFH) * 100,
        MFH: (d.miete.MFH * 12 / d.kaufpreis.MFH) * 100,
      },
      quellen: [{ ort: d.ort, distanceKm: 0, weight: 1 }],
      nearestDistanceKm: 0,
    };
  }

  // IDW mit 1/d²
  const weights = nearest.map(({ distanceKm }) => 1 / (distanceKm * distanceKm));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const normalized = weights.map((w) => w / sumW);

  const mix = (getVal: (d: MarktDatensatz) => number) =>
    nearest.reduce((s, n, i) => s + getVal(n.d) * normalized[i], 0);

  const miete = {
    ETW: mix((d) => d.miete.ETW),
    EFH: mix((d) => d.miete.EFH),
    MFH: mix((d) => d.miete.MFH),
  };
  const kaufpreis = {
    ETW: mix((d) => d.kaufpreis.ETW),
    EFH: mix((d) => d.kaufpreis.EFH),
    MFH: mix((d) => d.kaufpreis.MFH),
  };

  return {
    miete,
    kaufpreis,
    bodenrichtwert: mix((d) => d.bodenrichtwert),
    bruttorendite: {
      ETW: (miete.ETW * 12 / kaufpreis.ETW) * 100,
      EFH: (miete.EFH * 12 / kaufpreis.EFH) * 100,
      MFH: (miete.MFH * 12 / kaufpreis.MFH) * 100,
    },
    quellen: nearest.map((n, i) => ({
      ort: n.d.ort,
      distanceKm: n.distanceKm,
      weight: normalized[i],
    })),
    nearestDistanceKm,
  };
}

/** Qualitätsstufe basierend auf Entfernung zur nächsten Quelle. */
export function interpolationQualitaet(nearestKm: number): {
  level: "hoch" | "mittel" | "niedrig";
  label: string;
  note: string;
} {
  if (nearestKm < 10) {
    return {
      level: "hoch",
      label: "Hohe Genauigkeit",
      note: `Nächste Referenz nur ${nearestKm.toFixed(0)} km entfernt`,
    };
  }
  if (nearestKm < 40) {
    return {
      level: "mittel",
      label: "Mittlere Genauigkeit",
      note: `Nächste Referenz ${nearestKm.toFixed(0)} km entfernt — Werte sind Mittelwert aus mehreren Städten`,
    };
  }
  return {
    level: "niedrig",
    label: "Grobe Schätzung",
    note: `Nächste Referenz ${nearestKm.toFixed(0)} km entfernt — für konkrete Einschätzung lokale Quellen nutzen`,
  };
}
