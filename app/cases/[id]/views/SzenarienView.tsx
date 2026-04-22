"use client";

import type { Case } from "@/types/case";
import { useCasesStore } from "@/lib/store";
import {
  Field,
  PercentInput,
  NumberInput,
  Section,
  Checkbox,
  Select,
} from "@/components/forms/inputs";
import { GlassCard } from "@/components/ui/GlassCard";
import { berechneMietprojektion, berechneSensitivitaet, kpiLabel, type SensitivitaetsKpi } from "@/lib/calc";
import { TornadoChart } from "@/components/ui/TornadoChart";
import { formatCurrency } from "@/lib/cn";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SzenarienView({ caseItem }: { caseItem: Case }) {
  const mutate = useCasesStore((s) => s.mutateCase);
  const upd = (fn: (c: Case) => void) => mutate(caseItem.id, fn);

  const proj = berechneMietprojektion(caseItem, 30);
  const [sensiKpi, setSensiKpi] = useState<SensitivitaetsKpi>("ekRendite");
  const sensi = useMemo(() => berechneSensitivitaet(caseItem, sensiKpi), [caseItem, sensiKpi]);
  const sensiUnit = sensiKpi === "cashflowMonat" || sensiKpi === "kumulierterCf10J" ? "currency" : "percent";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Section title="Leerstand">
          <Field
            label="Leerstandsquote"
            tooltip="Pauschaler %-Satz, um den die erwartete Kaltmiete reduziert wird. Konservativ: 2–5% je nach Lage. Bei Problem-Standorten bis 8%."
          >
            <PercentInput
              value={caseItem.szenario.leerstandProzent}
              onChange={(v) => upd((c) => { c.szenario.leerstandProzent = v; })}
            />
          </Field>
        </Section>

        <Section
          title="Sensitivität"
          description="Welche Annahme trifft deinen Case am stärksten? Je breiter der Balken, desto größer der Impact."
        >
          <div className="mb-5">
            <Field label="Metrik">
              <Select<SensitivitaetsKpi>
                value={sensiKpi}
                onChange={setSensiKpi}
                options={[
                  { value: "ekRendite", label: kpiLabel("ekRendite") },
                  { value: "irr", label: kpiLabel("irr") },
                  { value: "cashflowMonat", label: kpiLabel("cashflowMonat") },
                  { value: "kumulierterCf10J", label: kpiLabel("kumulierterCf10J") },
                ]}
              />
            </Field>
          </div>
          <TornadoChart data={sensi} unit={sensiUnit} />
        </Section>

        <Section
          title="Mietsteigerung"
          description="Dreistufiges Modell: Baseline + Mieterwechsel + Kappungsgrenzen-Check."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Baseline-Steigerung p.a."
              tooltip="Jährliche Anpassung laufender Mietverträge (z.B. Staffel- oder Indexmiete). Realistisch: 1–2%. Historisch langfristiger Schnitt ≈ 1,5%."
            >
              <PercentInput
                value={caseItem.szenario.mietsteigerung.baselineProzentPA}
                onChange={(v) => upd((c) => { c.szenario.mietsteigerung.baselineProzentPA = v; })}
              />
            </Field>
            <Field
              label="Mieterwechsel alle … Jahre"
              tooltip="Durchschnittlicher Abstand zwischen Mieterwechseln. Bei Wechsel darf neu vermietet werden — Sprung auf Marktmiete. Typisch: 6–10 Jahre. Bei 0 wird das Modell deaktiviert."
            >
              <NumberInput
                value={caseItem.szenario.mietsteigerung.mieterwechselAlleJahre}
                onChange={(v) => upd((c) => { c.szenario.mietsteigerung.mieterwechselAlleJahre = Math.round(v); })}
                unit="J."
                min={0}
                max={20}
              />
            </Field>
            <Field
              label="Marktmiete-Uplift bei Wechsel"
              tooltip="Wie viel % über der aktuellen Miete du bei Neuvermietung ansetzen kannst. Wird durch Kappungsgrenze begrenzt wenn aktiv."
            >
              <PercentInput
                value={caseItem.szenario.mietsteigerung.marktmieteUpliftProzent}
                onChange={(v) => upd((c) => { c.szenario.mietsteigerung.marktmieteUpliftProzent = v; })}
              />
            </Field>
            <Field
              label="Kappungsgrenze prüfen"
              tooltip="§558 Abs. 3 BGB: In angespannten Wohnungsmärkten darf die Miete in 3 Jahren um max. 15% steigen (sonst 20%). Tool begrenzt Sprünge automatisch."
            >
              <div className="flex h-10 items-center">
                <Checkbox
                  checked={caseItem.szenario.mietsteigerung.kappungsgrenzeAktiv}
                  onChange={(v) => upd((c) => { c.szenario.mietsteigerung.kappungsgrenzeAktiv = v; })}
                  label="+15% in 3 Jahren als Obergrenze"
                />
              </div>
            </Field>
          </div>
        </Section>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <GlassCard strong className="overflow-hidden p-5">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--fg-muted)]">
            Mietprojektion (brutto)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={proj.map((p) => ({ jahr: p.jahr, miete: Math.round(p.bruttoKaltmiete) }))}>
              <defs>
                <linearGradient id="mp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="jahr" stroke="var(--fg-muted)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--fg-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-glass-strong)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12,
                  backdropFilter: "blur(24px)",
                }}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Area type="monotone" dataKey="miete" stroke="var(--accent-emerald)" strokeWidth={2} fill="url(#mp)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <div className="text-[var(--fg-muted)]">Jahr 1</div>
              <div className="mt-1 font-semibold">{formatCurrency(proj[0]?.bruttoKaltmiete ?? 0)}</div>
            </div>
            <div>
              <div className="text-[var(--fg-muted)]">Jahr 30</div>
              <div className="mt-1 font-semibold">{formatCurrency(proj[proj.length - 1]?.bruttoKaltmiete ?? 0)}</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
