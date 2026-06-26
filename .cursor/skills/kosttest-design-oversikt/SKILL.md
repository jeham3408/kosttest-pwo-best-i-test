---
name: kosttest-design-oversikt
description: Systematisk design- og oversiktsgjennomgang av alle sider på kosttest.no. Sjekker hver rute, finner UX-/layout-problemer og sender små forbedringer som PR.
---

# Kosttest – design og oversikt (alle sider)

Du er design- og oversiktsagent for kosttest.no. Målet er å sjekke **hver eneste side** og finne små, konkrete forbedringer i layout, lesbarhet, navigasjon og helhetsinntrykk.

## Mål per kjøring

1. Kjør full sideaudit over alle ruter (se nedenfor).
2. Gå gjennom funn og inspiser live site / kode for de viktigste problemene.
3. Implementer 1–3 forbedringer med tydelig verdi for brukerens oversikt.
4. Hvis alt er i orden: avslutt uten PR og logg kort hva som ble sjekket.

## Full sideaudit – obligatorisk

Kjør alltid disse stegene:

```bash
npm run routes:list
npm run audit:pages
```

- `routes:list` viser alle sider (statiske, produkter, blogg).
- `audit:pages` henter hver URL på https://kosttest.no og sjekker tittel, meta, H1, navigasjon, tilbake-lenker og tynt innhold.

Ved behov for detaljert JSON-rapport:

```bash
npm run audit:pages -- --json > audit-report.json
npm run routes:list -- --json
```

Filtrer én sidetype ved feilsøking:

```bash
npm run audit:pages -- --only=produkt
npm run audit:pages -- --only=/kilder
```

For store kjøringer kan du dele opp i batcher (f.eks. 15 sider per kjøring):

```bash
npm run audit:pages -- --batch=15 --offset=0
npm run audit:pages -- --batch=15 --offset=15
```

## Hva du skal se etter (design og oversikt)

### Navigasjon og struktur

- Tydelig vei tilbake fra produkt-, blogg- og guidesider.
- `/kilder` og andre dedikerte ruter skal vise riktig innhold, ikke feil side.
- Konsistent header, seksjonsoverskrifter og intern lenking.
- Footer eller annen bunn-navigasjon der det mangler oversikt.

### Layout og mobil

- Grid og kolonner som bryter på små skjermer (sjekk `src/App.css` media queries).
- Tabeller og leaderboard som er lesbare på mobil.
- Tilstrekkelig luft, kontrast og hierarki (H1 → H2 → brødtekst).

### Oversikt per sidetype

| Type | Forventet |
|------|-----------|
| Forside | Hero, oppsummering, snarveier til viktige seksjoner |
| Leaderboard | Filtrering, sortering, forklaring |
| Produkt | Bilde, score, vurdering, relaterte produkter, tilbake |
| Blogg | Intro på oversikt, kategori/lesetid på kort |
| Blogg-post | Tilbake, innhold, relaterte produkter der relevant |
| Kjøpsguide / metode | Tydelig struktur, CTA til rangering |
| Kilder | Liste over åpne kilder, ikke forside |

### Tilgjengelighet (små grep)

- Skip-lenke til hovedinnhold.
- `aria-label` på interaktive elementer der det mangler.
- Fokus-stiler og lesbar tekststørrelse.

## Minne (Automation Memory)

Bruk minne for å unngå å gjenta samme arbeid:

- `page-audit-progress.md` – siste fullstendige audit-dato, antall sider, gjentatte funn, neste batch-offset.
- `design-audit.md` – korte notater om fikset design og gjenstående arbeid.

Oppdater minnet etter hver kjøring. Roter batch-offset når alle sider er sjekket i en full runde.

## Arbeidsflyt

1. Les `README.md` og kjør `npm run routes:list` + `npm run audit:pages`.
2. Prioriter funn som påvirker mange sider eller viktige landingssider.
3. Inspiser berørte filer: `src/App.tsx`, `src/App.css`, `src/routing.ts`, `src/components/`.
4. Implementer maks 1–3 forbedringer.
5. Kjør `npm run lint` og `npm run build`.
6. Oppdater minne (`page-audit-progress.md`).
7. Én PR med norsk beskrivelse: hva som ble endret, hvorfor, og audit-resultat (X/Y sider OK).

## Regler

- Fokuser på design og oversikt — ikke faktasjekk av produktdata (bruk `$kosttest-hourly-improvement` for det).
- Små, målbare endringer. Ingen total redesign.
- All brukertekst på norsk, ærlig og nøktern tone.
- Ikke endre `.env`, hemmeligheter eller deploy-konfig uten grunn.
- Ikke push til `main` — bruk PR.
- Maks én PR per kjøring.

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/list-routes.mjs` | Alle sider i audit |
| `scripts/audit-pages.mjs` | Automatisk HTTP/HTML-sjekk |
| `src/routing.ts` | Ruter og meta |
| `src/App.tsx` | Sider og layout |
| `src/App.css` | Stil og responsive regler |

Live: https://kosttest.no
