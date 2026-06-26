---
name: kosttilskudd-faktasjekk
description: Verifiserer ÉTT kosttilskudd per kjøring (kreatin, protein, fremtidige kategorier). Roterer mellom kategorier. Bruk i Cursor Automation med cron 0 * * * * (hver time).
---

# Kosttest – kosttilskudd faktasjekk (1 produkt per kjøring)

Du verifiserer **nøyaktig ett** kosttilskudd per automasjonskjøring. Køen roterer mellom kategorier: **kreatin → protein → (fremtidige)**.

## Ferdig = har produktbilde

**Regel:** Et produkt er først ferdig analysert når det har **ekte produktbilde** i kategori-mappen (ikke generisk placeholder).

| Kategori | Bildemappe | Produkter |
|----------|------------|-----------|
| Kreatin | `public/images/creatine/<id>.jpg` | `src/data/creatineProducts.ts` |
| Protein | `public/images/protein/<id>.jpg` | `src/data/proteinProducts.ts` |

- Produkter **med bilde** = ferdig — **ALDRI test igjen**
- `complete` feiler uten bilde

## Hard regler

1. **Aldri finn på produkter, priser, doser eller URL-er.**
2. **Produktet må finnes** på lenken — sjekk at siden laster og viser riktig vare.
3. **Næringsdata/doser** skal komme fra etikett eller produktside — ikke gjetning.
4. **Score** beregnes via eksisterende scoring-modul — oppdater rådata, ikke score manuelt.
5. **Alltid last ned produktbilde** før `complete`.

## Arbeidsflyt (følg i rekkefølge)

### Steg 0 — Les master status

1. **Les `data/kosttilskudd-verification-status.md`** — se hvilken kategori og produkt som er aktivt.
2. Kjør audit:

```bash
node scripts/kosttilskudd-verify-queue.mjs audit
```

### Steg 1 — Lås produkt

```bash
node scripts/kosttilskudd-verify-queue.mjs start
```

Output viser `category`, `lockedProductId` og kategori-spesifikk `statusMd`. Les den filen.

### Steg 2 — Verifiser mot ekte kilde

- Åpne produktets `url` og søk på nett om URL er feil.
- Bekreft: produktnavn, merke, pris (NOK), pakkestørrelse, dose.
- **Last ned produktbilde** til riktig mappe.
- Hvis produktet **ikke finnes**: kjør `reject`, fjern fra produktfil, commit, stopp.

### Steg 3 — Skriv rapport

Lag `data/<kategori>-verifications/<id>.json`:

```json
{
  "id": "...",
  "exists": true,
  "verifiedAt": "<ISO>",
  "sources": ["<ekte produkt-URL>"],
  "checks": {
    "productPageLoads": true,
    "nameMatches": true,
    "doseFromLabel": true,
    "priceFromMerchant": true,
    "imageDownloaded": true
  },
  "corrections": ["liste over hva som var feil"],
  "data": {},
  "analysis": "2-4 setninger ærlig vurdering",
  "notes": "usikkerhet eller kampanjepris"
}
```

### Steg 4 — Oppdater produktdata

Oppdater **kun** det verifiserte produktet i riktig `*Products.ts`:
- Rådata fra rapporten
- `image: '/images/<kategori>/<id>.jpg'`
- `verdict`, `strengths`, `watchouts` hvis feil

### Steg 5 — Merk verifisert

```bash
node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category <creatine|protein>
node scripts/kosttilskudd-verify-queue.mjs sync-md
```

### Steg 6 — Bygg og lever

```bash
npm run lint
npm run build
```

Commit: `Verify <kategori>: <id> — <kort beskrivelse>`  
Push til feature branch → PR.

## Scoring per kategori

| Kategori | Modul | Vekting |
|----------|-------|---------|
| Kreatin | `creatineScoring.ts` | Dose 60 % + form 15 % + pris/g 25 % |
| Protein | `proteinScoring.ts` | DIAAS 70 % + pris/g protein 30 % |

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| **`data/kosttilskudd-verification-status.md`** | Master — les først |
| `data/creatine-verification-status.md` | Kreatin-detaljer |
| `data/protein-verification-status.md` | Protein-detaljer |
| `scripts/kosttilskudd-verify-queue.mjs` | Roterende kø |
| `src/data/creatineProducts.ts` | Kreatin (pulver + gummies) |
| `src/data/proteinProducts.ts` | Proteinpulver |

Live:
- https://kosttest.no/tester/kreatin/
- https://kosttest.no/tester/protein/

## Utvide med nye kategorier

For omega-3, vitamin D osv.: kopier kreatin-mønsteret:
1. `src/data/<kategori>Products.ts` + `*Scoring.ts`
2. `src/data/<kategori>VerificationQueue.json`
3. Legg til i `CATEGORY_CONFIGS` i `scripts/lib/category-verify-queue.mjs`
4. Legg til i `src/data/kosttilskuddMasterQueue.json`
5. UI + ruter i `routing.ts` og `App.tsx`
