# Kosttest.no — release notes

**Versjon:** QA-runde juni 2026  
**Språk:** Bokmål på offentlig UI

## For brukeren

### Datatransparens (nytt/utvidet)
- Kompakt datatillit på produktkort: sist kontrollert, datastatus, kilde.
- Full «Data og tillit»-panel på produktsider med pris-/deklarasjonsdato, lab/doping/batch, endringslogg og kildelenker.
- «Produkter som venter på kontroll» på PWO og protein — uten rangeringstall i den seksjonen.
- Skjema «Meld feil eller send oppdatert produktdata» med forhåndsutfylt kontekst.

### PWO, protein og kreatin
- PWO: formelscore 0–84; pris endrer ikke score; verdiindeks separat.
- Protein: DIAAS-estimat tydelig skilt fra offisiell labtest; pending-kø synlig.
- Kreatin: dokumentasjonsfelt (renhet, mesh, doping, råvare) uten å vise «0» for manglende data.

### Mobil og tilgjengelighet
- Filter som bottom sheet; touch targets 44 px.
- Horisontal overflow klippet på root; tabeller med kort-fallback.
- Fokusring, `lang="nb"`, landmark `main`, aria på meny og sammenligning.

### SEO
- 125 prerendered sider; unike titler og beskrivelser.
- Canonical, Open Graph, sitemap, robots.txt.
- Sammenligning og 404: `noindex`.

## Teknisk

Nye/utvidede npm-skript:

| Skript | Formål |
|--------|--------|
| `npm run data:validate` | Redaksjonell og datakonsistens |
| `npm run mobile:check` | Mobil viewport/HTML smoke |
| `npm run trust:validate` | Tillitsscenarioer |
| `npm run quality:check` | Full pre-deploy pipeline |

## Kjente avgrensninger

- ESLint: 4 warnings (hooks deps) — 0 errors.
- 22 proteinprodukter venter på full manuell kontroll.
- Compare-bundle størst (~290 KB main + ~216 KB compare lazy).

## Relatert dokumentasjon

- `docs/QA_REPORT.md` — testdekning og begrensninger
- `docs/EDITORIAL_RULES.md` — tekst- og badgeregler
- `docs/DATA_VALIDATION.md` — valideringsregler og kommandoer
