"use client";

import { cn } from "@/lib/cn";
import { GlassCard } from "./GlassCard";
import { Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

export type KpiTone = "neutral" | "positive" | "negative" | "warning";

interface KpiTileProps {
  label: string;
  value: string;
  unit?: string;
  trend?: number; // +/- % change vs. reference
  tone?: KpiTone;
  tooltip?: string;
  sublabel?: string;
}

const toneAccent: Record<KpiTone, string> = {
  neutral: "text-[var(--fg-primary)]",
  positive: "text-[var(--accent-emerald)]",
  negative: "text-[var(--accent-rose)]",
  warning: "text-[var(--accent-amber)]",
};

const toneGlow: Record<KpiTone, string> = {
  neutral: "",
  positive:
    "before:bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(52,211,153,0.16),transparent_60%)]",
  negative:
    "before:bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(251,113,133,0.16),transparent_60%)]",
  warning:
    "before:bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(251,191,36,0.14),transparent_60%)]",
};

export function KpiTile({
  label,
  value,
  unit,
  trend,
  tone = "neutral",
  tooltip,
  sublabel,
}: KpiTileProps) {
  return (
    <GlassCard
      className={cn(
        "relative overflow-hidden p-5 transition-transform hover:-translate-y-0.5",
        "before:absolute before:inset-0 before:-z-0 before:pointer-events-none",
        toneGlow[tone],
      )}
    >
      <div className="relative flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
          <span>{label}</span>
          {tooltip && (
            <InfoTooltip content={tooltip}>
              <Info className="size-3 opacity-60 hover:opacity-100" />
            </InfoTooltip>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={cn("font-mono text-2xl font-semibold tabular-nums", toneAccent[tone])}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-[var(--fg-muted)]">{unit}</span>
          )}
        </div>
        {(sublabel || trend !== undefined) && (
          <div className="flex items-center gap-2 text-xs text-[var(--fg-secondary)]">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono",
                  trend > 0
                    ? "text-[var(--accent-emerald)]"
                    : trend < 0
                    ? "text-[var(--accent-rose)]"
                    : "text-[var(--fg-muted)]",
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="size-3" />
                ) : trend < 0 ? (
                  <TrendingDown className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
                {trend > 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
            )}
            {sublabel && <span>{sublabel}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
