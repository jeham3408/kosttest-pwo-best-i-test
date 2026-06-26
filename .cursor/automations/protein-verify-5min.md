# Kosttest – protein verifisering (hvert 5. min)

Én ekte produktsjekk per kjøring. Unngår at agenten blir lat og faker hele listen på én gang.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – protein verifisering (1 produkt)
3. **Trigger:** On a schedule → Custom cron → **`*/5 * * * *`** (hvert 5. minutt)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttest-protein-verify

STEG 0: Ta screenshot av https://kosttest.no/tester/protein/
Produkter UTEN ekte bilde (generisk placeholder) = IKKE ferdig analysert.

Les data/protein-verification-status.md — seksjon 1 (ferdig med bilde) og 1b (mangler bilde).

Kjør:
  node scripts/protein-verify-queue.mjs audit
  node scripts/protein-verify-queue.mjs start

Verifiser NØYAKTIG ÉTT produkt (kun productId under ➡️ NÅ).
Last ned produktbilde til public/images/protein/<id>.jpg før complete.
ALDRI test produkter som allerede har bilde. Ikke hopp til neste før cron.
```

8. **Run now** én gang for å teste.

## Ferdig-signal

Produkt er ferdig når `public/images/protein/<id>.jpg` finnes og `image` i proteinProducts.ts peker dit.
`complete` feiler uten bilde.

## Manuell status

```bash
node scripts/protein-verify-queue.mjs audit
node scripts/protein-verify-queue.mjs status
node scripts/protein-verify-queue.mjs next
```
