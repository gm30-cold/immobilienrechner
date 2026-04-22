"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Case } from "@/types/case";
import type { CaseResult } from "@/lib/calc";
import { BUNDESLAND_LABEL } from "@/data/bundeslaender";

// ---------------------------------------------------------------------------
// Styles — clean fintech, works without custom font (falls back to Helvetica)
// ---------------------------------------------------------------------------

const COLOR = {
  bg: "#0f0f16",
  card: "#161621",
  muted: "#6b6b78",
  primary: "#f4f4f6",
  secondary: "#a8a8b3",
  border: "#2a2a36",
  emerald: "#34d399",
  rose: "#fb7185",
  amber: "#fbbf24",
  violet: "#a78bfa",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLOR.bg,
    color: COLOR.primary,
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: COLOR.primary,
  },
  h2: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    marginTop: 18,
    color: COLOR.primary,
    borderBottom: `1pt solid ${COLOR.border}`,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: COLOR.muted,
  },
  meta: {
    marginTop: 4,
    color: COLOR.muted,
    fontSize: 9,
  },
  brand: {
    color: COLOR.emerald,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    marginBottom: 4,
  },
  // KPI grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginHorizontal: -4,
  },
  kpiCell: {
    width: "33.33%",
    padding: 4,
  },
  kpiBox: {
    backgroundColor: COLOR.card,
    border: `1pt solid ${COLOR.border}`,
    borderRadius: 8,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 7,
    color: COLOR.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 700,
    color: COLOR.primary,
  },
  kpiTone: {
    fontSize: 16,
    fontWeight: 700,
  },
  kpiSub: {
    fontSize: 8,
    color: COLOR.muted,
    marginTop: 2,
  },
  // Table
  table: {
    marginTop: 6,
    border: `1pt solid ${COLOR.border}`,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1pt solid ${COLOR.border}`,
    padding: 6,
  },
  tableRowLast: {
    flexDirection: "row",
    padding: 6,
  },
  tableCol1: {
    flex: 1,
    color: COLOR.secondary,
  },
  tableCol2: {
    width: 110,
    textAlign: "right",
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    padding: 6,
    backgroundColor: COLOR.card,
    borderBottom: `1pt solid ${COLOR.border}`,
  },
  // Ampel
  ampelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    fontSize: 8,
  },
  bullet: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: COLOR.muted,
    textAlign: "center",
    borderTop: `1pt solid ${COLOR.border}`,
    paddingTop: 6,
  },
  // Bar chart (native react-pdf shapes)
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    fontSize: 8,
  },
  barLabel: {
    width: 60,
    fontSize: 8,
    color: COLOR.muted,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLOR.card,
    borderRadius: 2,
    position: "relative",
    marginHorizontal: 4,
  },
  barValue: {
    width: 70,
    textAlign: "right",
    fontSize: 8,
    fontFamily: "Courier",
  },
});

// Format helpers (no locale deps for PDF reliability)
const eur = (v: number) =>
  `${v < 0 ? "-" : ""}${Math.abs(Math.round(v)).toLocaleString("de-DE")} €`;
const pct = (v: number, dec = 2) => `${v.toFixed(dec)} %`;

const ampelStyle = (s: "gruen" | "gelb" | "rot") => ({
  color:
    s === "gruen" ? COLOR.emerald : s === "gelb" ? COLOR.amber : COLOR.rose,
  backgroundColor:
    s === "gruen" ? "#34d39920" : s === "gelb" ? "#fbbf2420" : "#fb718520",
});

interface Props {
  caseItem: Case;
  result: CaseResult;
}

export function CaseReport({ caseItem, result }: Props) {
  const s = caseItem.stammdaten;
  const k = caseItem.kaufkosten;
  const f = caseItem.finanzierung;
  const kpi = result.kpi;

  const monatsmiete = s.einheiten.reduce((a, e) => a + e.kaltmiete, 0);

  return (
    <Document title={`Immobilien-Case: ${caseItem.name}`}>
      {/* --- Page 1 — Cover & Summary --- */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>IMMOBILIENRECHNER</Text>
        <Text style={styles.h1}>{caseItem.name}</Text>
        <Text style={styles.subtitle}>
          {s.adresse.strasse && `${s.adresse.strasse}, `}
          {s.adresse.plz} {s.adresse.ort} · {BUNDESLAND_LABEL[s.adresse.bundesland]}
        </Text>
        <Text style={styles.meta}>
          {s.objekttyp} · Baujahr {s.baujahr} · {s.einheiten.length}{" "}
          {s.einheiten.length === 1 ? "Einheit" : "Einheiten"}
        </Text>

        {/* Ampel */}
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.ampelPill, ampelStyle(result.ampel.gesamt)]}>
            {result.ampel.gesamt === "gruen"
              ? "Solide"
              : result.ampel.gesamt === "gelb"
              ? "Prüfen"
              : "Kritisch"}
          </Text>
          <Text style={{ fontSize: 9, color: COLOR.secondary }}>
            · Gesamt-Bewertung
          </Text>
        </View>

        <Text style={styles.h2}>Kern-Kennzahlen (Jahr 1)</Text>

        <View style={styles.kpiGrid}>
          <Kpi label="Bruttorendite" value={pct(kpi.bruttomietrenditeProzent)} />
          <Kpi label="Nettorendite" value={pct(kpi.nettomietrenditeProzent)} tone="emerald" />
          <Kpi label="EK-Rendite n. St." value={pct(kpi.eigenkapitalrenditeNachSteuernProzent)} tone="emerald" />
          <Kpi
            label="Cashflow n. St. / Mo."
            value={eur(kpi.cashflowNachSteuernProMonat)}
            tone={kpi.cashflowNachSteuernProMonat >= 0 ? "emerald" : "rose"}
          />
          <Kpi
            label="Break-Even"
            value={kpi.breakEvenJahr ? `Jahr ${kpi.breakEvenJahr}` : "> 30 J."}
          />
          <Kpi label="Restschuld n. ZB" value={eur(kpi.restschuldNachZinsbindung)} />
        </View>

        <Text style={styles.h2}>Investition</Text>
        <Kv label="Kaufpreis" value={eur(k.kaufpreis)} />
        <Kv label="Kaufnebenkosten" value={`${eur(result.nebenkosten.summe)} (${pct(result.nebenkosten.summeProzent, 1)})`} />
        <Kv
          label="Sanierungsbudget"
          value={eur(k.sanierung.reduce((a, p) => a + p.betrag, 0))}
        />
        <Kv label="Gesamtinvestition" value={eur(result.gesamtinvestition)} bold />

        <Text style={styles.h2}>Finanzierung</Text>
        <Kv label="Eigenkapital" value={eur(f.eigenkapital)} />
        {f.darlehen.map((d) => (
          <Kv
            key={d.id}
            label={d.bezeichnung}
            value={`${eur(d.betrag)} · ${pct(d.sollzinsProzent, 2)} · ${pct(d.tilgungAnfaenglichProzent, 2)} Tilg. · ${d.sollzinsbindungJahre} J.`}
          />
        ))}
        <Kv label="EK-Quote" value={pct(kpi.eigenkapitalQuoteProzent, 1)} />
        <Kv label="Kaufpreisfaktor" value={`${kpi.kaufpreisFaktor.toFixed(1)}×`} />

        <Text style={styles.h2}>Mieteinnahmen & Bewirtschaftung</Text>
        <Kv label="Kaltmiete (Jahr 1, monatlich)" value={eur(monatsmiete)} />
        <Kv label="Leerstandsquote" value={pct(caseItem.szenario.leerstandProzent, 1)} />
        <Kv label="Mietsteigerung p.a. (Baseline)" value={pct(caseItem.szenario.mietsteigerung.baselineProzentPA, 1)} />
        <Kv label="Instandhaltungsrücklage (Jahr 1)" value={eur(result.bewirtschaftung[0]?.instandhaltungRuecklage ?? 0)} />

        <Text style={styles.h2}>Bewertung</Text>
        {result.ampel.gruende.map((g, i) => (
          <View key={i} style={styles.bullet}>
            <Text
              style={{
                fontSize: 8,
                color:
                  g.ampel === "gruen"
                    ? COLOR.emerald
                    : g.ampel === "gelb"
                    ? COLOR.amber
                    : COLOR.rose,
              }}
            >
              ●
            </Text>
            <Text style={{ fontSize: 9, color: COLOR.secondary, flex: 1 }}>{g.text}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Immobilienrechner · Erstellt {new Date().toLocaleDateString("de-DE")} ·
          Alle Zahlen basieren auf den eingetragenen Annahmen. Keine Anlageberatung.
        </Text>
      </Page>

      {/* --- Page 2 — Cashflow Details --- */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>IMMOBILIENRECHNER · {caseItem.name}</Text>
        <Text style={styles.h1}>Cashflow-Projektion</Text>

        <Text style={styles.h2}>Jahresübersicht</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol1, { fontWeight: 700, fontSize: 8 }]}>Jahr</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>Kaltmiete</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>Zins</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>Tilgung</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>Steuer</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>CF n. St.</Text>
            <Text style={[styles.tableCol2, { fontSize: 8 }]}>kum. CF</Text>
          </View>
          {result.cashflow.slice(0, 15).map((z, i, arr) => (
            <View
              key={z.jahr}
              style={i === arr.length - 1 ? styles.tableRowLast : styles.tableRow}
            >
              <Text style={[styles.tableCol1, { fontSize: 8 }]}>{z.jahr}</Text>
              <Text style={[styles.tableCol2, { fontSize: 8, fontFamily: "Courier" }]}>
                {eur(z.einnahmenKaltmiete)}
              </Text>
              <Text style={[styles.tableCol2, { fontSize: 8, fontFamily: "Courier" }]}>
                {eur(z.zins)}
              </Text>
              <Text style={[styles.tableCol2, { fontSize: 8, fontFamily: "Courier" }]}>
                {eur(z.tilgung)}
              </Text>
              <Text style={[styles.tableCol2, { fontSize: 8, fontFamily: "Courier" }]}>
                {eur(z.steuerEffekt)}
              </Text>
              <Text
                style={[
                  styles.tableCol2,
                  {
                    fontSize: 8,
                    fontFamily: "Courier",
                    color: z.cashflowNachSteuer >= 0 ? COLOR.emerald : COLOR.rose,
                  },
                ]}
              >
                {eur(z.cashflowNachSteuer)}
              </Text>
              <Text
                style={[
                  styles.tableCol2,
                  {
                    fontSize: 8,
                    fontFamily: "Courier",
                    color: z.kumulierterCashflowNachSteuer >= 0 ? COLOR.emerald : COLOR.rose,
                  },
                ]}
              >
                {eur(z.kumulierterCashflowNachSteuer)}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.meta, { marginTop: 4 }]}>
          (Anzeige der ersten 15 Jahre von {result.cashflow.length})
        </Text>

        <Text style={styles.h2}>Exit-Szenario (Jahr {result.exit.haltedauerJahre})</Text>
        <Kv label="Angenommener Verkaufspreis" value={eur(result.exit.verkaufspreis)} />
        <Kv label="Restschuld bei Exit" value={eur(result.exit.restschuldBeiExit)} />
        <Kv label="Veräußerungsgewinn" value={eur(result.exit.veraeusserungsgewinn)} />
        <Kv
          label="Spekulationssteuer"
          value={result.exit.spekulationssteuerFaellig ? eur(result.exit.spekulationssteuer) : "entfällt (≥ 10 J.)"}
        />
        <Kv label="Nettoerlös" value={eur(result.exit.nettoerloes)} bold />
        <Kv
          label="IRR über Haltedauer"
          value={result.exit.irrProzent != null ? pct(result.exit.irrProzent) : "—"}
          bold
        />

        <Text style={styles.footer}>
          Immobilienrechner · Erstellt {new Date().toLocaleDateString("de-DE")} · Seite 2
        </Text>
      </Page>
    </Document>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "rose" | "amber" }) {
  const color =
    tone === "emerald" ? COLOR.emerald : tone === "rose" ? COLOR.rose : tone === "amber" ? COLOR.amber : COLOR.primary;
  return (
    <View style={styles.kpiCell}>
      <View style={styles.kpiBox}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function Kv({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
      <Text style={{ color: COLOR.secondary, fontSize: 10 }}>{label}</Text>
      <Text
        style={{
          color: COLOR.primary,
          fontSize: 10,
          fontFamily: "Courier",
          fontWeight: bold ? 700 : 400,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
