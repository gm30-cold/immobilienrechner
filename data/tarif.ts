// ---------------------------------------------------------------------------
// Einkommensteuertarif 2026 — §32a EStG
// Werte basieren auf dem Steuerfortentwicklungsgesetz. Jährlich prüfen!
// ---------------------------------------------------------------------------

export interface Tarif {
  jahr: number;
  grundfreibetrag: number;       // Zone 1: bis zu diesem Wert 0 €
  zone2Ende: number;             // Ende Progressionszone 1
  zone3Ende: number;             // Ende Progressionszone 2
  zone4Ende: number;             // Ende Zone 4 (42%)
  // Zone 5 beginnt danach mit 45% (Reichensteuer)
  y1Faktor: number;              // Zone 2 Formel-Koeffizient
  y1Basis: number;
  y2Faktor: number;              // Zone 3 Formel-Koeffizient
  y2Basis: number;
  // Soli/ESt
  soliProzent: number;           // 5.5% auf ESt (ab Freigrenze)
  soliFreigrenze: number;        // Milderungszone startet darüber
}

// §32a EStG Tarif 2026 (Projektion auf Basis Steuerfortentwicklungsgesetz).
// Prüfen und ggf. anpassen bei Gesetzesänderungen.
export const TARIF_2026: Tarif = {
  jahr: 2026,
  grundfreibetrag: 12348,
  zone2Ende: 17443,
  zone3Ende: 68481,
  zone4Ende: 277826,
  y1Faktor: 922.98,
  y1Basis: 1400,
  y2Faktor: 181.19,
  y2Basis: 2397,
  soliProzent: 5.5,
  soliFreigrenze: 19950, // Solidaritätszuschlag fällt erst über dieser ESt-Last
};

/**
 * Berechnet die zu zahlende Einkommensteuer nach §32a EStG (Grundtarif).
 * Für Splittingtarif: zvE halbieren → Ergebnis verdoppeln.
 */
export function einkommensteuerGrundtarif(zvE: number, tarif: Tarif = TARIF_2026): number {
  const x = Math.floor(zvE);
  if (x <= tarif.grundfreibetrag) return 0;

  if (x <= tarif.zone2Ende) {
    const y = (x - tarif.grundfreibetrag) / 10000;
    return Math.floor((tarif.y1Faktor * y + tarif.y1Basis) * y);
  }

  if (x <= tarif.zone3Ende) {
    const z = (x - tarif.zone2Ende) / 10000;
    // Spitze Progressionsformel — an aktuelle Koeffizienten angelehnt
    return Math.floor((tarif.y2Faktor * z + tarif.y2Basis) * z + 1025.38);
  }

  if (x <= tarif.zone4Ende) {
    return Math.floor(0.42 * x - 10602.13);
  }

  return Math.floor(0.45 * x - 18936.88);
}

export function einkommensteuer(zvE: number, veranlagung: "einzeln" | "zusammen", tarif: Tarif = TARIF_2026): number {
  if (veranlagung === "zusammen") {
    return 2 * einkommensteuerGrundtarif(zvE / 2, tarif);
  }
  return einkommensteuerGrundtarif(zvE, tarif);
}

/**
 * Grenzsteuersatz = Steuer auf (zvE + 100€) − Steuer auf zvE, dann /100.
 * Inkl. Soli und optionaler Kirchensteuer.
 */
export function grenzsteuersatz(
  zvE: number,
  veranlagung: "einzeln" | "zusammen",
  kirchensteuerSatz: 0 | 0.08 | 0.09,
  tarif: Tarif = TARIF_2026,
): { estSatz: number; gesamtSatz: number } {
  const estBasis = einkommensteuer(zvE, veranlagung, tarif);
  const estPlus = einkommensteuer(zvE + 100, veranlagung, tarif);
  const grenzEst = (estPlus - estBasis) / 100;

  // Soli: nur wenn Jahressteuer über Freigrenze, hier vereinfacht pauschal
  const soli = grenzEst * (tarif.soliProzent / 100);
  const kist = grenzEst * kirchensteuerSatz;
  const gesamtSatz = grenzEst + soli + kist;

  return {
    estSatz: grenzEst,
    gesamtSatz,
  };
}

// Vereinfachte Schätzung z.v.E. aus Brutto für Angestellte.
// ±5% ungenau — nur als Default, Bescheid ist exakter.
export function schaetzeZvE(bruttojahreseinkommen: number): number {
  const sozialabgaben = Math.min(bruttojahreseinkommen * 0.2, 22000);
  const werbungskostenpauschale = 1230;
  const sonderausgaben = 36;
  const vorsorgepauschale = Math.min(bruttojahreseinkommen * 0.12, 16000);
  return Math.max(
    0,
    bruttojahreseinkommen - sozialabgaben - werbungskostenpauschale - sonderausgaben - vorsorgepauschale,
  );
}
