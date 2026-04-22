import type { Darlehen, Finanzierung } from "@/types/case";
import type { TilgungsZeile, TilgungsplanErgebnis } from "./types";

/**
 * Monatsgenauer Annuitätenplan für EIN Darlehen.
 * Nach Ablauf der Sollzinsbindung wird — falls anschlussZinsAnnahmeProzent gesetzt —
 * mit gleichem Anfangs-Tilgungs-% neu auf die Restschuld umgerechnet.
 * Lauf bis Restschuld 0 oder maximal 40 Jahre (Sicherheits-Cutoff).
 */
export function berechneTilgungsplanDarlehen(
  d: Darlehen,
  maxJahre = 40,
): TilgungsZeile[] {
  const zeilen: TilgungsZeile[] = [];
  if (d.betrag <= 0) return zeilen;

  let restschuld = d.betrag;
  let zinsP = d.sollzinsProzent;
  let monatsRate = (d.betrag * ((zinsP + d.tilgungAnfaenglichProzent) / 100)) / 12;
  const maxMonate = maxJahre * 12;
  const tilgungsfrei = (d.tilgungsfreieJahre ?? 0) * 12;
  const bindungMonate = d.sollzinsbindungJahre * 12;

  for (let m = 1; m <= maxMonate; m++) {
    // Anschlussfinanzierung prüfen (nur einmal, am Ende der Bindung)
    if (m === bindungMonate + 1 && d.anschlussZinsAnnahmeProzent != null) {
      zinsP = d.anschlussZinsAnnahmeProzent;
      // Annuität auf gleiche Anfangs-Tilgung neu bezogen auf aktuelle Restschuld
      monatsRate =
        (restschuld * ((zinsP + d.tilgungAnfaenglichProzent) / 100)) / 12;
    }

    const zinsMonat = restschuld * (zinsP / 100 / 12);

    if (m <= tilgungsfrei) {
      // Tilgungsfreies Anlaufjahr: nur Zins zahlen
      zeilen.push({
        monat: m,
        jahr: Math.ceil(m / 12),
        zins: zinsMonat,
        tilgung: 0,
        annuitaet: zinsMonat,
        restschuld,
        darlehenId: d.id,
      });
      continue;
    }

    let tilgungMonat = Math.max(0, monatsRate - zinsMonat);
    if (tilgungMonat > restschuld) tilgungMonat = restschuld;
    restschuld = Math.max(0, restschuld - tilgungMonat);

    zeilen.push({
      monat: m,
      jahr: Math.ceil(m / 12),
      zins: zinsMonat,
      tilgung: tilgungMonat,
      annuitaet: zinsMonat + tilgungMonat,
      restschuld,
      darlehenId: d.id,
    });

    if (restschuld <= 0.005) break;
  }

  return zeilen;
}

export function berechneTilgungsplan(f: Finanzierung): TilgungsplanErgebnis {
  const alleZeilen = f.darlehen.flatMap((d) => berechneTilgungsplanDarlehen(d));

  // Aggregation je Jahr
  const jahresMap = new Map<number, { zins: number; tilgung: number; annuitaet: number; restschuldEnde: number }>();
  const laufzeitMax = Math.max(
    1,
    ...alleZeilen.map((z) => z.jahr),
    ...f.darlehen.map((d) => d.sollzinsbindungJahre),
  );

  // Für Restschuld am Jahresende: letzter Eintrag je Darlehen im jeweiligen Jahr
  for (let jahr = 1; jahr <= laufzeitMax; jahr++) {
    let zinsJ = 0;
    let tilgJ = 0;
    for (const d of f.darlehen) {
      const zeilenDarlehenJahr = alleZeilen.filter(
        (z) => z.darlehenId === d.id && z.jahr === jahr,
      );
      zinsJ += zeilenDarlehenJahr.reduce((a, z) => a + z.zins, 0);
      tilgJ += zeilenDarlehenJahr.reduce((a, z) => a + z.tilgung, 0);
    }
    // Restschuld am Jahresende = Summe letzter Restschulden je Darlehen
    let restEnde = 0;
    for (const d of f.darlehen) {
      const last = [...alleZeilen]
        .filter((z) => z.darlehenId === d.id && z.jahr <= jahr)
        .pop();
      restEnde += last ? last.restschuld : d.betrag;
    }
    jahresMap.set(jahr, {
      zins: zinsJ,
      tilgung: tilgJ,
      annuitaet: zinsJ + tilgJ,
      restschuldEnde: restEnde,
    });
  }

  const aggregiertJahr = Array.from(jahresMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([jahr, v]) => ({ jahr, ...v }));

  // Restschuld nach Zinsbindung = Summe der Restschulden am Ende der längsten Zinsbindung
  const bindungMax = Math.max(0, ...f.darlehen.map((d) => d.sollzinsbindungJahre));
  let restschuldNachZinsbindung = 0;
  for (const d of f.darlehen) {
    const last = [...alleZeilen]
      .filter((z) => z.darlehenId === d.id && z.jahr <= bindungMax)
      .pop();
    restschuldNachZinsbindung += last ? last.restschuld : d.betrag;
  }

  return {
    zeilen: alleZeilen,
    aggregiertJahr,
    restschuldNachZinsbindung,
    laufzeitJahreMax: laufzeitMax,
  };
}

/** Gewichteter Anfangs-Tilgung-Prozentsatz über alle Darlehen. */
export function gewichteteTilgungAnfaenglich(f: Finanzierung): number {
  const gesamt = f.darlehen.reduce((s, d) => s + d.betrag, 0);
  if (gesamt === 0) return 0;
  return (
    f.darlehen.reduce(
      (s, d) => s + d.betrag * d.tilgungAnfaenglichProzent,
      0,
    ) / gesamt
  );
}
