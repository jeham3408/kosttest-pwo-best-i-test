# Protein verifisering — status

> **Automasjon:** Les **FORRIGE** og **NÅ** først. Test kun produktet under **NÅ**. Oppdater **Kjøringslogg** etterpå.

## ⬅️ FORRIGE (ferdig testet — ikke test på nytt)

| Felt | Verdi |
|------|-------|
| productId | `optimum-gold-standard` |
| merke | Optimum Nutrition |
| navn | Gold Standard 100% Whey |
| resultat | ✅ verified |
| ferdig | 2026-06-26 15:54 |
| url i repo | https://www.gymgrossisten.no/100-whey-gold-standard-myseprotein-908-g/6870R.html |

**Du skal IKKE teste `optimum-gold-standard` igjen.**

## ➡️ NÅ (test KUN dette produktet i denne kjøringen)

| Felt | Verdi |
|------|-------|
| productId | `star-whey-100` |
| merke | Star Nutrition |
| navn | 100% Whey |
| url i repo (sjekk/fiks) | https://www.gymgrossisten.no/star-nutrition-100-whey |
| kø-status | ⏳ pending |
| kjøring | ⏳ klar — kjør `node scripts/protein-verify-queue.mjs start` |
| startet | — |

**TEST KUN `star-whey-100` i denne kjøringen. Ett produkt. Ikke hopp over. Ikke test flere.**

## Oppsummering

| Felt | Verdi |
|------|-------|
| Verifisert | 3 / 26 |
| Avvist | 0 |
| Gjenstår | 23 |
| Neste i kø | `star-whey-100` |
| Siste kjøring | 2026-06-26 15:54 |
| Cron | `*/5 * * * *` (hvert 5. min) |

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
| 1 | dymatize-iso100 | Dymatize | ISO100 Hydrolyzed 100% Whey Isolate | ✅ verified | 2026-06-26 |
| 2 | optimum-gold-standard ← forrige | Optimum Nutrition | Gold Standard 100% Whey | ✅ verified | 2026-06-26 |
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

### 2026-06-26 — optimum-gold-standard ✅

- **Kilde:** https://www.gymgrossisten.no/100-whey-gold-standard-myseprotein-908-g/6870R.html
- **Fant produktet:** ja (utsolgt, men siden og data gyldig)
- **Endringer:** Feil URL (404), porsjon (30,4→30 g), porsjoner (29→30), leucin fjernet (ikke på NO-etikett)
- **Laktose:** Inneholder laktose fra whey concentrate — ikke laktosefri
- **Bilde:** `public/images/protein/optimum-gold-standard.jpg`
- **Score:** beregnes på nytt (pris/g uendret, små porsjonsjusteringer)
- **Rapport:** `data/protein-verifications/optimum-gold-standard.json`
- **➡️ Neste:** `star-whey-100` — IKKE test `optimum-gold-standard` igjen

### 2026-06-26 — dymatize-iso100 ✅

- **Kilde:** https://www.gymgrossisten.no/iso-100-myseproteinisolat-932-g/9922-098R.html
- **Fant produktet:** ja (utsolgt, men siden og data gyldig)
- **Endringer:** Feil URL, pris (699→899 kr), pakke (907→932 g), porsjon (31→32 g), protein% (86→78), leucin fjernet (ikke på NO-etikett)
- **Laktose:** Filtrert ut ifølge produsent — laktosefattig, men melkeallergen
- **Bilde:** `public/images/protein/dymatize-iso100.jpg` (fra GG)
- **Score:** beregnes på nytt (lavere protein% + høyere pris)
- **Rapport:** `data/protein-verifications/dymatize-iso100.json`
- **➡️ Neste:** `optimum-gold-standard` — IKKE test `dymatize-iso100` igjen

### 2026-06-26 — bodylab-whey-100 ✅

- **Kilde:** https://www.bodylab.no/shop/bodylab-whey-100-663p.html
- **Fant produktet:** ja
- **Endringer:** Feil butikk (Gymgrossisten → Bodylab.no), feil pakke (1800g → 1000g), feil protein% (84 → 70)
- **Score:** beregnes på nytt etter datafix (DIAAS + pris/g)
- **Rapport:** `data/protein-verifications/bodylab-whey-100.json`

## Instruks (automasjon)

1. Les **⬅️ FORRIGE** og **➡️ NÅ** i denne filen.
2. `node scripts/protein-verify-queue.mjs start` → låser produktet under **NÅ**.
3. Verifiser **kun** productId under **NÅ** mot ekte butikkside.
4. Oppdater `src/data/proteinProducts.ts` + `data/protein-verifications/<id>.json`.
5. `node scripts/protein-verify-queue.mjs complete --id <id>` eller `reject`.
6. `node scripts/protein-verify-queue.mjs sync-md` → oppdater FORRIGE/NÅ og tabell.
7. Legg til oppføring i **Kjøringslogg**.
8. `npm run build` → commit → push.
