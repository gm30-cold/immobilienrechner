import { describe, it, expect } from "vitest";
import { linearerAfASatz, effektiverAfASatz, berechneAfA } from "./afa";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("linearer AfA-Satz nach Baujahr", () => {
  it("2% für Bestand ab 1925", () => {
    expect(linearerAfASatz(1995)).toBe(2.0);
  });
  it("2,5% für Altbau vor 1925", () => {
    expect(linearerAfASatz(1910)).toBe(2.5);
  });
  it("3% für Neubau ab 2023", () => {
    expect(linearerAfASatz(2024)).toBe(3.0);
  });
});

describe("berechneAfA", () => {
  it("rechnet lineare AfA auf Gebäudewert", () => {
    const c = makeDefaultCase();
    c.kaufkosten.kaufpreis = 400000;
    c.kaufkosten.aufteilung = { grundProzent: 20, gebaeudeProzent: 80 };
    c.stammdaten.baujahr = 1995;
    const afa = berechneAfA(c);
    // 320.000 × 2% = 6400
    expect(afa.linear).toBeCloseTo(6400, 2);
    expect(afa.proJahr(1)).toBeCloseTo(6400, 2);
  });

  it("§7b Sonder-AfA addiert 5% in Jahren 1-4", () => {
    const c = makeDefaultCase();
    c.stammdaten.baujahr = 1995;
    c.kaufkosten.kaufpreis = 400000;
    c.kaufkosten.aufteilung = { grundProzent: 20, gebaeudeProzent: 80 };
    c.steuer.sonderAfA = { aktiv: true, qualifizierenderBetrag: 200000 };
    const afa = berechneAfA(c);
    // linear 6400 + Sonder 10.000 = 16.400
    expect(afa.proJahr(1)).toBeCloseTo(16400, 2);
    expect(afa.proJahr(4)).toBeCloseTo(16400, 2);
    // Jahr 5: nur linear
    expect(afa.proJahr(5)).toBeCloseTo(6400, 2);
  });

  it("Restnutzungsdauer-Modus: Satz = 100 / RND (§7 Abs. 4 S. 2)", () => {
    const c = makeDefaultCase();
    c.stammdaten.baujahr = 1960;
    c.steuer.afaModus = "restnutzungsdauer";
    c.steuer.restnutzungsdauerJahre = 25;
    expect(effektiverAfASatz(c)).toBeCloseTo(4.0, 6);

    c.kaufkosten.kaufpreis = 400000;
    c.kaufkosten.aufteilung = { grundProzent: 20, gebaeudeProzent: 80 };
    const afa = berechneAfA(c);
    // 320.000 × 4% = 12.800
    expect(afa.linear).toBeCloseTo(12800, 2);
    expect(afa.proJahr(1)).toBeCloseTo(12800, 2);
  });

  it("Restnutzungsdauer-Modus: AfA endet nach Ablauf der RND", () => {
    const c = makeDefaultCase();
    c.stammdaten.baujahr = 1960;
    c.kaufkosten.kaufpreis = 400000;
    c.kaufkosten.aufteilung = { grundProzent: 20, gebaeudeProzent: 80 };
    c.steuer.afaModus = "restnutzungsdauer";
    c.steuer.restnutzungsdauerJahre = 25;
    const afa = berechneAfA(c);
    expect(afa.proJahr(25)).toBeCloseTo(12800, 2);
    expect(afa.proJahr(26)).toBeCloseTo(0, 2);
    // Summe über alle Jahre = voller Gebäudewert
    let sum = 0;
    for (let j = 1; j <= 30; j++) sum += afa.proJahr(j);
    expect(sum).toBeCloseTo(320000, 2);
  });

  it("ohne afaModus (Alt-Cases) bleibt der Baujahr-Satz aktiv", () => {
    const c = makeDefaultCase();
    c.stammdaten.baujahr = 1995;
    c.steuer.restnutzungsdauerJahre = 25; // gesetzt, aber Modus nicht aktiv
    expect(effektiverAfASatz(c)).toBe(2.0);
  });

  it("Denkmal §7i: 9% Jahre 1-8, 7% Jahre 9-12", () => {
    const c = makeDefaultCase();
    c.stammdaten.baujahr = 1995;
    c.kaufkosten.kaufpreis = 400000;
    c.steuer.denkmalAfA = { aktiv: true, qualifizierenderBetrag: 100000 };
    const afa = berechneAfA(c);
    expect(afa.proJahr(5) - afa.linear).toBeCloseTo(9000, 2);
    expect(afa.proJahr(10) - afa.linear).toBeCloseTo(7000, 2);
    expect(afa.proJahr(13) - afa.linear).toBeCloseTo(0, 2);
  });
});
