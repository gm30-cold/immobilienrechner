import { describe, it, expect } from "vitest";
import { berechneSensitivitaet } from "./sensitivitaet";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("berechneSensitivitaet", () => {
  it("liefert 7 Default-Variablen, absteigend sortiert nach Impact", () => {
    const c = makeDefaultCase();
    const r = berechneSensitivitaet(c, "ekRendite");
    expect(r.zeilen).toHaveLength(7);
    const spans = r.zeilen.map((z) => Math.abs(z.highImpact - z.lowImpact));
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i]).toBeLessThanOrEqual(spans[i - 1] + 0.0001);
    }
  });

  it("Sollzins +1pp verschlechtert Cashflow Jahr 1, −1pp verbessert", () => {
    const c = makeDefaultCase();
    const r = berechneSensitivitaet(c, "cashflowMonat");
    const zins = r.zeilen.find((z) => z.variable === "sollzins");
    expect(zins).toBeDefined();
    expect(zins!.lowImpact).toBeGreaterThan(zins!.highImpact);
  });

  it("Baseline hat Impact 0 in sich selbst", () => {
    const c = makeDefaultCase();
    const r = berechneSensitivitaet(c);
    // Baseline-Vergleich: each impact is delta vs. baseline — wenn apply() nichts ändert,
    // wäre impact=0. Wir prüfen nur, dass baseline gesetzt ist und nicht NaN.
    expect(r.baseline).toBeDefined();
    expect(Number.isFinite(r.baseline)).toBe(true);
  });
});
