"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MarktDatensatz } from "@/data/markt";
import type { Objekttyp } from "@/types/case";
import { benchmarkBruttorendite } from "@/data/markt";

// ---------------------------------------------------------------------------
// Interaktive Deutschland-Karte mit Markt-Daten als Blasen.
// Basiskarte: OSM Raster (frei, Attribution Pflicht).
// ---------------------------------------------------------------------------

type Metric = "miete" | "kaufpreis" | "bodenrichtwert" | "rendite";

interface Props {
  data: MarktDatensatz[];
  metric: Metric;
  typ: Objekttyp;
  /** Fokuspunkt (z.B. Geocoding-Ergebnis) — bewegt die Karte dorthin */
  focus?: { lat: number; lng: number } | null;
  /** Case-Pin: Adresse des aktuellen Cases */
  casePin?: { lat: number; lng: number; label: string } | null;
  /** Highlight eines Ortes nach Name */
  highlightOrt?: string;
}

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm-tiles",
      paint: {
        // Etwas abdunkeln/desaturieren für Dark-UI
        "raster-brightness-max": 0.65,
        "raster-saturation": -0.4,
      },
    },
  ],
};

function valueFor(d: MarktDatensatz, metric: Metric, typ: Objekttyp): number {
  switch (metric) {
    case "miete": return d.miete[typ];
    case "kaufpreis": return d.kaufpreis[typ];
    case "bodenrichtwert": return d.bodenrichtwert;
    case "rendite": return benchmarkBruttorendite(d, typ);
  }
}

function fmtValue(v: number, metric: Metric): string {
  if (metric === "rendite") return `${v.toFixed(2)}%`;
  if (metric === "miete") return `${v.toFixed(1)} €/m²`;
  return `${Math.round(v).toLocaleString("de-DE")} €/m²`;
}

function colorFor(t: number): string {
  // 0..1 intensity → violet-emerald gradient via HSL
  const hue = 260 - t * 120; // 260 (violet) → 140 (emerald)
  const sat = 70;
  const light = 60 - t * 15;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function MarketMap({
  data,
  metric,
  typ,
  focus,
  casePin,
  highlightOrt,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const casePinRef = useRef<Marker | null>(null);
  const focusPinRef = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [10.5, 51.3], // Germany center
      zoom: 5.5,
      minZoom: 4.5,
      maxZoom: 14,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data/metric/typ change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    // Clear previous
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const values = data.map((d) => valueFor(d, metric, typ));
    const min = Math.min(...values);
    const max = Math.max(...values);

    for (const d of data) {
      const v = valueFor(d, metric, typ);
      const intensity = max === min ? 0.5 : (v - min) / (max - min);
      const radius = 10 + intensity * 20;
      const color = colorFor(intensity);
      const highlighted = highlightOrt && d.ort.toLowerCase() === highlightOrt.toLowerCase();

      const el = document.createElement("div");
      el.className = "market-bubble";
      el.style.cssText = `
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.75;
        border: ${highlighted ? "3px solid #34d399" : "1.5px solid rgba(255,255,255,0.3)"};
        box-shadow: 0 0 ${radius}px ${color}40, 0 2px 6px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.15s ease, opacity 0.15s ease;
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.opacity = "1";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.opacity = "0.75";
      });

      const popup = new Popup({
        offset: radius + 4,
        closeButton: false,
        className: "market-popup",
      }).setHTML(
        `<div style="color:#f4f4f6;font-family:system-ui;padding:4px 8px;min-width:160px">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px">${d.ort}</div>
          <div style="color:#6b6b78;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${d.bundesland} · Tier ${d.tier}</div>
          <div style="display:flex;justify-content:space-between;font-size:11px"><span style="color:#a8a8b3">${metricLabel(metric)}</span><span style="font-family:monospace;font-weight:600">${fmtValue(v, metric)}</span></div>
          ${metric !== "bodenrichtwert" ? `<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px"><span style="color:#6b6b78">${typ}</span><span style="font-family:monospace;color:#a78bfa">Rendite ${benchmarkBruttorendite(d, typ).toFixed(2)}%</span></div>` : ""}
        </div>`,
      );

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([d.lng, d.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [ready, data, metric, typ, highlightOrt]);

  // Focus (Geocoding result)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (focusPinRef.current) {
      focusPinRef.current.remove();
      focusPinRef.current = null;
    }

    if (focus) {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fbbf24;
        border: 3px solid rgba(251,191,36,0.3);
        box-shadow: 0 0 14px #fbbf24;
        animation: pulse 1.5s ease-in-out infinite;
      `;
      focusPinRef.current = new Marker({ element: el })
        .setLngLat([focus.lng, focus.lat])
        .addTo(map);

      map.flyTo({ center: [focus.lng, focus.lat], zoom: 10, duration: 900 });
    }
  }, [focus]);

  // Case pin
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (casePinRef.current) {
      casePinRef.current.remove();
      casePinRef.current = null;
    }

    if (casePin) {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50% 50% 50% 0;
        background: #34d399;
        border: 3px solid rgba(255,255,255,0.6);
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(52,211,153,0.4);
      `;
      const popup = new Popup({ offset: 20, closeButton: false }).setHTML(
        `<div style="color:#f4f4f6;padding:4px 8px"><div style="font-weight:600;font-size:12px">${casePin.label}</div><div style="font-size:10px;color:#6b6b78">Dein Case</div></div>`,
      );
      casePinRef.current = new Marker({ element: el, anchor: "bottom" })
        .setLngLat([casePin.lng, casePin.lat])
        .setPopup(popup)
        .addTo(map);
    }
  }, [casePin]);

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .maplibregl-ctrl-attrib {
          background: rgba(22, 22, 32, 0.7) !important;
          color: #a8a8b3 !important;
          backdrop-filter: blur(8px);
        }
        .maplibregl-ctrl-attrib a {
          color: #a78bfa !important;
        }
        .maplibregl-popup-content {
          background: rgba(22, 22, 32, 0.92) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          backdrop-filter: blur(24px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .maplibregl-popup-tip {
          border-top-color: rgba(22, 22, 32, 0.92) !important;
          border-bottom-color: rgba(22, 22, 32, 0.92) !important;
        }
        .maplibregl-ctrl-group {
          background: rgba(22, 22, 32, 0.7) !important;
          backdrop-filter: blur(12px);
        }
        .maplibregl-ctrl-group button {
          color: #f4f4f6 !important;
        }
        .maplibregl-ctrl-group button:hover {
          background: rgba(255,255,255,0.08) !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="h-[560px] w-full overflow-hidden rounded-2xl border border-white/10"
      />
    </div>
  );
}

function metricLabel(m: Metric): string {
  switch (m) {
    case "miete": return "Miete";
    case "kaufpreis": return "Kaufpreis";
    case "bodenrichtwert": return "Bodenrichtwert";
    case "rendite": return "Rendite";
  }
}
