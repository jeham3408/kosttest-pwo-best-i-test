# Protein verifisering — status

> **STOPP:** Les seksjon **1** (ferdig med bilde) og **1b** (mangler bilde) før du gjør noe.
> **Regel:** Ingen ekte produktbilde = ikke ferdig analysert — selv om køen sier «verified».

## 1. 🚫 FERDIG ANALYSERT — HAR BILDE (ALDRI TEST IGJEN)

> **Regel:** Produkt med ekte bilde i `public/images/protein/` = ferdig. Generisk placeholder = IKKE ferdig.

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
| `bodylab-whey-100` | Bodylab | Whey 100 | 2026-06-28 12:54 | ✅ ferdig (har bilde) |

**FORBUDT å teste på nytt:** `bodylab-whey-100`

Sjekk live-liste: https://kosttest.no/tester/protein/

## 1b. 🖼️ MANGLER BILDE — IKKE FERDIG ANALYSERT

| productId | Merke | Navn | Kø-status | Bilde |
|-----------|-------|------|-----------|-------|
| `dymatize-iso100` **← NESTE** | Dymatize | ISO100 Hydrolyzed 100% Whey Isolate | ✅ verified | 🖼️ mangler |
| `optimum-gold-standard` | Optimum Nutrition | Gold Standard 100% Whey | ✅ verified | 🖼️ mangler |
| `star-whey-100` | Star Nutrition | Whey-100 | ✅ verified | 🖼️ mangler |
| `myprotein-impact-whey` | MyProtein | Impact Whey Protein | ⏳ pending | 🖼️ mangler |
| `scitec-100-whey-professional` | Scitec Nutrition | 100% Whey Protein Professional | ⏳ pending | 🖼️ mangler |
| `applied-critical-whey` | Applied Nutrition | Critical Whey | ⏳ pending | 🖼️ mangler |
| `mutant-iso-surge` | Mutant | ISO Surge | ⏳ pending | 🖼️ mangler |
| `rule1-r1-protein` | Rule 1 | R1 Protein | ⏳ pending | 🖼️ mangler |
| `muscletech-nitrotech` | MuscleTech | Nitro-Tech Whey Gold | ⏳ pending | 🖼️ mangler |
| `kevin-levrone-levro-whey` | Kevin Levrone | Levro Whey Supreme | ⏳ pending | 🖼️ mangler |
| `ghost-whey` | Ghost | Ghost Whey | ⏳ pending | 🖼️ mangler |
| `esn-designer-whey` | ESN | Designer Whey Protein | ⏳ pending | 🖼️ mangler |
| `biotech-iso-whey-zero` | BioTech USA | Iso Whey Zero | ⏳ pending | 🖼️ mangler |
| `weider-premium-whey` | Weider | Premium Whey Protein | ⏳ pending | 🖼️ mangler |
| `proteinfabrikken-whey` | Proteinfabrikken | 100% Whey | ⏳ pending | 🖼️ mangler |
| `smartsupps-whey` | SmartSupps | Whey Protein | ⏳ pending | 🖼️ mangler |
| `bsn-syntha6-isolate` | BSN | Syntha-6 Isolate | ⏳ pending | 🖼️ mangler |
| `olimp-pure-whey` | Olimp | Pure Whey Isolate 95 | ⏳ pending | 🖼️ mangler |
| `qnt-delicious-whey` | QNT | Delicious Whey Protein | ⏳ pending | 🖼️ mangler |
| `esn-isoclear` | ESN | Isoclear Whey Isolate | ⏳ pending | 🖼️ mangler |
| `optimum-gold-standard-casein` | Optimum Nutrition | Gold Standard 100% Casein | ⏳ pending | 🖼️ mangler |
| `myprotein-soy-isolate` | MyProtein | Soy Protein Isolate | ⏳ pending | 🖼️ mangler |
| `myprotein-vegan-blend` | MyProtein | Vegan Protein Blend | ⏳ pending | 🖼️ mangler |
| `proteinseries-100-whey` | Protein Series | 100% Whey | ⏳ pending | 🖼️ mangler |
| `bulk-pure-whey` | Bulk | Pure Whey Protein | ⏳ pending | 🖼️ mangler |

**25 produkter uten ekte bilde.** Disse skal verifiseres — ta screenshot av listen og sammenlign.

## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| productId | `dymatize-iso100` |
| merke | Dymatize |
| navn | ISO100 Hydrolyzed 100% Whey Isolate |
| url i repo (sjekk/fiks) | https://www.gymgrossisten.no/iso-100-myseproteinisolat-932-g/9922-098R.html |
| har bilde | 🖼️ nei — må hentes |
| kø-status | ✅ verified |
| kjøring | ⏳ klar — kjør `node scripts/protein-verify-queue.mjs start` |
| startet | — |

**TEST KUN `dymatize-iso100` i denne kjøringen.** Husk: last ned produktbilde til `public/images/protein/dymatize-iso100.jpg` før `complete`.

**IKKE test:** `bodylab-whey-100`

## 3. ⬅️ Sist ferdig (referanse — ikke test igjen)

| Felt | Verdi |
|------|-------|
| productId | `bodylab-whey-100` |
| merke | Bodylab |
| navn | Whey 100 |
| resultat | ✅ ferdig (har bilde) |
| ferdig | 2026-06-28 12:54 |

Sist ferdig var `bodylab-whey-100`. Neste uten bilde: `dymatize-iso100`.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Ferdig (har bilde) | 1 / 26 |
| Mangler bilde | 25 |
| Avvist | 0 |
| Neste uten bilde | `dymatize-iso100` |
| Siste kjøring | 2026-06-28 12:54 |
| Live-liste | https://kosttest.no/tester/protein/ |
| Cron | `*/5 * * * *` (hvert 5. min) |

## Produktkø

| # | ID | Merke | Navn | Kø | Bilde | Dato |
|---|-----|-------|------|-----|-------|------|
| 1 | dymatize-iso100 | Dymatize | ISO100 Hydrolyzed 100% Whey Isolate | ✅ verified | 🖼️ ❌ | 2026-06-26 |
| 2 | optimum-gold-standard | Optimum Nutrition | Gold Standard 100% Whey | ✅ verified | 🖼️ ❌ | 2026-06-26 |
| 3 | bodylab-whey-100 ← forrige | Bodylab | Whey 100 | ✅ verified | 🖼️ ✅ | 2026-06-28 |
| 4 | star-whey-100 | Star Nutrition | Whey-100 | ✅ verified | 🖼️ ❌ | 2026-06-26 |
| 5 | myprotein-impact-whey | MyProtein | Impact Whey Protein | ⏳ pending | 🖼️ ❌ | — |
| 6 | scitec-100-whey-professional | Scitec Nutrition | 100% Whey Protein Professional | ⏳ pending | 🖼️ ❌ | — |
| 7 | applied-critical-whey | Applied Nutrition | Critical Whey | ⏳ pending | 🖼️ ❌ | — |
| 8 | mutant-iso-surge | Mutant | ISO Surge | ⏳ pending | 🖼️ ❌ | — |
| 9 | rule1-r1-protein | Rule 1 | R1 Protein | ⏳ pending | 🖼️ ❌ | — |
| 10 | muscletech-nitrotech | MuscleTech | Nitro-Tech Whey Gold | ⏳ pending | 🖼️ ❌ | — |
| 11 | kevin-levrone-levro-whey | Kevin Levrone | Levro Whey Supreme | ⏳ pending | 🖼️ ❌ | — |
| 12 | ghost-whey | Ghost | Ghost Whey | ⏳ pending | 🖼️ ❌ | — |
| 13 | esn-designer-whey | ESN | Designer Whey Protein | ⏳ pending | 🖼️ ❌ | — |
| 14 | biotech-iso-whey-zero | BioTech USA | Iso Whey Zero | ⏳ pending | 🖼️ ❌ | — |
| 15 | weider-premium-whey | Weider | Premium Whey Protein | ⏳ pending | 🖼️ ❌ | — |
| 16 | proteinfabrikken-whey | Proteinfabrikken | 100% Whey | ⏳ pending | 🖼️ ❌ | — |
| 17 | smartsupps-whey | SmartSupps | Whey Protein | ⏳ pending | 🖼️ ❌ | — |
| 18 | bsn-syntha6-isolate | BSN | Syntha-6 Isolate | ⏳ pending | 🖼️ ❌ | — |
| 19 | olimp-pure-whey | Olimp | Pure Whey Isolate 95 | ⏳ pending | 🖼️ ❌ | — |
| 20 | qnt-delicious-whey | QNT | Delicious Whey Protein | ⏳ pending | 🖼️ ❌ | — |
| 21 | esn-isoclear | ESN | Isoclear Whey Isolate | ⏳ pending | 🖼️ ❌ | — |
| 22 | optimum-gold-standard-casein | Optimum Nutrition | Gold Standard 100% Casein | ⏳ pending | 🖼️ ❌ | — |
| 23 | myprotein-soy-isolate | MyProtein | Soy Protein Isolate | ⏳ pending | 🖼️ ❌ | — |
| 24 | myprotein-vegan-blend | MyProtein | Vegan Protein Blend | ⏳ pending | 🖼️ ❌ | — |
| 25 | proteinseries-100-whey | Protein Series | 100% Whey | ⏳ pending | 🖼️ ❌ | — |
| 26 | bulk-pure-whey | Bulk | Pure Whey Protein | ⏳ pending | 🖼️ ❌ | — |

## Kjøringslogg

<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->

### 2026-06-28 — bodylab-whey-100 ✅ FERDIG (har bilde)

- **Kilde:** https://www.bodylab.no/shop/bodylab-whey-100-663p.html
- **Fant produktet:** ja
- **Endringer:** Pris (349→297 kr kampanje), bilde lagt til, laktoseanalyse, kalorier (387 kcal/100 g), allergennotat
- **Laktose:** Inneholder laktose (whey konsentrat + isolat) — ikke laktosefri. Melke- og soyaallergen.
- **Bilde:** `public/images/protein/bodylab-whey-100.jpg` (fra bodylab.no CDN)
- **Score:** beregnes på nytt (lavere pris forbedrer pris/g protein)
- **Rapport:** `data/protein-verifications/bodylab-whey-100.json`
- **🚫 IKKE test igjen:** `bodylab-whey-100` — ferdig med bilde
- **➡️ Neste:** `dymatize-iso100` — bildefil finnes på disk, men `image` i proteinProducts.ts mangler fortsatt

### 2026-06-26 — star-whey-100 ✅

- **Kilde:** https://www.gymgrossisten.no/whey-100-myseprotein-1-kg/575R.html
- **Fant produktet:** ja (repo-URL var 404)
- **Endringer:** Feil URL (404), navn (100% Whey→Whey-100), pris (399→549 kr), porsjon (30→37 g), porsjoner (33→27), protein% (78→84), type (concentrate→isolate), leucin fjernet
- **Laktose:** Lavt innhold (whey isolate), men ikke laktosefri — melkeallergen + soya + fenylalanin
- **Bilde:** `public/images/protein/star-whey-100.jpg` (fra GG)
- **Score:** beregnes på nytt (høyere protein% men også høyere pris)
- **Rapport:** `data/protein-verifications/star-whey-100.json`
- **➡️ Neste:** `myprotein-impact-whey` — IKKE test `star-whey-100` igjen

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

1. **Screenshot:** Ta bilde av https://kosttest.no/tester/protein/ — produkter uten ekte bilde er ikke ferdig.
2. `node scripts/protein-verify-queue.mjs audit` → bekreft hvem som mangler bilde.
3. Les **seksjon 1** (🚫 ferdig med bilde) — disse ID-ene er **forbudt**.
4. Les **seksjon 2** (➡️ NÅ) — dette er det **eneste** produktet du skal teste.
5. `node scripts/protein-verify-queue.mjs start` → låser neste produkt **uten bilde**.
6. Verifiser mot ekte butikkside + **last ned produktbilde** til `public/images/protein/<id>.jpg`.
7. Oppdater `src/data/proteinProducts.ts` + `data/protein-verifications/<id>.json`.
8. `node scripts/protein-verify-queue.mjs complete --id <id>` (feiler uten bilde) eller `reject`.
9. `node scripts/protein-verify-queue.mjs sync-md` → oppdater seksjon 1 og 2.
10. Legg til oppføring i **Kjøringslogg**.
11. `npm run build` → commit → push.
