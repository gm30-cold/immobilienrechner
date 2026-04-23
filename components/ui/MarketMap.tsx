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
  const hue = 260 - t * 120;
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
      center: [10.5, 51.3],
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

      // Outer wrapper: MapLibre steuert transform → nicht anfassen
      const outer = document.createElement("div");
      outer.style.cssText = `
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        cursor: pointer;
      `;

      // Inner: hier leben alle visuellen Transforms
      const inner = document.createElement("div");
      inner.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: ${color};
        opacity: 0.75;
        border: ${highlighted ? "3px solid #34d399" : "1.5px solid rgba(255,255,255,0.3)"};
        box-shadow: 0 0 ${radius}px ${color}40, 0 2px 6px rgba(0,0,0,0.4);
        transition: transform 0.15s ease, opacity 0.15s ease;
        will-change: transform;
      `;
      outer.appendChild(inner);

      outer.addEventListener("mouseenter", () => {
        inner.style.transform = "scale(1.2)";
        inner.style.opacity = "1";
      });
      outer.addEventListener("mouseleave", () => {
        inner.style.transform = "scale(1)";
        inner.style.opacity = "0.75";
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

      const marker = new Marker({ element: outer, anchor: "center" })
        .setLngLat([d.lng, d.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [ready, data, metric, typ, highlightOrt]);

  // Focus pin (Geocoding result)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (focusPinRef.current) {
      focusPinRef.current.remove();
      focusPinRef.current = null;
    }

    if (focus) {
      const outer = document.createElement("div");
      outer.style.cssText = "width: 22px; height: 22px;";

      const inner = document.createElement("div");
      inner.className = "focus-pulse-inner";
      inner.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #fbbf24;
        border: 3px solid rgba(251,191,36,0.3);
        box-shadow: 0 0 14px #fbbf24;
        transform-origin: center;
      `;
      outer.appendChild(inner);

      focusPinRef.current = new Marker({ element: outer, anchor: "center" })
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
      const outer = document.createElement("div");
      outer.style.cssText = "width: 22px; height: 28px;";

      const inner = document.createElement("div");
      inner.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50% 50% 50% 0;
        background: #34d399;
        border: 3px solid rgba(255,255,255,0.6);
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(52,211,153,0.4);
      `;
      outer.appendChild(inner);

      const popup = new Popup({ offset: 20, closeButton: false }).setHTML(
        `<div style="color:#f4f4f6;padding:4px 8px"><div style="font-weight:600;font-size:12px">${casePin.label}</div><div style="font-size:10px;color:#6b6b78">Dein Case</div></div>`,
      );

      casePinRef.current = new Marker({ element: outer, anchor: "bottom" })
        .setLngLat([casePin.lng, casePin.lat])
        .setPopup(popup)
        .addTo(map);
    }
  }, [casePin]);

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes focusPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        .focus-pulse-inner {
          animation: focusPulse 1.5s ease-in-out infinite;
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
