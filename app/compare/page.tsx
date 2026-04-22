"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Ampel } from "@/components/ui/Ampel";
import { useCasesStore } from "@/lib/store";
import { computeCase } from "@/lib/calc";
import type { Case } from "@/types/case";
import { formatCurrency, formatPercent } from "@/lib/cn";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitCompare, Check } from "lucide-react";

const LINE_COLORS = ["var(--accent-emerald)", "var(--accent-violet)", "var(--accent-sky)"];

export default function ComparePage() {
  const cases = useCasesStore((s) => s.cases);
  const [picked, setPicked] = useState<string[]>(cases.slice(0, 2).map((c) => c.id));

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= 3
        ? prev
        : [...prev, id],
    );

  const selected = picked
    .map((id) => cases.find((c) => c.id === id))
    .filter((c): c is Case => !!c);

  const results = useMemo(
    () => selected.map((c) => ({ c, r: computeCase(c, 30) })),
    [selected],
  );

  const combinedChart = useMemo(() => {
    if (results.length === 0) return [];
    const maxJahre = Math.max(...results.map((r) => r.r.cashflow.length));
    return Array.from({ length: maxJahre }, (_, i) => {
      const jahr = i + 1;
      const row: Record<string, number> = { jahr };
      for (const { c, r } of results) {
        row[c.id] = r.cashflow[i]?.kumulierterCashflowNachSteuer ?? 0;
      }
      return row;
    });
  }, [results]);

  return (
    <div>
      <PageHeader
        title="Vergleich"
        subtitle="Bis zu 3 Cases nebeneinander."
      />

      <div className="p-8 space-y-6">
        {cases.length < 2 ? (
          <GlassCard className="flex flex-col items-start gap-3 p-8">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
              <GitCompare className="size-4 text-[var(--fg-muted)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Noch nicht genug Cases</h2>
              <p className="mt-1 text-sm text-[var(--fg-secondary)]">
                Du brauchst mindestens 2 Cases, um zu vergleichen.
              </p>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* Case Picker */}
            <GlassCard className="p-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
                Cases auswählen ({picked.length}/3)
              </h2>
              <div className="flex flex-wrap gap-2">
                {cases.map((c) => {
                  const on = picked.includes(c.id);
                  const disabled = !on && picked.length >= 3;
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      disabled={disabled}
                      className={[
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                        on
                          ? "bg-emerald-500/20 text-[var(--accent-emerald)] ring-1 ring-inset ring-emerald-400/30"
                          : "bg-white/[0.03] text-[var(--fg-secondary)] ring-1 ring-inset ring-white/10 hover:bg-white/[0.06]",
                        disabled && "opacity-40",
                      ].join(" ")}
                    >
                      {on ? <Check className="size-3" /> : null}
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {selected.length < 2 ? (
              <GlassCard className="p-8 text-center text-sm text-[var(--fg-muted)]">
                Wähle mindestens 2 Cases aus.
              </GlassCard>
            ) : (
              <>
                {/* KPI Table */}
                <GlassCard className="overflow-hidden">
                  <div className="grid" style={{ gridTemplateColumns: `200px repeat(${results.length}, 1fr)` }}>
                    {/* Header */}
                    <div className="border-b border-white/5 bg-white/[0.02] p-4 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
                      Kennzahl
                    </div>
                    {results.map(({ c }, i) => (
                      <div
                        key={c.id}
                        className="border-b border-white/5 bg-white/[0.02] p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: LINE_COLORS[i] }}
                          />
                          <span className="font-semibold">{c.name}</span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[var(--fg-muted)]">
                          {c.stammdaten.adresse.ort || "—"} · {c.stammdaten.adresse.bundesland}
                        </div>
                      </div>
                    ))}

                    {/* Rows */}
                    <RowTitle>Ampel</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>
                        <Ampel state={r.ampel.gesamt} />
                      </RowCell>
                    ))}

                    <RowTitle>Kaufpreis</RowTitle>
                    {results.map(({ c }) => (
                      <RowCell key={c.id}>{formatCurrency(c.kaufkosten.kaufpreis)}</RowCell>
                    ))}

                    <RowTitle>Gesamtinvestition</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{formatCurrency(r.kpi.gesamtinvestition)}</RowCell>
                    ))}

                    <RowTitle>Eigenkapital</RowTitle>
                    {results.map(({ c }) => (
                      <RowCell key={c.id}>{formatCurrency(c.finanzierung.eigenkapital)}</RowCell>
                    ))}

                    <RowTitle>EK-Quote</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{formatPercent(r.kpi.eigenkapitalQuoteProzent)}</RowCell>
                    ))}

                    <RowTitle highlight>Bruttorendite</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id} highlight>{formatPercent(r.kpi.bruttomietrenditeProzent)}</RowCell>
                    ))}

                    <RowTitle highlight>Nettorendite</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id} highlight>{formatPercent(r.kpi.nettomietrenditeProzent)}</RowCell>
                    ))}

                    <RowTitle highlight>EK-Rendite n. St.</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id} highlight>{formatPercent(r.kpi.eigenkapitalrenditeNachSteuernProzent)}</RowCell>
                    ))}

                    <RowTitle>Cashflow n. St. / Mo.</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id} tone={r.kpi.cashflowNachSteuernProMonat >= 0 ? "emerald" : "rose"}>
                        {formatCurrency(r.kpi.cashflowNachSteuernProMonat)}
                      </RowCell>
                    ))}

                    <RowTitle>Break-Even</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{r.kpi.breakEvenJahr ? `Jahr ${r.kpi.breakEvenJahr}` : "> 30"}</RowCell>
                    ))}

                    <RowTitle>Kaufpreisfaktor</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{r.kpi.kaufpreisFaktor.toFixed(1)}×</RowCell>
                    ))}

                    <RowTitle>Restschuld n. ZB</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{formatCurrency(r.kpi.restschuldNachZinsbindung)}</RowCell>
                    ))}

                    <RowTitle>IRR</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>
                        {r.exit.irrProzent != null ? formatPercent(r.exit.irrProzent) : "—"}
                      </RowCell>
                    ))}

                    <RowTitle>Nettoerlös bei Exit</RowTitle>
                    {results.map(({ c, r }) => (
                      <RowCell key={c.id}>{formatCurrency(r.exit.nettoerloes)}</RowCell>
                    ))}
                  </div>
                </GlassCard>

                {/* Combined Cashflow */}
                <GlassCard className="p-5">
                  <h3 className="mb-4 text-base font-semibold">
                    Kumulierter Cashflow nach Steuern
                  </h3>
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={combinedChart}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="jahr" stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-glass-strong)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 12,
                          backdropFilter: "blur(24px)",
                        }}
                        formatter={(v) => formatCurrency(Number(v))}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--fg-secondary)" }} />
                      {results.map(({ c }, i) => (
                        <Line
                          key={c.id}
                          type="monotone"
                          dataKey={c.id}
                          name={c.name}
                          stroke={LINE_COLORS[i]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RowTitle({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={[
        "border-b border-white/5 p-3 text-xs",
        highlight ? "bg-white/[0.02] font-medium text-[var(--fg-primary)]" : "text-[var(--fg-secondary)]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function RowCell({
  children,
  highlight,
  tone,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  tone?: "emerald" | "rose";
}) {
  const toneClass =
    tone === "emerald" ? "text-[var(--accent-emerald)]" : tone === "rose" ? "text-[var(--accent-rose)]" : "";
  return (
    <div
      className={[
        "border-b border-white/5 p-3 font-mono text-sm",
        highlight ? "bg-white/[0.02] font-semibold" : "",
        toneClass,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
