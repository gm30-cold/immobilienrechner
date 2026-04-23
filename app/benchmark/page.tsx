"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { RadioGroup, Select } from "@/components/forms/inputs";
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
import { formatNumber, formatPercent } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Info, Search, Loader2, X } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

export default function BenchmarkPage() {
  const cases = useCasesStore((s) => s.cases);
  const [metric, setMetric] = useState<Metric>("kaufpreis");
  const [typ, setTyp] = useState<Objekttyp>("ETW");
  const [caseId, setCaseId] = useState<string>(cases[0]?.id ?? "");
  const [view, setView] = useState<ViewMode>("map");
  const [sortBy, setSortBy] = useState<"wert" | "alpha" | "tier">("wert");

  // Geocoding-Suche
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<GeocodeResult | null>(null);
  const { results: geoResults, loading: geoLoading } = useGeocode(picked ? "" : query);

  const selectedCase = cases.find((c) => c.id === caseId);
  const userValues = selectedCase ? computeUserValues(selectedCase) : null;

  // Case-Pin auf Karte: Geocode aus Adresse des Cases
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
    } else {
      setCasePin(null);
    }
  }, [selectedCase]);

  const valueFor = (d: MarktDatensatz): number => {
    switch (metric) {
      case "miete": return d.miete[typ];
      case "kaufpreis": return d.kaufpreis[typ];
      case "bodenrichtwert": return d.bodenrichtwert;
      case "rendite": return benchmarkBruttorendite(d, typ);
    }
  };

  // Nächster Datensatz für Focus-Punkt
  const focusInfo = useMemo(() => {
    if (!picked) return null;
    const { d, distanceKm } = nearestDatensatz(picked.lat, picked.lng);
    return { d, distanceKm, picked };
  }, [picked]);

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

  return (
    <div>
      <PageHeader
        title="Markt-Benchmark"
        subtitle="Interaktive Karte mit Werten deutscher Städte und Bezirke. Real-time Adressuche via OpenStreetMap."
      />

      <div className="p-8 space-y-6">
        {/* Such-Leiste */}
        <GlassCard className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={picked ? picked.displayName : query}
              onChange={(e) => {
                setPicked(null);
                setQuery(e.target.value);
              }}
              placeholder="PLZ, Ort oder Straße eingeben — z.B. '10115' oder 'Düsseldorf Oberkassel'"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[var(--accent-emerald)]/40 focus:outline-none"
            />
            {(query || picked) && (
              <button
                onClick={() => {
                  setQuery("");
                  setPicked(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
              >
                <X className="size-4" />
              </button>
            )}
            {geoLoading && (
              <Loader2 className="pointer-events-none absolute right-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-[var(--fg-muted)]" />
            )}
          </div>

          {/* Dropdown mit Vorschlägen */}
          {!picked && query.length >= 3 && geoResults.length > 0 && (
            <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-[var(--bg-glass-strong)] p-1">
              {geoResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPicked(r);
                    setQuery("");
                  }}
                  className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--fg-muted)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[var(--fg-primary)]">{r.displayName}</div>
                    {r.plz && (
                      <div className="text-[10px] text-[var(--fg-muted)]">
                        PLZ {r.plz} · {r.typ}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Fokus-Info */}
          {picked && focusInfo && (
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-[var(--fg-secondary)]">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-[var(--accent-amber)]" />
                <span className="font-semibold text-[var(--fg-primary)]">
                  {picked.displayName}
                </span>
              </div>
              <div className="mt-1 text-[11px]">
                Nächste erfasste Stadt:{" "}
                <span className="font-mono text-[var(--fg-primary)]">{focusInfo.d.ort}</span>{" "}
                · {focusInfo.distanceKm.toFixed(0)} km entfernt · Werte als Orientierung unten
              </div>
            </div>
          )}
        </GlassCard>

        {/* Controls */}
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_240px]">
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--fg-secondary)]">
                Metrik
              </label>
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
              <label className="mb-2 block text-xs font-medium text-[var(--fg-secondary)]">
                Ansicht
              </label>
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
                <InfoTooltip content="Wähle einen deiner Cases, um seine Werte als Pin auf der Karte und Vergleich im Grid anzuzeigen.">
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

        {/* Main View */}
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
              focus={picked ? { lat: picked.lat, lng: picked.lng } : null}
              casePin={casePin}
              highlightOrt={focusInfo?.d.ort}
            />
            <p className="mt-3 px-1 text-[11px] text-[var(--fg-muted)]">
              Blasengröße und Farbe zeigen den jeweiligen Wert. Klick auf eine Blase für Details.
              {picked && focusInfo && ` Gelber Pin = deine Suche, nächste Vergleichsstadt hervorgehoben.`}
            </p>
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
              <BenchmarkCell
                label="Dein Miete/m²"
                userValue={userValues.miete}
                refValue={mittel.miete}
                format={(v) => `${v.toFixed(2)} €`}
              />
              <BenchmarkCell
                label="Dein Kaufpreis/m²"
                userValue={userValues.kaufpreis}
                refValue={mittel.kaufpreis}
                format={(v) => `${formatNumber(Math.round(v))} €`}
                invertTone
              />
              <BenchmarkCell
                label="Deine Bruttorendite"
                userValue={userValues.rendite}
                refValue={mittel.bruttorendite}
                format={(v) => `${v.toFixed(2)}%`}
              />
              <BenchmarkCell
                label="Dein Bodenwert/m²"
                userValue={userValues.bodenrichtwert}
                refValue={mittel.bodenrichtwert}
                format={(v) => `${formatNumber(Math.round(v))} €`}
                invertTone
                hint="grob aus Kaufpreis × Grundanteil / Wohnfläche"
              />
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-4 text-xs leading-relaxed text-[var(--fg-muted)]">
          <div className="mb-1 font-medium text-[var(--fg-secondary)]">Datenquellen & Limits</div>
          Werte sind aggregierte Mittelwerte aus LBS Wohnatlas, Postbank Wohnatlas,
          Bulwiengesa, JLL/CBRE Marktberichten und Gutachterausschuss-Berichten (BORIS-D).
          Geocoding: OpenStreetMap Nominatim (kostenlos, 1 Anfrage/Sek.). Für straßengenaue
          Kaufpreise gibt es in Deutschland derzeit keine kostenlose öffentliche Datenquelle
          — bei Kaufentscheidungen immer lokalen Mietspiegel und Gutachterausschuss-Bericht
          prüfen.
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
        <h3 className="text-sm font-semibold">
          {METRIC_LABEL[metric]} · {data.length} Einträge
        </h3>
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
            userMatch && userValue != null && v > 0
              ? ((userValue - v) / v) * 100
              : null;
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
              <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                {d.bundesland} · Tier {d.tier}
              </div>
              <div className="mt-2 font-mono text-base font-semibold">
                {fmt(v)}
              </div>
              {delta != null && (
                <div
                  className={[
                    "mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono",
                    delta > 5
                      ? "bg-rose-400/15 text-[var(--accent-rose)]"
                      : delta < -5
                      ? "bg-emerald-400/15 text-[var(--accent-emerald)]"
                      : "bg-amber-400/15 text-[var(--accent-amber)]",
                  ].join(" ")}
                >
                  <ArrowUpRight className={`size-2.5 ${delta < 0 ? "rotate-90" : ""}`} />
                  Dein Case: {fmt(userValue!)} ({delta > 0 ? "+" : ""}
                  {delta.toFixed(0)}%)
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
