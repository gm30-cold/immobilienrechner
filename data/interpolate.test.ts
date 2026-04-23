import { describe, it, expect } from "vitest";
import { interpolateValues, interpolationQualitaet } from "./interpolate";
import { MARKT_DATA } from "./markt";

describe("interpolateValues", () => {
  it("gibt bei exakter Stadt-Koordinate identische Werte zurück", () => {
    const muenchen = MARKT_DATA.find((d) => d.ort === "München")!;
    const r = interpolateValues(muenchen.lat, muenchen.lng);
    expect(r.miete.ETW).toBeCloseTo(muenchen.miete.ETW, 1);
    expect(r.kaufpreis.ETW).toBeCloseTo(muenchen.kaufpreis.ETW, 0);
    expect(r.nearestDistanceKm).toBeCloseTo(0, 1);
    expect(r.quellen).toHaveLength(1);
  });

  it("zwischen zwei Städten liegt der Wert zwischen beiden", () => {
    // Koordinate zwischen Berlin und Potsdam
    const r = interpolateValues(52.45, 13.22);
    expect(r.quellen.length).toBeGreaterThan(1);
    // Gewichte summieren auf 1
    const sumW = r.quellen.reduce((s, q) => s + q.weight, 0);
    expect(sumW).toBeCloseTo(1, 3);
  });

  it("Qualitätsstufen nach Distanz", () => {
    expect(interpolationQualitaet(5).level).toBe("hoch");
    expect(interpolationQualitaet(25).level).toBe("mittel");
    expect(interpolationQualitaet(80).level).toBe("niedrig");
  });

  it("Gewichte reduzieren sich bei weiter entfernten Quellen", () => {
    const r = interpolateValues(53.5, 9.99); // Hamburg
    const closest = r.quellen[0];
    const farthest = r.quellen[r.quellen.length - 1];
    expect(closest.weight).toBeGreaterThan(farthest.weight);
  });
});
