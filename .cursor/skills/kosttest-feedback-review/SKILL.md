# Kosttest – tilbakemeldinger (footer)

Leser, vurderer og **legger godkjente produkter inn i test/rangering**.

## Når du bruker denne skillen

- Brukeren ber om å lese/vurdere tilbakemeldinger
- Cursor-automasjonen `feedback-review-hourly` kjører
- Et leserforslag om manglende produkt eller feil produktdata skal behandles

## Kommandoer (kjør i rekkefølge)

```bash
node scripts/feedback-process-queue.mjs pull-github   # Hent nye fra GitHub Issues (produksjon)
# eller: node scripts/feedback-process-queue.mjs pull  # Supabase hvis konfigurert
node scripts/feedback-process-queue.mjs audit
node scripts/feedback-process-queue.mjs process         # Vurder ÉN melding + lag ingest-plan
```

## Etter `process` — OBLIGATORISK samme kjøring

`process` returnerer `agentMustDo` / `ingestPlan.agentSteps`. **Du skal utføre alle steg**, ikke bare notere anbefaling:

| verdict | Handling |
|---------|----------|
| `candidate_for_testing` | Verifiser produkt på ekte butikkside → legg i riktig katalog → `npm run build` |
| `needs_product_correction` | Finn produkt i katalog → rett feil data med kilde → `npm run build` |
| `likely_already_listed` | Finn eksisterende `productId` i kategori → bekreft data → `npm run build` → `complete-ingest --status listed` |
| `rejected_invalid` | Avvis (test, butikk/merke, ugyldig type). Kjør `reject --id` hvis allerede triaged |
| `needs_manual_review` | Les og vurder manuelt |

### Kategori → fil

| Kategori | Legg til / oppdater |
|----------|---------------------|
| `creatine` | `src/data/creatineProducts.ts` + bilde i `public/products/` + `data/creatine-images.json` |
| `protein` | `src/data/proteinProducts.ts` + `src/data/proteinVerificationQueue.json` → deretter `kosttest-protein-verify` |
| `pwo` | `listedProducts` i `src/data/pwoProducts.ts` → etter dosekontroll `testedProducts` |

### Avslutt ingest

```bash
node scripts/feedback-process-queue.mjs complete-ingest --id <feedbackId> --productId <slug> --status listed
node scripts/feedback-process-queue.mjs reject --id <feedbackId> --reason "kort begrunnelse"
```

Status: `listed` | `duplicate` | `corrected`

## Hard regler

1. **Aldri finn på produkter, priser eller doser** — verifiser mot butikk/produsent.
2. **Merker som kun selger PWO** (NutriTac, Peveo) skal **ikke** legges i protein-testen.
3. **Behandle én melding per kjøring** (`process` én gang).
4. **Ikke eksponer e-post** i commits eller offentlig tekst.
5. **GitHub Issues** er produksjonskilde når Supabase ikke er satt opp.

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `data/feedback-inbox.json` | Synket inbox |
| `data/feedback-ingest-queue.json` | Produkter som skal inn i test |
| `data/feedback-review-status.md` | Status for automasjon |
