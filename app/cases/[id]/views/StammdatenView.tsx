"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BUNDESLAND_LABEL } from "@/data/bundeslaender";
import type { Case } from "@/types/case";
import { formatCurrency, formatNumber } from "@/lib/cn";

export function StammdatenView({ caseItem }: { caseItem: Case }) {
  const s = caseItem.stammdaten;
  const gesamtQm = s.einheiten.reduce((a, e) => a + e.qm, 0);
  const gesamtKaltmiete = s.einheiten.reduce((a, e) => a + e.kaltmiete, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Objekt</h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <Label>Objekttyp</Label>
          <Value>{s.objekttyp}</Value>
          <Label>Baujahr</Label>
          <Value>{s.baujahr}</Value>
          <Label>Straße</Label>
          <Value>{s.adresse.strasse || "—"}</Value>
          <Label>PLZ · Ort</Label>
          <Value>
            {s.adresse.plz || "—"} {s.adresse.ort || "—"}
          </Value>
          <Label>Bundesland</Label>
          <Value>{BUNDESLAND_LABEL[s.adresse.bundesland]}</Value>
        </dl>
        <p className="mt-5 border-t border-white/5 pt-4 text-xs text-[var(--fg-muted)]">
          Formulare kommen in Etappe 3 — diese Ansicht zeigt aktuell die Default-Werte.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Einheiten</h2>
          <span className="font-mono text-xs text-[var(--fg-muted)]">
            {s.einheiten.length} {s.einheiten.length === 1 ? "Einheit" : "Einheiten"} ·{" "}
            {formatNumber(gesamtQm)} m² · {formatCurrency(gesamtKaltmiete)}/Mo.
          </span>
        </div>

        <div className="space-y-2">
          {s.einheiten.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{e.bezeichnung}</div>
                <div className="font-mono text-xs text-[var(--fg-muted)]">
                  {e.qm} m² · Geschoss {e.geschoss} · {e.status}
                </div>
              </div>
              <div className="font-mono text-sm font-semibold">
                {formatCurrency(e.kaltmiete)}/Mo.
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <dt className="text-[var(--fg-muted)]">{children}</dt>;
}
function Value({ children }: { children: React.ReactNode }) {
  return <dd className="font-medium">{children}</dd>;
}
