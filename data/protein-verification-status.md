# Protein verifisering — status

> **Automasjon:** Les denne filen **før** hver kjøring. Oppdater **Aktuell oppgave** ved start og **Kjøringslogg** ved slutt. Kjør `node scripts/protein-verify-queue.mjs sync-md` før commit for å oppdatere tabellen under.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Verifisert | 1 / 26 |
| Avvist | 0 |
| Gjenstår | 25 |
| Neste i kø | `dymatize-iso100` |
| Siste kjøring | — |
| Cron | `*/5 * * * *` (hvert 5. min) |

## Aktuell oppgave

| Felt | Verdi |
|------|-------|
| productId | — |
| status | `idle` |
| startet | — |
| kilde-URL | — |
| produkt finnes | — |
| score (etter build) | — |
| notat | — |

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
| 1 | dymatize-iso100 | Dymatize | ISO100 Hydrolyzed 100% Whey Isolate | ⏳ pending | — |
| 2 | optimum-gold-standard | Optimum Nutrition | Gold Standard 100% Whey | ⏳ pending | — |
| 3 | bodylab-whey-100 | Bodylab | Whey 100 | ✅ verified | 2026-06-26 |
| 4 | star-whey-100 | Star Nutrition | 100% Whey | ⏳ pending | — |
| 5 | myprotein-impact-whey | MyProtein | Impact Whey Protein | ⏳ pending | — |
| 6 | scitec-100-whey-professional | Scitec Nutrition | 100% Whey Protein Professional | ⏳ pending | — |
| 7 | applied-critical-whey | Applied Nutrition | Critical Whey | ⏳ pending | — |
| 8 | mutant-iso-surge | Mutant | ISO Surge | ⏳ pending | — |
| 9 | rule1-r1-protein | Rule 1 | R1 Protein | ⏳ pending | — |
| 10 | muscletech-nitrotech | MuscleTech | Nitro-Tech Whey Gold | ⏳ pending | — |
| 11 | kevin-levrone-levro-whey | Kevin Levrone | Levro Whey Supreme | ⏳ pending | — |
| 12 | ghost-whey | Ghost | Ghost Whey | ⏳ pending | — |
| 13 | esn-designer-whey | ESN | Designer Whey Protein | ⏳ pending | — |
| 14 | biotech-iso-whey-zero | BioTech USA | Iso Whey Zero | ⏳ pending | — |
| 15 | weider-premium-whey | Weider | Premium Whey Protein | ⏳ pending | — |
| 16 | proteinfabrikken-whey | Proteinfabrikken | 100% Whey | ⏳ pending | — |
| 17 | smartsupps-whey | SmartSupps | Whey Protein | ⏳ pending | — |
| 18 | bsn-syntha6-isolate | BSN | Syntha-6 Isolate | ⏳ pending | — |
| 19 | olimp-pure-whey | Olimp | Pure Whey Isolate 95 | ⏳ pending | — |
| 20 | qnt-delicious-whey | QNT | Delicious Whey Protein | ⏳ pending | — |
| 21 | esn-isoclear | ESN | Isoclear Whey Isolate | ⏳ pending | — |
| 22 | optimum-gold-standard-casein | Optimum Nutrition | Gold Standard 100% Casein | ⏳ pending | — |
| 23 | myprotein-soy-isolate | MyProtein | Soy Protein Isolate | ⏳ pending | — |
| 24 | myprotein-vegan-blend | MyProtein | Vegan Protein Blend | ⏳ pending | — |
| 25 | proteinseries-100-whey | Protein Series | 100% Whey | ⏳ pending | — |
| 26 | bulk-pure-whey | Bulk | Pure Whey Protein | ⏳ pending | — |

## Kjøringslogg

<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->

### 2026-06-26 — bodylab-whey-100 ✅

- **Kilde:** https://www.bodylab.no/shop/bodylab-whey-100-663p.html
- **Fant produktet:** ja
- **Endringer:** Feil butikk (Gymgrossisten → Bodylab.no), feil pakke (1800g → 1000g), feil protein% (84 → 70)
- **Score:** beregnes på nytt etter datafix (DIAAS + pris/g)
- **Rapport:** `data/protein-verifications/bodylab-whey-100.json`

## Instruks (automasjon)

1. Les denne filen.
2. `node scripts/protein-verify-queue.mjs start` → sett **Aktuell oppgave** til `in_progress`.
3. Verifiser **ett** produkt mot ekte butikkside — aldri finn på data.
4. Oppdater `src/data/proteinProducts.ts` + `data/protein-verifications/<id>.json`.
5. `node scripts/protein-verify-queue.mjs complete --id <id>` eller `reject`.
6. `node scripts/protein-verify-queue.mjs sync-md` → oppdater tabeller.
7. Legg til oppføring i **Kjøringslogg**. Nullstill **Aktuell oppgave** til `idle`.
8. `npm run build` → commit → push.
