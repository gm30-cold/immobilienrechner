// ---------------------------------------------------------------------------
// PLZ-Datensatz (geonames.org DE, 9856 Einträge).
// Lazy-geladen aus /data/plz.json zur Build-Zeit nicht in den Bundle-Code eingebaut.
// ---------------------------------------------------------------------------

import type { Bundesland } from "@/types/case";
import { withBasePath } from "@/lib/basePath";

export interface PlzEntry {
  plz: string;
  ort: string;
  bundesland: Bundesland;
  lat: number;
  lng: number;
}

interface PlzFile {
  version: number;
  source: string;
  generated: string;
  format: string[];
  count: number;
  entries: [string, string, Bundesland, number, number][];
}

let cachedEntries: PlzEntry[] | null = null;
let loadingPromise: Promise<PlzEntry[]> | null = null;

export async function loadPlzDataset(): Promise<PlzEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const res = await fetch(withBasePath("/data/plz.json"));
    if (!res.ok) throw new Error("PLZ-Daten konnten nicht geladen werden");
    const json = (await res.json()) as PlzFile;
    const entries = json.entries.map(([plz, ort, bundesland, lat, lng]) => ({
      plz,
      ort,
      bundesland,
      lat,
      lng,
    }));
    cachedEntries = entries;
    return entries;
  })();

  return loadingPromise;
}

export async function findByPlz(plz: string): Promise<PlzEntry | null> {
  const entries = await loadPlzDataset();
  return entries.find((e) => e.plz === plz) ?? null;
}

export async function findByPlzPrefix(prefix: string, limit = 10): Promise<PlzEntry[]> {
  const entries = await loadPlzDataset();
  return entries.filter((e) => e.plz.startsWith(prefix)).slice(0, limit);
}

export async function findByOrt(query: string, limit = 10): Promise<PlzEntry[]> {
  const entries = await loadPlzDataset();
  const q = query.toLowerCase();
  return entries.filter((e) => e.ort.toLowerCase().includes(q)).slice(0, limit);
}

/** Cached getter für schon geladene Daten (synchron). */
export function getCachedPlz(): PlzEntry[] | null {
  return cachedEntries;
}
