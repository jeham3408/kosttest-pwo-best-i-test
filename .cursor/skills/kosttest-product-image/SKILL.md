---
name: kosttest-product-image
description: Systematisk faktasjekk og produktbilde for kosttest.no. Sjekker URL og bilde, finner bilde på nett ved behov. Bruk i Cursor Automation med cron 0 * * * *.
---

# Kosttest – produktbilde og faktasjekk

Du kjører **én batch per automasjonskjøring** (standard 5 produkter). Cron kjører hver time til køen er tom.

## Mål

1. **Faktasjekk:** Bekreft at produkt-URL laster (HTTP 200).
2. **Bildesjekk:** Produktet skal ha et gyldig, ikke-generisk bilde.
3. **Bildehenting:** Mangler bilde → finn på nett (og:image fra produktside først, deretter Bing/DuckDuckGo).
4. **Oppdatering:** Skriv bilde-URL til riktig seksjon i datafilene.

## Hard regler

1. **Aldri finn på produktdata** — kun bilde-URL fra verifiserte kilder.
2. **Listed-only produkter** (`pwo-listed-only`): oppdater **kun** `listedProducts`-seksjonen, ikke `testedProducts` (samme id kan finnes i begge).
3. **Protein med `IMG`:** erstatt med ekte produktbilde fra butikksiden.
4. Ved usikkerhet: `skip` med begrunnelse, ikke gjett.

## Arbeidsflyt

### Steg 0 — Les status

Les `data/product-image-status.md` — seksjon **1** (ferdig) og **2** (nå).

### Steg 1 — Kjør batch (anbefalt)

```bash
node scripts/product-image-run.mjs
```

Dette låser batch, sjekker URL/bilde, finner bilde ved behov, oppdaterer TS-filer og skriver rapport til `data/product-image-last-run.json`.

Alternativt manuelt:

```bash
node scripts/product-image-queue.mjs start
# ... manuell bildehenting ...
node scripts/product-image-queue.mjs complete --id <id> --source og:image
node scripts/product-image-queue.mjs skip --id <id> --reason "..."
```

### Steg 2 — Verifiser endringer

```bash
npm run lint
npm run build
```

### Steg 3 — Lever

- Commit: `Product image: batch — <kort oppsummering>`
- Push til feature branch
- Opprett PR med norsk beskrivelse: antall lagt til, feilet, gjenstår

### Ny kø etter nye produkter

```bash
node scripts/product-image-queue.mjs init
```

## Bildesøk-prioritet

1. `og:image` / `twitter:image` fra produkt-URL
2. Shopify JSON-LD / Demandware-bilder i HTML
3. Bing bildesøk (`merke + navn + pre workout produkt`)
4. DuckDuckGo bildesøk (fallback)

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `data/product-image-status.md` | Status og batch-pekere |
| `src/data/productImageQueue.json` | Kø per produkt |
| `scripts/product-image-run.mjs` | Hovedkjøring (batch) |
| `scripts/product-image-queue.mjs` | Kø: init/start/complete/skip |
| `scripts/product-image-lib.mjs` | Parser, bildehenting, TS-oppdatering |
| `data/product-image-reports/<id>.json` | Rapport per produkt |
| `src/data/pwoProducts.ts` | PWO tested + listed |
| `src/data/proteinProducts.ts` | Proteinpulver |

Live: https://kosttest.no  
Repo: `jeham3408/kosttest-pwo-best-i-test`
