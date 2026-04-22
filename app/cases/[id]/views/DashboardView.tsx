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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

// NOTE: Diese View nutzt vorerst vereinfachte Rechnung — in Etappe 2
// wird sie durch den vollständigen Rechenkern (/lib/calc) ersetzt.

export function DashboardView({ caseItem }: { caseItem: Case }) {
  const kpis = useMemo(() => computeRoughKpis(caseItem), [caseItem]);
  const cashflow = useMemo(() => buildRoughCashflow(caseItem, 30), [caseItem]);
  const [showTaxReserve, setShowTaxReserve] = useState(true);

  const monthly = useMemo(() => buildMonthlyBreakdown(caseItem, showTaxReserve), [caseItem, showTaxReserve]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="Bruttomietrendite"
          value={formatPercent(kpis.brutto)}
          tone={kpis.brutto > 4 ? "positive" : kpis.brutto > 3 ? "warning" : "negative"}
          tooltip="Jahreskaltmiete / Kaufpreis. Grobe Orientierung, ohne Nebenkosten & Bewirtschaftung."
        />
        <KpiTile
          label="Nettomietrendite"
          value={formatPercent(kpis.netto)}
          tone={kpis.netto > 3 ? "positive" : kpis.netto > 2 ? "warning" : "negative"}
          tooltip="(Jahreskaltmiete − Bewirtschaftung) / Gesamtinvestition inkl. Nebenkosten."
        />
        <KpiTile
          label="EK-Rendite n. Steuern"
          value={formatPercent(kpis.ekRendite)}
          tone={kpis.ekRendite > 5 ? "positive" : kpis.ekRendite > 2 ? "warning" : "negative"}
          tooltip="Die ehrlichste Zahl: (Cashflow n. Steuern + Tilgung) / Eigenkapital."
        />
        <KpiTile
          label="Cashflow n. Steuern"
          value={formatCurrency(kpis.cashflow)}
          unit="/Mo."
          tone={kpis.cashflow >= 0 ? "positive" : "negative"}
          tooltip="Was monatlich real auf dem Konto bleibt, inkl. Steuerwirkung (jährlich anteilig)."
        />
        <KpiTile
          label="Break-Even"
          value={kpis.breakEven ? `Jahr ${kpis.breakEven}` : "> 30 J."}
          tone={kpis.breakEven && kpis.breakEven < 15 ? "positive" : "warning"}
          tooltip="Ab welchem Jahr kumulativer Cashflow positiv ist."
        />
        <KpiTile
          label="Restschuld n. Zinsbindung"
          value={formatCurrency(kpis.restschuld)}
          tone="neutral"
          tooltip="Verbleibende Darlehenssumme am Ende der Sollzinsbindung."
        />
      </div>

      {/* Ampel */}
      <GlassCard className="flex flex-wrap items-center gap-4 p-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
            Gesamt-Bewertung
          </div>
          <div className="mt-1 flex items-center gap-3">
            <Ampel state={kpis.ampel} />
            <span className="text-sm text-[var(--fg-secondary)]">
              Basiert auf Nettorendite, Cashflow und Tilgungsquote.
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Trägt sich das selbst?"
          subtitle="Monatliche Miete vs. Ausgaben (Jahr 1)"
          right={
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--fg-secondary)]">
              <input
                type="checkbox"
                checked={showTaxReserve}
                onChange={(e) => setShowTaxReserve(e.target.checked)}
                className="size-3.5 accent-emerald-500"
              />
              Steuerrücklage (1/12)
            </label>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barCategoryGap="30%">
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="kategorie"
                stroke="var(--fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}€`}
              />
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
          title="Cashflow über 30 Jahre"
          subtitle="Vor und nach Steuern (kumuliert)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashflow}>
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
              <XAxis
                dataKey="jahr"
                stroke="var(--fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-glass-strong)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12,
                  backdropFilter: "blur(24px)",
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="vorSteuer"
                stroke="var(--accent-violet)"
                strokeWidth={2}
                fill="url(#cfVor)"
                name="vor Steuer"
              />
              <Area
                type="monotone"
                dataKey="nachSteuer"
                stroke="var(--accent-emerald)"
                strokeWidth={2}
                fill="url(#cfNach)"
                name="nach Steuer"
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--fg-secondary)" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <GlassCard className="flex items-start gap-3 p-5 text-xs text-[var(--fg-muted)]">
        <span className="mt-0.5 rounded-md bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent-amber)]">
          Etappe 1
        </span>
        Zahlen hier sind aus einer vereinfachten Berechnung. Der vollständige Rechenkern
        (monatsgenauer Tilgungsplan, Peterssche Formel, §82b-Verteilung, §32a-Tarif,
        Sensitivität, Exit-IRR) folgt in Etappe 2.
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vereinfachte Rough-Calc nur fürs UI-Gerüst. In Etappe 2 ersetzen durch /lib/calc.
// ---------------------------------------------------------------------------

function computeRoughKpis(c: Case) {
  const jahresKaltmiete = c.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0) * 12;
  const bewirtschaftungPA =
    c.bewirtschaftung.versicherungProJahr +
    c.bewirtschaftung.sonstigeKostenProJahr +
    c.bewirtschaftung.hausverwaltungProMonatJeEinheit * 12 * c.stammdaten.einheiten.length +
    jahresKaltmiete * (c.bewirtschaftung.mietausfallwagnisProzent / 100) +
    c.kaufkosten.kaufpreis * (c.kaufkosten.aufteilung.gebaeudeProzent / 100) * 0.01;

  const nebenkostenProzent =
    c.kaufkosten.nebenkosten.grunderwerbsteuerProzent +
    c.kaufkosten.nebenkosten.notarProzent +
    c.kaufkosten.nebenkosten.grundbuchProzent +
    c.kaufkosten.nebenkosten.maklerProzent;
  const nebenkosten = c.kaufkosten.kaufpreis * (nebenkostenProzent / 100);
  const gesamtinvestition = c.kaufkosten.kaufpreis + nebenkosten;

  const darlehen = c.finanzierung.darlehen[0];
  const jahresZins = darlehen ? darlehen.betrag * (darlehen.sollzinsProzent / 100) : 0;
  const jahresTilgung = darlehen ? darlehen.betrag * (darlehen.tilgungAnfaenglichProzent / 100) : 0;
  const annuitaet = jahresZins + jahresTilgung;

  const brutto = c.kaufkosten.kaufpreis > 0 ? (jahresKaltmiete / c.kaufkosten.kaufpreis) * 100 : 0;
  const netto = gesamtinvestition > 0 ? ((jahresKaltmiete - bewirtschaftungPA) / gesamtinvestition) * 100 : 0;

  const afa = c.kaufkosten.kaufpreis * (c.kaufkosten.aufteilung.gebaeudeProzent / 100) * 0.02;
  const steuerpflichtigesEinkommen = jahresKaltmiete - bewirtschaftungPA - jahresZins - afa;
  const grenzsteuer =
    (c.steuer.grenzsteuersatzDirektProzent ?? 42) / 100;
  const steuerPA = steuerpflichtigesEinkommen * grenzsteuer;

  const cashflowPA = jahresKaltmiete - bewirtschaftungPA - annuitaet - steuerPA;
  const cashflow = cashflowPA / 12;

  const ekRendite =
    c.finanzierung.eigenkapital > 0
      ? ((cashflowPA + jahresTilgung) / c.finanzierung.eigenkapital) * 100
      : 0;

  // Rough Break-Even
  let kum = 0;
  let breakEven: number | null = null;
  for (let j = 1; j <= 30; j++) {
    kum += cashflowPA;
    if (kum >= 0 && !breakEven) breakEven = j;
  }

  const restschuld = darlehen
    ? Math.max(
        0,
        darlehen.betrag -
          jahresTilgung * darlehen.sollzinsbindungJahre *
            (1 + darlehen.sollzinsProzent / 100 / 2),
      )
    : 0;

  const ampel: "gruen" | "gelb" | "rot" =
    netto > 3 && cashflow >= 0 ? "gruen" : cashflow >= -200 ? "gelb" : "rot";

  return { brutto, netto, ekRendite, cashflow, breakEven, restschuld, ampel };
}

function buildMonthlyBreakdown(c: Case, includeTax: boolean) {
  const kaltmiete = c.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0);
  const darlehen = c.finanzierung.darlehen[0];
  const zins = darlehen ? (darlehen.betrag * (darlehen.sollzinsProzent / 100)) / 12 : 0;
  const tilgung = darlehen ? (darlehen.betrag * (darlehen.tilgungAnfaenglichProzent / 100)) / 12 : 0;
  const bewirtschaftung =
    (c.bewirtschaftung.versicherungProJahr + c.bewirtschaftung.sonstigeKostenProJahr) / 12 +
    c.bewirtschaftung.hausverwaltungProMonatJeEinheit * c.stammdaten.einheiten.length +
    kaltmiete * (c.bewirtschaftung.mietausfallwagnisProzent / 100) +
    ((c.kaufkosten.kaufpreis * (c.kaufkosten.aufteilung.gebaeudeProzent / 100)) * 0.01) / 12;

  const jahresKaltmiete = kaltmiete * 12;
  const afa = c.kaufkosten.kaufpreis * (c.kaufkosten.aufteilung.gebaeudeProzent / 100) * 0.02;
  const steuerpflichtiges =
    jahresKaltmiete - bewirtschaftung * 12 - zins * 12 - afa;
  const grenzsteuer = (c.steuer.grenzsteuersatzDirektProzent ?? 42) / 100;
  const steuerJahr = Math.max(0, steuerpflichtiges * grenzsteuer);
  const steuerMonat = includeTax ? steuerJahr / 12 : 0;

  return [
    {
      kategorie: "Monat 1",
      miete: Math.round(kaltmiete),
      zins: Math.round(zins),
      tilgung: Math.round(tilgung),
      bewirtschaftung: Math.round(bewirtschaftung),
      steuer: Math.round(steuerMonat),
    },
  ];
}

function buildRoughCashflow(c: Case, years: number) {
  const kpis = computeRoughKpis(c);
  const jahresCF = kpis.cashflow * 12;
  const jahresCFvor = jahresCF + ((c.steuer.grenzsteuersatzDirektProzent ?? 42) / 100) *
    (c.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0) * 12 * 0.3); // sehr grob

  let kumNach = 0;
  let kumVor = 0;
  return Array.from({ length: years + 1 }, (_, i) => {
    if (i > 0) {
      kumNach += jahresCF;
      kumVor += jahresCFvor;
    }
    return {
      jahr: i,
      nachSteuer: Math.round(kumNach),
      vorSteuer: Math.round(kumVor),
    };
  });
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}
function ChartCard({ title, subtitle, right, children }: ChartCardProps) {
  return (
    <GlassCard className="p-5">
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
