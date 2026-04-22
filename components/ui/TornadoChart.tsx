"use client";

import { useMemo } from "react";
import type { SensitivitaetsErgebnis } from "@/lib/calc/sensitivitaet";
import { formatCurrency, formatPercent } from "@/lib/cn";

interface Props {
  data: SensitivitaetsErgebnis;
  unit?: "percent" | "currency";
}

export function TornadoChart({ data, unit = "percent" }: Props) {
  const { max } = useMemo(() => {
    let m = 0;
    for (const z of data.zeilen) {
      m = Math.max(m, Math.abs(z.lowImpact), Math.abs(z.highImpact));
    }
    return { max: Math.max(m, 0.001) };
  }, [data]);

  const fmt = (v: number) =>
    unit === "currency" ? formatCurrency(v, { sign: true }) : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <div className="space-y-2">
      {data.zeilen.map((z) => {
        const leftVal = Math.min(z.lowImpact, z.highImpact);
        const rightVal = Math.max(z.lowImpact, z.highImpact);
        const leftLabel = leftVal === z.lowImpact ? z.lowLabel : z.highLabel;
        const rightLabel = rightVal === z.highImpact ? z.highLabel : z.lowLabel;

        const leftPct = Math.abs(leftVal) / max * 50;
        const rightPct = Math.abs(rightVal) / max * 50;

        return (
          <div key={z.variable} className="grid grid-cols-[160px_1fr] items-center gap-3 text-xs">
            <div className="truncate text-right text-[var(--fg-secondary)]">{z.label}</div>
            <div className="relative h-8">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />

              {/* Left bar */}
              <div
                className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center justify-end overflow-hidden rounded-l-md pr-2 text-[10px] font-mono text-[var(--accent-rose)]"
                style={{
                  right: "50%",
                  width: `${leftPct}%`,
                  background: "linear-gradient(to left, rgba(251,113,133,0.35), rgba(251,113,133,0.08))",
                  border: "1px solid rgba(251,113,133,0.25)",
                  borderRight: "none",
                }}
                title={`${leftLabel}: ${fmt(leftVal)}`}
              >
                <span className="truncate">{fmt(leftVal)}</span>
              </div>

              {/* Right bar */}
              <div
                className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-r-md pl-2 text-[10px] font-mono text-[var(--accent-emerald)]"
                style={{
                  left: "50%",
                  width: `${rightPct}%`,
                  background: "linear-gradient(to right, rgba(52,211,153,0.35), rgba(52,211,153,0.08))",
                  border: "1px solid rgba(52,211,153,0.25)",
                  borderLeft: "none",
                }}
                title={`${rightLabel}: ${fmt(rightVal)}`}
              >
                <span className="truncate">{fmt(rightVal)}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-3 grid grid-cols-[160px_1fr] gap-3 text-[10px] text-[var(--fg-muted)]">
        <div />
        <div className="flex justify-between">
          <span>− Verschlechterung</span>
          <span>Baseline: {unit === "currency" ? formatCurrency(data.baseline) : formatPercent(data.baseline)}</span>
          <span>Verbesserung +</span>
        </div>
      </div>
    </div>
  );
}
