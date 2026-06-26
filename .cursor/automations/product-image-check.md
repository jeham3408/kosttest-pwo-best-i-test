# Kosttest – produkt-bilde sjekk (hver time)

Systematisk faktasjekk: sjekker om produkter har bilde, finner bilde på nett og legger til når det mangler.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – produkt-bilde sjekk
3. **Trigger:** On a schedule → Every hour (`0 * * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttest-product-image

Kjør produkt-bilde automasjonen:
  npm run product:image:audit
  npm run product:image:run

Behandle batch med produkter uten gyldig bilde. Ikke finn på bilder — kun fra ekte butikksider.
Kjør npm run build, commit og opprett PR med norsk beskrivelse.
```

8. **Run now** for å teste én gang.

## Manuell status

```bash
npm run product:image:init
npm run product:image:status
npm run product:image:audit
PRODUCT_IMAGE_BATCH=3 npm run product:image:run
```
