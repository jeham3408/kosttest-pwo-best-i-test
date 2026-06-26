# Kosttilskudd verifisering — master status

> Roterer mellom kategorier: kreatin → protein → (fremtidige).
> **Regel:** Produkt uten ekte bilde = ikke ferdig analysert.

## ➡️ NÅ — TEST KUN DETTE

| Felt | Verdi |
|------|-------|
| kategori | **Kreatin** (`creatine`) |
| productId | `star-creatine-500` |
| statusfil | `data/creatine-verification-status.md` |
| produktfil | `src/data/creatineProducts.ts` |
| bildemappe | `public/images/creatine/` |

Les kategori-spesifikk statusfil for detaljer. **Én produkt per kjøring.**

## Kategorioversikt

| Kategori | ID | Ferdig (bilde) | Mangler | Neste | Statusfil |
|----------|-----|----------------|---------|-------|-----------|
| Kreatin | `creatine` | 0 / 8 | 8 | `star-creatine-500` | [status](data/creatine-verification-status.md) |
| Proteinpulver | `protein` | 3 / 26 | 23 | `bodylab-whey-100` | [status](data/protein-verification-status.md) |

## Oppsummering

| Felt | Verdi |
|------|-------|
| Siste kategori | `creatine` |
| Aktiv kategori | `creatine` |
| Aktivt produkt | `star-creatine-500` |
| Siste kjøring | 2026-06-26T18:11:12.475Z |
| Cron | `0 * * * *` (hver time) |

## Instruks

1. `node scripts/kosttilskudd-verify-queue.mjs audit` — oversikt alle kategorier.
2. `node scripts/kosttilskudd-verify-queue.mjs start` — lås neste produkt (roterer kategori).
3. Les kategori-spesifikk statusfil (se tabell over).
4. Verifiser mot butikk + last ned produktbilde.
5. `complete --id <id> --category <id>` eller `reject`.
6. `sync-md` → build → commit → push.
