import type { Case } from "@/types/case";
import {
  einkommensteuerGrundtarif,
  grenzsteuersatz,
  schaetzeZvE,
  TARIF_2026,
} from "@/data/tarif";

/**
 * Ermittelt den effektiven Grenzsteuersatz (inkl. Soli und Kirchensteuer)
 * aus dem gewählten Modus.
 */
export function effektiverGrenzsteuersatz(c: Case): number {
  const s = c.steuer;
  if (s.grenzsteuersatzModus === "direkt") {
    const base = (s.grenzsteuersatzDirektProzent ?? 42) / 100;
    // Bei Direkteingabe gehen wir davon aus, dass der Nutzer den
    // ESt-Grenzsatz OHNE Soli/KiSt eintippt. Wir addieren analog.
    const soli = base * (TARIF_2026.soliProzent / 100);
    const kist = base * s.kirchensteuerSatz;
    return base + soli + kist;
  }

  let zvE: number;
  if (s.grenzsteuersatzModus === "bescheid") {
    zvE = s.zvE ?? 0;
  } else {
    const brutto1 = s.bruttoEhegatte1 ?? 0;
    const brutto2 = s.bruttoEhegatte2 ?? 0;
    zvE = schaetzeZvE(brutto1) + schaetzeZvE(brutto2);
  }

  const { gesamtSatz } = grenzsteuersatz(
    zvE,
    s.veranlagung,
    s.kirchensteuerSatz,
  );
  return gesamtSatz;
}

/**
 * Prüfberechnung: Jahressteuer bei gegebenem zvE (ohne Vermietung).
 * Wird nicht im Cashflow-Pfad genutzt — nur zu Anzeigezwecken.
 */
export function jahressteuerBasis(c: Case): number {
  const s = c.steuer;
  if (s.grenzsteuersatzModus === "direkt") return 0;
  let zvE = 0;
  if (s.grenzsteuersatzModus === "bescheid") zvE = s.zvE ?? 0;
  else zvE = schaetzeZvE(s.bruttoEhegatte1 ?? 0) + schaetzeZvE(s.bruttoEhegatte2 ?? 0);

  if (s.veranlagung === "zusammen") {
    return 2 * einkommensteuerGrundtarif(zvE / 2);
  }
  return einkommensteuerGrundtarif(zvE);
}
