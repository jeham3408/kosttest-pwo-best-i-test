# Kosttest design system

Sentral tokens og UI-komponenter for mobil-først sammenligning.

## Tokens

Alle designvariabler ligger i `src/styles/tokens.css`:

| Kategori | Eksempler |
|----------|-----------|
| Farger | `--color-brand-navy`, `--color-brand-green`, `--color-text-muted` |
| Score | `--grade-a` … `--grade-f`, `--grade-bg-a` |
| Datatillit | `--trust-high`, `--trust-limited`, … |
| Typografi | `--font-size-sm` … `--font-size-3xl`, `--font-weight-*` |
| Spacing | `--space-1` … `--space-12`, `--space-touch` (44px), `--space-safe-*` |
| Radius | `--radius-sm` … `--radius-full` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-sheet` |
| Focus | `--focus-ring-width`, `--focus-ring-color` |
| Z-index | `--z-header` (100) … `--z-modal` (400) |
| Breakpoints | `--breakpoint-md` (768px) — bruk `breakpoints` fra `src/styles/tokens.ts` i JS |

Legacy-alias (`--bg`, `--paper`, `--accent`, …) peker på tokens for bakoverkompatibilitet.

## UI-komponenter

Mappe: `src/components/ui/`

| Komponent | Formål |
|-----------|--------|
| `PageHeader` | Én H1 per side, eyebrow + lead |
| `CategoryHero` | Kategori-rangering hero |
| `MethodNotice` | Kort metode-/avgrensingsinfo |
| `ScoreBadge` | Formelscore med karakter + tekst |
| `ValueBadge` | Prisreferanse, visuelt skilt fra score |
| `DataConfidenceBadge` | Wrapper for datatillit (ProductDataStatus) |
| `FilterPanelShell` | Desktop inline filter / mobil bottom sheet |
| `FilterChip` | Enkelt filtervalg |
| `MobileBottomSheet` | Filterpanel med focus trap |
| `EmptyState` / `LoadingState` / `ErrorState` | Tilstandskomponenter |
| `Tooltip` | Hover/focus + title-fallback |
| `Accordion` | Sekundærinformasjon |
| `CompareTray` | Sammenligningslinje (ProductCompareBar) |

Stiler: `src/styles/ui-components.css`

## Bruk

```tsx
import { FilterPanelShell, ScoreBadge, PageHeader } from './components/ui'
```

Endre uttrykk ved å oppdatere tokens — ikkje hardkoda fargar i komponentar.

## Kjente avgrensingar

- `ProductCard` / `ProductTableRow` bruker enno eksisterende ranking-card/table-markup; migrering til dedikerte komponentar er delvis.
- `DocumentationStatusBadge` og `DisclosurePanel` deles med `DataTransparencyPanel` inntil videre.
- Leaderboard-diagram (`LeaderboardSection`) har enno eldre markup — tittel og tastatur fokus bør forbedrast videre.

## Produksjon

Test alltid filter bottom sheet og compare tray på ekte iOS (safe area) etter deploy.
