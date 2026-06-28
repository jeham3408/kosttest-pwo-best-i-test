import { ExternalLink } from 'lucide-react'
import { brand } from '../brand'
import { creatineSourceLinks } from '../data/creatineScoring'
import { proteinSourceLinks } from '../data/proteinProducts'
import { sourceLinks } from '../data/pwoProducts'
import FeedbackBar from './FeedbackBar'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="footer-trust-line">
        Åpen metode · Synlige kilder · Produkter rangeres etter publiserte regler
      </p>
      <FeedbackBar />
      <div className="site-footer-inner">
        <div>
          <img src={brand.logoDark} alt="Kosttest.no" className="footer-logo" width={150} height={40} decoding="async" />
          <p>Sammenligning av kosttilskudd i Norge basert på deklarasjonsanalyse og åpen metode.</p>
        </div>
        <div>
          <span className="site-footer-label">Tester</span>
          <a href="/tester/pwo/">PWO</a>
          <a href="/tester/protein/">Protein</a>
          <a href="/tester/kreatin/">Kreatin</a>
        </div>
        <div>
          <span className="site-footer-label">Guider</span>
          <a href="/tester/pwo/slik-velger-du/">Slik velger du PWO</a>
          <a href="/tester/protein/slik-velger-du/">Slik velger du protein</a>
          <a href="/tester/kreatin/slik-velger-du/">Slik velger du kreatin</a>
          <a href="/blogg/">Ingrediensertikler</a>
        </div>
        <div>
          <span className="site-footer-label">Om Kosttest</span>
          <a href="/om-kosttest/">Om oss</a>
          <a href="/om-metoden/">Metode</a>
          <a href="/hvor-ferske-er-dataene/">Hvor ferske er dataene?</a>
          <a href="/kilder/">Kilder</a>
          <a href="/om-kosttest/#kontakt">Meld feil</a>
        </div>
      </div>
      <p className="site-footer-note">
        Kosttilskudd er ikke nødvendig for fremgang. Rådfør deg med helsepersonell ved usikkerhet.
      </p>
    </footer>
  )
}

export function KilderPageContent() {
  return (
    <section className="content-section">
      <div className="hub-page-hero" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <p className="test-badge-inline">Kilder</p>
        <h1>Åpne kilder og referanser</h1>
        <p className="lead">
          Vi lenker til produktkategorier, merker vi har testet, og vitenskapelige retningslinjer
          som ligger til grunn for scoringen.
        </p>
      </div>
      <div className="source-section" style={{ paddingTop: 24 }}>
        <div className="section-heading"><span>PWO</span><h2>Butikker og vitenskap</h2></div>
        <ul className="source-list">
          {sourceLinks.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>
          ))}
        </ul>
      </div>
      <div className="source-section">
        <div className="section-heading"><span>Protein</span><h2>DIAAS og aminosyrer</h2></div>
        <ul className="source-list">
          {proteinSourceLinks.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>
          ))}
        </ul>
      </div>
      <div className="source-section">
        <div className="section-heading"><span>Kreatin</span><h2>ISSN og kvalitet</h2></div>
        <ul className="source-list">
          {creatineSourceLinks.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>
          ))}
        </ul>
      </div>
    </section>
  )
}
