import type { Bundesland } from "@/types/case";

// ---------------------------------------------------------------------------
// Öffentliche Bodenrichtwerte-WMS-Endpoints.
// Jedes Bundesland betreibt seine eigenen Geodienste — URLs ändern sich.
// Nur bei Stand dieser Datei als funktionierend verifizierte Endpoints sind
// hier aufgeführt. User können weitere in der UI ergänzen.
// ---------------------------------------------------------------------------

export interface BorisWmsLayer {
  id: string;
  label: string;
  bundesland: Bundesland | "DE";
  url: string;
  layer: string;
  /** Standard-Crs für MapLibre (EPSG:3857 = Web Mercator). */
  crs: string;
  /** CORS verfügbar? Wenn nicht, Browser-Zugriff blockiert. */
  cors: boolean;
  /** Empfohlener Min-Zoom, ab dem die Layer sinnvoll dargestellt wird. */
  minZoom?: number;
  attribution: string;
  sourceUrl?: string;
  note?: string;
}

export const BORIS_WMS_LAYERS: BorisWmsLayer[] = [
  {
    id: "hh_brw_zonen_2025",
    label: "Hamburg — Bodenrichtwertzonen 2025",
    bundesland: "HH",
    url: "https://geodienste.hamburg.de/HH_WMS_Bodenrichtwerte",
    layer: "lgv_brw_zonen_2025",
    crs: "EPSG:3857",
    cors: true,
    attribution: "© Freie und Hansestadt Hamburg, LGV · dl-by-de/2.0",
    sourceUrl: "https://www.geoportal-hamburg.de/",
  },
  {
    id: "hh_brw_zonen_2024",
    label: "Hamburg — Bodenrichtwertzonen 2024",
    bundesland: "HH",
    url: "https://geodienste.hamburg.de/HH_WMS_Bodenrichtwerte",
    layer: "lgv_brw_zonen_2024",
    crs: "EPSG:3857",
    cors: true,
    attribution: "© Freie und Hansestadt Hamburg, LGV · dl-by-de/2.0",
    sourceUrl: "https://www.geoportal-hamburg.de/",
  },
  // Platzhalter für weitere Bundesländer — URLs oft hinter Auth/paywall oder
  // ohne CORS. Nutzer-Custom-WMS ist der saubere Workaround.
];

export const BUNDESLAND_PORTAL_LINKS: Partial<Record<Bundesland, { label: string; url: string }>> = {
  BE: { label: "FIS-Broker Berlin", url: "https://fbinter.stadt-berlin.de/fb/" },
  BY: { label: "BORIS-Bayern", url: "https://www.ldbv.bayern.de/vermessung/bodenschaetzung.html" },
  BW: { label: "BORIS-BW", url: "https://www.gutachterausschuesse-bw.de/boris-bw/" },
  BB: { label: "BORIS-BB", url: "https://www.boris.brandenburg.de/" },
  HB: { label: "Bremen Gutachterausschuss", url: "https://www.gag.bremen.de/" },
  HE: { label: "BORIS-Hessen", url: "https://www.boris.hessen.de/" },
  MV: { label: "BORIS-MV", url: "https://www.boris-mv.de/" },
  NI: { label: "BORIS-Niedersachsen", url: "https://www.boris.niedersachsen.de/" },
  NW: { label: "BORISplus.NRW", url: "https://www.boris.nrw.de/" },
  RP: { label: "BORIS-RLP", url: "https://boris.rlp.de/" },
  SL: { label: "Saarland BRW", url: "https://geoportal.saarland.de/" },
  SN: { label: "BORIS.Sachsen", url: "https://www.boris.sachsen.de/" },
  ST: { label: "BORIS-ST", url: "https://www.lvermgeo.sachsen-anhalt.de/" },
  SH: { label: "BORIS-SH", url: "https://www.schleswig-holstein.de/boris/" },
  TH: { label: "Geoportal Thüringen", url: "https://www.geoportal-th.de/" },
};
