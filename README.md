# Kosttest.no - PWO best i test

Statisk, prerenderet React/Vite-side for en norsk og kildeåpen PWO-test.

## Kommandoer

```bash
npm install
npm run dev
npm run build
npm run lint
```

`npm run build` genererer først Vite-klienten, bygger deretter en SSR-entry og skriver ferdig HTML til `dist/index.html` for bedre SEO.

## Datakilder

Produktdata ligger i `src/data/pwoProducts.ts`. Første publisering bruker Gymgrossisten og Tights som norske produktkilder, Mattilsynet/EFSA for koffein- og regelverkskontekst og ISSN/fagartikler for prestasjonsdose-bakgrunn.
