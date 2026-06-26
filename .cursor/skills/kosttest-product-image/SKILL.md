---
name: kosttest-product-image
description: Systematisk faktasjekk av produktbilder for PWO og protein. Finner bilde på nett når mangler. Bruk i Cursor Automation med cron 0 * * * *.
---

# Kosttest – produkt-bilde automasjon

Du sjekker produkter systematisk og legger til manglende bilder fra ekte kilder.

## Mål per kjøring

1. Kjør bilde-audit
2. Behandle én batch (standard 5 produkter) uten gyldig bilde
3. Commit og PR med endringer

## Produkttyper

| Type | Kilde | Bilde-lagring |
|------|-------|---------------|
| `pwo-tested` | `src/data/pwoProducts.ts` (testedProducts) | Hotlink URL |
| `pwo-listed` | `src/data/pwoProducts.ts` (listedProducts) | Hotlink URL |
| `protein` | `src/data/proteinProducts.ts` | `public/images/protein/<id>.jpg` |

## Arbeidsflyt

```bash
npm run product:image:init      # første gang / etter nye produkter
npm run product:image:audit     # se hvem som mangler bilde
npm run product:image:run       # behandle batch (PRODUCT_IMAGE_BATCH=5)
npm run product:image:status
npm run product:image:sync-md
npm run build
```

## Bildesøk (prioritet)

1. Valider eksisterende bilde-URL (HEAD)
2. `og:image` / Demandware / Shopify fra produkt-URL
3. Oppdag ny produkt-URL via Gymgrossisten-søk hvis lagret URL er 404
4. Bing: `site:gymgrossisten.no` / `site:myprotein.com`
5. DuckDuckGo (fallback)

## Regler

- **Aldri finn på bilder** — kun fra ekte produktsider eller butikksøk
- Blokker logo, banner, favicon og generiske placeholders
- For `pwo-listed`: oppdater kun `listedProducts`-seksjonen
- For protein: last ned til `public/images/protein/<id>.jpg`
- Oppdater produkt-URL når bedre kilde finnes
- Ved feil: `npm run product:image:retry -- --id <id>`

## Spesialtilfeller

- **Ghost Whey**: ghostlifestyle.com Shopify-variant
- **MuscleTech Nitro-Tech**: muscletech.com når GG mangler
- **Off The Hook Stim-Free**: Chained Nutrition / Gymgrossisten

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/product-image-queue.mjs` | Kø, søk, oppdatering |
| `src/data/productImageQueue.json` | Køstatus |
| `data/product-image-status.md` | Koordinering |
| `data/product-image-reports/<id>.json` | Per-produkt rapport |
| `data/product-image-last-run.json` | Siste batch |

Live: https://kosttest.no
