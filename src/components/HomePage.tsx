import { ArrowRight, BookOpen, ClipboardList, Database, Scale } from 'lucide-react'
import { blogPosts } from '../data/blog'
import { homeGoalGroups } from '../data/homeGoals'
import { getHomeWinnersByCategory } from '../data/homeWinners'
import type { AppPage } from '../routing'
import HomeHeroSection from './HomeHeroSection'
import HomeHeroSlider from './HomeHeroSlider'

type HomePageProps = {
  onNavigate: (page: AppPage, productId?: string | null) => void
  onNavigatePath: (path: string) => void
}

const howItWorksSteps = [
  {
    icon: Database,
    title: 'Vi samler deklarerte data',
    text: 'Ingredienser, doser, pris og produsentopplysninger fra etikett, butikk og åpne kilder.',
  },
  {
    icon: Scale,
    title: 'Åpne kriterier per kategori',
    text: 'PWO etter formel, protein etter DIAAS-estimat, kreatin etter råstoff og dokumentasjon. Reglene er publisert.',
  },
  {
    icon: ClipboardList,
    title: 'Resultat og datakvalitet',
    text: 'Du ser score, prisreferanse, hva som mangler, og når data sist ble kontrollert.',
  },
] as const

const guideLinks = [
  { label: 'Slik velger du PWO', path: '/tester/pwo/slik-velger-du/', description: 'Koffein, pump og deklarasjon' },
  { label: 'Slik velger du protein', path: '/tester/protein/slik-velger-du/', description: 'DIAAS, proteintype og pris' },
  { label: 'Slik velger du kreatin', path: '/tester/kreatin/slik-velger-du/', description: 'Råstoff, renhet og dokumentasjon' },
  { label: 'Slik fungerer scoring', path: '/om-metoden/', description: 'Hva som teller — og hva som ikke gjør det' },
] as const

const ingredientSlugs = new Set([
  'l-citrulline',
  'beta-alanin',
  'kreatin',
  'koffein',
  'arginin',
  'glycerol',
  'rodbetekstrakt',
  'betain',
  'taurin',
  'tyrosin',
])

export default function HomePage({ onNavigate, onNavigatePath }: HomePageProps) {
  const winners = getHomeWinnersByCategory()
  const ingredientPosts = blogPosts.filter((p) => ingredientSlugs.has(p.slug)).slice(0, 4)

  return (
    <>
      <HomeHeroSlider />
      <HomeHeroSection onNavigatePath={onNavigatePath} />

      <section className="content-section home-goals-section" aria-labelledby="home-goals-heading">
        <div className="section-heading hub-section-heading">
          <span>Finn riktig test</span>
          <h2 id="home-goals-heading">Hva ser du etter?</h2>
          <p className="home-section-lead">
            Velg et mål — du kommer direkte til rangeringen med relevant filter eller sortering.
          </p>
        </div>
        <div className="home-goals-grid">
          {homeGoalGroups.map((group) => (
            <div key={group.id} className="home-goals-group">
              <div className="home-goals-group-head">
                <h3>{group.title}</h3>
                <button type="button" className="home-goals-all" onClick={() => onNavigatePath(group.rankingPath)}>
                  Full rangering
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
              <ul className="home-goals-list">
                {group.goals.map((goal) => (
                  <li key={goal.path + goal.label}>
                    <button type="button" className="home-goal-chip" onClick={() => onNavigatePath(goal.path)}>
                      <span className="home-goal-chip-label">{goal.label}</span>
                      <span className="home-goal-chip-hint">{goal.hint}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section home-winners-section" aria-labelledby="home-winners-heading">
        <div className="section-heading hub-section-heading">
          <span>Aktuelle toppvalg</span>
          <h2 id="home-winners-heading">Kategori-vinnere nå</h2>
          <p className="home-section-lead">
            Utvalgte produkter med dokumenterte badge-kriterier — ikke generelle «best i test»-påstander uten kontekst.
          </p>
        </div>
        {(['pwo', 'protein', 'creatine'] as const).map((cat) => {
          const items = winners[cat]
          if (!items.length) return null
          const rankingPath = items[0].rankingPath
          const comparePath = items[0].comparePath
          return (
            <div key={cat} className="home-winners-category">
              <h3 className="home-winners-cat-title">{items[0].categoryLabel}</h3>
              <div className="home-winners-grid">
                {items.map((card) => (
                  <article key={card.productId + card.badgeLabel} className="home-winner-card">
                    <span className="home-winner-badge">{card.badgeLabel}</span>
                    <p className="home-winner-badge-expl">{card.badgeExplanation}</p>
                    <button
                      type="button"
                      className="home-winner-product"
                      onClick={() => onNavigatePath(card.productPath)}
                    >
                      <strong>{card.brand}</strong>
                      <span>{card.productName}</span>
                    </button>
                    <dl className="home-winner-stats">
                      <div><dt>Score</dt><dd>{card.scoreLabel}</dd></div>
                      <div><dt>Pris</dt><dd>{card.priceLabel}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="home-winners-actions">
                <button type="button" className="button secondary" onClick={() => onNavigatePath(rankingPath)}>
                  Se full {items[0].categoryLabel.toLowerCase()}-rangering
                </button>
                <button type="button" className="button secondary" onClick={() => onNavigatePath(comparePath)}>
                  Sammenlign produkter
                </button>
              </div>
            </div>
          )
        })}
      </section>

      <section className="content-section home-how-section" aria-labelledby="home-how-heading">
        <div className="section-heading hub-section-heading">
          <span>Metode</span>
          <h2 id="home-how-heading">Slik fungerer Kosttest</h2>
        </div>
        <ol className="home-how-steps">
          {howItWorksSteps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <span className="home-how-step-num" aria-hidden="true">{i + 1}</span>
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="home-how-note">
          Laboratorietest brukes bare der det finnes dokumentert måling for produktet — for eksempel offisiell DIAAS
          for ferdig proteinpulver. Ellers jobber vi med deklarasjonsanalyse og åpne kilder.
        </p>
        <div className="home-how-actions">
          <button type="button" className="button primary" onClick={() => onNavigatePath('/om-metoden/')}>
            Les om metoden
          </button>
          <button type="button" className="button secondary" onClick={() => onNavigatePath('/om-kosttest/')}>
            Om Kosttest
          </button>
        </div>
      </section>

      <section className="home-trust-compact" aria-label="Datatillit">
        <div className="home-trust-compact-inner">
          <p className="home-trust-compact-lead">
            <strong>Åpen metode.</strong> Synlige kilder. Dato på kontroll.
          </p>
          <div className="home-trust-compact-links">
            <button type="button" onClick={() => onNavigatePath('/om-metoden/')}>Metode</button>
            <button type="button" onClick={() => onNavigatePath('/kilder/')}>Kilder</button>
            <button type="button" onClick={() => onNavigatePath('/hvor-ferske-er-dataene/')}>Hvor ferske er dataene?</button>
          </div>
        </div>
      </section>

      <section className="content-section home-knowledge-section" aria-labelledby="home-knowledge-heading">
        <div className="section-heading hub-section-heading">
          <span>Guider og kunnskap</span>
          <h2 id="home-knowledge-heading">Støtte for kjøpsvalg</h2>
          <p className="home-section-lead">Guider og ingrediensertikler — etter at du har funnet riktig kategori.</p>
        </div>
        <div className="home-guide-grid">
          {guideLinks.map((g) => (
            <button key={g.path} type="button" className="home-guide-card" onClick={() => onNavigatePath(g.path)}>
              <BookOpen size={20} aria-hidden="true" />
              <strong>{g.label}</strong>
              <span>{g.description}</span>
            </button>
          ))}
        </div>
        {ingredientPosts.length ? (
          <>
            <h3 className="home-knowledge-sub">Ingrediensertikler</h3>
            <div className="blog-grid blog-grid-compact">
              {ingredientPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="blog-card"
                  onClick={() => onNavigate('blog-post', post.id)}
                >
                  <span className="blog-card-category">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="button" className="button secondary" onClick={() => onNavigate('blog')}>
                Alle artikler
              </button>
            </div>
          </>
        ) : null}
      </section>

      <section className="home-purpose-band" aria-labelledby="home-purpose-heading">
        <div className="home-purpose-inner">
          <h2 id="home-purpose-heading">Formål og veldedighet</h2>
          <p>
            Kosttest drives som et redaksjonelt prosjekt. Målet er å søke om godkjent non-profit innen 2027.
            Dersom det lykkes, skal overskudd fra annonser og affiliate gå til barnekreftforskning, rent vann
            og andre veldedige formål — dette er et fremtidig mål, ikke dagens drift.
          </p>
          <button type="button" className="button secondary" onClick={() => onNavigatePath('/om-kosttest/#finansiering')}>
            Slik finansieres siden
          </button>
        </div>
      </section>
    </>
  )
}
