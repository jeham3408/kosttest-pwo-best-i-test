# Kosttest.no — redaksjonelle regler

Gjelder offentlig tekst: forsider, kategorier, produktsider, badgar, metode, footer, skjemaer og metadata.

## Språk og tone
- **Bokmål** på offentlig UI.
- Nøktern, forklarende tone — ikke salgsspråk.
- Unngå superlativer («beste for alle», «garantert», «trygt for alle») uten regelgrunnlag.

## Standardformuleringer

| Situasjon | Formulering |
|-----------|-------------|
| Datagrunnlag | Basert på deklarert innhold |
| Lab | Ikke laboratorietestet av Kosttest med mindre annet er oppgitt |
| Manglende dokumentasjon | Ikke dokumentert i åpne kilder |
| Pris | Pris sist kontrollert |
| Score PWO | Formelscore (0–84) |
| Pris i rangering | Prisreferanse — endrer ikke formelscore |
| Data alder | Data sist kontrollert |

Kilde: `src/data/editorialLabels.ts`

## Forbudt / unngå
- Medisinske effektpåstander eller garanti om resultater.
- Blande deklarasjonsanalyse og egen laboratorietest uten tydelig merking.
- Presentere «ikke dokumentert» som «dårlig produkt».
- Hente «uavhengig» uten å forklare metode (bruk «åpen metode», «ingen sponsede plasseringer»).

## Badgar
- Kun produkter med datatillit ≥ middels (PWO) får rangeringbadgar.
- Hver badge skal ha `eligibilityReason` og `sourceMetric` i kode.
- «Best formel totalt» = høyest formelscore blant eligible — ikke pris.
- «Best verdi» = verdiindeks (72 % formel + 28 % prisreferanse), ikke billigst.
- «Best budsjett» = lavest pris per dose blant produkter over min formelscore.

## Produkttekst
- `verdict` og sammendrag: beskriv deklarasjon og score, ikke brukerens helseutfall.
- Koffein: nøktern doseinfo + henvisning til emballasje og helsepersonell ved usikkerhet.
- Kosttilskudd er ikke nødvendig for fremgang — si det eksplisitt der det er naturlig (om-side, guider).

## SEO-tekst
- Unik title og meta description per viktig side.
- FAQ schema kun for synlig FAQ-innhold på siden.
- Ingen Review/Rating schema som antyder uavhengig labtest.

## Feilmeldinger
- Menneskelige, uten stack traces eller teknisk sjargong.
- Tilby neste steg (forside, testoversikt, feilrapport).
