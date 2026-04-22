import { describe, it, expect } from "vitest";
import { linearerAfASatz, berechneAfA } from "./afa";
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

  it("Denkmal §7i: 9% Jahre 1-8, 7% Jahre 9-12", () => {
    const c = makeDefaultCase();
    c.kaufkosten.kaufpreis = 400000;
    c.steuer.denkmalAfA = { aktiv: true, qualifizierenderBetrag: 100000 };
    const afa = berechneAfA(c);
    expect(afa.proJahr(5) - afa.linear).toBeCloseTo(9000, 2);
    expect(afa.proJahr(10) - afa.linear).toBeCloseTo(7000, 2);
    expect(afa.proJahr(13) - afa.linear).toBeCloseTo(0, 2);
  });
});
