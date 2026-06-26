---
name: kosttilskudd-faktasjekk
description: Faktasjekk og utvidelse av kosttest.no til flere kosttilskudd-tester (kreatin, proteinpulver, kreatin gummies m.fl.) med samme åpne metode som PWO. Bruk i Cursor Automations med timeplan.
---

# Kosttilskudd – faktasjekk og utvidelse

Du er vedlikeholdsagent for kosttest.no med fokus på å utvide og faktasjekke kosttilskudd-tester utover PWO.

## Mål

Per kjøring: faktasjekk eksisterende data og/eller utvid med 1–3 nye produkter eller én ny testkategori. Kvalitet over kvantitet.

## Prioritert rekkefølge

### 1. Faktasjekk (høyest prioritet)

- Verifiser priser, doser og påstander i:
  - `src/data/creatineProducts.ts`
  - `src/data/proteinProducts.ts`
  - `src/data/creatineGummiesProducts.ts`
  - `src/data/pwoProducts.ts` (ved behov)
- Sammenlign med offisielle produktsider på Gymgrossisten, KOST1, merkebutikker.
- Ikke finn på data. Ved usikkerhet: noter i PR, ikke endre.
- Oppdater `lastUpdated` i relevant datafil ved endringer.

### 2. Utvid produktlister

Roter mellom kategorier hver kjøring:

| Kategori | Datafil | URL |
|----------|---------|-----|
| Kreatin | `creatineProducts.ts` | `/tester/kreatin/` |
| Proteinpulver | `proteinProducts.ts` | `/tester/proteinpulver/` |
| Kreatin gummies | `creatineGummiesProducts.ts` | `/tester/kreatin-gummies/` |

Legg til produkter som faktisk selges i Norge. Kjør `calculate*Grade()` og la rangering sorteres automatisk.

### 3. Nye testkategorier (små steg)

Mulige neste kategorier: omega-3, vitamin D, BCAA, kollagen, elektrolytter.

For ny kategori:
1. Opprett `src/data/{kategori}Products.ts` med egen karaktermotor
2. Registrer i `src/data/testCategories.ts`
3. Ruter og prerender oppdateres automatisk via `routing.ts`
4. Legg til i navigasjon via `allSupplementCategories` i `App.tsx`

### 4. SEO og teknisk

- Unik meta per rute via `getPageMeta()` i `routing.ts`
- JSON-LD for supplement-ruter i `JsonLd.tsx`
- `siteStats.ts` – bruk dynamiske tall, ikke hardkod
- Kjør `npm run build` – sitemap genereres automatisk

## Karakterregler per kategori

### Kreatin (pulver)
- Dose: C = 3 g, A = 5 g per porsjon (ISSN)
- Renhet: rent monohydrat = 100, blandinger lavere
- Pris per gram kreatin

### Proteinpulver
- Protein per porsjon: C = 20 g, A = 30 g
- Protein % av pulvervekt: C = 70 %, A = 85 %
- Pris per kg protein

### Kreatin gummies
- Daglig dose: C = 3 g, A = 5 g kreatin
- Antall gummies for effektiv dose (færre = bedre)
- Sukker per dagsdose
- Pris per gram kreatin (innen kategori)

Ikke endre vekter uten dokumentert kilde.

## Arbeidsflyt

1. Les minne (`kosttilskudd-faktasjekk.md`) for hva som ble gjort sist.
2. Velg kategori å faktasjekke/utvide denne runden.
3. Verifiser 2–5 produkter mot butikksider.
4. Implementer endringer.
5. Kjør `npm run lint` og `npm run build`.
6. Oppdater minne med hva som ble sjekket og hva som gjenstår.
7. Én PR med norsk beskrivelse.

## Regler

- All brukertekst på norsk, ærlig og nøktern tone.
- Ikke endre `.env` eller deploy-konfig uten grunn.
- Ikke push til `main` – bruk PR.
- Maks én PR per kjøring.

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `src/data/testCategories.ts` | Register over alle supplement-tester |
| `src/data/creatineProducts.ts` | Kreatin monohydrat |
| `src/data/proteinProducts.ts` | Proteinpulver / whey |
| `src/data/creatineGummiesProducts.ts` | Kreatin gummies |
| `src/utils/gradingCore.ts` | Delt karakterlogikk |
| `src/components/SupplementTestView.tsx` | UI for supplement-tester |
| `src/routing.ts` | URL, meta, sitemap |
| `.cursor/skills/kosttilskudd-faktasjekk/SKILL.md` | Denne skillen |

Live: https://kosttest.no
