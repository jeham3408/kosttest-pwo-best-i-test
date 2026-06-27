# Kosttest – tilbakemeldinger (hver time)

Leser, vurderer og legger godkjente produkter inn i test/rangering.

## Oppsett i Cursor Automations

1. **Agents Window** → **Automations** → **+ New automation**
2. **Navn:** Kosttest – tilbakemeldinger (1 melding)
3. **Trigger:** On a schedule → Custom cron → **`0 * * * *`** (hver time)
4. **Repository:** `jeham3408/kosttest-pwo-best-i-test` · branch `main`
5. **Agent:** Cloud Agent
6. **Memory:** På
7. **Prompt:**

```
Følg skill $kosttest-feedback-review

Kjør:
  node scripts/feedback-process-queue.mjs pull-github
  node scripts/feedback-process-queue.mjs audit
  node scripts/feedback-process-queue.mjs process

Behandle NØYAKTIG ÉN pending melding per kjøring.

Etter process: utfør ALLE steg i agentMustDo / ingestPlan.agentSteps i SAMME kjøring:
- Verifiser produkt mot ekte butikkside
- Legg til i riktig katalog (creatine/protein/pwo)
- npm run build
- node scripts/feedback-process-queue.mjs complete-ingest --id <id> --productId <slug> --status listed

Ikke finn på data. Avvis butikk/merke-forslag (vi rangerer kun kosttilskudd).
```

## Miljøvariabler

- **Produksjon (Vercel):** `GITHUB_TOKEN`, `GITHUB_FEEDBACK_REPO`
- **Valgfritt:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **Valgfritt:** `FEEDBACK_WEBHOOK_URL`

## Manuell status

```bash
npm run feedback:pull-github
npm run feedback:audit
npm run feedback:process
```
