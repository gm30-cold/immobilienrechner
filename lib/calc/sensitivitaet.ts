import type { Case } from "@/types/case";
import { computeCase } from "./cashflow";
import type { CaseResult } from "./types";

/**
 * Welche Kennzahl soll als Impact-Metrik verwendet werden?
 */
export type SensitivitaetsKpi = "ekRendite" | "irr" | "cashflowMonat" | "kumulierterCf10J";

export interface SensitivitaetsVariable {
  key: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  apply: (c: Case, richtung: "low" | "high") => void;
}

export interface TornadoZeile {
  variable: string;
  label: string;
  lowImpact: number;   // relative Abweichung ggü. Baseline (pp bzw. €)
  highImpact: number;
  lowLabel: string;
  highLabel: string;
  baselineValue: number;
}

export interface SensitivitaetsErgebnis {
  baseline: number;
  metricLabel: string;
  zeilen: TornadoZeile[];
}

function kpiValue(r: CaseResult, kpi: SensitivitaetsKpi): number {
  switch (kpi) {
    case "ekRendite":
      return r.kpi.eigenkapitalrenditeNachSteuernProzent;
    case "irr":
      return r.exit.irrProzent ?? 0;
    case "cashflowMonat":
      return r.kpi.cashflowNachSteuernProMonat;
    case "kumulierterCf10J": {
      const idx = Math.min(9, r.cashflow.length - 1);
      return r.cashflow[idx]?.kumulierterCashflowNachSteuer ?? 0;
    }
  }
}

export function kpiLabel(kpi: SensitivitaetsKpi): string {
  switch (kpi) {
    case "ekRendite":
      return "EK-Rendite n. Steuern (%)";
    case "irr":
      return "IRR über Haltedauer (%)";
    case "cashflowMonat":
      return "Cashflow n. Steuern (€/Mo.)";
    case "kumulierterCf10J":
      return "Kumulierter CF nach 10 Jahren (€)";
  }
}

/**
 * Standard-Variablen-Set für die Sensitivitätsanalyse.
 * Jede Variable hat einen Low- und High-Pfad mit labeled Varianten.
 */
export function defaultVariablen(): SensitivitaetsVariable[] {
  return [
    {
      key: "anschlusszins",
      label: "Anschlusszins",
      lowLabel: "−2 Prozentpunkte",
      highLabel: "+2 Prozentpunkte",
      apply: (c, r) => {
        const delta = r === "low" ? -2 : 2;
        for (const d of c.finanzierung.darlehen) {
          const base = d.anschlussZinsAnnahmeProzent ?? d.sollzinsProzent + 1;
          d.anschlussZinsAnnahmeProzent = Math.max(0, base + delta);
        }
      },
    },
    {
      key: "sollzins",
      label: "Sollzins",
      lowLabel: "−1 Prozentpunkt",
      highLabel: "+1 Prozentpunkt",
      apply: (c, r) => {
        const delta = r === "low" ? -1 : 1;
        for (const d of c.finanzierung.darlehen) {
          d.sollzinsProzent = Math.max(0.1, d.sollzinsProzent + delta);
        }
      },
    },
    {
      key: "mietsteigerung",
      label: "Mietsteigerung p.a.",
      lowLabel: "0% (Stagnation)",
      highLabel: "3% p.a.",
      apply: (c, r) => {
        c.szenario.mietsteigerung.baselineProzentPA = r === "low" ? 0 : 3;
      },
    },
    {
      key: "leerstand",
      label: "Leerstandsquote",
      lowLabel: "0%",
      highLabel: "8%",
      apply: (c, r) => {
        c.szenario.leerstandProzent = r === "low" ? 0 : 8;
      },
    },
    {
      key: "kaufpreisFaktor",
      label: "Kaufpreis ±10%",
      lowLabel: "−10%",
      highLabel: "+10%",
      apply: (c, r) => {
        const f = r === "low" ? 0.9 : 1.1;
        c.kaufkosten.kaufpreis *= f;
      },
    },
    {
      key: "verkaufspreis",
      label: "Verkaufspreis ±30%",
      lowLabel: "−30%",
      highLabel: "+30%",
      apply: (c, r) => {
        const f = r === "low" ? 0.7 : 1.3;
        if (c.exit.verkaufspreisModus === "fixWert" && c.exit.verkaufspreisFix != null) {
          c.exit.verkaufspreisFix *= f;
        } else {
          // Wertsteigerung-Modus: wir verstellen stattdessen die Wertsteigerungs-Annahme
          const base = c.exit.wertsteigerungProzentPA ?? 1.5;
          c.exit.wertsteigerungProzentPA =
            r === "low" ? Math.max(-5, base - 3) : base + 3;
        }
      },
    },
    {
      key: "instandhaltung",
      label: "Instandhaltung ±50%",
      lowLabel: "−50%",
      highLabel: "+50%",
      apply: (c, r) => {
        const f = r === "low" ? 0.5 : 1.5;
        if (c.bewirtschaftung.ruecklageModus === "prozent") {
          c.bewirtschaftung.ruecklageProzentGebaeudewert =
            (c.bewirtschaftung.ruecklageProzentGebaeudewert ?? 1) * f;
        } else {
          // bei Peterssche Formel kippen wir auf Prozent-Modus mit entsprechend skaliertem Default
          c.bewirtschaftung.ruecklageModus = "prozent";
          c.bewirtschaftung.ruecklageProzentGebaeudewert = 1.875 * f;
        }
      },
    },
  ];
}

export function berechneSensitivitaet(
  c: Case,
  kpi: SensitivitaetsKpi = "ekRendite",
  variablen: SensitivitaetsVariable[] = defaultVariablen(),
): SensitivitaetsErgebnis {
  const baselineResult = computeCase(c, 30);
  const baseline = kpiValue(baselineResult, kpi);

  const zeilen: TornadoZeile[] = variablen.map((v) => {
    const lowCase = structuredClone(c);
    v.apply(lowCase, "low");
    const lowResult = computeCase(lowCase, 30);
    const lowVal = kpiValue(lowResult, kpi);

    const highCase = structuredClone(c);
    v.apply(highCase, "high");
    const highResult = computeCase(highCase, 30);
    const highVal = kpiValue(highResult, kpi);

    return {
      variable: v.key,
      label: v.label,
      lowImpact: lowVal - baseline,
      highImpact: highVal - baseline,
      lowLabel: v.lowLabel,
      highLabel: v.highLabel,
      baselineValue: baseline,
    };
  });

  // Sortiere absteigend nach absoluter Spanne für Tornado-Look
  zeilen.sort((a, b) => {
    const spanA = Math.abs(a.highImpact - a.lowImpact);
    const spanB = Math.abs(b.highImpact - b.lowImpact);
    return spanB - spanA;
  });

  return {
    baseline,
    metricLabel: kpiLabel(kpi),
    zeilen,
  };
}
