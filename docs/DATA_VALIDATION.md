# Kosttest.no — datavalidering

Oversikt over automatiske sjekker som sikrer datanøyaktighet og konsistent presentasjon.

## Kommandoer

```bash
# Full pipeline (anbefalt før deploy)
npm run quality:check

# Deltester
npm run release:validate   # Scoring, badges, editorial, compare, trust
npm run data:validate    # Redaksjonell og visningskonsistens
npm run trust:validate   # Tillitsscenarioer
npm run seo:check        # Krever build
npm run a11y:check       # Krever build
npm run perf:check       # Krever build
npm run mobile:check     # Krever build
```

## Scoring og badges (`scoring-validation-test.ts`)

| Regel | Sjekk |
|-------|-------|
| PWO formelscore | 0–84, beregnet = lagret |
| Pris vs score | Prisendring endrer ikke formelscore eller `formulaPart` |
| Lik score | Sorteres på pris per dose, deretter alfabetisk |
| Best formel totalt | Høyest score blant eligible |
| Best verdi | Verdiindeks, min score og prisgrad |
| Best budsjett | Lavest pris over min formelscore |
| Badge eligibility | Insufficient/limited → ingen badge |
| Dokumentasjon | `notDocumented` ≠ `notApplicable` ≠ `notFound` |

## Data og redaksjon (`data-validation-test.ts`)

| Regel | Sjekk |
|-------|-------|
| «Passer best for» | ≥85 % unike tekster på PWO |
| Lav score | Ingen for positive anbefalinger (&lt;25 poeng) |
| Begrenset tillit | Ikke vist som `high` datakvalitet |
| Datoformat | `d. måned yyyy` der per-produkt dato finnes |
| Protein DIAAS | Estimat ikke markert som offisiell labtest |
| Kreatin visning | Renhet/doping ikke vist som «0» |
| Effektpåstander | Ingen «garantert» / «beste på markedet» i watchouts |

## Tillit (`trust-test.ts`, `trust-validation-test.ts`)

| Regel | Sjekk |
|-------|-------|
| Lab PWO | Alltid «Ikke laboratorietestet av Kosttest» |
| Manglende dato | `MISSING_VALUE` der relevant |
| Endringslogg | Ingen interne notater i `publicSummary` |
| Pending | Grunn og manglende felt oppgitt |
| Doping dokumentert | Advarsel hvis ingen kildelenke (kreatin) |
| Badge vs tillit | Advarsel ved badge + `limited` confidence |

**Forventet:** 52 advarsler for protein uten per-produkt `lastVerifiedAt` — ikke failures.

## SEO (`seo-check.mjs`)

- Unik title per side (unntatt felles suffiks)
- Meta description ≥50 tegn
- Canonical `https://kosttest.no/...`
- Open Graph title
- Én H1
- Sammenligning: `noindex`
- `robots.txt` → sitemap
- Sitemap inkluderer tester og produkt-URL-er

## Tilgjengelighet (`a11y-check.mjs`)

- `lang="nb"` på alle sider
- `main` landmark
- Focus ring og `prefers-reduced-motion` i tokens
- `:focus-visible` i UI-komponenter

## Ytelse (`perf-check.mjs`)

- Rapporterer JS-chunk-størrelser
- Main bundle &lt; 300 KB (ua gzip)
- Compare lazy-loaded separat

## Mobil (`mobile-check.mjs`)

- `viewport` meta på nøkkelsider
- Ingen `100vw` i HTML
- Tabell `min-width` har mobil fallback
- `overflow-x: clip` på root
- `ranking-cards-mobile` finnes
- Touch target 44 px

## Manuelle dataoppgaver (ikke automatisert)

| Kategori | Status | Handling |
|----------|--------|----------|
| PWO rangerte | 45 uten `dataTrust` | Fyll `lastVerifiedAt` etter kontroll |
| PWO pending | 51 produkter | Deklarasjon/dose før rangering |
| Protein | 22 pending, 4 verified | `protein:verify:next` |
| Kreatin | 10 uten dopingdok. | Innhent dokumentasjon eller behold status |

## Legge til validering for nytt felt

1. Utvid relevant test i `scripts/data-validation-test.ts` eller `scoring-validation-test.ts`.
2. Oppdater `docs/EDITORIAL_RULES.md` med visningsregel.
3. Kjør `npm run quality:check`.

## Relaterte filer

- `src/data/pwo/metrics.ts` — verdiindeks, sortering
- `src/data/pwo/badges.ts` — badge-vinnere
- `src/data/trust/validation.ts` — tillitsadvarsler
- `src/data/trust/enums.ts` — kontrollerte statusverdier
