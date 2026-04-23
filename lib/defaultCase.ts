import type { Case } from "@/types/case";
import { DEFAULT_NEBENKOSTEN, GRUNDERWERBSTEUER } from "@/data/bundeslaender";

// Leere Case-Vorlage — strukturelle Defaults (z.B. Steuerprozente, Tilgung,
// Wertsteigerung) bleiben sinnvoll voreingestellt, aber alle vom User
// objektspezifisch einzutragenden Werte sind 0 / leer.
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
      baujahr: new Date().getFullYear(),
      einheiten: [
        {
          id: crypto.randomUUID(),
          bezeichnung: "WE 1",
          qm: 0,
          geschoss: 1,
          kaltmiete: 0,
          status: "vermietet",
        },
      ],
    },
    kaufkosten: {
      kaufpreis: 0,
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
      eigenkapital: 0,
      darlehen: [
        {
          id: crypto.randomUUID(),
          bezeichnung: "Bank-Annuität",
          betrag: 0,
          sollzinsProzent: 3.5,
          tilgungAnfaenglichProzent: 2.0,
          sollzinsbindungJahre: 15,
        },
      ],
    },
    bewirtschaftung: {
      ruecklageModus: "peterssche",
      ruecklageProzentGebaeudewert: 1.0,
      hausverwaltungProMonatJeEinheit: 25,
      mietausfallwagnisProzent: 2,
      versicherungProJahr: 0,
      sonstigeKostenProJahr: 0,
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
