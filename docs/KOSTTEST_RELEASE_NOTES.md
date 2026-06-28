# Kosttest.no — lanseringsnotater

**Versjon:** produksjonsklar QA (juni 2026)  
**Språk offentlig UI:** bokmål (med enkelte fagtermar på nynorsk i interne moduler)

## For brukeren

### Tydeligere valg på forsiden
- Hero med målrettede snarveier (sterk formel, koffeinfri, best verdi, protein, kreatin).
- Kategori-vinnere med badge-kontekst — ikke bare «best i test» uten forklaring.
- Data-tillitsstripe og lenke til «Kor ferske er dataa?».

### PWO, protein og kreatin på lik linje
- Egne filter, badgar, metodesider og sammenlikning per kategori.
- PWO: formelscore 0–84, prisreferanse endrer ikke score, verdiindeks er egen størrelse.
- Kreatin: modell B (poengtrekk, ikke harde porter) dokumentert på metodesiden.

### Datatransparens
- Per produkt: datakilde, sist kontrollert, dokumentasjonsstatus, lab-test-status.
- «Ikke dokumentert» skilles fra «ikke relevant» og «ikke funne i åpne kilder».
- Feilrapportering og produkttilbakemelding uten automatisk rangering.

### Mobil og tilgjengelighet
- Filter som bottom sheet på mobil.
- Sentrale designtokens, fokusring, sammenlikningskurv med safe area.
- Code splitting for raskere første lasting.

### SEO og juridisk presisjon
- Unike titler og beskrivelser per side, canonical, Open Graph, Twitter-kort.
- Sitemap og robots.txt.
- Dynamiske sammenliknings-URL-er: `noindex`.
- 404-side med `noindex` (ikke lenger soft redirect til forsiden).
- Structured data uten misvisende Review/Rating på produktsider.

## Teknisk
- `npm run release:validate` — score, badge og tillitstester.
- `npm run quality:check` — build, validering, SEO, a11y, ytelse.
- Analyse: `kosttest:compare` og `kosttest:analytics` CustomEvents (ingen PII).

## Kjente avgrensninger
- Enkelte filter (protein kcal/søtstoff/baking) venter på produktfelt.
- Compare-chunk ~200 KB (lazy).
- Manuell produktkontroll ved pris- og deklarasjonsendringer.
