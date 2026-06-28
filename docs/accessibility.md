# Tilgjengelighet (WCAG 2.2 AA)

## Implementerte tiltak

### Perception
- Farge er aldri eneste informasjonsbærer: score vises som tall + karakter (`ScoreBadge`, `ScoreLockup`)
- Kontrast: mørk navy på hvit bakgrunn, grønn accent på badges
- `prefers-reduced-motion`: reduserte animasjoner i tokens og UI-CSS

### Operability
- Synlig `:focus-visible` ring (`--focus-ring-color`)
- Minimum trykkflate 44px på mobil (`--space-touch`) for filter, compare, knapper
- `MobileBottomSheet`: focus trap, Escape lukker, `aria-modal`, labelledby
- Compare toggle: `aria-pressed`, beskrivende `aria-label`
- Tabeller: semantisk `<table>` på desktop; kortvisning på mobil
- Leaderboard-søyler: `<button>` med tastaturfokus der klikkbare

### Forståelse
- Filtergrupper: `role="group"` + `aria-label`
- Sammenligningslinje: `aria-live="polite"`
- Skjema (FeedbackBar): feltfeil som tekst, labels på inputs
- Heading-hierarki: `PageHeader` sikrer én H1; underseksjoner H2/H3

### Robusthet
- `lang="nb"` på `<html>`
- Ikoner dekorativt: `aria-hidden="true"` der tekst finnes
- Tooltip: `title` + `aria-describedby` som fallback

## Automatisert sjekk

```bash
npm run build
npm run a11y:check
```

Sjekker: `lang`, enkelt H1, tokens, focus-stiler, bottom sheet.

## Manuell sjekk (anbefalt før release)

1. **Tastatur**: Tab gjennom forsida → PWO → filter → produkt → sammenlign
2. **Skjermleser** (VoiceOver/NVDA): minst én produktside + sammenlikningsside
3. **Mobil**: filter bottom sheet, compare tray dekker ikkje header-innhald
4. **Zoom 200%**: ingen horisontal scroll på forsida

## Kjente gap

- Enkelte eldre tekstar (t.d. metodesider) kan enno blande nynorsk/bokmål
- Leaderboard mangler full tekstlig tabellalternativ for alle diagram
- Lighthouse bør køyrast i produksjon med ekte CDN/cache

## Produksjon

Kjør Lighthouse mobil på `/`, `/tester/pwo/`, `/pwo/peveo-maxed/` etter deploy.
Verifiser at compare tray + iOS safe area fungerer på fysisk enhet.
