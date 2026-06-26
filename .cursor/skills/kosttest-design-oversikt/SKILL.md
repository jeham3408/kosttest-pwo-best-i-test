---
name: kosttest-design-oversikt
description: Design- og oversiktsaudit av kosttest.no — sjekker hver eneste side systematisk. Bruk i Cursor Automations med timeplan (cron 0 * * * *).
---

# Kosttest – design og oversikt (side-audit)

Du er design- og UX-revisor for kosttest.no. Målet er å gå gjennom **alle sider** én etter én og finne små, konkrete forbedringer i layout, lesbarhet, navigasjon og oversikt.

## Mål per kjøring

1. **Én side** fra audit-køen — aldri hopp over uten `skip` med begrunnelse.
2. Kjør statisk audit + visuell gjennomgang (live site).
3. Implementer **0–2 små forbedringer** hvis de har tydelig verdi.
4. Marker siden som ferdig i køen. Maks én PR per kjøring.

Hvis siden er i god stand: fullfør uten kodeendring og noter hva som ble sjekket.

## Arbeidsflyt

```
node scripts/page-audit-queue.mjs start
npm run build
npm run audit:pages -- --route <rute>
```

1. Les `data/page-audit-progress.md` — se hva som er gjort og hva som er neste.
2. Kjør `start` for å låse neste side.
3. Kjør `npm run build` og `npm run audit:pages -- --route <rute>`.
4. Åpne https://kosttest.no<rute>/ og vurder:
   - Er overskriftshierarki tydelig (én h1, logiske h2)?
   - Er navigasjon og «tilbake»-lenker intuitive?
   - Fungerer mobilvisning (smal skjerm, tabeller, filter)?
   - Er intern lenking god (relaterte produkter, krysslenker PWO ↔ protein)?
   - Er tomtilstander og CTA-er tydelige?
   - Matcher meta/canonical den faktiske URL-en?
5. Fiks funn med liten, fokusert diff. Unngå store redesigns.
6. `npm run lint` og `npm run build`. Kjør audit på nytt for siden.
7. `node scripts/page-audit-queue.mjs complete --route "<rute>" --notes "..." --fixes N`
8. Opprett PR med norsk beskrivelse.

## Prioritet på forbedringer

1. **Feil** fra `audit-pages.mjs` (manglende h1, tom prerender, feil canonical).
2. **Oversikt** — brukeren forstår raskt hva siden viser og hva neste steg er.
3. **Navigasjon** — tilbake-lenker, brødsmuler, relatert innhold.
4. **Lesbarhet** — avstand, kontrast, tabell på mobil.
5. **SEO-meta** — unik tittel/beskrivelse per filter-rute (f.eks. `/tester/pwo/stim-free/`).

## Regler

- All brukertekst på norsk, nøktern tone.
- Ikke endre produktdata, doser eller karakterer — det er egen automasjon.
- Ikke store nye seksjoner eller features.
- Ikke push til `main` — bruk PR.
- Ved full gjennomgang av alle ${104} sider: kjør `init` for å starte ny runde.

## Nøkkelfiler

| Fil | Formål |
|-----|--------|
| `scripts/list-routes.mjs` | Alle prerender-ruter |
| `scripts/audit-pages.mjs` | Statisk HTML-audit (meta, h1, alt, innhold) |
| `scripts/page-audit-queue.mjs` | Kø: én side per kjøring |
| `data/page-audit-progress.md` | Fremdrift og logg |
| `data/page-audit-queue.json` | Kødata |
| `src/routing.ts` | Meta og canonical per rute |
| `src/App.tsx` | Sidelayouter og komponenter |

## Kommandoer

```bash
npm run audit:routes          # list alle ruter
npm run audit:pages           # audit alle sider (krever build)
npm run audit:pages -- --route /pwo/peveo-maxed
node scripts/page-audit-queue.mjs status
node scripts/page-audit-queue.mjs init   # nullstill kø etter full runde
```

Live: https://kosttest.no
