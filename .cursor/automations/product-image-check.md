# Kosttest – produkt-bilde automasjon

Systematisk faktasjekk og bilde-oppdatering for produkter uten bilde.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – produkt-bilde sjekk
3. **Trigger:** On a schedule → Every 6 hours (`0 */6 * * *`)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Kjør produkt-bilde automasjonen for kosttest.no:

1. Kjør `python3 run_automation.py --limit 10` for å finne og legge til bilder for produkter uten bilde
2. Sjekk rapporten i `data/last_run_report.json`
3. Kjør `npm run lint && npm run build` etter endringer
4. Opprett PR med norsk beskrivelse av hvilke produkter som fikk bilde
5. Hvis alle produkter har bilde, avslutt uten PR og noter status
```

## Manuell kjøring

```bash
# Dry-run (ingen endringer)
python3 run_automation.py --dry-run --limit 5

# Behandle 10 produkter
python3 run_automation.py --limit 10

# Cron-wrapper (brukes av automasjon)
./scripts/cron_run.sh
```

## Hva skriptet gjør

1. **Parser** `src/data/pwoProducts.ts` og finner listede produkter uten `image`-felt
2. **Faktasjekker** at produkt-URL er tilgjengelig
3. **Finner bilde** i prioritert rekkefølge:
   - `og:image` fra produktsiden (butikk-URL)
   - Bing bildesøk
   - DuckDuckGo bildesøk
4. **Oppdaterer** `pwoProducts.ts` med funne bilde-URL
5. **Sporer** fremdrift i `data/state.json`
6. **Rapporterer** resultat i `data/last_run_report.json`

## Filer

| Fil | Formål |
|-----|--------|
| `scripts/product_image_automation.py` | Hovedskript |
| `run_automation.py` | Inngangspunkt |
| `scripts/cron_run.sh` | Cron-wrapper (maks 10 per kjøring) |
| `data/state.json` | Sporer behandlede produkter |
| `data/last_run_report.json` | Siste kjøringsrapport |

## Rate limiting

Skriptet venter 0,6 sekunder mellom HTTP-kall og behandler maks 10 produkter per cron-kjøring for å unngå blokkering fra butikker.
