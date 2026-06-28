# Kosttest.no — QA-rapport

**Dato:** 2026-06-28  
**Omfang:** Produksjonsklar kvalitetssikring (mobil, a11y, SEO, data, ytelse, lint, tomtilstander)

## Testede sider

| Side | Rute | Automatisert | Interaktiv preview |
|------|------|--------------|-------------------|
| Forside | `/` | ✅ | Statisk |
| PWO rangering | `/tester/pwo/` | ✅ | ✅ 320 px, 390 px |
| Protein rangering | `/tester/protein/` | ✅ | ✅ 390 px |
| Kreatin rangering | `/tester/kreatin/` | ✅ | Statisk |
| PWO produkt | `/pwo/peveo-maxed/` | ✅ | Statisk |
| Protein produkt | `/protein/bodylab-whey-100/` | ✅ | Statisk |
| Kreatin produkt | `/kreatin/nutritac-bare-creatine/` | ✅ | Statisk |
| Sammenligning | `/tester/pwo/sammenlign/` | ✅ noindex | Kode + tomtilstand |
| Metode | `/om-metoden/` | ✅ | Statisk |
| Om Kosttest | `/om-kosttest/` | ✅ | Statisk |
| Dataferskhet | `/hvor-ferske-er-dataene/` | ✅ | Statisk |
| 404 | `/404/` | ✅ noindex | Statisk |

## Skjermstørrelser

| Bredde | Type | Horisontal scroll | Metode |
|--------|------|-------------------|--------|
| 320 px | Mobil smal | Nei (`/tester/pwo/`) | CDP Emulation + Runtime |
| 375 px | Mobil | Verifisert statisk | `mobile-check.mjs` |
| 390 px | Mobil | Nei (`/tester/protein/`) | CDP |
| 414 px | Mobil stor | Verifisert statisk | `mobile-check.mjs` |
| 768 px | Nettbrett | Verifisert statisk | `mobile-check.mjs` |
| 1024 px | Nettbrett/desktop | Verifisert statisk | `mobile-check.mjs` |
| ≥1280 px | Desktop | Verifisert statisk | CSS breakpoints |

Mobil fallback: `ranking-cards-mobile` under breakpoint; tabeller i `overflow-x: auto`-wrapper.

## Automatiserte tester (siste kjøring 2026-06-28)

| Test | Kommando | Resultat |
|------|----------|----------|
| ESLint | `npm run lint` | ✅ 0 errors, 4 warnings |
| Typecheck + production build | `npm run build` | ✅ 125 HTML, sitemap 124 URL |
| Scoring & badges | `npm run release:validate` | ✅ |
| Data & redaksjon | `npm run data:validate` | ✅ 99 passed |
| Tillit | `trust:test` + `trust:validate` | ✅ |
| SEO | `npm run seo:check` | ✅ 639 passed |
| Tilgjengelighet | `npm run a11y:check` | ✅ 381 passed |
| Ytelse (chunks) | `npm run perf:check` | ✅ 5 passed |
| Mobil (statisk) | `npm run mobile:check` | ✅ 31 passed |
| **Full pipeline** | `npm run quality:check` | ✅ |

### ESLint-advarsler (ikke blokkerende)

- `App.tsx`: `useEffect` deps for compare-sync (bevisst defer)
- `SiteHeader.tsx`: `triggerRefs` i effect-deps
- `ProductCompareView.tsx`: `fields` i useCallback-deps

### Datavalidering

- Best formel totalt = høyest eligible formelscore
- Best verdi = verdiindeks (ikke billigst alene)
- Pris endrer ikke PWO formelscore
- Lik score → pris per dose → alfabetisk
- Begrenset datakvalitet → ingen badge
- «Passer best for» ≥85 % unike tekster
- Lav score uten for positive anbefalinger
- Kreatin: renhet/doping ikke vist som «0»

### Tillit (forventet)

52 advarsler for protein uten per-produkt `lastVerifiedAt` — dokumentert, ikke test-feil.

## Feil funnet og rettet i QA-runden

| Område | Problem | Tiltak |
|--------|---------|--------|
| ESLint | 20 errors (hooks, refresh, unused) | `useSyncExternalStore` for compare; fjernet kunstig loading i compare; splittet PWO leaderboard med `key`; flyttet `resolveCompareBarItems`; fjernet døde exports |
| Sammenligning | `setState` i `useMemo` / effect | Avledet `invalidIds` i render; fjernet 120 ms loading |
| Compare storage | Hydration via effect | `subscribeCompareStorage` + event ved lagring |
| Mobil CSS | Lang datatillit-tekst | `word-break` / `overflow-wrap` på kompakt status |
| Sammenligning UI | Nynorsk i feilmelding | Bokmål: «finnes ikke lenger», «hoppet over» |
| QA-verktøy | Manglende mobil/data scripts | `mobile-check.mjs`, `data-validation-test.ts` |

## Tom- og feiltilstander (verifisert i kode + tester)

| Tilfelle | Implementasjon |
|----------|----------------|
| Ingen produkter etter filter | `pwo-empty-state` med nullstill-knapp |
| Ugyldig filter i URL | Ignoreres / faller tilbake til standard |
| Produkt finnes ikke | NotFound / produkt-side guard |
| Sammenligning ugyldig ID | `invalidIds` + `role="alert"` |
| Sammenligning &lt;2 produkter | `CompareEmptyState` |
| Produkt uten bilde | `ProductImage` placeholder |
| Manglende dokumentasjon | `MISSING_VALUE` / eksplisitte etiketter |
| Pending / utgått | `PendingReviewSection` uten rangering |
| Skjema-feil | `role="status"`, min 10 tegn |
| 404 | Egen side, `noindex` |

## Kjente begrensninger

1. **22 proteinprodukter** uten per-produkt kontrolldato (manuell kø)
2. **51 PWO** i «venter på kontroll»
3. **Compare-chunk** ~216 KB (lazy)
4. **Lighthouse/CWV** ikke målt i CI — chunk-størrelser og statisk sjekk only
5. **ESLint warnings** (4) — hooks deps, lav risiko

## Manuell sjekkliste før deploy

- [ ] Visuell sammenligning med 3 produkter + sticky bar på fysisk mobil
- [ ] Produktfeedback mot `/api/feedback` i prod
- [ ] Bekreft priser mot butikk etter egen policy

## Kommando

```bash
npm run quality:check   # build + alle valideringer
npm run lint              # inkluderes manuelt (0 errors)
```
