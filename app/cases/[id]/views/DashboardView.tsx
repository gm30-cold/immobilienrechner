"use client";

import type { Case } from "@/types/case";
import { KpiTile } from "@/components/ui/KpiTile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Ampel } from "@/components/ui/Ampel";
import { formatCurrency, formatPercent } from "@/lib/cn";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { computeCase, monatsBreakdownJahr1 } from "@/lib/calc";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function DashboardView({ caseItem }: { caseItem: Case }) {
  const result = useMemo(() => computeCase(caseItem, 30), [caseItem]);
  const [showTaxReserve, setShowTaxReserve] = useState(true);
  const [chartJahr, setChartJahr] = useState(1);

  const monthly = useMemo(() => {
    const r = computeCase(caseItem, 30);
    const idx = Math.max(0, Math.min(chartJahr - 1, r.cashflow.length - 1));
    const zeile = r.cashflow[idx];
    return [
      {
        kategorie: `Jahr ${chartJahr}`,
        miete: Math.round(zeile.einnahmenKaltmiete / 12),
        zins: Math.round(zeile.zins / 12),
        tilgung: Math.round(zeile.tilgung / 12),
        bewirtschaftung: Math.round(zeile.bewirtschaftung / 12),
        steuer: showTaxReserve
          ? Math.round(Math.max(0, zeile.steuerEffekt) / 12)
          : 0,
      },
    ];
  }, [caseItem, chartJahr, showTaxReserve]);

  const kpi = result.kpi;
  const breakEvenJahr = kpi.breakEvenJahr;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="Bruttorendite"
          value={formatPercent(kpi.bruttomietrenditeProzent)}
          tone={kpi.bruttomietrenditeProzent > 4 ? "positive" : kpi.bruttomietrenditeProzent > 3 ? "warning" : "negative"}
          tooltip="Jahreskaltmiete / Kaufpreis. Ohne Nebenkosten und Bewirtschaftung — nur zur groben Orientierung."
        />
        <KpiTile
          label="Nettorendite"
          value={formatPercent(kpi.nettomietrenditeProzent)}
          tone={kpi.nettomietrenditeProzent > 3 ? "positive" : kpi.nettomietrenditeProzent > 2 ? "warning" : "negative"}
          tooltip="(Jahreskaltmiete − Bewirtschaftungskosten) / Gesamtinvestition inkl. aller Kaufnebenkosten. Realistische Objektrendite."
        />
        <KpiTile
          label="EK-Rendite n. St."
          value={formatPercent(kpi.eigenkapitalrenditeNachSteuernProzent)}
          tone={kpi.eigenkapitalrenditeNachSteuernProzent > 5 ? "positive" : kpi.eigenkapitalrenditeNachSteuernProzent > 2 ? "warning" : "negative"}
          tooltip="Die ehrlichste Kennzahl: (Cashflow n. Steuern + jährliche Tilgung) / Eigenkapital. Zeigt, was dein eingesetztes Kapital wirklich bringt — inkl. Steuervorteil und Vermögensaufbau durch Tilgung."
        />
        <KpiTile
          label="Cashflow n. St."
          value={formatCurrency(kpi.cashflowNachSteuernProMonat)}
          unit="/Mo."
          tone={kpi.cashflowNachSteuernProMonat >= 0 ? "positive" : kpi.cashflowNachSteuernProMonat > -200 ? "warning" : "negative"}
          tooltip="Was monatlich real auf dem Konto bleibt (Jahr 1). Steuerwirkung anteilig eingerechnet — wird faktisch einmal jährlich mit der Steuererklärung verrechnet."
        />
        <KpiTile
          label="Break-Even"
          value={breakEvenJahr ? `Jahr ${breakEvenJahr}` : "> 30 J."}
          tone={breakEvenJahr && breakEvenJahr <= 15 ? "positive" : breakEvenJahr && breakEvenJahr <= 25 ? "warning" : "negative"}
          tooltip="Jahr, ab dem der kumulierte Cashflow nach Steuern positiv ist. Ohne Exit-Erlös betrachtet."
        />
        <KpiTile
          label="Restschuld n. ZB"
          value={formatCurrency(kpi.restschuldNachZinsbindung)}
          tone="neutral"
          tooltip="Verbleibende Darlehenssumme am Ende der Sollzinsbindung. Darauf muss Anschlussfinanzierung gefunden werden — Zinsrisiko beachten."
        />
      </div>

      {/* Ampel */}
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
            Gesamt-Bewertung
          </div>
          <Ampel state={result.ampel.gesamt} />
        </div>
        <ul className="mt-4 space-y-1.5 text-xs">
          {result.ampel.gruende.map((g, i) => {
            const Icon = g.ampel === "gruen" ? CheckCircle2 : g.ampel === "gelb" ? AlertTriangle : XCircle;
            const color =
              g.ampel === "gruen"
                ? "text-[var(--accent-emerald)]"
                : g.ampel === "gelb"
                ? "text-[var(--accent-amber)]"
                : "text-[var(--accent-rose)]";
            return (
              <li key={i} className="flex items-start gap-2 text-[var(--fg-secondary)]">
                <Icon className={`mt-0.5 size-3.5 shrink-0 ${color}`} />
                <span>{g.text}</span>
              </li>
            );
          })}
        </ul>
      </GlassCard>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Trägt sich das selbst?"
          subtitle="Monatliche Miete vs. Ausgaben"
          right={
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--fg-secondary)]">
                <input
                  type="checkbox"
                  checked={showTaxReserve}
                  onChange={(e) => setShowTaxReserve(e.target.checked)}
                  className="size-3.5 accent-emerald-500"
                />
                Steuerrücklage
              </label>
              <select
                value={chartJahr}
                onChange={(e) => setChartJahr(Number(e.target.value))}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
              >
                {result.cashflow.map((z) => (
                  <option key={z.jahr} value={z.jahr}>
                    Jahr {z.jahr}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barCategoryGap="30%">
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="kategorie" stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "var(--bg-glass-strong)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12,
                  backdropFilter: "blur(24px)",
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Bar dataKey="miete" stackId="in" fill="var(--accent-emerald)" radius={[6, 6, 0, 0]} name="Kaltmiete" />
              <Bar dataKey="zins" stackId="out" fill="#e11d48" radius={[0, 0, 0, 0]} name="Zins" />
              <Bar dataKey="tilgung" stackId="out" fill="#a78bfa" radius={[0, 0, 0, 0]} name="Tilgung" />
              <Bar dataKey="bewirtschaftung" stackId="out" fill="#fb7185" radius={[0, 0, 0, 0]} name="Bewirtschaftung" />
              {showTaxReserve && (
                <Bar dataKey="steuer" stackId="out" fill="#fbbf24" radius={[6, 6, 0, 0]} name="Steuerrücklage" />
              )}
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--fg-secondary)" }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Kumulierter Cashflow"
          subtitle="Vor und nach Steuern über Haltedauer"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={result.cashflow.map((z) => ({
              jahr: z.jahr,
              kumNach: Math.round(z.kumulierterCashflowNachSteuer),
              kumVor: Math.round(
                result.cashflow.slice(0, z.jahr).reduce((a, r) => a + r.cashflowVorSteuer, 0),
              ),
            }))}>
              <defs>
                <linearGradient id="cfNach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cfVor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-violet)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--accent-violet)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="jahr" stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" />
              {breakEvenJahr && (
                <ReferenceLine
                  x={breakEvenJahr}
                  stroke="var(--accent-emerald)"
                  strokeDasharray="3 3"
                  label={{ value: "Break-Even", fill: "var(--accent-emerald)", fontSize: 10, position: "top" }}
                />
              )}
              <Tooltip
                contentStyle={{
                  background: "var(--bg-glass-strong)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12,
                  backdropFilter: "blur(24px)",
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Area type="monotone" dataKey="kumVor" stroke="var(--accent-violet)" strokeWidth={2} fill="url(#cfVor)" name="vor Steuer" />
              <Area type="monotone" dataKey="kumNach" stroke="var(--accent-emerald)" strokeWidth={2} fill="url(#cfNach)" name="nach Steuer" />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--fg-secondary)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Vermögensaufbau"
          subtitle="Tilgung + Wertsteigerung + kumulierter Cashflow"
          className="xl:col-span-2"
        >
          <VermoegensaufbauChart result={result} caseItem={caseItem} />
        </ChartCard>
      </div>
    </div>
  );
}

function VermoegensaufbauChart({ result, caseItem }: { result: ReturnType<typeof computeCase>; caseItem: Case }) {
  const wertsteigerungPA = caseItem.exit.wertsteigerungProzentPA ?? 0;
  const startwert = caseItem.kaufkosten.kaufpreis;
  const darlehenStart = caseItem.finanzierung.darlehen.reduce((s, d) => s + d.betrag, 0);

  const data = result.cashflow.map((z) => {
    const objektwert = startwert * Math.pow(1 + wertsteigerungPA / 100, z.jahr);
    const tilgungGesamt = darlehenStart - z.restschuldEnde;
    const wertsteigerung = objektwert - startwert;
    return {
      jahr: z.jahr,
      tilgung: Math.round(tilgungGesamt),
      wertsteigerung: Math.round(wertsteigerung),
      cashflow: Math.round(z.kumulierterCashflowNachSteuer),
      gesamt: Math.round(tilgungGesamt + wertsteigerung + z.kumulierterCashflowNachSteuer),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
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
        <Area type="monotone" dataKey="tilgung" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} name="Tilgung" />
        <Area type="monotone" dataKey="wertsteigerung" stackId="1" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} name="Wertsteigerung" />
        <Area type="monotone" dataKey="cashflow" stackId="1" stroke="var(--accent-emerald)" fill="var(--accent-emerald)" fillOpacity={0.35} name="kum. Cashflow" />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--fg-secondary)" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}
function ChartCard({ title, subtitle, right, className, children }: ChartCardProps) {
  return (
    <GlassCard className={`p-5 ${className ?? ""}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--fg-secondary)]">{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </GlassCard>
  );
}
