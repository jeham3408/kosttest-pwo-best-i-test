# Kosttest – kosttilskudd faktasjekk og utvidelse

Faktasjekker og utvider kosttest.no med nye testkategorier (kreatin, protein, gummies) — én ekte produktsjekk per kjøring.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – kosttilskudd faktasjekk
3. **Trigger:** On a schedule → Custom cron → **`0 * * * *`** (hver time)

   | Felt | Verdi | Betydning |
   |------|-------|-----------|
   | 1 | `0` | Minutt 0 |
   | 2 | `*` | Hver time |
   | 3 | `*` | Hver dag |
   | 4 | `*` | Hver måned |
   | 5 | `*` | Hver ukedag |

4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttilskudd-faktasjekk

Les data/kosttilskudd-verification-status.md og kategori-spesifikk status-MD.
Verifiser NØYAKTIG ÉTT produkt (seksjon 2 ➡️ NÅ).
Start med: node scripts/kosttilskudd-verify-queue.mjs start
Avslutt med: complete/reject + sync-md + sync-master + kjøringslogg.
Ved tom kø: vurder å legge til nye produkter i kreatin/protein.
```

8. **Run now** én gang for å teste.

## Kategorier

| Kategori | Produkter | Status-MD |
|----------|-----------|-----------|
| Kreatin (pulver + gummies) | 8 | `data/creatine-verification-status.md` |
| Proteinpulver | 26 | `data/protein-verification-status.md` |

## Manuell status

```bash
node scripts/kosttilskudd-verify-queue.mjs status
node scripts/kosttilskudd-verify-queue.mjs start --category creatine
node scripts/kosttilskudd-verify-queue.mjs sync-master
```

## Eksisterende automasjoner

- **Protein (5 min):** `$kosttest-protein-verify` — dedikert protein-kø
- **Timevis forbedring:** `$kosttest-hourly-improvement` — PWO/blogg/UX/SEO

Kosttilskudd-automasjonen dekker kreatin + roterer til protein når kreatin-køen er tom.
