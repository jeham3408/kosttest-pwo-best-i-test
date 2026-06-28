# Produkt­samanlikning på Kosttest.no

Kategoriuavhengig samanlikningssystem — implementert for PWO, protein og kreatin.

## Brukarflyt

1. Vel **Samanlikn** på eit produktkort (maks 3 per kategori).
2. Valde produkt visast i den faste samanlikningslinja nedst.
3. Med 2–3 val, trykk **Samanlikn produkta**.
4. Del lenkje med `?compare=slug1,slug2` — mottakar kan opne direkte.

Samanlikning må skje **innanfor same kategori**. Prøver brukaren å blande PWO og protein, visast ein forklaring.

## URL og SEO

| Kategori | Compare-side | Eksempel |
|----------|--------------|----------|
| PWO | `/tester/pwo/samanlikn/` | `?compare=peveo-maxed,nutritac-midnight` |
| Protein | `/tester/protein/samanlikn/` | `?compare=...` |
| Kreatin | `/tester/kreatin/samanlikn/` | `?compare=...` |

- **noindex, follow** på samanlikningssider
- **Canonical** peikar til kategori-hub (t.d. `/tester/pwo/`)
- Compare-kombinasjonar prerenderast **ikkje** (unngår SEO-spam)

## Arkitektur

```
src/compare/
  types.ts          — CompareFieldDef, CompareCell, CompareCategoryConfig
  format.ts         — formatMg, formatScore, «ikkje dokumentert» vs «0 mg»
  highlight.ts      — best/worst markering per rad
  url.ts            — parse/build compare URL
  storage.ts        — localStorage (kosttest-compare-v1)
  analytics.ts      — trackCompareEvent + CustomEvent kosttest:compare
  registry.ts       — getCompareConfig(category)
  categories/
    pwo.ts          — PWO-felt + diff-reglar
    protein.ts
    creatine.ts
```

## Legge til felt for ny kategori

1. Opprett `src/compare/categories/<kategori>.ts` med:
   - `getXCompareFields(): CompareFieldDef[]`
   - `generateXCompareDiff(products)`
   - `xCompareConfig: CompareCategoryConfig`
2. Registrer i `registry.ts`.
3. Legg til rute i `routing.ts` (`/tester/<kat>/samanlikn/`).
4. Legg til `noindex`-meta i `getPageMeta`.

### CompareFieldDef

```typescript
{
  key: 'formulaScore',
  label: 'Formelscore',
  group: 'score',
  priority: 100,        // høgare = synlegare i tabell
  higherIsBetter: true,   // grøn ↑ markering
  lowerIsBetter: false,   // for pris
  diffRelevant: true,     // inkluder i «Viktigaste skilnader»
  getValue: (product) => ({ display, kind, raw, ariaLabel }),
}
```

**CompareValueKind:** `number` | `text` | `score` | `missing` | `not-documented` | `not-applicable`

## Analytics

Hendingar (ingen persondata):

| Event | Når |
|-------|-----|
| `compare_add` | Produkt lagt til |
| `compare_remove` | Produkt fjerna |
| `compare_open` | Samanlikningsside opna |
| `compare_share` | Del-lenkjekopi |
| `compare_clear` | Tømt val |
| `compare_external_link` | Butikklenkje frå samanlikning |

Integrasjon:
- `window.dataLayer` (GA4/GTM) om tilgjengeleg
- `window.addEventListener('kosttest:compare', (e) => …)`

## Test

```bash
npm run compare:test
```

## Tilgjenge

- `aria-pressed` på Samanlikn-knapp
- Tabell med `scope="row"` / `scope="col"`
- Best/worst markert med symbol (↑/↓) + tekst, ikkje berre farge
- Fokus synleg på alle interaktive element
