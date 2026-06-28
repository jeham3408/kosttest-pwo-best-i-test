# Kosttest.no — QA-rapport

**Dato:** 2026-06-26  
**Omfang:** Del 1–7 lansering QA

## Automatiserte tester

| Test | Kommando | Resultat |
|------|----------|----------|
| Typecheck + production build | `npm run build` | ✅ OK (125 HTML, sitemap 124 URL) |
| Scoring & badge-validering | `npm run release:validate` | ✅ 173 + 39 + 20 + compare + badge OK |
| SEO smoke | `npm run seo:check` | ✅ 639 passed |
| Tilgjengelighet | `npm run a11y:check` | ✅ 381 passed |
| Ytelse (chunking) | `npm run perf:check` | ✅ 5 passed |
| ESLint | `npm run lint` | ⚠️ 21 pre-existing errors (react-refresh, trust resolvers, compare hook) — ikke introdusert i QA-runden |

### Scoring-validering (`scripts/scoring-validation-test.ts`)
- PWO formelscore 0–84 for alle produkter
- Beregnet score = lagret score
- Prisendring endrer ikke formelscore eller verdiindeks.formulaPart
- Lik score → sortering på pris per dose; lik pris → alfabetisk
- Badge-eligibility: insufficient datatillit → ingen badge
- «Best formel totalt» = høyest score blant eligible
- Koffeinfri, budsjett, verdi, sterkeste respekterer terskler
- `notDocumented` ≠ `notApplicable`
- Edge fixtures: uten pris, uten koffein, langt navn

### Tillit (`trust:test`)
- Etiketter uten vage «verifisert»
- Lab-status PWO
- Manglende data vises som «Ikke oppgitt per produkt»

### Sammenlikning (`compare:test`)
- URL-parsing, kategori-isolasjon, deling

## Manuell sluttkontroll (checkliste)

| Side | Desktop | Mobil | Notat |
|------|---------|-------|-------|
| Forside | ☐ | ☐ | Hero, CTAs, vinnere |
| PWO rangering | ☐ | ☐ | Filter sheet, badgar |
| Protein rangering | ☐ | ☐ | DIAAS, filter |
| Kreatin rangering | ☐ | ☐ | Modell B tekst |
| Produktside (PWO) | ☐ | ☐ | Score/84, disclaimer |
| Sammenlikning 2 prod | ☐ | ☐ | noindex i devtools |
| Sammenlikning 3 prod | ☐ | ☐ | |
| Metode | ☐ | ☐ | Samsvar med sortering |
| Kilder | ☐ | ☐ | |
| Om Kosttest | ☐ | ☐ | Ingen medisinske løfter |
| Feilrapportering | ☐ | ☐ | Skjema sender / feilmelding |
| Navigasjon + footer | ☐ | ☐ | Lenker, kontrast |
| 404 | ☐ | ☐ | `/404/` og ukjent URL |

### Verifisert i denne runden (automatisert)
- 404-routing (ikke soft redirect)
- Produkt/blogg not-found states
- Compare empty state bokmål
- JsonLd uten Review-schema på produkter
- PWO FAQ formelscore /84

### Gjenstår manuelt
- Visuell gjennomgang alle breakpoints
- Console errors i produksjonsbuild preview
- Hydration warnings (ingen observert i build-logg)

## Siste testkjøring (2026-06-26)

```
npm run build          → OK
npm run release:validate → OK (173 scoring + badges + trust + compare)
npm run seo:check      → 639 passed
npm run a11y:check     → 381 passed
npm run perf:check     → 5 passed
npm run lint           → 21 errors (pre-existing, se ESLint-rad over)
```
