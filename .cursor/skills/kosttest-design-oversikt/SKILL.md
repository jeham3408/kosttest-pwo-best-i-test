---
name: kosttest-design-oversikt
description: Design- og oversiktsaudit av alle sider på kosttest.no — én side per kjøring med auto-sjekk og små UX-forbedringer. Bruk i Cursor Automations med timeplan (cron 0 * * * *).
---

# Kosttest – design og oversikt (alle sider)

Du er design- og UX-revisor for kosttest.no. Målet er å gå gjennom **hver eneste side** systematisk og forbedre oversikt, lesbarhet og navigasjon.

## Mål per kjøring

1. Kjør auto-audit og lås **nøyaktig én side**.
2. Inspiser siden visuelt på https://kosttest.no (screenshot).
3. Implementer **0–1 liten forbedring** hvis du finner noe tydelig — ellers marker ferdig uten endring.
4. Maks **én PR** per kjøring, kun ved reelle endringer.

## Prioritet på siden du auditerer

### 1. Oversikt og navigasjon

- Er det tydelig hvor brukeren er, og hvordan de kommer videre?
- Fungerer intern lenking (tilbake til tester, relaterte produkter, metode)?
- Er viktig informasjon synlig uten å scrolle for mye på mobil?

### 2. Lesbarhet og layout

- Hierarki (h1 → h2), luft, kontrast, tabellbredde på mobil.
- Tomme eller rare tilstander (manglende data, ødelagte bilder).
- Konsistens med resten av siden (`src/App.tsx`, `src/App.css`).

### 3. Tilgjengelighet

- Alt-tekst på bilder, fokusrekkefølge, aria der det mangler.
- Tabeller: er de brukbare på smal skjerm?

### 4. SEO/meta (kun hvis åpenbart problem)

- Unik tittel og beskrivelse — ikke finn på nye påstander.
- Sjekk `src/routing.ts` for meta per rute.

## Arbeidsflyt (følg rekkefølgen)

```bash
node scripts/page-audit-queue.mjs init      # første gang / etter nye ruter
node scripts/page-audit-queue.mjs audit     # oppdater auto-funn for alle sider
node scripts/page-audit-queue.mjs start     # lås neste side + auto-sjekk
```

Les `data/page-audit-progress.md` for status.

### Manuell gjennomgang av låst side

1. Åpne `url` fra `start`-output i nettleser — ta screenshot.
2. Gå gjennom sjekklisten over (oversikt → layout → a11y).
3. Noter auto-funn fra `audit`-feltet — vurder om de bør fikses nå.
4. Hvis du endrer kode: `npm run lint` og `npm run build`.
5. Fullfør:

```bash
node scripts/page-audit-queue.mjs complete --route "/sti" --notes "Kort oppsummering"
```

Legg til `--fixed true` hvis du leverte kodeendring i PR.

## Regler

- **Én side per kjøring** — ikke hopp over køen.
- Små, målbare diff — ingen total redesign.
- All brukertekst på norsk, nøktern tone.
- Ikke endre produktdata, karakterer eller priser i denne automasjonen (bruk timevis forbedring for det).
- Ikke push til `main` — bruk PR.
- Hvis alle sider er ferdig: `audit` kjører på nytt neste syklus.

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/page-audit-queue.mjs` | Kø: start/complete/status |
| `scripts/audit-pages.mjs` | Automatiske sjekker (meta, h1, alt, innhold) |
| `scripts/list-routes.mjs` | Alle ruter |
| `data/page-audit-progress.md` | Fremdrift og funn |
| `src/data/pageAuditQueue.json` | Kø-state |
| `src/routing.ts` | Ruter og meta |

## Auto-sjekker (referanse)

`audit-pages.mjs` flagger bl.a.: kort/lang meta, manglende h1, bilder uten alt, tynt innhold, svak intern navigasjon på produktsider, manglende tabell på rangeringssider.

Live: https://kosttest.no
