"use client";

import { useState } from "react";
import type { Case } from "@/types/case";
import {
  runMonteCarlo,
  type MonteCarloErgebnis,
  type MetricSummary,
} from "@/lib/calc";
import { GlassCard } from "./GlassCard";
import { KpiTile } from "./KpiTile";
import { formatCurrency, formatPercent } from "@/lib/cn";
import { Dice6, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Metric = "irr" | "ekRendite" | "cashflowMonatJ1" | "kumCashflow10J" | "nettoerloesExit";

const METRIC_META: Record<Metric, { label: string; unit: "percent" | "currency" }> = {
  irr: { label: "IRR über Haltedauer", unit: "percent" },
  ekRendite: { label: "EK-Rendite n. St.", unit: "percent" },
  cashflowMonatJ1: { label: "Cashflow/Mo. (Jahr 1)", unit: "currency" },
  kumCashflow10J: { label: "Kum. CF nach 10 J.", unit: "currency" },
  nettoerloesExit: { label: "Nettoerlös bei Exit", unit: "currency" },
};

export function MonteCarloPanel({ caseItem }: { caseItem: Case }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MonteCarloErgebnis | null>(null);
  const [runs, setRuns] = useState(3000);
  const [metric, setMetric] = useState<Metric>("irr");

  const run = async () => {
    setRunning(true);
    setProgress(0);
    const r = await runMonteCarlo(caseItem, { runs }, setProgress);
    setResult(r);
    setRunning(false);
  };

  const summary: MetricSummary | null = result ? result[metric] : null;
  const unit = METRIC_META[metric].unit;
  const fmt = (v: number) => (unit === "percent" ? formatPercent(v) : formatCurrency(v));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--fg-secondary)]">Durchläufe</label>
          <select
            value={runs}
            onChange={(e) => setRuns(Number(e.target.value))}
            disabled={running}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-mono"
          >
            {[1000, 3000, 5000, 10000].map((n) => (
              <option key={n} value={n} className="bg-[var(--bg-raised)]">
                {n.toLocaleString("de-DE")}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-500/80 to-violet-600/80 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/10 transition-transform hover:-translate-y-0.5 hover:from-violet-500 hover:to-violet-600 disabled:opacity-60"
        >
          {running ? <Loader2 className="size-4 animate-spin" /> : <Dice6 className="size-4" />}
          {running ? `Simuliere … ${Math.round(progress * 100)}%` : "Simulation starten"}
        </button>

        {result && !running && (
          <span className="font-mono text-xs text-[var(--fg-muted)]">
            {result.runs.toLocaleString("de-DE")} Durchläufe abgeschlossen
          </span>
        )}
      </div>

      {running && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-violet-400 to-emerald-400 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {result && (
        <>
          {/* Wahrscheinlichkeiten */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile
              label="CF J1 positiv"
              value={formatPercent(result.wahrscheinlichkeiten.cashflowPositivJ1 * 100, 0)}
              tone={result.wahrscheinlichkeiten.cashflowPositivJ1 > 0.7 ? "positive" : result.wahrscheinlichkeiten.cashflowPositivJ1 > 0.4 ? "warning" : "negative"}
              tooltip="Wahrscheinlichkeit, dass der monatliche Cashflow im 1. Jahr positiv ist."
            />
            <KpiTile
              label="Kum. CF > 0 nach 10 J."
              value={formatPercent(result.wahrscheinlichkeiten.kumCashflowPositivNach10J * 100, 0)}
              tone={result.wahrscheinlichkeiten.kumCashflowPositivNach10J > 0.7 ? "positive" : result.wahrscheinlichkeiten.kumCashflowPositivNach10J > 0.4 ? "warning" : "negative"}
              tooltip="Wahrscheinlichkeit, dass die Summe aller Cashflows nach 10 Jahren positiv ist."
            />
            <KpiTile
              label="IRR > 4%"
              value={formatPercent(result.wahrscheinlichkeiten.irrUeber4Prozent * 100, 0)}
              tone={result.wahrscheinlichkeiten.irrUeber4Prozent > 0.6 ? "positive" : "warning"}
              tooltip="Wahrscheinlichkeit einer IRR über 4% über die Haltedauer. 4% ≈ typische Benchmark für Renditeobjekte."
            />
            <KpiTile
              label="IRR < 0%"
              value={formatPercent(result.wahrscheinlichkeiten.irrUnterNull * 100, 0)}
              tone={result.wahrscheinlichkeiten.irrUnterNull < 0.05 ? "positive" : result.wahrscheinlichkeiten.irrUnterNull < 0.15 ? "warning" : "negative"}
              tooltip="Downside-Risiko: Wahrscheinlichkeit einer negativen Gesamtrendite."
            />
          </div>

          {/* Metric-Picker */}
          <div className="flex flex-wrap gap-1 rounded-lg glass p-1">
            {(Object.keys(METRIC_META) as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  metric === m
                    ? "bg-white/[0.08] text-[var(--fg-primary)] ring-1 ring-inset ring-white/10"
                    : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]",
                ].join(" ")}
              >
                {METRIC_META[m].label}
              </button>
            ))}
          </div>

          {/* Histogramm */}
          {summary && (
            <GlassCard className="p-5">
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                <PercentileCell label="P10 (Worst)" value={fmt(summary.p10)} tone="rose" />
                <PercentileCell label="Median" value={fmt(summary.median)} />
                <PercentileCell label="Mean" value={fmt(summary.mean)} />
                <PercentileCell label="P90 (Best)" value={fmt(summary.p90)} tone="emerald" />
                <PercentileCell label="Spannweite" value={`${fmt(summary.max - summary.min)}`} muted />
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary.histogram.map((b) => ({
                  label: unit === "percent" ? `${b.bucket.toFixed(1)}%` : `${Math.round(b.bucket / 1000)}k`,
                  count: b.count,
                  fullLabel: b.label,
                }))}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--fg-muted)" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="var(--fg-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-glass-strong)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 12,
                      backdropFilter: "blur(24px)",
                      fontSize: 11,
                    }}
                    formatter={(v) => [`${v} Durchläufe`, "Häufigkeit"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
                  />
                  <Bar dataKey="count" fill="var(--accent-violet)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs text-[var(--fg-muted)]">
                Histogramm: Verteilung der {METRIC_META[metric].label.toLowerCase()} über{" "}
                {result.runs.toLocaleString("de-DE")} Durchläufe.
              </p>
            </GlassCard>
          )}
        </>
      )}

      {!result && !running && (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-[var(--fg-muted)]">
          Simulation noch nicht gestartet. Je mehr Durchläufe, desto glatter das Histogramm —
          aber auch länger die Wartezeit. 3.000 ist ein guter Anfang.
        </div>
      )}
    </div>
  );
}

function PercentileCell({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "rose" | "emerald";
  muted?: boolean;
}) {
  const color =
    tone === "rose"
      ? "text-[var(--accent-rose)]"
      : tone === "emerald"
      ? "text-[var(--accent-emerald)]"
      : muted
      ? "text-[var(--fg-muted)]"
      : "text-[var(--fg-primary)]";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{label}</div>
      <div className={`mt-1 font-mono text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}
