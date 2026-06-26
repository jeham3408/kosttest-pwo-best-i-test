---
name: kosttest-protein-verify
description: Verifiserer ÉTT proteinpulver per kjøring mot ekte butikkside. Bruk i Cursor Automation med cron */5 * * * * (hvert 5. min).
---

# Kosttest – protein verifisering (1 produkt per kjøring)

Du verifiserer **nøyaktig ett** proteinpulver per automasjonskjøring. Ikke hopp over. Ikke gjør flere produkter i samme kjøring — cron kjører igjen om 5 minutter.

## Ferdig = har produktbilde

**Regel:** Et produkt er først ferdig analysert når det har **ekte produktbilde** i `public/images/protein/<id>.jpg` (ikke generisk placeholder `IMG`).

- Produkter **med bilde** på listen = ferdig — **ALDRI test igjen**
- Produkter **uten bilde** (generisk whey-placeholder) = **ikke ferdig** — disse skal verifiseres
- `complete` feiler uten bilde

## Hard regler

1. **Aldri finn på produkter, priser, protein% eller URL-er.**
2. **Produktet må finnes** på lenken du oppgir — sjekk at siden laster og viser riktig vare.
3. **Merker som kun selger PWO** (NutriTac, Peveo, osv.) skal **avvises** og fjernes fra `proteinProducts.ts`.
4. **Næringsdata** skal komme fra næringsdeklarasjon på produktsiden — ikke gjetning.
5. **DIAAS uten lab-test** = estimat (`diaasIsOfficial: false`). Ikke kall det offisiell DIAAS.
6. **Score** beregnes via eksisterende `calculateProteinGrade()` — oppdater rådata, ikke score manuelt.
7. **Alltid last ned produktbilde** til `public/images/protein/<id>.jpg` og oppdater `image` i `proteinProducts.ts`.

## Arbeidsflyt (følg i rekkefølge)

### Steg 0 — Screenshot + les statusfil

1. **Ta screenshot** av https://kosttest.no/tester/protein/ — produkter med generisk bilde er IKKE ferdig.
2. **Les `data/protein-verification-status.md`** — seksjonene **øverst**:
   - **🚫 FERDIG ANALYSERT** — har bilde. **ALDRI test disse igjen.**
   - **🖼️ MANGLER BILDE** — ikke ferdig. Neste kandidater.
   - **➡️ NÅ** — det eneste produktet du skal teste.

Hvis `productId` du tenker å teste har bilde: **STOPP** — det er feil produkt.

### Steg 1 — Bilde-audit og lås produkt

```bash
node scripts/protein-verify-queue.mjs audit
node scripts/protein-verify-queue.mjs start
```

`audit` viser `withImage` / `withoutImage` / `nextWithoutImage`.  
`start` låser neste produkt **uten bilde**. Hvis `done: true`, avslutt.

**Test kun `productId` fra seksjon 2 (➡️ NÅ).** Ikke noen ID fra seksjon 1.

### Steg 2 — Les produktet i repo

Finn oppføringen i `src/data/proteinProducts.ts` for `productId`.

### Steg 3 — Verifiser mot ekte kilde

- Åpne produktets `url` og **søk på nett** om URL er feil.
- Bekreft: produktnavn, merke, pris (NOK), pakkestørrelse, protein per 100 g, dosestørrelse.
- **Last ned produktbilde** fra butikksiden → `public/images/protein/<id>.jpg`
- Noter **ekte produkt-URL** (Gymgrossisten, MyProtein, Bodylab, Proteinfabrikken, osv.).
- Analyser **laktose** og allergener fra etikett.
- Hvis produktet **ikke finnes**: kjør `reject`, **fjern** fra `rawProducts`, commit, stopp.

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
    "priceFromMerchant": true,
    "imageDownloaded": true
  },
  "corrections": ["liste over hva som var feil"],
  "data": { "..." },
  "lactoseAnalysis": { "containsLactose": true, "description": "...", "allergens": [] },
  "analysis": "2-4 setninger ærlig vurdering",
  "notes": "usikkerhet eller kampanjepris"
}
```

### Steg 5 — Oppdater produktdata

I `src/data/proteinProducts.ts`, oppdater **kun** det verifiserte produktet:
- Rådata fra rapporten
- `image: '/images/protein/<id>.jpg'`
- `verdict`, `strengths`, `watchouts` hvis feil

### Steg 6 — Merk verifisert i kø

```bash
node scripts/protein-verify-queue.mjs complete --id <id>
node scripts/protein-verify-queue.mjs sync-md
```

`complete` feiler hvis bildefilen mangler.

### Steg 6b — Oppdater status-MD

Legg til nytt avsnitt **øverst** under **Kjøringslogg** (dato, id, kilde, endringer, bilde, neste).

### Steg 7 — Bygg og lever

```bash
npm run build
```

Commit: `Verify protein: <id> — <kort beskrivelse>`  
Push til `main` (én commit per produkt).

## Scoring

- **DIAAS 70 %** + **pris per g protein 30 %**
- **IAAS** fra aminosyreprofil-mal (ikke i totalscore)

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| **`data/protein-verification-status.md`** | **Hovedfil — les og oppdater hver kjøring** |
| `scripts/protein-verify-queue.mjs` | Kø: audit/start/complete/reject/sync-md |
| `public/images/protein/<id>.jpg` | **Ferdig-signal** — mangler = ikke ferdig |
| `data/protein-verifications/*.json` | Verifikasjonsrapporter |
| `src/data/proteinProducts.ts` | Produkter (kun ekte data) |

Live-liste: https://kosttest.no/tester/protein/
