import { describe, it, expect } from "vitest";
import { irr, berechneExit } from "./exit";
import { computeCase } from "./cashflow";
import { makeDefaultCase } from "@/lib/defaultCase";

describe("IRR", () => {
  it("liefert ~10% für Standard-CF mit Exit", () => {
    // -1000 in Jahr 0, +100 in Jahr 1-9, +1100 in Jahr 10 → ~10%
    const cf = [-1000, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1100];
    const r = irr(cf);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(0.1, 2);
  });

  it("null bei keinem Vorzeichenwechsel", () => {
    expect(irr([-100, -10, -10])).toBeNull();
  });
});

describe("Exit-Berechnung", () => {
  it("Spekulationssteuer fällt bei Verkauf <10 Jahre", () => {
    const c = makeDefaultCase();
    c.exit.haltedauerJahre = 5;
    c.exit.verkaufspreisModus = "wertsteigerungProzent";
    c.exit.wertsteigerungProzentPA = 3;
    const r = computeCase(c, 30);
    expect(r.exit.spekulationssteuerFaellig).toBe(true);
    expect(r.exit.spekulationssteuer).toBeGreaterThan(0);
  });

  it("Keine Spekulationssteuer bei Haltedauer ≥10", () => {
    const c = makeDefaultCase();
    c.exit.haltedauerJahre = 12;
    const r = computeCase(c, 30);
    expect(r.exit.spekulationssteuerFaellig).toBe(false);
    expect(r.exit.spekulationssteuer).toBe(0);
  });
});
