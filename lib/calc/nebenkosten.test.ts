import { describe, it, expect } from "vitest";
import { berechneNebenkosten, berechneGesamtinvestition, berechneWertaufteilung } from "./nebenkosten";
import type { Kaufkosten } from "@/types/case";

const kaufkosten: Kaufkosten = {
  kaufpreis: 400000,
  nebenkosten: {
    grunderwerbsteuerProzent: 6.5, // NW
    notarProzent: 1.5,
    grundbuchProzent: 0.5,
    maklerProzent: 3.57,
  },
  sanierung: [
    { id: "1", bezeichnung: "Bad", betrag: 20000, typ: "anschaffungsnah" },
    { id: "2", bezeichnung: "Malerarbeiten", betrag: 5000, typ: "erhaltungsaufwand", verteilungJahre: 3 },
  ],
  aufteilung: { grundProzent: 20, gebaeudeProzent: 80 },
};

describe("berechneNebenkosten", () => {
  it("rechnet alle Einzelpositionen korrekt", () => {
    const r = berechneNebenkosten(kaufkosten);
    expect(r.grunderwerbsteuer).toBeCloseTo(26000, 2);
    expect(r.notar).toBeCloseTo(6000, 2);
    expect(r.grundbuch).toBeCloseTo(2000, 2);
    expect(r.makler).toBeCloseTo(14280, 2);
    expect(r.summe).toBeCloseTo(48280, 2);
    expect(r.summeProzent).toBeCloseTo(12.07, 1);
  });
});

describe("berechneGesamtinvestition", () => {
  it("addiert Kaufpreis, Nebenkosten und Sanierung", () => {
    // 400.000 + 48.280 + 25.000 = 473.280
    expect(berechneGesamtinvestition(kaufkosten)).toBeCloseTo(473280, 2);
  });
});

describe("berechneWertaufteilung", () => {
  it("aktiviert anschaffungsnahe Sanierung im Gebäudewert", () => {
    const r = berechneWertaufteilung(kaufkosten);
    expect(r.bodenwert).toBeCloseTo(80000, 2);
    // 80% von 400k + 20k aktivierte Sanierung
    expect(r.gebaeudewert).toBeCloseTo(320000 + 20000, 2);
    expect(r.aktivierteSanierung).toBeCloseTo(20000, 2);
  });
});
