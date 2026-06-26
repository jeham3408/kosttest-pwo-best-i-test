# Kosttest – produktbilde og faktasjekk

Systematisk sjekk av produkt-URL og bilde. Finner og legger til bilde fra nett når det mangler.

## Oppsett i Cursor Automations

1. Åpne **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – produktbilde
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På (anbefalt)
7. **Prompt:**

```
Følg skill $kosttest-product-image
```

Alternativt:

```
Les og følg instruksjonene i .cursor/skills/kosttest-product-image/SKILL.md
```

8. **Run now** for å teste én gang.

## Hva skjer per kjøring

- Maks **5 produkter** per batch (`PRODUCT_IMAGE_BATCH` kan overstyres)
- Sjekker om produkt-URL fungerer
- Sjekker om bilde finnes og er gyldig
- Henter bilde fra produktside eller bildesøk
- Oppdaterer `pwoProducts.ts` / `proteinProducts.ts`
- Commit + PR når det er endringer

## Manuell kjøring lokalt

```bash
node scripts/product-image-queue.mjs init   # første gang / etter nye produkter
node scripts/product-image-run.mjs          # én batch
node scripts/product-image-queue.mjs status
```
