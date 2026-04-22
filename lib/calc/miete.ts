import type { Case } from "@/types/case";
import type { MieteProJahr } from "./types";

/**
 * Mietprojektion über N Jahre.
 *
 * Modell (3-stufig):
 *  1. Baseline-Steigerung p.a. für laufende Mietverträge
 *  2. Alle `mieterwechselAlleJahre` Sprung auf Marktmiete
 *     = aktuelle Miete × (1 + marktmieteUplift%)
 *  3. Kappungsgrenze (§558 BGB): +15% in 3 Jahren (Mietpreisbremse-Gebiete)
 *     wird geprüft und ggf. begrenzt — nur wenn kappungsgrenzeAktiv.
 *
 * Leerstandsquote wird auf die Bruttokaltmiete angewandt.
 */
export function berechneMietprojektion(c: Case, jahreMax: number): MieteProJahr[] {
  const startKaltmiete = c.stammdaten.einheiten.reduce((s, e) => s + e.kaltmiete, 0) * 12;
  if (startKaltmiete === 0) {
    return Array.from({ length: jahreMax }, (_, i) => ({
      jahr: i + 1,
      kaltmiete: 0,
      bruttoKaltmiete: 0,
      leerstandAbzug: 0,
    }));
  }

  const baseP = c.szenario.mietsteigerung.baselineProzentPA / 100;
  const wechselInt = c.szenario.mietsteigerung.mieterwechselAlleJahre;
  const marktUplift = c.szenario.mietsteigerung.marktmieteUpliftProzent / 100;
  const kappungAktiv = c.szenario.mietsteigerung.kappungsgrenzeAktiv;
  const leerstand = c.szenario.leerstandProzent / 100;

  const result: MieteProJahr[] = [];
  let aktuelleMiete = startKaltmiete;
  const mietVerlauf3j: number[] = [startKaltmiete]; // für Kappungsgrenzen-Check

  for (let j = 1; j <= jahreMax; j++) {
    if (j > 1) {
      // Jährliche Baseline-Steigerung
      let neu = aktuelleMiete * (1 + baseP);

      // Mieterwechsel-Effekt (im jeweiligen Wechseljahr)
      if (wechselInt > 0 && (j - 1) % wechselInt === 0) {
        neu = aktuelleMiete * (1 + marktUplift);
      }

      // Kappungsgrenze: +15% in 3 Jahren
      if (kappungAktiv && mietVerlauf3j.length >= 3) {
        const vor3J = mietVerlauf3j[mietVerlauf3j.length - 3];
        const maxErlaubt = vor3J * 1.15;
        if (neu > maxErlaubt) neu = maxErlaubt;
      }
      aktuelleMiete = neu;
    }
    mietVerlauf3j.push(aktuelleMiete);
    if (mietVerlauf3j.length > 4) mietVerlauf3j.shift();

    const bruttoKaltmiete = aktuelleMiete;
    const abzug = bruttoKaltmiete * leerstand;
    result.push({
      jahr: j,
      bruttoKaltmiete,
      leerstandAbzug: abzug,
      kaltmiete: bruttoKaltmiete - abzug,
    });
  }

  return result;
}
