---
name: kosttest-protein-verify
description: Verifiserer ÉTT proteinpulver per kjøring mot ekte butikkside. Bruk i Cursor Automation med cron */5 * * * * (hvert 5. min).
---

# Kosttest – protein verifisering (1 produkt per kjøring)

Du verifiserer **nøyaktig ett** proteinpulver per automasjonskjøring. Ikke hopp over. Ikke gjør flere produkter i samme kjøring — cron kjører igjen om 5 minutter.

## Hard regler

1. **Aldri finn på produkter, priser, protein% eller URL-er.**
2. **Produktet må finnes** på lenken du oppgir — sjekk at siden laster og viser riktig vare.
3. **Merker som kun selger PWO** (NutriTac, Peveo, osv.) skal **avvises** og fjernes fra `proteinProducts.ts`.
4. **Næringsdata** skal komme fra næringsdeklarasjon på produktsiden — ikke gjetning.
5. **DIAAS uten lab-test** = estimat (`diaasIsOfficial: false`). Ikke kall det offisiell DIAAS.
6. **Score** beregnes via eksisterende `calculateProteinGrade()` — oppdater rådata, ikke score manuelt.

## Arbeidsflyt (følg i rekkefølge)

### Steg 1 — Hent neste produkt

```bash
node scripts/protein-verify-queue.mjs start
```

Output gir `productId` og `reportPath`. Hvis `done: true`, avslutt uten endring.

### Steg 2 — Les produktet i repo

Finn oppføringen i `src/data/proteinProducts.ts` for `productId`.

### Steg 3 — Verifiser mot ekte kilde

- Åpne produktets `url` og **søk på nett** om URL er feil.
- Bekreft: produktnavn, merke, pris (NOK), pakkestørrelse, protein per 100 g, dosestørrelse.
- Noter **ekte produkt-URL** (Gymgrossisten, MyProtein, Bodylab, Proteinfabrikken, osv.).
- Hvis produktet **ikke finnes**: kjør `node scripts/protein-verify-queue.mjs reject --id <id> --reason "..."`, **fjern** fra `rawProducts`, commit, stopp.

### Steg 4 — Skriv rapport

Lag/oppdater `data/protein-verifications/<id>.json`:

```json
{
  "id": "...",
  "exists": true,
  "verifiedAt": "<ISO>",
  "sources": ["<ekte produkt-URL>"],
  "checks": {
    "productPageLoads": true,
    "nameMatches": true,
    "nutritionFromLabel": true,
    "priceFromMerchant": true
  },
  "corrections": ["liste over hva som var feil"],
  "data": {
    "name", "brand", "merchant", "url", "priceNok",
    "packageSizeG", "packageSize", "servingSizeG", "servingSize", "servings",
    "proteinPer100g", "proteinPerServingG", "sourceType", "sourceLabel"
  },
  "analysis": "2-4 setninger ærlig vurdering",
  "notes": "usikkerhet eller kampanjepris"
}
```

### Steg 5 — Oppdater produktdata

I `src/data/proteinProducts.ts`, oppdater **kun** det verifiserte produktet med data fra rapporten. Oppdater også `verdict`, `strengths`, `watchouts` hvis de var basert på feil info.

`sourceType` må matche `ProteinSourceType` i `proteinScoring.ts`.

### Steg 6 — Merk verifisert i kø

```bash
node scripts/protein-verify-queue.mjs complete --id <id>
```

### Steg 7 — Bygg og lever

```bash
npm run build
```

Commit med melding: `Verify protein: <id> — <kort beskrivelse>`

Push til `main` (én commit per produkt).

## Scoring

Etter dataoppdatering regner `gradeProduct()` ut score automatisk ved build:
- **DIAAS 70 %** + **pris per g protein 30 %**
- **IAAS** fra aminosyreprofil-mal (ikke i totalscore)

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/protein-verify-queue.mjs` | Kø: next/start/complete/reject |
| `src/data/proteinVerificationQueue.json` | Status per produkt |
| `data/protein-verifications/*.json` | Verifikasjonsrapporter |
| `src/data/proteinProducts.ts` | Produkter (kun ekte data) |
| `src/data/proteinScoring.ts` | DIAAS/IAAS motor |

Live: https://kosttest.no  
Repo: `jeham3408/kosttest-pwo-best-i-test`
