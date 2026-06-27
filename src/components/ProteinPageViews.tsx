import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { RANKING_TIEBREAKER_NOTE, RANKING_TIEBREAKER_SHORT } from '../data/rankingNotes'
import { formulationNote, iaasVsDiaasExplanation, proteinScoringRules } from '../data/proteinScoring'
import { proteinSourceLinks, testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { generateProteinContent } from '../proteinContent'
import { getRelatedProteinProducts } from '../utils/proteinHelpers'
import ProteinLeaderboardSection from './ProteinLeaderboardSection'
import ProductImage from './ProductImage'
import { MethodRulesCards } from './MethodRulesDisplay'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price)

const gradeClass = (grade: GradeLetter | undefined) => `grade-badge grade-${grade ?? 'F'}`

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="scorebar" aria-label={`${score} av 100 poeng`}>
      <span style={{ width: `${score}%` }} />
    </div>
  )
}

function ProteinMobileRankingCards({
  products,
  onSelect,
}: {
  products: TestedProteinProduct[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="ranking-cards-mobile" role="list" aria-label="Proteinrangering">
      {products.map((p) => (
        <button key={p.id} type="button" className="ranking-card" onClick={() => onSelect(p.id)} role="listitem">
          <div className="ranking-card-head">
            <span className="rank-badge">#{p.rank}</span>
            <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="proteinpulver" />
            <div className="ranking-card-title">
              <strong>{p.name}</strong>
              <span>{p.brand} · {p.sourceLabel}</span>
              {p.verificationStatus === 'verified' && <span className="ranking-card-tag">✓ Verifisert</span>}
            </div>
            <div className="ranking-card-score">
              <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
              <strong>{p.score}</strong>
            </div>
          </div>
          <dl className="ranking-card-stats">
            <div><dt>DIAAS ★</dt><dd>{p.diaasScore}{!p.diaasIsOfficial ? ' (est.)' : ''}</dd></div>
            <div><dt>IAAS</dt><dd>{p.iaasScore}</dd></div>
            <div><dt>kr/g prot</dt><dd>{p.pricePerGramProtein.toFixed(2).replace('.', ',')} kr</dd></div>
            <div><dt>Protein</dt><dd>{p.proteinPerServingG} g</dd></div>
          </dl>
          <div className="ranking-card-foot">
            <span>{formatPrice(p.priceNok)} · {p.packageSize}</span>
            <ScoreBar score={p.score} />
          </div>
        </button>
      ))}
    </div>
  )
}

export function ProteinRankingTable({
  products,
  sortCol,
  sortAsc,
  onSort,
  onSelect,
}: {
  products: TestedProteinProduct[]
  sortCol: string
  sortAsc: boolean
  onSort: (col: string) => void
  onSelect: (id: string) => void
}) {
  const arrow = (col: string) => (sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : ' ⇅')

  return (
    <>
      <ProteinMobileRankingCards products={products} onSelect={onSelect} />
      <div className="table-shell ranking-table-desktop">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Produkt</th>
            <th onClick={() => onSort('diaas')} style={{ cursor: 'pointer' }}>DIAAS ★{arrow('diaas')}</th>
            <th onClick={() => onSort('iaas')} style={{ cursor: 'pointer' }}>IAAS{arrow('iaas')}</th>
            <th onClick={() => onSort('price-protein')} style={{ cursor: 'pointer' }}>kr/g prot{arrow('price-protein')}</th>
            <th onClick={() => onSort('score')} style={{ cursor: 'pointer' }}>Poeng{arrow('score')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <td><span className="rank-badge">#{p.rank}</span></td>
              <td className="product-cell">
                <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="proteinpulver fra Kosttest.no" />
                <div>
                  <span>{p.name}</span>
                  <span>{p.brand} · {p.sourceLabel}</span>
                  {p.verificationStatus === 'verified' && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', display: 'block' }}>✓ Verifisert mot butikk</span>
                  )}
                </div>
              </td>
              <td>
                <strong style={{ color: 'var(--accent)' }}>{p.diaasScore}</strong>
                {!p.diaasIsOfficial && <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>estimat</span>}
              </td>
              <td><span style={{ color: 'var(--muted)' }}>{p.iaasScore}</span></td>
              <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.pricePerGramProtein.toFixed(2).replace('.', ',')} kr</span></td>
              <td>
                <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
                <strong>{p.score}</strong>
                <ScoreBar score={p.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

export function ProteinProductPageView({
  product,
  onBack,
  onSelect,
}: {
  product: TestedProteinProduct
  onBack: () => void
  onSelect: (id: string) => void
}) {
  const content = generateProteinContent(product)
  const related = getRelatedProteinProducts(product)

  return (
    <section className="content-section">
      <button className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Tilbake til proteinrangering</button>
      <div className="review-card">
        <ProductImage name={product.name} brand={product.brand} image={product.image} altSuffix="proteinpulver fra Kosttest.no" />
        <div className="review-body">
          <div className="review-heading">
            <div>
              {product.award && <span className="award">{product.award}</span>}
              {product.verificationStatus === 'verified' && (
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✓ Verifisert</span>
              )}
              <h1 style={{ marginTop: 4, fontSize: 22 }}>#{product.rank} {product.name}</h1>
              <p>{content.summary}</p>
            </div>
            <div className="score-lockup">
              <span className={gradeClass(product.overallGrade)}>{product.overallGrade}</span>
              <strong>{product.score}</strong>
              <span>/100</span>
            </div>
          </div>
          <div className="spec-row">
            <span><strong>DIAAS: {product.diaasScore}</strong>{product.diaasIsOfficial ? ' (testet)' : ' (estimat)'}</span>
            <span>IAAS: {product.iaasScore} (profil)</span>
            <span>{product.proteinPerServingG} g protein/dose</span>
            <span>{formatPrice(product.priceNok)} · {product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein</span>
          </div>
          <div style={{ marginTop: 10, padding: 12, background: 'var(--paper-strong)', borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--accent)' }}>DIAAS er vår primære kvalitetsmåling.</strong>{' '}
            {iaasVsDiaasExplanation.diaas.whyBest} IAAS ({product.iaasScore}) viser aminosyreprofil på papir — nyttig sammenligning, men inngår ikke i scoren.
          </div>
          <div className="ingredients-list" style={{ marginTop: 10 }}>
            {product.keyFeatures.map((f) => <span key={f}>{f}</span>)}
          </div>
          <div className="grade-breakdown" aria-label="Karaktergrunnlag" style={{ marginTop: 12 }}>
            {product.gradeBreakdown.map((item) => (
              <div className="grade-chip" key={item.key}>
                <span className={gradeClass(item.grade)}>{item.grade}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.doseLabel} · {item.points.toFixed(1).replace('.', ',')}/{item.maxPoints} poeng</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4><CheckCircle2 size={18} /> Vurdering</h4>
              <ul>
                <li><strong>DIAAS:</strong> {content.diaasAnalysis}</li>
                <li><strong>IAAS:</strong> {content.iaasAnalysis}</li>
                <li><strong>Pris:</strong> {content.priceAnalysis}</li>
                <li><strong>Passer for:</strong> {content.bestFor}</li>
                {product.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4><AlertTriangle size={18} /> Begrensninger</h4>
              <ul>
                <li><strong>Passer ikke for:</strong> {content.notFor}</li>
                {product.watchouts.map((w) => <li key={w}>{w}</li>)}
                <li><strong>Bunnlinje:</strong> {content.bottomLine}</li>
              </ul>
            </div>
          </div>
          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>❓ Ofte stilte spørsmål</summary>
            <div style={{ marginTop: 10 }}>
              {content.faq.map((f, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13 }}>{f.question}</strong>
                  <p style={{ fontSize: 12, margin: '2px 0 0' }}>{f.answer}</p>
                </div>
              ))}
            </div>
          </details>
          <a className="source-link" href={product.url} target="_blank" rel="noreferrer" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Kjøp hos {product.merchant} <ExternalLink size={16} />
          </a>
          {related.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Lignende proteinpulver i testen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {related.map((item) => (
                  <button key={item.id} type="button" onClick={() => onSelect(item.id)} style={{ border: '1px solid var(--border)', background: 'var(--paper)', borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left' }}>
                    <ProductImage name={item.name} brand={item.brand} image={item.image} altSuffix="proteinpulver fra Kosttest.no" />
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 6 }}>{item.brand}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>DIAAS {item.diaasScore} · IAAS {item.iaasScore}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function ProteinMetodeSection() {
  return (
    <section className="grade-system-section">
      <div className="section-heading section-heading--compact">
        <span>Protein karaktermodell</span>
        <h2>DIAAS + IAAS — og hvorfor DIAAS er best</h2>
        <p>
          Vi viser både IAAS (aminosyreprofil) og DIAAS (fordøyelig kvalitet). <strong>Totalscore bygger kun på DIAAS.</strong> Pris vises som referanse, men påvirker ikke rangeringen.
          IAAS vises for sammenligning, men FAO anbefaler DIAAS som gullstandard.
        </p>
      </div>
      <div className="hub-duo-grid">
        <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{iaasVsDiaasExplanation.iaas.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{iaasVsDiaasExplanation.iaas.summary}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5 }}><strong>Begrensning:</strong> {iaasVsDiaasExplanation.iaas.limitation}</p>
        </div>
        <div style={{ padding: 16, background: 'var(--paper-strong)', borderRadius: 8, border: '2px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>{iaasVsDiaasExplanation.diaas.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{iaasVsDiaasExplanation.diaas.summary}</p>
          <p style={{ fontSize: 12, margin: '10px 0 0', lineHeight: 1.5 }}><strong>Hvorfor best:</strong> {iaasVsDiaasExplanation.diaas.whyBest}</p>
        </div>
      </div>
      <div className="section-heading section-heading--compact" style={{ marginTop: 0 }}>
        <span>Scoring</span>
        <h2>Totalscore</h2>
      </div>
      <MethodRulesCards
        caption="Åpen vekting for proteinpulver-karakter."
        rules={proteinScoringRules.map((rule) => ({
          label: rule.label,
          weight: `${rule.weight} poeng`,
          note: rule.note,
        }))}
      />
      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>
          Regelsettet ligger i <code>proteinScoring.ts</code>. Produkter uten lab-testet DIAAS får estimat
          basert på proteintype. Vi påstår aldri offisiell DIAAS uten dokumentert test av ferdig produkt.
        </p>
        <p style={{ marginTop: 12 }}>{formulationNote}</p>
        <p style={{ marginTop: 12 }}>{RANKING_TIEBREAKER_NOTE}</p>
      </div>
    </section>
  )
}

export function ProteinLeaderboardBlock({
  onSelectProduct,
  sortCol,
  sortAsc,
  proteinFilter,
  onSort,
  onFilterChange,
  sortedProducts,
}: {
  onSelectProduct: (id: string) => void
  sortCol: string
  sortAsc: boolean
  proteinFilter: 'alle' | 'whey' | 'vegan' | 'kasein'
  onSort: (col: string) => void
  onFilterChange: (f: 'alle' | 'whey' | 'vegan' | 'kasein') => void
  sortedProducts: TestedProteinProduct[]
}) {
  const heroTitle =
    proteinFilter === 'vegan'
      ? 'Vegan proteinpulver best i test 2026'
      : proteinFilter === 'kasein'
        ? 'Kaseinprotein best i test 2026'
        : proteinFilter === 'whey'
          ? 'Whey protein best i test 2026'
          : 'Proteinpulver best i test 2026'

  const heroLead =
    proteinFilter === 'vegan'
      ? `${sortedProducts.length} plantebaserte produkter rangert etter DIAAS. Soya og erte/ris-blends — pris påvirker ikke plasseringen. ${RANKING_TIEBREAKER_SHORT}`
      : proteinFilter === 'kasein'
        ? `Kaseinprotein for langsom frigjøring — rangert etter DIAAS og IAAS. ${RANKING_TIEBREAKER_SHORT}`
        : 'Rangert etter DIAAS (kvalitet). IAAS vises for sammenligning — pris påvirker ikke plasseringen. ' + RANKING_TIEBREAKER_SHORT

  return (
    <>
      <section className="hub-page-hero">
        <p className="test-badge-inline">Test</p>
        <h1>{heroTitle}</h1>
        <p className="lead">{heroLead}</p>
      </section>
      <ProteinLeaderboardSection onSelectProduct={onSelectProduct} products={sortedProducts} />
      <section className="content-section">
        <div className="section-heading">
          <span>Proteinpulver best i test</span>
          <h2>Fullstendig rangering</h2>
          <p>
            Rangert etter DIAAS (kvalitet). IAAS vises for sammenligning av aminosyreprofil. Pris påvirker ikke plasseringen.
            Uten laboratorietestet DIAAS viser vi estimat basert på proteintype. {RANKING_TIEBREAKER_NOTE}
          </p>
        </div>
        <div className="filter-bar">
          <span className="filter-label" style={{ fontSize: 11 }}>Type:</span>
          {(['alle', 'whey', 'vegan', 'kasein'] as const).map((v) => (
            <button key={v} type="button" className={`toggle-btn ${proteinFilter === v ? 'on' : 'off'}`} onClick={() => onFilterChange(v)}>
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label">{v === 'alle' ? 'Alle' : v === 'whey' ? 'Whey' : v === 'vegan' ? 'Vegan' : 'Kasein'}</span>
            </button>
          ))}
        </div>
        <ProteinRankingTable products={sortedProducts} sortCol={sortCol} sortAsc={sortAsc} onSort={onSort} onSelect={onSelectProduct} />
        {sortedProducts.length === 0 && (
          <p className="muted" style={{ marginTop: 16 }}>Ingen produkter i denne kategorien ennå. Prøv «Alle» eller en annen type.</p>
        )}
      </section>
      <section className="source-section">
        <div className="section-heading"><span>Kilder</span><h2>Protein vitenskap</h2></div>
        <ul className="source-list">
          {proteinSourceLinks.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>
          ))}
        </ul>
      </section>
    </>
  )
}

export { testedProteinProducts }
