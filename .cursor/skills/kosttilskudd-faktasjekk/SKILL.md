---
name: kosttilskudd-faktasjekk
description: Faktasjekker og utvider kosttest.no med nye kosttilskudd-tester (kreatin, protein, gummies). Én produkt per kjøring. Bruk i Cursor Automations med cron 0 * * * *.
---

# Kosttest – kosttilskudd faktasjekk og utvidelse

Du faktasjekker og utvider kosttest.no med nye testkategorier — samme metode som protein-verifisering.

## Hard regler

1. **Aldri finn på produkter, priser, doser eller URL-er.**
2. **Én produkt per kjøring** — cron kjører igjen neste time.
3. **Produktet må finnes** på lenken — sjekk at siden laster og viser riktig vare.
4. **Score beregnes via eksisterende scoring** — oppdater rådata, ikke score manuelt.
5. **Les status-MD før du starter** — test aldri produkter i «ferdig testet»-listen.

## Kategorier

| Kategori | Datafil | Status-MD | Scoring |
|----------|---------|-----------|---------|
| Kreatin (pulver + gummies) | `src/data/creatineProducts.ts` | `data/creatine-verification-status.md` | `creatineScoring.ts` |
| Proteinpulver | `src/data/proteinProducts.ts` | `data/protein-verification-status.md` | `proteinScoring.ts` |

Master-oversikt: `data/kosttilskudd-verification-status.md`

## Arbeidsflyt (følg i rekkefølge)

### Steg 0 — Les status

1. Les `data/kosttilskudd-verification-status.md` for aktiv kategori.
2. Les kategori-spesifikk status-MD (f.eks. `data/creatine-verification-status.md`).
3. Seksjon **1** = ferdig testet (ALDRI test igjen). Seksjon **2** = NÅ (kun dette produktet).

### Steg 1 — Lås neste produkt

```bash
node scripts/kosttilskudd-verify-queue.mjs start
```

Output sier `category`, `testNowProduct`, `doNotTestIds`. Hvis `done: true`, vurder utvidelse (steg 8).

### Steg 2 — Verifiser mot ekte kilde

- Åpne produktets `url` og søk på nett om URL er feil.
- Bekreft: navn, merke, pris (NOK), pakkestørrelse, kreatin/protein per dose.
- For gummies: mg kreatin per gummy, antall per porsjon, total i pakke.
- Hvis produktet **ikke finnes**: `reject` + fjern fra datafil.

### Steg 3 — Skriv rapport

Lag `data/<kategori>-verifications/<id>.json`:

```json
{
  "id": "...",
  "category": "creatine",
  "exists": true,
  "verifiedAt": "<ISO>",
  "sources": ["<ekte produkt-URL>"],
  "checks": {
    "productPageLoads": true,
    "nameMatches": true,
    "doseFromLabel": true,
    "priceFromMerchant": true
  },
  "corrections": [],
  "data": { "name", "brand", "priceNok", "creatinePerServingG", "url" },
  "analysis": "2-4 setninger",
  "notes": ""
}
```

### Steg 4 — Oppdater produktdata

Oppdater **kun** det verifiserte produktet i riktig datafil. Oppdater `verdict`, `strengths`, `watchouts` hvis basert på feil info.

### Steg 5 — Merk verifisert

```bash
node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category <kategori>
node scripts/kosttilskudd-verify-queue.mjs sync-md --category <kategori>
node scripts/kosttilskudd-verify-queue.mjs sync-master
```

Legg til oppføring i **Kjøringslogg** i kategori-status-MD.

### Steg 6 — Bygg og lever

```bash
npm run lint && npm run build
```

Commit: `Verify <kategori>: <id> — <kort beskrivelse>`

### Steg 7 — Utvidelse (når kø er tom eller som del av kjøring)

Legg til nye produkter i riktig datafil + kø (`*VerificationQueue.json`):

**Kreatin pulver:** Star, SmartSupps, ON, Mutant, BodyFuel, Holistic, Creapure
**Kreatin gummies:** Star, Elit, Applied, Bodylab
**Protein:** fortsett eksisterende protein-kø

Etter nye produkter: `sync-md` + `sync-master`.

### Steg 8 — Fremtidige kategorier

For omega-3, vitamin D osv.: kopier mønsteret fra kreatin:
1. `src/data/<kategori>Products.ts` + `*Scoring.ts`
2. `src/data/<kategori>VerificationQueue.json`
3. Legg til i `scripts/kosttilskudd-categories.mjs`
4. UI-komponent + routing

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `data/kosttilskudd-verification-status.md` | Master-oversikt |
| `scripts/kosttilskudd-verify-queue.mjs` | Kø: start/complete/reject/sync |
| `scripts/kosttilskudd-categories.mjs` | Kategori-konfig |
| `src/data/creatineProducts.ts` | Kreatin (pulver + gummies) |
| `src/data/creatineScoring.ts` | Kreatin karaktermotor |
| `src/components/CreatinePageViews.tsx` | Kreatin UI |

Live: https://kosttest.no  
Repo: `jeham3408/kosttest-pwo-best-i-test`
