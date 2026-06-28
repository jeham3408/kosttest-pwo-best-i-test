# Kosttest.no — redaksjonelle regler

Gjelder offentlig tekst: forsider, kategorier, produktsider, badger, metode, footer, skjemaer og metadata.

Kilde i kode: `src/data/editorialLabels.ts`, `src/data/trust/labels.ts`, `src/data/trust/enums.ts`.

## Språk og tone

- **Bokmål** på offentlig UI.
- Nøktern, forklarende tone — ikke salgsspråk.
- Unngå superlativer («beste for alle», «garantert», «trygt for alle») uten regelgrunnlag.
- Ikke bruk «uavhengig» uten metodeforklaring — bruk «åpen metode», «deklarasjonsanalyse».

## «Best formel totalt» (PWO)

- Tildels produktet med **høyest formelscore** blant badge-eligible produkter.
- Bygger **kun** på deklarerte ingredienser og dose — **ikke pris**.
- Krever datatillit ≥ middels (`isEligibleForBadges`).
- Produkter med begrenset/insufficient datakvalitet får **ikke** badge.
- Ved likt score: delt vinnerstatus etter `pickTop`-regel i `src/data/pwo/badges.ts`.

## «Best verdi» (PWO)

- **Ikke** det billigste produktet alene.
- Høyest **verdiindeks**: 72 % formelscore + 28 % prisreferanse per dose (`calculatePwoValueIndex`).
- Minimum formelscore og prisgrad (`PWO_BADGE_THRESHOLDS.valueMinFormulaScore`, `valueMinPriceGrades`).
- Prisendring endrer **ikke** formelscore — kun verdiindeks.

## «Best budsjett» (PWO)

- Lavest pris per dose blant produkter over minimum formelscore.
- Skilles fra «best verdi».

## Produkttekst generelt

- `verdict` og sammendrag: beskriv **deklarasjon og score**, ikke brukerens helseutfall.
- Ingen medisinske effektpåstander eller garantier.
- Koffein: nøktern doseinfo; henvis til emballasje og helsepersonell ved usikkerhet.
- Kosttilskudd er ikke nødvendig for fremgang — si det der det er naturlig.

## «Passer best for»

- Genereres per produkt via `generatePwoProductCopy` / protein/kreatin-tilsvarende.
- Må reflektere **faktisk score, dose og pris** — ikke generisk ros.
- Produkter med **lav score (&lt;25)** skal ikke få «topp», «beste valg» eller «anbefales for alle».
- Maks ~15 % dupliserte «Passer best for»-tekster på tvers av katalog (testet i `data:validate`).
- Produkter i **«venter på kontroll»** får ikke «best for»-tekst eller positive anbefalinger.

## «Viktig å vite»

- Skal nevne reelle **watchouts**: koffein, allergener, manglende dokumentasjon, pris.
- Ingen «garantert», «trygt for alle», «beste på markedet».
- Manglende felt formuleres som «ikke dokumentert» — ikke som kvalitetsdom.

## Manglende data

| Situasjon | Visning | Ikke bruk |
|-----------|---------|-----------|
| Felt ikke oppgitt | «Ikke oppgitt per produkt» | `null`, `—`, tom celle |
| Produsent har ikke oppgitt | «Ikke dokumentert» | Score 0 |
| Ikke funnet i åpne kilder | «Ikke funnet i åpne kilder» | «Manglende» uten forklaring |
| Felt gjelder ikke | «Ikke relevant» | Samme som «manglende» |
| Venter kontroll | «Venter på kontroll» | Rangeringstall i pending-seksjon |

Kilde: `MISSING_VALUE` i `src/data/trust/labels.ts`.

## Laboratorietest og dokumentasjon

- Standard PWO: **«Ikke laboratorietestet av Kosttest»** — vi analyserer deklarasjon.
- Offisiell DIAAS: kun når `diaasIsOfficial` og dokumentert test av ferdig produkt.
- Tredjepartsdokumentasjon: sitér kilde — ikke fremstill som Kosttest-lab.
- Dopingtest kreatin: `documented` / `not_documented` / `not_found_in_public_sources` — aldri «0».
- Produkter med `dataConfidence: limited` skal **ikke** fremstå som fullt verifisert.

## Badger (alle kategorier)

- Hver badge har `eligibilityReason` og `sourceMetric`.
- Begrenset datatillit → ingen badge (`data:validate` + scoring-test).
- Protein: DIAAS-badge ≠ automatisk «best protein for muskelvekst».

## SEO-tekst

- Unik `title` og meta description per viktig side (≥50 tegn).
- Én H1 per side.
- FAQ schema kun for synlig FAQ.
- Ingen Review/Rating schema som antyder uavhengig labtest.
- Sammenlignings-URL-er: `noindex`.

## Feilmeldinger og skjema

- Menneskelige setninger; ingen stack traces.
- `role="status"` på tilbakemeldinger.
- Innsending endrer **ikke** rangering automatisk — alltid oppgitt.

## Forbudt / unngå

- Oppdiktede datoer, kilder eller labresultater.
- Interne notater eller API-nøkler i offentlig UI.
- Presentere estimat som offisiell labtest.
- «Verifisert» uten å si **hva** som er kontrollert og **mot hvilken kilde**.
