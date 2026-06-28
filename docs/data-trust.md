# Datatillit og transparens (Kosttest.no)

Synleg system for kva Kosttest veit, kva som manglar, og kor fersk informasjonen er.

## Komponentar

| Komponent | Bruk |
|-----------|------|
| `ProductDataStatus` | Kompakt badge (kort, tabell) |
| `DataTransparencyPanel` | `compact` / `full` / `drawer` |
| `ProductFeedbackForm` | «Meld feil eller send oppdatert produktdata» |
| `PendingReviewSection` | «Produkt som ventar på kontroll» på PWO-lista |
| `DataFreshnessPage` | `/kor-ferske-er-dataa/` |
| `TrustLevelExplainer` | Forklaring på testhubbar |

## Datamodell

- `src/data/trust/types.ts` — `ProductTrustSnapshot`, `ProductChangeEntry`, `ProductDataTrust`
- `src/data/trust/labels.ts` — etikettar utan vage «verifisert»
- `src/data/trust/resolvers/` — kategori-spesifikke resolvere (PWO, protein, kreatin)
- `src/data/trust/proteinAudits.ts` — endringslogg frå `data/protein-verifications/*.json`

### Tillitsnivå

- **Høg** — sentrale felt kontrollert mot primærkjelde/etikett
- **Middels** — nok for rangering, nokre felt bør sjekkast igjen
- **Avgrensa** — synleg, men ikkje fullt dokumentert
- **Ikkje rangert** — ikkje nok kontrollerbar info

## Kvar det visast

- **Produktkort (PWO):** kompakt status + drawer på mobil
- **Produktsider:** full panel + feilmeldingsskjema
- **Samanlikning:** datatillit, sist kontrollert, datakjelde, lab/doping
- **Testlister:** explainer + pending-seksjon (PWO)

## Feilmeldingar

`ProductFeedbackForm` sender til `/api/feedback` med metadata innebygd i meldinga (JSON-blokk). Typar:

- feil pris, ingrediensliste, dose
- produkt utgått / manglande produkt
- dokumentasjon tilgjengeleg
- feil i rangering / anna

Innsending endrar **ikkje** rangering automatisk.

## Testar

```bash
npm run trust:test
```

## Felt som bør fyllast manuelt (per produkt)

Disse støttar `ProductDataTrust`-override, men er **ikkje** fylt inn for dei fleste produkt enno:

| Felt | Status |
|------|--------|
| `lastChecked` (per produkt) | Brukar global `lastUpdated` + note |
| `priceLastChecked` (dato) | Viser global dato + butikknamn |
| `declarationLastChecked` | Avleda frå konfidens/audit |
| `changeLog` (PWO/kreatin) | Tom utan override |
| `batchTestStatus` | «Ikkje relevant» for PWO/protein |
| `lastAttemptedCheck` (pending) | `null` — ikkje registrert per produkt |
| `dataTrust` override på produktpost | Ikkje lagt inn i JSON enno |

Protein med audit (`bodylab-whey-100`, `dymatize-iso100`, `optimum-gold-standard`, `star-whey-100`) har verifisert dato og endringslogg frå audit-filer.

## Ruter

- `/kor-ferske-er-dataa/` — prerendera, i sitemap
