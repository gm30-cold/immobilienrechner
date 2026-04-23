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
  type MarktDatensatz,
} from "@/data/markt";
import { BUNDESLAND_LABEL } from "@/data/bundeslaender";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/cn";
import { useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Info } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type Metric = "miete" | "kaufpreis" | "bodenrichtwert" | "rendite";

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
  const [sortBy, setSortBy] = useState<"wert" | "alpha" | "tier">("wert");

  const selectedCase = cases.find((c) => c.id === caseId);
  const userValues = selectedCase ? computeUserValues(selectedCase) : null;

  const valueFor = (d: MarktDatensatz): number => {
    switch (metric) {
      case "miete":
        return d.miete[typ];
      case "kaufpreis":
        return d.kaufpreis[typ];
      case "bodenrichtwert":
        return d.bodenrichtwert;
      case "rendite":
        return benchmarkBruttorendite(d, typ);
    }
  };

  const data = useMemo(() => {
    const all = [...MARKT_DATA];
    if (sortBy === "wert") all.sort((a, b) => valueFor(b) - valueFor(a));
    if (sortBy === "alpha") all.sort((a, b) => a.ort.localeCompare(b.ort, "de"));
    if (sortBy === "tier") all.sort((a, b) => a.tier.localeCompare(b.tier) || valueFor(b) - valueFor(a));
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, typ, sortBy]);

  const mittel = bundesMittel(typ);
  const { min, max } = useMemo(() => {
    const vals = data.map(valueFor);
    return { min: Math.min(...vals), max: Math.max(...vals) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, metric, typ]);

  const userValue = userValues?.[metric] ?? null;

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
        subtitle="Aggregierte Marktwerte 2025 für ~40 deutsche Städte. Vergleiche deinen Case mit realistischen Orientierungswerten."
      />

      <div className="p-8 space-y-6">
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
                Sortierung
              </label>
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
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--fg-secondary)]">
                Benchmark-Case
                <InfoTooltip content="Wähle einen deiner Cases, um seine Werte als Overlay im Grid anzuzeigen.">
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

        {/* Benchmark-Overview wenn Case gewählt */}
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

        {/* Heatmap Grid */}
        <GlassCard className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              {METRIC_LABEL[metric]}
              {metric !== "bodenrichtwert" && ` · ${typ}`}
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)]">
              <LegendSwatch intensity={0.1} label={fmt(min)} />
              <LegendSwatch intensity={0.5} label={fmt((min + max) / 2)} />
              <LegendSwatch intensity={1.0} label={fmt(max)} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((d) => {
              const v = valueFor(d);
              const intensity = (v - min) / (max - min || 1);
              const userMatch = userValue != null && userValues?.matchOrt === d.ort;
              return (
                <HeatCell
                  key={d.ort}
                  datensatz={d}
                  value={v}
                  formatted={fmt(v)}
                  intensity={intensity}
                  highlighted={userMatch}
                  userValue={userMatch && userValue != null ? userValue : undefined}
                  formatUserValue={fmt}
                />
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-4 text-xs leading-relaxed text-[var(--fg-muted)]">
          Quellen: LBS Wohnatlas, Postbank Wohnatlas, Bulwiengesa-Reports,
          Gutachterausschuss-Berichte BORIS-D, JLL/CBRE Marktberichte.
          Die Werte sind aggregierte Stadtmittel und Orientierungshilfen —
          für konkrete Kaufentscheidungen immer aktuellen Bodenrichtwert und
          Mietspiegel für das tatsächliche Objekt prüfen.
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
  const t = Math.max(0, Math.min(1, intensity));
  // Emerald (low) → Amber (mid) → Rose (high) für Kaufpreise
  // Hier einfach als Alpha auf Violet: niedrig = dunkel, hoch = heller/saturierter
  const alpha = 0.08 + t * 0.35;
  return `rgba(167, 139, 250, ${alpha})`;
}

function HeatCell({
  datensatz,
  value,
  formatted,
  intensity,
  highlighted,
  userValue,
  formatUserValue,
}: {
  datensatz: MarktDatensatz;
  value: number;
  formatted: string;
  intensity: number;
  highlighted?: boolean;
  userValue?: number;
  formatUserValue: (v: number) => string;
}) {
  const delta =
    userValue != null && value > 0 ? ((userValue - value) / value) * 100 : null;
  return (
    <div
      className={[
        "rounded-xl border p-3 transition-transform hover:-translate-y-0.5",
        highlighted
          ? "border-emerald-400/60 ring-2 ring-emerald-400/40"
          : "border-white/10",
      ].join(" ")}
      style={{ background: heatColor(intensity) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{datensatz.ort}</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
            {datensatz.bundesland} · Tier {datensatz.tier}
          </div>
        </div>
      </div>
      <div className="mt-3 font-mono text-base font-semibold text-[var(--fg-primary)]">
        {formatted}
      </div>
      {delta != null && (
        <div
          className={[
            "mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono",
            delta > 5
              ? "bg-rose-400/15 text-[var(--accent-rose)]"
              : delta < -5
              ? "bg-emerald-400/15 text-[var(--accent-emerald)]"
              : "bg-amber-400/15 text-[var(--accent-amber)]",
          ].join(" ")}
        >
          <ArrowUpRight className={`size-2.5 ${delta < 0 ? "rotate-90" : ""}`} />
          Dein Case: {formatUserValue(userValue!)} ({delta > 0 ? "+" : ""}
          {delta.toFixed(0)}%)
        </div>
      )}
    </div>
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
  // normal: above average = good (emerald). invert: above average = bad (rose)
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
  return (
    <div className="flex items-center gap-1">
      <span
        className="size-3 rounded-sm ring-1 ring-inset ring-white/10"
        style={{ background: heatColor(intensity) }}
      />
      <span>{label}</span>
    </div>
  );
}
