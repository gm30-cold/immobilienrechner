import { describe, it, expect } from "vitest";
import { computeCase, monatsBreakdownJahr1 } from "./cashflow";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("computeCase — Sanity-Checks", () => {
  const c = makeDefaultCase();
  c.stammdaten.einheiten = [
    { id: "1", bezeichnung: "WE 1", qm: 75, geschoss: 1, kaltmiete: 1200, status: "vermietet" },
  ];
  c.kaufkosten.kaufpreis = 350000;
  c.finanzierung.eigenkapital = 80000;
  c.finanzierung.darlehen = [
    {
      id: "d1",
      bezeichnung: "Bank",
      betrag: 310000,
      sollzinsProzent: 3.5,
      tilgungAnfaenglichProzent: 2,
      sollzinsbindungJahre: 10,
    },
  ];
  c.szenario.mietsteigerung = {
    baselineProzentPA: 1.5,
    mieterwechselAlleJahre: 7,
    marktmieteUpliftProzent: 8,
    kappungsgrenzeAktiv: true,
  };
  c.steuer.grenzsteuersatzDirektProzent = 42;

  const r = computeCase(c, 30);

  it("liefert 30 Jahre Cashflow", () => {
    expect(r.cashflow).toHaveLength(30);
  });

  it("Bruttorendite plausibel", () => {
    // 1200 × 12 / 350.000 ≈ 4.11%
    expect(r.kpi.bruttomietrenditeProzent).toBeCloseTo(4.11, 1);
  });

  it("Tilgung reduziert Restschuld jährlich", () => {
    for (let i = 1; i < r.cashflow.length; i++) {
      expect(r.cashflow[i].restschuldEnde).toBeLessThanOrEqual(r.cashflow[i - 1].restschuldEnde + 0.01);
    }
  });

  it("Kumulierter Cashflow monoton bei positivem Jahres-CF", () => {
    // Kein harter Test — nur dass Aggregation korrekt läuft
    const last = r.cashflow[r.cashflow.length - 1];
    const manualSum = r.cashflow.reduce((a, z) => a + z.cashflowNachSteuer, 0);
    expect(last.kumulierterCashflowNachSteuer).toBeCloseTo(manualSum, 0);
  });

  it("Miete wächst (Baseline 1,5%)", () => {
    expect(r.miete[5].bruttoKaltmiete).toBeGreaterThan(r.miete[0].bruttoKaltmiete);
  });

  it("Gesamtinvestition = Kaufpreis + NK + Sanierung", () => {
    expect(r.gesamtinvestition).toBeGreaterThan(350000);
    // Mit NW ~12% NK ohne Sanierung
    expect(r.gesamtinvestition).toBeLessThan(350000 * 1.2);
  });

  it("Ampel hat mindestens einen Grund", () => {
    expect(r.ampel.gruende.length).toBeGreaterThan(0);
    expect(["gruen", "gelb", "rot"]).toContain(r.ampel.gesamt);
  });
});

describe("monatsBreakdownJahr1", () => {
  it("summiert zu Cashflow vor Steuer", () => {
    const c = makeDefaultCase();
    const r = computeCase(c, 30);
    const m = monatsBreakdownJahr1(r);
    const ausgaben = m.zins + m.tilgung + m.bewirtschaftung;
    const cfVor = m.kaltmiete - ausgaben;
    expect(cfVor).toBeCloseTo(m.cashflowVorSteuer, 0);
  });
});
