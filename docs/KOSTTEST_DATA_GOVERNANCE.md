# Kosttest.no — datastyring

## Prinsipper
1. **Ingen oppdiktede datoer** — vis «Ikke oppgitt per produkt» eller la felt stå tomme der data mangler.
2. **Deklarasjon først** — dose og ingredienser hentes fra etikett/produktbilde med kilde notert.
3. **Pris er referanse** — påvirker ikke formelscore; brukes ved lik score og i verdiindeks.
4. **Endringer logges** — via tillitsmodul og manuell gjennomgang (`/kor-ferske-er-dataa/`).

## Datatyper

| Felt | Kilde | Oppdatering | Mangler |
|------|-------|-------------|---------|
| Ingrediens/dose | Etikett, produsent | Manuell kontroll | `null` / «Ikke oppgitt» |
| Pris | Forhandler | «Pris sist kontrollert» | Vis uten pris per dose der 0 |
| DIAAS / lab | Produsentdokumentasjon | Sitert med status | `notDocumented` / `notFound` |
| Dopingtest | Produsent | Egen status | Ikke straff automatisk som «dårlig» |
| Produktbilde | CDN/lokal | Fallback placeholder | `ProductImage` uten layout shift |

## Dokumentasjonsstatus

Definert i `src/data/trust/labels.ts`:

- **Dokumentert** — oppgitt av produsent eller funnet i åpne kilder
- **Ikke dokumentert** — produsent har ikke oppgitt feltet (≠ dårlig score)
- **Ikke funne i åpne kilder** — aktivt søk uten treff
- **Ikke relevant** — feltet gjelder ikke produktet
- **Venter på kontroll** — ikke ranger fullt

## Datatillit (PWO)

Nivåer: høy, middels, lav, insufficient (`getPwoDataConfidence`).

- Badgar krever ≥ middels.
- Insufficient: synlig, men ikke badge eller «full vurdering» uten forbehold.

## Endringsprosess
1. Bruker sender inn via produkttilbakemelding eller `/api/feedback`.
2. Manuell vurdering — **ingen automatisk rangering**.
3. Oppdater produktdata + `lastChecked`-felt.
4. Kjør `npm run release:validate` og `trust:test`.

## Analyse og personvern

Hendelser (ingen PII):
- `kosttest:compare` — sammenlikning
- `kosttest:analytics` — filter, produktkort, ekstern lenke, feedback start/sent

Ingen cookie-banner kreves for disse events alene. Ved fremtidig GA/Plausible: samtykke før tredjeparts cookies.

## Deploy-sjekkliste data
- [ ] Ingen `.env` secrets i repo
- [ ] Priser og datoer stemmer med siste manuelle runde
- [ ] `quality:check` grønn
- [ ] Sitemap uten `/404`
