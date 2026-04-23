import type { Case } from "@/types/case";
import { computeCase } from "./cashflow";
import {
  mulberry32,
  randomNormalTrunc,
  randomTriangular,
  percentile,
} from "./random";

// ---------------------------------------------------------------------------
// Monte-Carlo-Simulation.
// Für jede der N Iterationen werden aus Verteilungen zufällige Werte für die
// Schlüsselvariablen gezogen und der Case neu durchgerechnet. Ergebnis:
// Verteilung der Zielkennzahlen + abgeleitete Risikomaße.
// ---------------------------------------------------------------------------

export interface MonteCarloConfig {
  runs: number;
  seed?: number;
  sigmaSollzinsPP: number;        // Streuung Sollzins ±
  sigmaAnschlusszinsPP: number;   // Streuung Anschlusszins ±
  sigmaMietsteigerungPP: number;  // Streuung Baseline-Miete ±
  leerstandMax: number;           // Triangular max %
  sigmaWertsteigerungPP: number;  // Streuung Wertsteigerung ±
  instandhaltungModeMulti: number; // Triangular around 1.0
}

export const DEFAULT_MC_CONFIG: MonteCarloConfig = {
  runs: 3000,
  seed: 42,
  sigmaSollzinsPP: 0.5,
  sigmaAnschlusszinsPP: 1.5,
  sigmaMietsteigerungPP: 0.7,
  leerstandMax: 10,
  sigmaWertsteigerungPP: 1.5,
  instandhaltungModeMulti: 1.0,
};

export interface MonteCarloRunResult {
  irr: number;                             // %
  ekRendite: number;                       // %
  cashflowMonatJ1: number;                 // €
  kumCashflow10J: number;                  // €
  restschuld15J: number;                   // €
  nettoerloesExit: number;                 // €
}

export interface MonteCarloErgebnis {
  runs: number;
  irr: MetricSummary;
  ekRendite: MetricSummary;
  cashflowMonatJ1: MetricSummary;
  kumCashflow10J: MetricSummary;
  nettoerloesExit: MetricSummary;
  wahrscheinlichkeiten: {
    cashflowPositivJ1: number;        // 0-1
    kumCashflowPositivNach10J: number; // 0-1
    irrUeber4Prozent: number;          // 0-1
    irrUnterNull: number;              // 0-1
  };
}

export interface MetricSummary {
  mean: number;
  median: number;
  p10: number;
  p50: number;
  p90: number;
  min: number;
  max: number;
  histogram: { bucket: number; count: number; label: string }[];
}

function summarize(values: number[], bucketCount = 24): MetricSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const span = max - min || 1;
  const step = span / bucketCount;

  const histogram: MetricSummary["histogram"] = [];
  for (let i = 0; i < bucketCount; i++) {
    const lo = min + i * step;
    const hi = lo + step;
    const count = values.filter((v) => v >= lo && (i === bucketCount - 1 ? v <= hi : v < hi)).length;
    histogram.push({ bucket: lo + step / 2, count, label: `${lo.toFixed(1)}–${hi.toFixed(1)}` });
  }

  return {
    mean,
    median: percentile(sorted, 0.5),
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    min,
    max,
    histogram,
  };
}

function runOne(c: Case, cfg: MonteCarloConfig, rand: () => number): MonteCarloRunResult {
  const draft: Case = structuredClone(c);

  // Sollzins pro Darlehen leicht streuen
  for (const d of draft.finanzierung.darlehen) {
    d.sollzinsProzent = randomNormalTrunc(
      rand,
      d.sollzinsProzent,
      cfg.sigmaSollzinsPP,
      0.5,
      12,
    );
    if (d.anschlussZinsAnnahmeProzent != null) {
      d.anschlussZinsAnnahmeProzent = randomNormalTrunc(
        rand,
        d.anschlussZinsAnnahmeProzent,
        cfg.sigmaAnschlusszinsPP,
        0.5,
        14,
      );
    }
  }

  // Mietsteigerung
  draft.szenario.mietsteigerung.baselineProzentPA = randomNormalTrunc(
    rand,
    draft.szenario.mietsteigerung.baselineProzentPA,
    cfg.sigmaMietsteigerungPP,
    -1,
    5,
  );

  // Leerstand — Triangular, mode = aktueller Wert
  draft.szenario.leerstandProzent = randomTriangular(
    rand,
    0,
    draft.szenario.leerstandProzent,
    cfg.leerstandMax,
  );

  // Wertsteigerung Exit
  if (draft.exit.verkaufspreisModus === "wertsteigerungProzent") {
    draft.exit.wertsteigerungProzentPA = randomNormalTrunc(
      rand,
      draft.exit.wertsteigerungProzentPA ?? 1.5,
      cfg.sigmaWertsteigerungPP,
      -5,
      8,
    );
  }

  // Instandhaltungs-Multiplikator (Triangular 0.5 / mode=1 / 1.7)
  const maintMulti = randomTriangular(rand, 0.5, cfg.instandhaltungModeMulti, 1.7);
  if (draft.bewirtschaftung.ruecklageModus === "prozent") {
    draft.bewirtschaftung.ruecklageProzentGebaeudewert =
      (draft.bewirtschaftung.ruecklageProzentGebaeudewert ?? 1) * maintMulti;
  } else {
    draft.bewirtschaftung.ruecklageModus = "prozent";
    draft.bewirtschaftung.ruecklageProzentGebaeudewert = 1.875 * maintMulti;
  }

  const r = computeCase(draft, 30);
  const j10 = r.cashflow[Math.min(9, r.cashflow.length - 1)];
  const j15 = r.cashflow[Math.min(14, r.cashflow.length - 1)];

  return {
    irr: r.exit.irrProzent ?? 0,
    ekRendite: r.kpi.eigenkapitalrenditeNachSteuernProzent,
    cashflowMonatJ1: r.kpi.cashflowNachSteuernProMonat,
    kumCashflow10J: j10?.kumulierterCashflowNachSteuer ?? 0,
    restschuld15J: j15?.restschuldEnde ?? 0,
    nettoerloesExit: r.exit.nettoerloes,
  };
}

/**
 * Asynchrones Chunk-Runner: blockiert den UI-Thread nicht.
 * `onProgress` wird in 5%-Schritten aufgerufen.
 */
export async function runMonteCarlo(
  c: Case,
  config: Partial<MonteCarloConfig> = {},
  onProgress?: (p: number) => void,
): Promise<MonteCarloErgebnis> {
  const cfg = { ...DEFAULT_MC_CONFIG, ...config };
  const rand = mulberry32(cfg.seed ?? Math.floor(Math.random() * 2 ** 31));

  const results: MonteCarloRunResult[] = [];
  const chunkSize = 100;
  const total = cfg.runs;
  let lastProgressPct = -1;

  for (let i = 0; i < total; i += chunkSize) {
    for (let j = i; j < Math.min(i + chunkSize, total); j++) {
      results.push(runOne(c, cfg, rand));
    }
    const pct = Math.floor(((i + chunkSize) / total) * 100);
    if (pct !== lastProgressPct && onProgress) {
      onProgress(Math.min(pct, 100) / 100);
      lastProgressPct = pct;
    }
    // yield to UI thread
    await new Promise((r) => setTimeout(r, 0));
  }

  const irrs = results.map((r) => r.irr);
  const eks = results.map((r) => r.ekRendite);
  const cfM = results.map((r) => r.cashflowMonatJ1);
  const kumCF10 = results.map((r) => r.kumCashflow10J);
  const nettos = results.map((r) => r.nettoerloesExit);

  return {
    runs: total,
    irr: summarize(irrs),
    ekRendite: summarize(eks),
    cashflowMonatJ1: summarize(cfM),
    kumCashflow10J: summarize(kumCF10),
    nettoerloesExit: summarize(nettos),
    wahrscheinlichkeiten: {
      cashflowPositivJ1: cfM.filter((v) => v >= 0).length / total,
      kumCashflowPositivNach10J: kumCF10.filter((v) => v >= 0).length / total,
      irrUeber4Prozent: irrs.filter((v) => v > 4).length / total,
      irrUnterNull: irrs.filter((v) => v < 0).length / total,
    },
  };
}
