import { lastUpdated } from '../data/siteMeta'
import HubPageBanner from './HubPageBanner'

export default function OmKosttestPage() {
  return (
    <>
      <HubPageBanner bannerId="om-kosttest" title="Om Kosttest.no" />
      <section className="content-section">
      <div className="hub-page-hero hub-page-hero--after-banner" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <p className="lead">
          Kosttest er en sammenligningstjeneste for kosttilskudd solgt i Norge. Produkter rangeres etter et
          publisert regelsett per kategori. Betalt plassering påvirker ikke rangeringen.
        </p>
        <p className="lead" style={{ fontSize: 15, marginTop: 8 }}>
          Sist oppdatert: {lastUpdated}.
        </p>
      </div>

      <div className="method-prose om-kosttest-prose">
        <h2 id="hva-er">Hva Kosttest er</h2>
        <p>
          Vi samler deklarerte produktdata — ingredienser, doser, pris og produsentopplysninger — og sammenligner
          dem med åpne kriterier. Målet er å gjøre det enklere å finne produkter som matcher det du leter etter,
          uten skjulte sponsorplasseringer.
        </p>
        <p>
          Kosttest drives av Peveo / Jesper Hammersvik som et redaksjonelt prosjekt. Det er ikke et laboratorium
          og ikke en butikk.
        </p>

        <h2 id="vurdert">Hva som blir vurdert</h2>
        <ul>
          <li><strong>PWO:</strong> Deklarerte ingredienser og dose per serving (L-citrulline, beta-alanin, m.m.). Koffein og pris vises separat.</li>
          <li><strong>Protein:</strong> DIAAS-basert kvalitetsscore (estimat fra proteintype der labmåling mangler), IAAS som forklaring, pris per gram protein.</li>
          <li><strong>Kreatin:</strong> Råstoff, renhet, mesh, dopingtest og monohydrat-status der oppgitt.</li>
          <li><strong>Datakvalitet:</strong> Hva som er dokumentert, hva som mangler, og når data sist ble kontrollert.</li>
        </ul>

        <h2 id="ikke-vurdert">Hva som ikke blir vurdert</h2>
        <ul>
          <li>Smak, oppløselighet og personlig toleranse (med mindre produsent dokumenterer relevante opplysninger).</li>
          <li>Effekt i kroppen — vi vurderer deklarasjon, ikke treningsresultater.</li>
          <li>Generell «best for alle»-anbefaling uten kontekst.</li>
          <li>Laboratorieanalyse av hver enkelt batch, med mindre det finnes dokumentert test for produktet.</li>
        </ul>

        <h2 id="deklarasjon">Hva «deklarasjonsanalyse» betyr</h2>
        <p>
          Vi leser det produsent og butikk oppgir på etikett og produktside, sammenholder med åpne kilder og
          regler, og beregner score. Det er ikke det samme som å sende produkter til et eksternt lab for
          innholdsanalyse — med mindre slik dokumentasjon finnes og er koblet til det aktuelle produktet.
        </p>

        <h2 id="lab">Når laboratorietest er relevant</h2>
        <p>
          Laboratoriemålt data brukes bare når den er dokumentert for det spesifikke produktet — for eksempel
          offisiell DIAAS-test av ferdig proteinpulver. Uten slik dokumentasjon bruker vi estimater basert på
          proteintype eller markerer feltet som ikke oppgitt.
        </p>

        <h2 id="pris">Hvorfor pris vises — og hvordan den brukes</h2>
        <p>
          Pris per dose (PWO) eller per gram protein/kreatin vises som egen referansekarakter. Pris endrer
          hovedrangeringen bare som tiebreaker ved lik score, eller i egne «best verdi»-badges med egne kriterier.
        </p>

        <h2 id="produkter">Hvordan produkter kommer med</h2>
        <p>
          Vi prioriterer produkter som selges i Norge og har lesbar deklarasjon. Brukere kan foreslå produkter
          via tilbakemeldingsskjemaet. Nye produkter vurderes med samme regelsett som eksisterende.
        </p>

        <h2 id="feil">Hvordan feil rettes</h2>
        <p>
          Oppdager du feil i dose, pris eller annen produktinfo? Send inn via skjemaet nederst på siden. Vi
          retter og logger endringen. Alvorlige feil prioriteres for ny gjennomgang.
        </p>

        <h2 id="kilder">Kilder og oppdateringer</h2>
        <p>
          Vitenskapelige retningslinjer, butikker og produsentdata ligger åpent på{' '}
          <a href="/kilder/">kildesiden</a>. Priser og etiketter kontrolleres løpende. Se også{' '}
          <a href="/hvor-ferske-er-dataene/">Hvor ferske er dataene?</a> for status per kategori.
        </p>

        <h2 id="finansiering">Finansiering og annonsering</h2>
        <p>
          Siden finansieres gjennom annonser og affiliate-lenker til butikker. Det påvirker ikke score eller
          rekkefølge i rangeringen. Målet er å søke om godkjent non-profit innen 2027. Dersom det lykkes,
          skal overskudd gå til veldedige formål — dette er et fremtidig mål, ikke dagens drift.
        </p>

        <h2 id="kontakt">Kontakt og produktinnsending</h2>
        <p>
          Bruk tilbakemeldingsskjemaet nederst på siden for å melde feil, foreslå produkter eller gi innspill
          til metoden. Du kan også sende e-post til <a href="mailto:post@kosttest.no">post@kosttest.no</a>.
        </p>
        <p>
          <a href="/tester/pwo/">Gå til PWO-rangering</a>
          {' · '}
          <a href="/tester/protein/">Protein</a>
          {' · '}
          <a href="/tester/kreatin/">Kreatin</a>
          {' · '}
          <a href="/om-metoden/">Metode</a>
        </p>
      </div>
    </section>
    </>
  )
}
