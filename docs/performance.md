# Performance

## Mål

| Metrikk | Mål |
|---------|-----|
| LCP (mobil 4G) | < 2,5 s på forsida |
| INP | Filter/sortering føles umiddelbar (< 100 ms opplevd) |
| CLS | Produktbilder reserverer plass (`aspect-ratio`, width/height) |
| JS initial | Code splitting per kategori |

## Endringer

### Bilder
- `ProductImage`: faste width/height, `aspect-ratio`, `loading="lazy"` som standard
- `priority` prop for LCP-bilder (produktsider)
- Fjernet ubrukte hero-banner preloads fra `index.html`

### JavaScript
- `vite.config.ts`: `manualChunks` for icons, compare, pwo, protein, creatine, data-*

### CSS
- Tokens og UI-CSS lastes via `index.css` før app-stiler
- Ingen tunge tredjeparts diagrambibliotek

### Hydration
- Filter state lesast frå URL ved mount; ingen ekstra server/client mismatch utover eksisterende SSR

## Sjekk

```bash
npm run build
npm run perf:check
```

`perf-check` validerer bundle-størrelse, code splitting og viewport.

### Lighthouse (lokal)

```bash
npx serve dist -p 4173
npx lighthouse http://localhost:4173 --only-categories=performance,accessibility --form-factor=mobile --output=html --output-path=./lighthouse-report.html
```

## Produksjon

- Verifiser Core Web Vitals i Search Console / Vercel Analytics
- Sjekk at CDN cacher statiske assets
- Feedback-skjema (`/api/feedback`) lastes først ved åpning — ikke på critical path

## Kjente avgrensingar

- Total JS bundle kan enno overstige ideal «≤ 200 KB» på grunn av produktdata inline; chunks reduserer initial parse
- SSR HTML inkluderer full produktliste for SEO — akseptabel tradeoff
