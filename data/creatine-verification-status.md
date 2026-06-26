# Kreatin verifisering — status

> **STOPP:** Les seksjon **1** (ferdig med bilde) og **1b** (mangler bilde) før du gjør noe.
> **Regel:** Ingen ekte produktbilde = ikke ferdig analysert.

## 1. 🚫 FERDIG ANALYSERT — HAR BILDE (ALDRI TEST IGJEN)

> **Regel:** Produkt med ekte bilde i `public/images/creatine/` = ferdig. Generisk placeholder = IKKE ferdig.

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
| — | — | Ingen ferdig ennå | — | — |

**FORBUDT å teste på nytt:** ingen ennå

Sjekk live-liste: https://kosttest.no/tester/kreatin/

## 1b. 🖼️ MANGLER BILDE — IKKE FERDIG ANALYSERT

| productId | Merke | Navn | Kø-status | Bilde |
|-----------|-------|------|-----------|-------|
| `star-creatine-500` **← NESTE** | Star Nutrition | Creatine Monohydrate 500 g | ⏳ pending | 🖼️ mangler |
| `star-creatine-300` | Star Nutrition | Creatine Monohydrate 300 g | ⏳ pending | 🖼️ mangler |
| `smartsupps-creatine-1kg` | SmartSupps | Creatine Monohydrate 1 kg | ⏳ pending | 🖼️ mangler |
| `on-creatine-600` | Optimum Nutrition | Micronized Creatine Powder 600 g | ⏳ pending | 🖼️ mangler |
| `mutant-creakong` | Mutant | Creakong | ⏳ pending | 🖼️ mangler |
| `star-creatine-gummies-75` | Star Nutrition | Creatine Gummies 75 stk | ⏳ pending | 🖼️ mangler |
| `elit-creatine-gummies` | ELIT | Creatine Gummies | ⏳ pending | 🖼️ mangler |
| `applied-creatine-gummies` | Applied Nutrition | Creatine Gummies | ⏳ pending | 🖼️ mangler |

**8 produkter uten ekte bilde.** Disse skal verifiseres.

## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| productId | `star-creatine-500` |
| merke | Star Nutrition |
| navn | Creatine Monohydrate 500 g |
| url i repo (sjekk/fiks) | https://www.gymgrossisten.no/creatine-monohydrate-500-g/9922-098R.html |
| har bilde | 🖼️ nei — må hentes |
| kø-status | ⏳ pending |
| kjøring | 🔒 in_progress (låst av start) |
| startet | 2026-06-26 18:11 |

**TEST KUN `star-creatine-500` i denne kjøringen.** Last ned bilde til `public/images/creatine/star-creatine-500.jpg` før complete.

**IKKE test:** ingen ferdige ennå

## 3. ⬅️ Sist ferdig (referanse)

Ingen produkter ferdig med bilde ennå.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Ferdig (har bilde) | 0 / 8 |
| Mangler bilde | 8 |
| Avvist | 0 |
| Neste uten bilde | `star-creatine-500` |
| Siste kjøring | 2026-06-26 18:11 |
| Live-liste | https://kosttest.no/tester/kreatin/ |

## Produktkø

| # | ID | Merke | Navn | Kø | Bilde | Dato |
|---|-----|-------|------|-----|-------|------|
| 1 | star-creatine-500 **← NÅ** | Star Nutrition | Creatine Monohydrate 500 g | ⏳ pending | 🖼️ ❌ | — |
| 2 | star-creatine-300 | Star Nutrition | Creatine Monohydrate 300 g | ⏳ pending | 🖼️ ❌ | — |
| 3 | smartsupps-creatine-1kg | SmartSupps | Creatine Monohydrate 1 kg | ⏳ pending | 🖼️ ❌ | — |
| 4 | on-creatine-600 | Optimum Nutrition | Micronized Creatine Powder 600 g | ⏳ pending | 🖼️ ❌ | — |
| 5 | mutant-creakong | Mutant | Creakong | ⏳ pending | 🖼️ ❌ | — |
| 6 | star-creatine-gummies-75 | Star Nutrition | Creatine Gummies 75 stk | ⏳ pending | 🖼️ ❌ | — |
| 7 | elit-creatine-gummies | ELIT | Creatine Gummies | ⏳ pending | 🖼️ ❌ | — |
| 8 | applied-creatine-gummies | Applied Nutrition | Creatine Gummies | ⏳ pending | 🖼️ ❌ | — |

## Kjøringslogg

<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->


## Instruks (automasjon)

1. Screenshot av https://kosttest.no/tester/kreatin/ — produkter uten ekte bilde er ikke ferdig.
2. Les **seksjon 1** (🚫 ferdig) og **seksjon 2** (➡️ NÅ).
3. Verifiser mot ekte butikkside + last ned bilde til `public/images/creatine/<id>.jpg`.
4. Oppdater `src/data/creatineProducts.ts` + `data/creatine-verifications/<id>.json`.
5. Kjør complete (feiler uten bilde) eller reject.
6. `npm run build` → commit → push.
