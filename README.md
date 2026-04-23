# Immobilienrechner

360°-Beurteilung von Vermietungs-Immobilien — Rendite, Cashflow, Exit-IRR,
Sensitivität, Monte Carlo, Markt-Benchmark.

## Features

- **Case-Editor** mit 7 Tabs: Stammdaten, Kaufkosten, Finanzierung,
  Bewirtschaftung, Steuer, Szenarien, Exit
- **Rechenkern** (pure TypeScript, unit-getestet):
  Grunderwerbsteuer nach Bundesland, monatsgenauer Tilgungsplan (bis zu 3
  Darlehen + Anschlussfinanzierung), lineare AfA + §7b/§7i, Peterssche Formel,
  §82b-Verteilung, V+V-Einkünfte nach §21 EStG, §32a Grenzsteuersatz mit
  Splitting-Tarif, Spekulationssteuer-Check
- **Dashboard** mit 6 KPI-Kacheln, Ampel-Bewertung, Cashflow-Projektion,
  Vermögensaufbau
- **Monte-Carlo** mit 5 Metriken × Histogramm + P10/P50/P90 + Risiko-Kennzahlen
- **Tornado-Sensitivität** für 7 Schlüsselvariablen
- **Vergleichsmodus** bis 3 Cases nebeneinander
- **Markt-Benchmark** mit interaktiver Deutschland-Karte (MapLibre),
  PLZ-genauer Suche (9.856 PLZs) und IDW-Interpolation aus 60 Referenzstädten
- **PDF-Report** (@react-pdf/renderer), **JSON-Export/Import** pro Case

## Lokal starten

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm test    # Vitest (47 Tests)
```

## Deployment zu GitHub Pages

Die App ist als **statischer Export** konfiguriert — läuft ohne Backend,
alle Daten bleiben im Browser (localStorage + JSON-Export).

### Einmalige Einrichtung

1. **Repo auf GitHub erstellen** (z.B. `immobilienrechner`) und pushen:
   ```bash
   git remote add origin git@github.com:<deinuser>/immobilienrechner.git
   git push -u origin main
   ```

2. **Pages aktivieren**: Repo-Settings → Pages → Source: **GitHub Actions**

Das war's. Jeder Push auf `main` triggert den Workflow in `.github/workflows/deploy.yml`:
- Install, Tests, Build mit automatisch aus Repo-Name abgeleiteter `basePath`
- Deploy zum GitHub-Pages-Environment

Nach ~2 Minuten ist die App unter
`https://<deinuser>.github.io/<repo>/` live.

### basePath

Der Deploy-Workflow setzt `NEXT_PUBLIC_BASE_PATH=/<repo>` automatisch.
Wenn du über eine **Custom Domain** (z.B. `rechner.meinedomain.de`) oder
auf dem User-Site-Repo (`<user>.github.io`) deployen willst, ist kein
basePath nötig — dann die Env-Var im Workflow entfernen.

### Lokal vs. Production

- Dev (`pnpm dev`): `basePath=""`, läuft auf `localhost:3000`
- Build (`pnpm build`): produziert `out/` Ordner mit allen statischen Assets
- Test statisch lokal: `npx serve out` oder `python3 -m http.server -d out 8080`

## Alternative: Vercel

Wenn du lieber Vercel statt GitHub Pages nutzt:

1. Auf [vercel.com](https://vercel.com) GitHub-Repo importieren
2. `output: "export"` und `basePath` in `next.config.ts` entfernen
   (Vercel unterstützt alle Next.js-Features nativ)
3. Deploy — fertig, URL `https://<projekt>.vercel.app`

## Architektur

```
app/
  page.tsx              ← Home (Case-Liste)
  case/                 ← Case-Editor (?id=...)
  compare/              ← Vergleichs-Modus
  benchmark/            ← Markt-Benchmark mit Karte
components/
  forms/                ← Form-Primitives (Field, NumberInput, Select, …)
  layout/               ← Sidebar, PageHeader
  report/               ← PDF-Report + Action-Buttons
  ui/                   ← GlassCard, KpiTile, Tabs, Ampel, MarketMap, …
lib/
  calc/                 ← Pure-TS Rechenkern + Vitest-Tests
  store.ts              ← Zustand-Store mit localStorage + JSON Import/Export
  plz.ts                ← Lazy-Load PLZ-Dataset
  geocoding.ts          ← OSM Nominatim-Wrapper
data/
  markt.ts              ← Curated Referenzstädte + Lat/Lng
  interpolate.ts        ← IDW-Interpolation
  bundeslaender.ts      ← Grunderwerbsteuer
  tarif.ts              ← §32a EStG Tarif 2026
types/
  case.ts               ← Komplettes Case-Datenmodell
public/
  data/plz.json         ← 9.856 deutsche PLZs mit Lat/Lng (geonames.org)
  .nojekyll             ← Verhindert Jekyll-Processing durch GH Pages
```

## Datenquellen

- **Stadt-Mittelwerte**: LBS/Postbank Wohnatlas, Bulwiengesa, JLL/CBRE,
  Gutachterausschuss-Berichte (2025)
- **PLZ-Koordinaten**: [geonames.org](https://www.geonames.org/) (CC BY 4.0)
- **Geocoding**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
  (1 Request/Sekunde, gratis, Attribution Pflicht)
- **Kartengrundlage**: [OpenStreetMap](https://www.openstreetmap.org/) via
  [MapLibre GL](https://maplibre.org/)

## Lizenz

MIT — privat + Weitergabe in Ordnung. Keine Anlageberatung.
