# Kreatin (pulver + gummies) — verifiseringsstatus

> **STOPP:** Les seksjon **1** (ferdig testet) og **2** (nå) før du gjør noe. Test **aldri** produkter i seksjon 1.

## 1. 🚫 FERDIG TESTET — ALDRI TEST DISSE IGJEN

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
| `star-creatine-500` | Star Nutrition | Kreatin Monohydrat 500 g | 2026-06-26 17:04 | ✅ verified |

**FORBUDT å teste på nytt:** `star-creatine-500`

Rapport ligger i `data/creatine-verifications/<id>.json`.

## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| kategori | **Kreatin (pulver + gummies)** (`creatine`) |
| productId | `star-creatine-300` |
| merke | Star Nutrition |
| navn | Kreatin Monohydrat 300 g |
| url i repo (sjekk/fiks) | https://www.gymgrossisten.no/kreatin-monohydrat-300-g/609.MASTER.300.html |
| kø-status | ⏳ pending |
| kjøring | ⏳ klar — kjør `node scripts/kosttilskudd-verify-queue.mjs start` |
| startet | — |

**TEST KUN `star-creatine-300` i denne kjøringen.**

**IKKE test:** `star-creatine-500`

## 3. ⬅️ Sist ferdig (referanse — ikke test igjen)

| Felt | Verdi |
|------|-------|
| productId | `star-creatine-500` |
| merke | Star Nutrition |
| navn | Kreatin Monohydrat 500 g |
| resultat | ✅ verified |
| ferdig | 2026-06-26 17:04 |

Sist ferdig var `star-creatine-500`. Neste er `star-creatine-300`.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Kategori | Kreatin (pulver + gummies) |
| Verifisert | 1 / 8 |
| Avvist | 0 |
| Gjenstår | 7 |
| Neste i kø | `star-creatine-300` |
| Siste kjøring | 2026-06-26 17:04 |

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
| 1 | star-creatine-500 ← forrige | Star Nutrition | Kreatin Monohydrat 500 g | ✅ verified | 2026-06-26 |
| 2 | star-creatine-300 | Star Nutrition | Kreatin Monohydrat 300 g | ⏳ pending | — |
| 3 | smartsupps-creatine-1kg | SmartSupps | Creatine Monohydrate 1 kg | ⏳ pending | — |
| 4 | on-creatine-600 | Optimum Nutrition | Micronized Creatine Powder 600 g | ⏳ pending | — |
| 5 | mutant-creakong | Mutant | CreaKong | ⏳ pending | — |
| 6 | star-creatine-gummies-75 | Star Nutrition | Creatine Gummies 75 stk | ⏳ pending | — |
| 7 | elit-creatine-gummies-60 | Elit | Creatine Gummies 60 stk | ⏳ pending | — |
| 8 | applied-creatine-gummies-80 | Applied Nutrition | Creatine Gummies 80 stk | ⏳ pending | — |

## Kjøringslogg

<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->

### 2026-06-26 — star-creatine-500 ✅

- **Kilde:** [Gymgrossisten](https://www.gymgrossisten.no/kreatin-monohydrat-500-g/609.MASTER.html)
- **Endringer:** Ingen — pris (215 kr), dose (5 g), pakke (500 g/100 porsjoner) stemte med butikk.
- **Score:** Automatisk beregnet via `creatineScoring.ts`

## Instruks (automasjon)

1. Les **seksjon 1** (🚫 ferdig testet) — disse ID-ene er **forbudt**.
2. Les **seksjon 2** (➡️ NÅ) — dette er det **eneste** produktet du skal teste.
3. `node scripts/kosttilskudd-verify-queue.mjs start --category creatine` → låser produktet under **NÅ**.
4. Verifiser **kun** productId fra seksjon 2 mot ekte butikkside.
5. Oppdater `src/data/creatineProducts.ts` + `data/creatine-verifications/<id>.json`.
6. `node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category creatine` eller `reject`.
7. `node scripts/kosttilskudd-verify-queue.mjs sync-md --category creatine`.
8. Legg til oppføring i **Kjøringslogg**.
9. `npm run build` → commit → push.
