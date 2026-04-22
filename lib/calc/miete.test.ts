import { describe, it, expect } from "vitest";
import { berechneMietprojektion } from "./miete";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("berechneMietprojektion", () => {
  it("Baseline-Steigerung erhöht Miete jährlich", () => {
    const c = makeDefaultCase();
    c.stammdaten.einheiten = [
      { id: "1", bezeichnung: "WE", qm: 70, geschoss: 1, kaltmiete: 1000, status: "vermietet" },
    ];
    c.szenario.mietsteigerung = {
      baselineProzentPA: 2,
      mieterwechselAlleJahre: 0, // aus
      marktmieteUpliftProzent: 0,
      kappungsgrenzeAktiv: false,
    };
    c.szenario.leerstandProzent = 0;

    const p = berechneMietprojektion(c, 5);
    // Jahr 1: 12.000
    expect(p[0].bruttoKaltmiete).toBeCloseTo(12000, 2);
    // Jahr 2: 12.000 × 1.02 = 12.240
    expect(p[1].bruttoKaltmiete).toBeCloseTo(12240, 2);
  });

  it("Leerstandsquote reduziert effektive Miete", () => {
    const c = makeDefaultCase();
    c.stammdaten.einheiten = [
      { id: "1", bezeichnung: "WE", qm: 70, geschoss: 1, kaltmiete: 1000, status: "vermietet" },
    ];
    c.szenario.mietsteigerung = {
      baselineProzentPA: 0,
      mieterwechselAlleJahre: 0,
      marktmieteUpliftProzent: 0,
      kappungsgrenzeAktiv: false,
    };
    c.szenario.leerstandProzent = 5;

    const p = berechneMietprojektion(c, 3);
    expect(p[0].bruttoKaltmiete).toBeCloseTo(12000, 2);
    expect(p[0].leerstandAbzug).toBeCloseTo(600, 2);
    expect(p[0].kaltmiete).toBeCloseTo(11400, 2);
  });

  it("Kappungsgrenze (+15%/3J) begrenzt starke Sprünge", () => {
    const c = makeDefaultCase();
    c.stammdaten.einheiten = [
      { id: "1", bezeichnung: "WE", qm: 70, geschoss: 1, kaltmiete: 1000, status: "vermietet" },
    ];
    c.szenario.mietsteigerung = {
      baselineProzentPA: 0,
      mieterwechselAlleJahre: 3, // Wechsel in Jahr 4
      marktmieteUpliftProzent: 30, // würde +30% sein
      kappungsgrenzeAktiv: true,
    };
    c.szenario.leerstandProzent = 0;

    const p = berechneMietprojektion(c, 5);
    // Jahr 4: max +15% ggü. Jahr 1
    expect(p[3].bruttoKaltmiete).toBeLessThanOrEqual(12000 * 1.15 + 0.01);
  });
});
