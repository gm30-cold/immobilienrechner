import type { Case } from "@/types/case";
import { DEFAULT_NEBENKOSTEN, GRUNDERWERBSTEUER } from "@/data/bundeslaender";

export function makeDefaultCase(name = "Neuer Case"): Case {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    stammdaten: {
      objekttyp: "ETW",
      adresse: { strasse: "", plz: "", ort: "", bundesland: "NW" },
      baujahr: 1995,
      einheiten: [
        {
          id: crypto.randomUUID(),
          bezeichnung: "WE 1",
          qm: 72,
          geschoss: 1,
          kaltmiete: 900,
          status: "vermietet",
        },
      ],
    },
    kaufkosten: {
      kaufpreis: 320000,
      nebenkosten: {
        grunderwerbsteuerProzent: GRUNDERWERBSTEUER.NW,
        notarProzent: DEFAULT_NEBENKOSTEN.notarProzent,
        grundbuchProzent: DEFAULT_NEBENKOSTEN.grundbuchProzent,
        maklerProzent: DEFAULT_NEBENKOSTEN.maklerProzentKaeufer,
      },
      sanierung: [],
      aufteilung: { grundProzent: 20, gebaeudeProzent: 80 },
    },
    finanzierung: {
      eigenkapital: 80000,
      darlehen: [
        {
          id: crypto.randomUUID(),
          bezeichnung: "Bank-Annuität",
          betrag: 280000,
          sollzinsProzent: 3.6,
          tilgungAnfaenglichProzent: 2.0,
          sollzinsbindungJahre: 15,
          anschlussZinsAnnahmeProzent: 4.5,
        },
      ],
    },
    bewirtschaftung: {
      ruecklageModus: "peterssche",
      ruecklageProzentGebaeudewert: 1.0,
      hausverwaltungProMonatJeEinheit: 25,
      mietausfallwagnisProzent: 2,
      versicherungProJahr: 300,
      sonstigeKostenProJahr: 200,
      instandhaltungsEvents: [],
    },
    steuer: {
      grenzsteuersatzModus: "direkt",
      veranlagung: "einzeln",
      kirchensteuerSatz: 0,
      grenzsteuersatzDirektProzent: 42,
    },
    exit: {
      haltedauerJahre: 15,
      verkaufspreisModus: "wertsteigerungProzent",
      wertsteigerungProzentPA: 1.5,
    },
    szenario: {
      leerstandProzent: 2,
      mietsteigerung: {
        baselineProzentPA: 1.5,
        mieterwechselAlleJahre: 7,
        marktmieteUpliftProzent: 8,
        kappungsgrenzeAktiv: true,
      },
    },
  };
}
