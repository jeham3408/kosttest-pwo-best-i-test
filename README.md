# Kosttest.no – PWO best i test

Ærlig, kildeåpen PWO-rangering for Norge. Bygget med React + Vite, prerenderet for SEO og deployet på Vercel.

Live: [kosttest.no](https://kosttest.no)  
Repo: [github.com/jeham3408/kosttest-pwo-best-i-test](https://github.com/jeham3408/kosttest-pwo-best-i-test)

## Kommandoer

```bash
npm install
npm run dev
npm run build
npm run lint
```

`npm run build` gjør følgende:

1. Typecheck + Vite client build
2. SSR-build av `src/entry-server.tsx`
3. Prerender av alle ruter med unik HTML og meta per URL
4. Auto-generert `sitemap.xml`
5. IndexNow-innsending av viktige URL-er

## Prosjektstruktur

| Sti | Formål |
|-----|--------|
| `src/data/pwoProducts.ts` | Produkter, karaktermotor, regler |
| `src/data/blog.ts` | Bloggposter |
| `src/routing.ts` | URL-parsing, meta, sitemap, prerender-ruter |
| `src/components/` | JsonLd, SubmissionPanel, UnrankedProductsSection |
| `scripts/prerender.mjs` | SSR + sitemap ved build |
| `api/scan-pwo.js` | Vercel serverless – AI etikett-scanning |

## Miljøvariabler

Kopier `.env.example`:

```bash
cp .env.example .env.local
```

| Variabel | Hvor | Beskrivelse |
|----------|------|-------------|
| `OPENAI_API_KEY` | Vercel | Kreves for `/api/scan-pwo` |
| `OPENAI_VISION_MODEL` | Vercel | Valgfri, default `gpt-4.1-mini` |
| `VITE_ENABLE_PWO_SCAN` | Lokal/Vercel | Sett `true` for å vise innsendingsskjema |

## Deploy

Prosjektet er koblet til Vercel som `kosttest-pwo-best-i-test`.

```bash
vercel --prod
```

Anbefalt: koble GitHub-repo i Vercel Dashboard for auto-deploy ved push til `main`.

## Datakilder

Produktdata i `src/data/pwoProducts.ts` er manuelt verifisert mot norske butikker (Gymgrossisten, KOST1, merkebutikker m.fl.). Karaktermotor basert på ISSN-retningslinjer. Pris påvirker **ikke** score.

## Vedlikehold

- Oppdater priser: rediger `priceNok` i `pwoProducts.ts`
- Nye produkter: legg til i `testedProducts` eller `listedProducts`
- `lastUpdated` i `pwoProducts.ts` bør oppdateres ved innholdsendringer
