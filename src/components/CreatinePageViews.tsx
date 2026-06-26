import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { creatineScoringRules } from '../data/creatineScoring'
import { creatineVerificationStats } from '../data/creatineVerification'
import { creatineSourceLinks, type TestedCreatineProduct } from '../data/creatineProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { generateCreatineContent } from '../creatineContent'
import { getRelatedCreatineProducts } from '../utils/creatineHelpers'
import CreatineLeaderboardSection from './CreatineLeaderboardSection'

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

function ProductImage({ product }: { product: Pick<TestedCreatineProduct, 'name' | 'image'> }) {
  return (
    <div className="product-image">
      <img src={product.image} alt={`${product.name} – kreatin fra Kosttest.no`} loading="lazy" decoding="async" width="150" height="150" />
    </div>
  )
}

export function CreatineRankingTable({
  products,
  sortCol,
  sortAsc,
  onSort,
  onSelect,
}: {
  products: TestedCreatineProduct[]
  sortCol: string
  sortAsc: boolean
  onSort: (col: string) => void
  onSelect: (id: string) => void
}) {
  const arrow = (col: string) => (sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : ' ⇅')

  return (
    <div className="table-shell">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Produkt</th>
            <th onClick={() => onSort('dose')} style={{ cursor: 'pointer' }}>Dose{arrow('dose')}</th>
            <th onClick={() => onSort('price-creatine')} style={{ cursor: 'pointer' }}>kr/g kreatin{arrow('price-creatine')}</th>
            <th onClick={() => onSort('score')} style={{ cursor: 'pointer' }}>Poeng{arrow('score')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <td><span className="rank-badge">#{p.rank}</span></td>
              <td className="product-cell">
                <ProductImage product={p} />
                <div>
                  <span>{p.name}</span>
                  <span>{p.brand} · {p.formatType === 'gummies' ? 'Gummies' : 'Pulver'}</span>
                  {p.verificationStatus === 'verified' && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', display: 'block' }}>✓ Verifisert mot butikk</span>
                  )}
                  {p.verificationStatus === 'pending' && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>⏳ Ikke verifisert ennå</span>
                  )}
                </div>
              </td>
              <td>
                <strong>{p.creatineMgPerServing} mg</strong>
                <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>{p.creatineForm}</span>
              </td>
              <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr</span></td>
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
  )
}

export function CreatineProductPageView({
  product,
  onBack,
  onSelect,
}: {
  product: TestedCreatineProduct
  onBack: () => void
  onSelect: (id: string) => void
}) {
  const content = generateCreatineContent(product)
  const related = getRelatedCreatineProducts(product)

  return (
    <section className="content-section">
      <button className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Tilbake til kreatinrangering</button>
      <div className="review-card" style={{ gridTemplateColumns: '200px 1fr' }}>
        <ProductImage product={product} />
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
            <span><strong>{product.creatineMgPerServing} mg kreatin/dose</strong></span>
            <span>Form: {product.creatineForm}</span>
            <span>{product.formatType === 'gummies' ? `${product.gummiesPerServing} gummies/dose` : product.servingSize}</span>
            <span>{formatPrice(product.priceNok)} · {product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin</span>
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
                <li><strong>Dose:</strong> {content.doseAnalysis}</li>
                <li><strong>Form:</strong> {content.formAnalysis}</li>
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
              <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Lignende kreatin i testen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {related.map((item) => (
                  <button key={item.id} type="button" onClick={() => onSelect(item.id)} style={{ border: '1px solid var(--border)', background: 'var(--paper)', borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left' }}>
                    <ProductImage product={item} />
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 6 }}>{item.brand}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{item.creatineMgPerServing} mg · {item.score} poeng</span>
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

export function CreatineMetodeSection() {
  return (
    <section className="grade-system-section">
      <div className="section-heading">
        <span>Kreatin karaktermodell</span>
        <h2>Dose, form og pris</h2>
        <p>
          Kreatin scores etter dose per servering (60 %), form (15 %) og pris per g effektiv kreatin (25 %).
          Pulver og gummies testes i egne underkategorier — gummies har ofte lavere dose og høyere pris.
        </p>
      </div>
      <div className="rules-table-shell">
        <table className="rules-table">
          <caption>Åpen vekting for kreatin-karakter.</caption>
          <thead><tr><th>Komponent</th><th>Vekt</th><th>Metode</th></tr></thead>
          <tbody>
            <tr><td><span style={{ fontWeight: 700 }}>Dose per servering</span></td><td>60 %</td><td>3–5 g kreatin = full score</td></tr>
            <tr><td><span style={{ fontWeight: 700 }}>Form</span></td><td>15 %</td><td>Monohydrat = referanse (100 %)</td></tr>
            <tr><td><span style={{ fontWeight: 700 }}>Pris per g kreatin</span></td><td>25 %</td><td>Lavere kr/g = høyere score</td></tr>
          </tbody>
        </table>
      </div>
      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>{creatineScoringRules.summary}</p>
        <p style={{ marginTop: 12 }}>Regelsettet ligger i <code>creatineScoring.ts</code>. Produkter verifiseres mot ekte butikksider via automasjon.</p>
      </div>
    </section>
  )
}

export function CreatineLeaderboardBlock({
  onSelectProduct,
  sortCol,
  sortAsc,
  creatineFilter,
  onSort,
  onFilterChange,
  sortedProducts,
}: {
  onSelectProduct: (id: string) => void
  sortCol: string
  sortAsc: boolean
  creatineFilter: 'alle' | 'pulver' | 'gummies'
  onSort: (col: string) => void
  onFilterChange: (f: 'alle' | 'pulver' | 'gummies') => void
  sortedProducts: TestedCreatineProduct[]
}) {
  const vStats = creatineVerificationStats()

  return (
    <>
      <CreatineLeaderboardSection onSelectProduct={onSelectProduct} />
      <section className="content-section">
        <div className="warning-box" style={{ marginBottom: 20 }}>
          <AlertTriangle size={22} />
          <div>
            <span style={{ fontWeight: 700 }}>Kun ekte produkter — verifisering pågår</span>
            <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.55 }}>
              {vStats.verified}/{vStats.total} produkter verifisert mot ekte butikkside (1 produkt per time via automasjon).
              Uverifiserte rader kan ha feil pris eller dose — sjekk alltid etikett.
            </p>
          </div>
        </div>
        <div className="section-heading">
          <span>Kreatin best i test</span>
          <h2>Fullstendig rangering</h2>
          <p>Rangert etter dose (3–5 g), form og pris per g kreatin. Pulver og gummies vises med filter.</p>
        </div>
        <div className="filter-bar">
          <span className="filter-label" style={{ fontSize: 11 }}>Format:</span>
          {(['alle', 'pulver', 'gummies'] as const).map((v) => (
            <button key={v} type="button" className={`toggle-btn ${creatineFilter === v ? 'on' : 'off'}`} onClick={() => onFilterChange(v)}>
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label">{v === 'alle' ? 'Alle' : v === 'pulver' ? 'Pulver' : 'Gummies'}</span>
            </button>
          ))}
        </div>
        <CreatineRankingTable products={sortedProducts} sortCol={sortCol} sortAsc={sortAsc} onSort={onSort} onSelect={onSelectProduct} />
      </section>
      <section className="source-section">
        <div className="section-heading"><span>Kilder</span><h2>Kreatin vitenskap</h2></div>
        <ul className="source-list">
          {creatineSourceLinks.map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>
          ))}
        </ul>
      </section>
    </>
  )
}
