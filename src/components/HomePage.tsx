import { BookOpen, MessageSquarePlus, RefreshCw, ShieldCheck } from 'lucide-react'
import { testedCreatineProducts } from '../data/creatineProducts'
import { testedProteinProducts } from '../data/proteinProducts'
import { lastUpdated, testedProducts } from '../data/pwoProducts'
import { blogPosts } from '../data/blog'
import { siteStats } from '../siteStats'
import { brand } from '../brand'
import type { AppPage } from '../routing'

const trustPillars = [
  {
    icon: ShieldCheck,
    title: 'Uavhengig testing',
    text: 'Vi kjøper ikke plasseringer og har ingen sponsede rangeringer.',
  },
  {
    icon: BookOpen,
    title: 'Åpen metode',
    text: 'Scoring og vekting er dokumentert — se reglene per kategori.',
  },
  {
    icon: MessageSquarePlus,
    title: 'Alle kan bidra',
    text: 'Meld inn produktforslag, feil eller forbedringer uten konto.',
  },
  {
    icon: RefreshCw,
    title: 'Oppdatert og kildeåpen',
    text: 'Tester oppdateres løpende. Kilder og referanser ligger åpent.',
  },
] as const

type HomePageProps = {
  onNavigate: (page: AppPage, productId?: string | null) => void
  onNavigatePath: (path: string) => void
}

const categories = [
  {
    id: 'pwo',
    page: 'lb-pwo' as const,
    badge: 'Test',
    title: 'Pre-workout (PWO)',
    description: `${siteStats.pwoTestedCount} produkter rangert etter ingredienser og dose per serving.`,
    count: `${siteStats.pwoTestedCount} testet`,
    topPick: testedProducts[0],
    links: [
      { label: 'Se rangering', path: '/tester/pwo/' },
      { label: 'Stim-free', path: '/tester/pwo/stim-free/' },
      { label: 'Metode', path: '/om-metoden/' },
    ],
  },
  {
    id: 'protein',
    page: 'lb-protein' as const,
    badge: 'Test',
    title: 'Proteinpulver',
    description: `${siteStats.proteinTestedCount} merker — DIAAS som kvalitetsmål, IAAS for sammenligning.`,
    count: `${siteStats.proteinTestedCount} testet`,
    topPick: testedProteinProducts[0],
    links: [
      { label: 'Se rangering', path: '/tester/protein/' },
      { label: 'Vegan', path: '/tester/protein/vegan/' },
      { label: 'Metode', path: '/tester/protein/metode/' },
    ],
  },
  {
    id: 'kreatin',
    page: 'lb-creatine' as const,
    badge: 'Ny test',
    title: 'Kreatin',
    description: `${siteStats.creatineTestedCount} produkter — merkevare-kreatin, renhet, mesh og dopingtest.`,
    count: `${siteStats.creatineTestedCount} testet`,
    topPick: testedCreatineProducts[0],
    links: [
      { label: 'Se rangering', path: '/tester/kreatin/' },
      { label: 'Creapure', path: '/tester/kreatin/creapure/' },
      { label: 'Metode', path: '/tester/kreatin/metode/' },
    ],
  },
]

export default function HomePage({ onNavigate, onNavigatePath }: HomePageProps) {
  return (
    <>
      <section className="home-hero-banner" aria-label="Forsidebanner">
        <h1 className="sr-only">Finn de beste kosttilskuddene</h1>
        <img
          src={brand.homeHeroBanner}
          alt="Finn de beste kosttilskuddene — sammenlign produkter, se rangeringer og oppdag testvinnere uten kjøpte plasseringer på kosttest.no"
          className="home-hero-banner-img"
          width={1024}
          height={439}
          fetchPriority="high"
          decoding="async"
        />
        <p className="home-hero-banner-meta">Oppdatert {lastUpdated} · Uavhengig · Ingen sponsede plasseringer</p>
      </section>

      <section className="content-section hub-trust-strip" aria-label="Hvorfor kosttest.no">
        <div className="hub-trust-grid">
          {trustPillars.map(({ icon: Icon, title, text }) => (
            <article key={title} className="hub-trust-card">
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section hub-categories">
        <div className="section-heading hub-section-heading">
          <span>Testkategorier</span>
          <h2>Hva vil du sammenligne?</h2>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <article key={cat.id} className="category-card">
              <button type="button" className="category-card-main" onClick={() => onNavigate(cat.page)}>
                <span className={`test-badge ${cat.id === 'kreatin' ? 'test-badge-new' : ''}`}>{cat.badge}</span>
                <h3>{cat.title}</h3>
                <p>{cat.description}</p>
                <span className="category-count">{cat.count}</span>
              </button>
              <div className="category-card-links">
                {cat.links.map((link) => (
                  <button key={link.label} type="button" onClick={() => onNavigatePath(link.path)}>
                    {link.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading hub-section-heading">
          <span>Topp i test</span>
          <h2>Aktuelle favoritter</h2>
        </div>
        <div className="editorial-grid">
          <button type="button" className="editorial-card" onClick={() => onNavigate('product', testedProducts[0].id)}>
            <span className="test-badge">PWO</span>
            <strong>{testedProducts[0].name}</strong>
            <p>Score {testedProducts[0].score} — {testedProducts[0].award}</p>
          </button>
          <button type="button" className="editorial-card" onClick={() => onNavigate('protein-product', testedProteinProducts[0].id)}>
            <span className="test-badge">Protein</span>
            <strong>{testedProteinProducts[0].brand}</strong>
            <p>DIAAS {testedProteinProducts[0].diaasScore} · IAAS {testedProteinProducts[0].iaasScore}</p>
          </button>
          <button type="button" className="editorial-card" onClick={() => onNavigate('creatine-product', testedCreatineProducts[0].id)}>
            <span className="test-badge test-badge-new">Kreatin</span>
            <strong>{testedCreatineProducts[0].brand} {testedCreatineProducts[0].name}</strong>
            <p>Score {testedCreatineProducts[0].score} — {testedCreatineProducts[0].creatineBrand ?? testedCreatineProducts[0].award}</p>
          </button>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading hub-section-heading">
          <span>Kunnskap</span>
          <h2>Siste fra bloggen</h2>
        </div>
        <div className="blog-grid">
          {blogPosts.slice(0, 4).map((post) => (
            <button key={post.id} type="button" className="blog-card" onClick={() => onNavigate('blog-post', post.id)}>
              <span className="blog-card-category">{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <span className="blog-meta">{post.readMinutes} min lesetid</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <button type="button" className="button secondary" onClick={() => onNavigate('blog')}>Alle artikler</button>
          <button type="button" className="button secondary" onClick={() => onNavigate('metode')} style={{ marginLeft: 8 }}>Om metoden</button>
        </div>
      </section>

      <section className="hub-trust-band">
        <div className="hub-trust-inner">
          <div>
            <h2>Slik tester vi</h2>
            <p>
              PWO etter ingredienser og dose, protein etter DIAAS, kreatin etter merkevare og dokumentasjon.
              Metoden er åpen — og du kan hjelpe oss å holde testene oppdatert.
            </p>
          </div>
          <div className="hub-trust-actions">
            <button type="button" className="button primary" onClick={() => onNavigate('metode')}>Les om metoden</button>
            <button type="button" className="button secondary" onClick={() => onNavigatePath('/kilder/')}>Se kilder</button>
          </div>
        </div>
      </section>
    </>
  )
}
