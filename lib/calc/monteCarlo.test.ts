import { describe, it, expect } from "vitest";
import {
  mulberry32,
  randomNormalTrunc,
  randomTriangular,
  percentile,
} from "./random";
import { runMonteCarlo } from "./monteCarlo";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("RNG", () => {
  it("mulberry32 ist deterministisch bei gleichem Seed", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBeCloseTo(b(), 10);
    }
  });

  it("randomNormalTrunc hält sich an Grenzen", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = randomNormalTrunc(rand, 5, 2, 0, 10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("randomTriangular hält sich an [min, max]", () => {
    const rand = mulberry32(11);
    for (let i = 0; i < 1000; i++) {
      const v = randomTriangular(rand, 2, 5, 10);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it("percentile", () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(sorted, 0.5)).toBeCloseTo(5.5, 2);
    expect(percentile(sorted, 0.1)).toBeCloseTo(1.9, 2);
    expect(percentile(sorted, 0.9)).toBeCloseTo(9.1, 2);
  });
});

describe("runMonteCarlo", () => {
  it("liefert konsistente Struktur mit N Durchläufen", async () => {
    const c = makeDefaultCase();
    const r = await runMonteCarlo(c, { runs: 200, seed: 42 });
    expect(r.runs).toBe(200);
    expect(r.irr.histogram.length).toBeGreaterThan(0);
    expect(r.wahrscheinlichkeiten.cashflowPositivJ1).toBeGreaterThanOrEqual(0);
    expect(r.wahrscheinlichkeiten.cashflowPositivJ1).toBeLessThanOrEqual(1);
  });

  it("P10 ≤ Median ≤ P90", async () => {
    const c = makeDefaultCase();
    const r = await runMonteCarlo(c, { runs: 300, seed: 99 });
    expect(r.irr.p10).toBeLessThanOrEqual(r.irr.median);
    expect(r.irr.median).toBeLessThanOrEqual(r.irr.p90);
  });

  it("reproduzierbar mit gleichem Seed", async () => {
    const c = makeDefaultCase();
    const a = await runMonteCarlo(c, { runs: 100, seed: 1 });
    const b = await runMonteCarlo(c, { runs: 100, seed: 1 });
    expect(a.irr.median).toBeCloseTo(b.irr.median, 5);
    expect(a.irr.p10).toBeCloseTo(b.irr.p10, 5);
  });
});
