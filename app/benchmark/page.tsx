"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { RadioGroup, Select } from "@/components/forms/inputs";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useCasesStore } from "@/lib/store";
import type { Case, Objekttyp } from "@/types/case";
import {
  MARKT_DATA,
  benchmarkBruttorendite,
  bundesMittel,
  nearestDatensatz,
  type MarktDatensatz,
} from "@/data/markt";
import { BUNDESLAND_LABEL } from "@/data/bundeslaender";
import { BORIS_WMS_LAYERS, BUNDESLAND_PORTAL_LINKS, type BorisWmsLayer } from "@/data/borisWms";
import { interpolateValues, interpolationQualitaet, type InterpolatedValues } from "@/data/interpolate";
import { findByPlz, findByPlzPrefix, loadPlzDataset, type PlzEntry } from "@/lib/plz";
import { formatNumber, formatPercent } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Info, Search, Loader2, X, Layers, ExternalLink } from "lucide-react";
import { MarketMap } from "@/components/ui/MarketMap";
import { useGeocode } from "@/lib/useGeocode";
import type { GeocodeResult } from "@/lib/geocoding";

type Metric = "miete" | "kaufpreis" | "bodenrichtwert" | "rendite";
type ViewMode = "map" | "grid";

const METRIC_LABEL: Record<Metric, string> = {
  miete: "Kaltmiete (€/m²)",
  kaufpreis: "Kaufpreis (€/m²)",
  bodenrichtwert: "Bodenrichtwert (€/m²)",
  rendite: "Bruttomietrendite (%)",
};

interface FocusSelection {
  label: string;
  lat: number;
  lng: number;
  /** True wenn das Ziel eine PLZ-exakte Ortszuordnung ist */
  isExactPlz: boolean;
  plzEntry?: PlzEntry;
}

export default function BenchmarkPage() {
  const cases = useCasesStore((s) => s.cases);
  const [metric, setMetric] = useState<Metric>("kaufpreis");
  const [typ, setTyp] = useState<Objekttyp>("ETW");
  const [caseId, setCaseId] = useState<string>(cases[0]?.id ?? "");
  const [view, setView] = useState<ViewMode>("map");
  const [sortBy, setSortBy] = useState<"wert" | "alpha" | "tier">("wert");

  // Such-Input
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<FocusSelection | null>(null);

  // PLZ-Dataset lazy-load
  useEffect(() => {
    loadPlzDataset().catch(() => {/* silent */});
  }, []);

  // PLZ-Vorschläge für numerische Eingabe
  const [plzSuggestions, setPlzSuggestions] = useState<PlzEntry[]>([]);
  useEffect(() => {
    const trimmed = query.trim();
    if (/^\d{2,5}$/.test(trimmed)) {
      findByPlzPrefix(trimmed, 8).then(setPlzSuggestions);
    } else {
      setPlzSuggestions([]);
    }
  }, [query]);

  // Nominatim nur für nicht-numerische Suchen
  const showNominatim = query.trim().length >= 3 && !/^\d+$/.test(query.trim());
  const { results: geoResults, loading: geoLoading } = useGeocode(
    showNominatim && !focus ? query : "",
  );

  // BORIS-WMS-Layer
  const [borisLayerId, setBorisLayerId] = useState<string>("");
  const [borisOpacity, setBorisOpacity] = useState<number>(0.55);
  const borisLayer: BorisWmsLayer | null =
    BORIS_WMS_LAYERS.find((l) => l.id === borisLayerId) ?? null;

  const selectedCase = cases.find((c) => c.id === caseId);
  const userValues = selectedCase ? computeUserValues(selectedCase) : null;

  // Case-Pin
  const [casePin, setCasePin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  useEffect(() => {
    if (!selectedCase) return setCasePin(null);
    const ort = selectedCase.stammdaten.adresse.ort;
    if (!ort) return setCasePin(null);
    const match = MARKT_DATA.find((d) =>
      d.ort.toLowerCase().includes(ort.toLowerCase()),
    );
    if (match) {
      setCasePin({ lat: match.lat, lng: match.lng, label: selectedCase.name });
    }
  }, [selectedCase]);

  // Interpolation am Focus-Punkt
  const interpolated: InterpolatedValues | null = useMemo(() => {
    if (!focus) return null;
    return interpolateValues(focus.lat, focus.lng);
  }, [focus]);
  const qualitaet = interpolated
    ? interpolationQualitaet(interpolated.nearestDistanceKm)
    : null;

  // Nearest curated city (zum Highlight)
  const nearestOrt = useMemo(() => {
    if (!focus) return null;
    return nearestDatensatz(focus.lat, focus.lng).d.ort;
  }, [focus]);

  const valueFor = (d: MarktDatensatz): number => {
    switch (metric) {
      case "miete": return d.miete[typ];
      case "kaufpreis": return d.kaufpreis[typ];
      case "bodenrichtwert": return d.bodenrichtwert;
      case "rendite": return benchmarkBruttorendite(d, typ);
    }
  };

  const data = useMemo(() => {
    const all = [...MARKT_DATA];
    if (view === "map") return all;
    if (sortBy === "wert") all.sort((a, b) => valueFor(b) - valueFor(a));
    if (sortBy === "alpha") all.sort((a, b) => a.ort.localeCompare(b.ort, "de"));
    if (sortBy === "tier") all.sort((a, b) => a.tier.localeCompare(b.tier) || valueFor(b) - valueFor(a));
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, typ, sortBy, view]);

  const mittel = bundesMittel(typ);
  const { min, max } = useMemo(() => {
    const vals = MARKT_DATA.map(valueFor);
    return { min: Math.min(...vals), max: Math.max(...vals) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, typ]);

  const fmt = (v: number) =>
    metric === "rendite"
      ? formatPercent(v, 2)
      : metric === "miete"
      ? `${v.toFixed(1)} €/m²`
      : `${formatNumber(Math.round(v))} €/m²`;

  const pickPlz = async (plz: string) => {
    const entry = await findByPlz(plz);
    if (entry) {
      setFocus({
        label: `${entry.plz} ${entry.ort}`,
        lat: entry.lat,
        lng: entry.lng,
        isExactPlz: true,
        plzEntry: entry,
      });
      setQuery("");
      setPlzSuggestions([]);
    }
  };

  const pickGeo = (r: GeocodeResult) => {
    setFocus({
      label: r.displayName,
      lat: r.lat,
      lng: r.lng,
      isExactPlz: false,
    });
    setQuery("");
  };

  const clearFocus = () => {
    setFocus(null);
    setQuery("");
    setPlzSuggestions([]);
  };

  return (
    <div>
      <PageHeader
        title="Markt-Benchmark"
        subtitle="PLZ-genaue Interpolation aus 60 Referenzstädten und Bodenrichtwerte-WMS-Overlay."
      />

      <div className="p-8 space-y-6">
        {/* Suchleiste */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={focus ? focus.label : query}
              onChange={(e) => {
                setFocus(null);
                setQuery(e.target.value);
              }}
              placeholder="PLZ (z.B. 10115), Ort oder Straße eingeben — aus 9.856 deutschen PLZs + OSM"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm focus:border-[var(--accent-emerald)]/40 focus:outline-none"
            />
            {(query || focus) && (
              <button
                onClick={clearFocus}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
              >
                <X className="size-4" />
              </button>
            )}
            {geoLoading && (
              <Loader2 className="pointer-events-none absolute right-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-[var(--fg-muted)]" />
            )}
          </div>

          {/* PLZ-Suggestions */}
          {!focus && plzSuggestions.length > 0 && (
            <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-[var(--bg-glass-strong)] p-1">
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                PLZ — lokal, sofort
              </div>
              {plzSuggestions.map((e) => (
                <button
                  key={e.plz + e.ort}
                  onClick={() => pickPlz(e.plz)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[var(--accent-emerald)]">{e.plz}</span>
                    <span>{e.ort}</span>
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)]">{e.bundesland}</span>
                </button>
              ))}
            </div>
          )}

          {/* Nominatim-Suggestions */}
          {!focus && showNominatim && geoResults.length > 0 && (
            <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-[var(--bg-glass-strong)] p-1">
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                OpenStreetMap
              </div>
              {geoResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickGeo(r)}
                  className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--fg-muted)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{r.displayName}</div>
                    {r.plz && (
                      <div className="text-[10px] text-[var(--fg-muted)]">PLZ {r.plz}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Interpolierter Werte-Block */}
        {focus && interpolated && qualitaet && (
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-[var(--accent-amber)]" />
                  <span className="text-sm font-semibold">{focus.label}</span>
                  {focus.isExactPlz && (
                    <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-mono text-[var(--accent-emerald)]">
                      PLZ-exakt
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[var(--fg-muted)]">
                  {focus.plzEntry && (
                    <>
                      {BUNDESLAND_LABEL[focus.plzEntry.bundesland]} ·{" "}
                    </>
                  )}
                  {qualitaet.note}
                </div>
              </div>
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                  qualitaet.level === "hoch"
                    ? "bg-emerald-400/10 text-[var(--accent-emerald)] ring-emerald-400/30"
                    : qualitaet.level === "mittel"
                    ? "bg-amber-400/10 text-[var(--accent-amber)] ring-amber-400/30"
                    : "bg-rose-400/10 text-[var(--accent-rose)] ring-rose-400/30",
                ].join(" ")}
              >
                {qualitaet.label}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <InterpolatedCell
                label={`Kaltmiete ${typ}`}
                value={`${interpolated.miete[typ].toFixed(1)} €/m²`}
                tone="emerald"
              />
              <InterpolatedCell
                label={`Kaufpreis ${typ}`}
                value={`${formatNumber(Math.round(interpolated.kaufpreis[typ]))} €/m²`}
              />
              <InterpolatedCell
                label={`Rendite ${typ}`}
                value={`${interpolated.bruttorendite[typ].toFixed(2)}%`}
                tone="violet"
              />
              <InterpolatedCell
                label="Bodenrichtwert"
                value={`${formatNumber(Math.round(interpolated.bodenrichtwert))} €/m²`}
              />
            </div>

            <div className="mt-5 border-t border-white/5 pt-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                Interpoliert aus
              </div>
              <div className="flex flex-wrap gap-2">
                {interpolated.quellen.map((q) => (
                  <div
                    key={q.ort}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
                  >
                    <span className="font-medium">{q.ort}</span>
                    <span className="ml-1 font-mono text-[var(--fg-muted)]">
                      {q.distanceKm.toFixed(0)} km · {Math.round(q.weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Controls */}
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_240px]">
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--fg-secondary)]">Metrik</label>
              <RadioGroup
                value={metric}
                onChange={setMetric}
                options={[
                  { value: "kaufpreis", label: "Kaufpreis" },
                  { value: "miete", label: "Miete" },
                  { value: "rendite", label: "Rendite" },
                  { value: "bodenrichtwert", label: "Boden" },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--fg-secondary)]">
                Objekttyp {metric === "bodenrichtwert" && <span className="text-[var(--fg-muted)]">(typ-unabhängig)</span>}
              </label>
              <RadioGroup<Objekttyp>
                value={typ}
                onChange={setTyp}
                options={[
                  { value: "ETW", label: "Wohnung" },
                  { value: "EFH", label: "EFH" },
                  { value: "MFH", label: "MFH" },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--fg-secondary)]">Ansicht</label>
              <RadioGroup<ViewMode>
                value={view}
                onChange={setView}
                options={[
                  { value: "map", label: "Karte" },
                  { value: "grid", label: "Grid" },
                ]}
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--fg-secondary)]">
                Benchmark-Case
                <InfoTooltip content="Pin für deinen Case auf der Karte">
                  <Info className="size-3 opacity-60" />
                </InfoTooltip>
              </label>
              <Select
                value={caseId}
                onChange={setCaseId}
                options={[
                  { value: "", label: "— kein Case —" },
                  ...cases.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* BORIS-WMS-Toggle (nur im Karten-Modus) */}
        {view === "map" && (
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Layers className="size-4 text-[var(--accent-violet)]" />
              <span className="text-sm font-medium">BORIS Bodenrichtwerte-Overlay</span>
              <Select
                value={borisLayerId}
                onChange={setBorisLayerId}
                options={[
                  { value: "", label: "— ausgeschaltet —" },
                  ...BORIS_WMS_LAYERS.map((l) => ({ value: l.id, label: l.label })),
                ]}
                className="min-w-[280px]"
              />
              {borisLayer && (
                <div className="flex items-center gap-2 text-xs text-[var(--fg-secondary)]">
                  <label>Deckkraft</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={borisOpacity}
                    onChange={(e) => setBorisOpacity(Number(e.target.value))}
                    className="accent-violet-500"
                  />
                  <span className="font-mono text-[var(--fg-muted)]">
                    {Math.round(borisOpacity * 100)}%
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[var(--fg-muted)]">
              Amtliche Bodenrichtwerte direkt vom offiziellen Geodienst des Bundeslandes.
              Derzeit verifiziert: Hamburg (öffentlicher WMS mit CORS). Für andere
              Bundesländer öffnest du das jeweilige BORIS-Portal direkt — Links unten.
            </p>
          </GlassCard>
        )}

        {/* Karten- oder Grid-View */}
        {view === "map" ? (
          <GlassCard className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <h3 className="text-sm font-semibold">
                {METRIC_LABEL[metric]}
                {metric !== "bodenrichtwert" && ` · ${typ}`}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)]">
                <LegendSwatch intensity={0.05} label={fmt(min)} />
                <LegendSwatch intensity={0.5} label={fmt((min + max) / 2)} />
                <LegendSwatch intensity={1.0} label={fmt(max)} />
              </div>
            </div>
            <MarketMap
              data={data}
              metric={metric}
              typ={typ}
              focus={focus ? { lat: focus.lat, lng: focus.lng } : null}
              casePin={casePin}
              highlightOrt={nearestOrt ?? undefined}
              borisLayer={borisLayer}
              borisOpacity={borisOpacity}
            />
          </GlassCard>
        ) : (
          <GridView
            data={data}
            valueFor={valueFor}
            fmt={fmt}
            min={min}
            max={max}
            userValues={userValues}
            metric={metric}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}

        {/* Case-Vergleich */}
        {selectedCase && userValues && (
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--fg-secondary)]">
              <MapPin className="size-3.5" />
              Vergleich: <span className="font-semibold text-[var(--fg-primary)]">{selectedCase.name}</span>
              · {selectedCase.stammdaten.adresse.ort || "—"} ({BUNDESLAND_LABEL[selectedCase.stammdaten.adresse.bundesland]})
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <BenchmarkCell label="Dein Miete/m²" userValue={userValues.miete} refValue={mittel.miete} format={(v) => `${v.toFixed(2)} €`} />
              <BenchmarkCell label="Dein Kaufpreis/m²" userValue={userValues.kaufpreis} refValue={mittel.kaufpreis} format={(v) => `${formatNumber(Math.round(v))} €`} invertTone />
              <BenchmarkCell label="Deine Bruttorendite" userValue={userValues.rendite} refValue={mittel.bruttorendite} format={(v) => `${v.toFixed(2)}%`} />
              <BenchmarkCell label="Dein Bodenwert/m²" userValue={userValues.bodenrichtwert} refValue={mittel.bodenrichtwert} format={(v) => `${formatNumber(Math.round(v))} €`} invertTone hint="grob aus Kaufpreis × Grundanteil / Wohnfläche" />
            </div>
          </GlassCard>
        )}

        {/* BORIS-Portal Links */}
        <GlassCard className="p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Offizielle Bodenrichtwerte-Portale (extern)
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {Object.entries(BUNDESLAND_PORTAL_LINKS).map(([bl, info]) => (
              <a
                key={bl}
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs transition-colors hover:bg-white/[0.05]"
              >
                <span className="truncate">
                  <span className="font-mono text-[var(--fg-muted)]">{bl}</span> ·{" "}
                  <span>{info.label}</span>
                </span>
                <ExternalLink className="size-3 shrink-0 text-[var(--fg-muted)]" />
              </a>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 text-xs leading-relaxed text-[var(--fg-muted)]">
          <div className="mb-1 font-medium text-[var(--fg-secondary)]">Datenquellen</div>
          PLZ-Koordinaten: geonames.org (9.856 deutsche PLZs, CC BY 4.0).
          Stadt-Mittelwerte: aggregiert aus LBS/Postbank Wohnatlas, Bulwiengesa,
          JLL/CBRE und Gutachterausschuss-Berichten (2025).
          Geocoding: OpenStreetMap Nominatim. Bodenrichtwerte-Overlay: amtliche WMS
          der Bundesländer (CORS-verfügbarkeit variiert).
          Die interpolierten Werte sind Schätzungen aus den 4 nächsten Referenzstädten
          via Inverse-Distance-Weighting — kein Ersatz für lokalen Mietspiegel oder Gutachterausschuss-Bericht.
        </GlassCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface UserValues {
  miete: number;
  kaufpreis: number;
  bodenrichtwert: number;
  rendite: number;
  matchOrt: string | null;
}

function computeUserValues(c: Case): UserValues {
  const gesamtQm = c.stammdaten.einheiten.reduce((a, e) => a + e.qm, 0);
  const monatsmiete = c.stammdaten.einheiten.reduce((a, e) => a + e.kaltmiete, 0);
  const miete = gesamtQm > 0 ? monatsmiete / gesamtQm : 0;
  const kaufpreis = gesamtQm > 0 ? c.kaufkosten.kaufpreis / gesamtQm : 0;
  const grundWert = c.kaufkosten.kaufpreis * (c.kaufkosten.aufteilung.grundProzent / 100);
  const bodenrichtwert = gesamtQm > 0 ? grundWert / gesamtQm : 0;
  const rendite = c.kaufkosten.kaufpreis > 0 ? (monatsmiete * 12 / c.kaufkosten.kaufpreis) * 100 : 0;
  const matchOrt =
    MARKT_DATA.find((d) => d.ort.toLowerCase().includes((c.stammdaten.adresse.ort || "").toLowerCase()))?.ort ?? null;
  return { miete, kaufpreis, bodenrichtwert, rendite, matchOrt };
}

function heatColor(intensity: number): string {
  const hue = 260 - intensity * 120;
  return `hsla(${hue}, 70%, ${55 - intensity * 10}%, ${0.15 + intensity * 0.35})`;
}

// ---------------------------------------------------------------------------

function InterpolatedCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "violet";
}) {
  const color =
    tone === "emerald"
      ? "text-[var(--accent-emerald)]"
      : tone === "violet"
      ? "text-[var(--accent-violet)]"
      : "text-[var(--fg-primary)]";
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{label}</div>
      <div className={`mt-1 font-mono text-base font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function GridView({
  data,
  valueFor,
  fmt,
  min,
  max,
  userValues,
  metric,
  sortBy,
  setSortBy,
}: {
  data: MarktDatensatz[];
  valueFor: (d: MarktDatensatz) => number;
  fmt: (v: number) => string;
  min: number;
  max: number;
  userValues: UserValues | null;
  metric: Metric;
  sortBy: "wert" | "alpha" | "tier";
  setSortBy: (v: "wert" | "alpha" | "tier") => void;
}) {
  const userValue = userValues?.[metric] ?? null;

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{METRIC_LABEL[metric]} · {data.length} Einträge</h3>
        <RadioGroup
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "wert", label: "Wert ↓" },
            { value: "tier", label: "Tier" },
            { value: "alpha", label: "A–Z" },
          ]}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((d) => {
          const v = valueFor(d);
          const intensity = (v - min) / (max - min || 1);
          const userMatch = userValue != null && userValues?.matchOrt === d.ort;
          const delta =
            userMatch && userValue != null && v > 0 ? ((userValue - v) / v) * 100 : null;
          return (
            <div
              key={d.ort}
              className={[
                "rounded-xl border p-3 transition-transform hover:-translate-y-0.5",
                userMatch ? "border-emerald-400/60 ring-2 ring-emerald-400/40" : "border-white/10",
              ].join(" ")}
              style={{ background: heatColor(intensity) }}
            >
              <div className="truncate text-sm font-semibold">{d.ort}</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{d.bundesland} · Tier {d.tier}</div>
              <div className="mt-2 font-mono text-base font-semibold">{fmt(v)}</div>
              {delta != null && (
                <div className={[
                  "mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono",
                  delta > 5 ? "bg-rose-400/15 text-[var(--accent-rose)]" : delta < -5 ? "bg-emerald-400/15 text-[var(--accent-emerald)]" : "bg-amber-400/15 text-[var(--accent-amber)]",
                ].join(" ")}>
                  <ArrowUpRight className={`size-2.5 ${delta < 0 ? "rotate-90" : ""}`} />
                  Dein Case: {fmt(userValue!)} ({delta > 0 ? "+" : ""}{delta.toFixed(0)}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function BenchmarkCell({
  label,
  userValue,
  refValue,
  format,
  invertTone,
  hint,
}: {
  label: string;
  userValue: number;
  refValue: number;
  format: (v: number) => string;
  invertTone?: boolean;
  hint?: string;
}) {
  const delta = refValue > 0 ? ((userValue - refValue) / refValue) * 100 : 0;
  const good = invertTone ? delta < -5 : delta > 5;
  const bad = invertTone ? delta > 5 : delta < -5;
  const tone = good ? "text-[var(--accent-emerald)]" : bad ? "text-[var(--accent-rose)]" : "text-[var(--accent-amber)]";
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
        {label}
        {hint && (
          <InfoTooltip content={hint}>
            <Info className="size-2.5 opacity-60" />
          </InfoTooltip>
        )}
      </div>
      <div className="mt-1 font-mono text-base font-semibold">{format(userValue)}</div>
      <div className={`mt-0.5 font-mono text-[10px] ${tone}`}>
        Ø Deutschland: {format(refValue)} ({delta > 0 ? "+" : ""}
        {delta.toFixed(0)}%)
      </div>
    </div>
  );
}

function LegendSwatch({ intensity, label }: { intensity: number; label: string }) {
  const hue = 260 - intensity * 120;
  return (
    <div className="flex items-center gap-1">
      <span
        className="size-3 rounded-full ring-1 ring-inset ring-white/10"
        style={{ background: `hsl(${hue} 70% ${60 - intensity * 15}%)` }}
      />
      <span>{label}</span>
    </div>
  );
}
