import { lastUpdated } from '../../data/siteMeta'
import { TrustLevelExplainer } from './ProductDataStatus'

export default function DataFreshnessPage({ onBack }: { onBack?: () => void }) {
  return (
    <section className="content-section data-freshness-page">
      {onBack ? (
        <button type="button" className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>
          ← Tilbake
        </button>
      ) : null}
      <div className="section-heading">
        <span>Data og tillit</span>
        <h1>Hvor ferske er dataene?</h1>
        <p className="lead">
          Kosttest viser deklarerte produktdata og ein opne vurderingsmodell. Her forklarar vi korleis vi
          oppdaterer informasjon — og hva vi ikke kan vite uten dokumentasjon.
        </p>
      </div>

      <div className="data-freshness-blocks">
        <article>
          <h2>Prisar og produktformlar endrer seg</h2>
          <p>
            Butikkpriser og emballasje kan endre seg uten varsel. Vi oppdaterer pris når vi gjer
            kontroll — siste felles gjennomgang av testdata var <strong>{lastUpdated}</strong>.
            Enkelte produkt kan ha nyare kontrolldato der vi har gjennomført produktspesifikk sjekk.
          </p>
        </article>
        <article>
          <h2>Rangeringar blir oppdaterte ved kontroll</h2>
          <p>
            Formelscore og plassering endrer seg bare når deklarasjon, dose eller pris er kontrollert
            og lagt inn i testen. Endringar loggføres i offentleg endringslogg der vi har data.
          </p>
        </article>
        <article>
          <h2>Laboratorietest ≠ deklarasjonsanalyse</h2>
          <p>
            For PWO analyserer vi ingredienser og dose fra etikett — vi har ikke eget labresultat
            med mindre anna er oppgitt. For protein kan offisiell DIAAS-test dokumenterast separat.
          </p>
        </article>
        <article>
          <h2>Manglende dokumentasjon blir vist som manglende</h2>
          <p>
            Vi bruker ikke «verifisert» uten å forklare hva som er kontrollert og mot hvilken kilde.
            Felt uten data visast som «Ikke oppgitt» eller «Ikke funnet i åpne kilder» — ikke som
            lav produktkvalitet.
          </p>
        </article>
        <article>
          <h2>Du kan bidra med feilretting</h2>
          <p>
            På produktsider finn du «Meld feil eller send oppdatert produktdata». Lenke til
            produktside, etikett eller pris hjelper oss — innsending endrer ikke rangeringen automatisk.
          </p>
        </article>
      </div>

      <TrustLevelExplainer />

      <p className="data-freshness-footer muted">
        Les mer om metoden på <a href="/om-metoden/">Om metoden</a> eller{' '}
        <a href="/om-kosttest/">Om Kosttest</a>.
      </p>
    </section>
  )
}
