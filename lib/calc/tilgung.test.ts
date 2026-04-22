import { describe, it, expect } from "vitest";
import { berechneTilgungsplan, berechneTilgungsplanDarlehen, gewichteteTilgungAnfaenglich } from "./tilgung";
import type { Darlehen, Finanzierung } from "@/types/case";

const dk: Darlehen = {
  id: "1",
  bezeichnung: "Bank",
  betrag: 300000,
  sollzinsProzent: 4.0,
  tilgungAnfaenglichProzent: 2.0,
  sollzinsbindungJahre: 10,
};

describe("Annuitätenplan — Einzeldarlehen", () => {
  const zeilen = berechneTilgungsplanDarlehen(dk);

  it("zahlt im 1. Monat korrekten Zinsanteil", () => {
    // Zins Monat 1 = 300.000 × 4% / 12 = 1000
    expect(zeilen[0].zins).toBeCloseTo(1000, 0);
  });

  it("Anfangs-Annuität ~= 300.000 × 6% / 12 = 1500", () => {
    expect(zeilen[0].annuitaet).toBeCloseTo(1500, 0);
  });

  it("Tilgungsanteil steigt über Zeit", () => {
    expect(zeilen[11].tilgung).toBeGreaterThan(zeilen[0].tilgung);
  });

  it("Restschuld monoton fallend", () => {
    for (let i = 1; i < Math.min(zeilen.length, 60); i++) {
      expect(zeilen[i].restschuld).toBeLessThanOrEqual(zeilen[i - 1].restschuld + 0.01);
    }
  });

  it("tilgt vollständig innerhalb des Cutoff-Horizonts", () => {
    const last = zeilen[zeilen.length - 1];
    expect(last.restschuld).toBeCloseTo(0, 0);
  });
});

describe("Anschlussfinanzierung", () => {
  it("schaltet Zinssatz nach Bindungsende um", () => {
    const withAnschluss: Darlehen = {
      ...dk,
      sollzinsbindungJahre: 5,
      anschlussZinsAnnahmeProzent: 6.0,
    };
    const zeilen = berechneTilgungsplanDarlehen(withAnschluss);
    const monat60 = zeilen[59]; // letzter Monat der Bindung
    const monat61 = zeilen[60]; // erster nach Bindung
    // Nach Umschaltung sollte Zinsanteil sprunghaft steigen
    expect(monat61.zins).toBeGreaterThan(monat60.zins);
  });
});

describe("Aggregation Multi-Darlehen", () => {
  const fin: Finanzierung = {
    eigenkapital: 100000,
    darlehen: [
      dk,
      { ...dk, id: "2", betrag: 100000, sollzinsProzent: 2.5, tilgungAnfaenglichProzent: 3 },
    ],
  };

  it("summiert Zins und Tilgung über alle Darlehen", () => {
    const plan = berechneTilgungsplan(fin);
    const jahr1 = plan.aggregiertJahr[0];
    // Jahr 1 Zins ~ 300k×4% + 100k×2.5% − minimaler Tilgungseffekt ≈ 14500
    expect(jahr1.zins).toBeGreaterThan(13500);
    expect(jahr1.zins).toBeLessThan(14500);
  });

  it("berechnet gewichtete Anfangstilgung korrekt", () => {
    // (300k × 2 + 100k × 3) / 400k = 2.25
    expect(gewichteteTilgungAnfaenglich(fin)).toBeCloseTo(2.25, 2);
  });

  it("Restschuld nach Zinsbindung > 0 bei 10J/2%", () => {
    const plan = berechneTilgungsplan(fin);
    expect(plan.restschuldNachZinsbindung).toBeGreaterThan(0);
    expect(plan.restschuldNachZinsbindung).toBeLessThan(400000);
  });
});
