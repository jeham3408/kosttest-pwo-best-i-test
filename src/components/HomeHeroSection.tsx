import { siteStats } from '../siteStats'

type HomeHeroSectionProps = {
  onNavigatePath: (path: string) => void
}

export default function HomeHeroSection({ onNavigatePath }: HomeHeroSectionProps) {
  return (
    <section className="hub-hero home-hero-text">
      <div className="hub-hero-grid">
        <div className="hub-hero-copy">
          <p className="hub-eyebrow">Deklarasjonsanalyse · åpen metode</p>
          <h1>Sammenlign kosttilskudd etter det som står på etiketten</h1>
          <p className="hub-lead">
            Kosttest samler deklarerte produktdata og åpne kilder, og rangerer PWO, protein og kreatin
            etter publiserte regler per kategori. Dette er ikke laboratorietest av hver pose — med mindre
            det er oppgitt for det enkelte produktet.
          </p>
          <div className="home-hero-cta">
            <button type="button" className="button primary" onClick={() => onNavigatePath('/tester/pwo/')}>
              Se PWO-rangering
            </button>
            <button type="button" className="button secondary" onClick={() => onNavigatePath('/tester/protein/')}>
              Se protein
            </button>
            <button type="button" className="button secondary" onClick={() => onNavigatePath('/tester/kreatin/')}>
              Se kreatin
            </button>
          </div>
          <div className="hub-stats" aria-label="Antall produkter i databasen">
            <div>
              <strong>{siteStats.pwoTestedCount}</strong>
              <span>PWO rangert</span>
            </div>
            <div>
              <strong>{siteStats.proteinTestedCount}</strong>
              <span>protein</span>
            </div>
            <div>
              <strong>{siteStats.creatineTestedCount}</strong>
              <span>kreatin</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
