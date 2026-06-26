import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { creatineMethodNote, creatineScoringRules, creatineSourceLinks } from '../data/creatineScoring'
import { creatineVerificationStats } from '../data/creatineVerification'
import { type TestedCreatineProduct } from '../data/creatineProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { generateCreatineContent } from '../creatineContent'
import { getRelatedCreatineProducts } from '../utils/creatineHelpers'

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
            <th onClick={() => onSort('dose')} style={{ cursor: 'pointer' }}>g/dose{arrow('dose')}</th>
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
                  <span>{p.brand} · {p.format === 'gummies' ? 'Gummies' : 'Pulver'}</span>
                  {p.verificationStatus === 'verified' && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', display: 'block' }}>✓ Verifisert mot butikk</span>
                  )}
                  {p.verificationStatus === 'pending' && (
                    <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>⏳ Ikke verifisert ennå</span>
                  )}
                </div>
              </td>
              <td><strong>{p.creatinePerServingG} g</strong><span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>{p.creatineForm}</span></td>
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
  const related = getRelatedCreatineProducts(product.id)

  return (
    <section className="content-section product-page">
      <button className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Kreatinrangering</button>
      <div className="product-hero">
        <ProductImage product={product} />
        <div>
          <span className="meta-line">#{product.rank} · {product.brand} · {product.format === 'gummies' ? 'Gummies' : 'Pulver'}</span>
          <h1>{product.name}</h1>
          <p className="lead">{product.verdict}</p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={gradeClass(product.overallGrade)} style={{ fontSize: 18 }}>{product.overallGrade}</span>
            <strong style={{ fontSize: 24 }}>{product.score} poeng</strong>
            <span style={{ color: 'var(--muted)' }}>{formatPrice(product.priceNok)} · {product.packageSize}</span>
          </div>
          <a className="button primary" href={product.url} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>
            Se hos {product.merchant} <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <div className="product-detail-grid">
        <div>
          <h2>Karaktergrunnlag</h2>
          <div className="grade-breakdown">
            {product.gradeBreakdown.map((item) => (
              <div className="grade-chip" key={item.key}>
                <span className={gradeClass(item.grade)}>{item.grade}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.doseLabel} · {item.points}/{item.maxPoints} poeng</span>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Nøkkeltall</h2>
          <ul className="detail-list">
            <li><strong>Kreatin per dose:</strong> {product.creatinePerServingG} g ({product.creatineForm})</li>
            <li><strong>Porsjon:</strong> {product.servingSize}</li>
            <li><strong>Porsjoner:</strong> {product.servings}</li>
            <li><strong>Pris per g kreatin:</strong> {product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr</li>
            <li><strong>Total kreatin i pakke:</strong> ca. {product.totalCreatineInPackG} g</li>
          </ul>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>{content.doseSection}</p>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{content.priceSection}</p>
        </div>
      </div>

      <div className="strengths-watchouts">
        <div><h3><CheckCircle2 size={18} /> Styrker</h3><ul>{product.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div><h3><AlertTriangle size={18} /> Svakheter</h3><ul>{product.watchouts.map((w) => <li key={w}>{w}</li>)}</ul></div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Relaterte produkter</h2>
          <div className="related-products">
            {related.map((r) => (
              <a key={r.id} href="#" onClick={(e) => { e.preventDefault(); onSelect(r.id) }} className="related-card">
                <strong>{r.name}</strong>
                <span>{r.brand} · {r.score} poeng</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function CreatineMetodeSection() {
  return (
    <section className="grade-system-section">
      <div className="section-heading">
        <span>Kreatin karaktermodell</span>
        <h2>Dose + form + pris per gram</h2>
        <p>{creatineMethodNote}</p>
      </div>
      <div className="rules-table-shell">
        <table className="rules-table">
          <caption>Åpen vekting for kreatin-karakter.</caption>
          <thead><tr><th>Komponent</th><th>Vekt</th><th>Metode</th></tr></thead>
          <tbody>
            {creatineScoringRules.map((rule) => (
              <tr key={rule.label}>
                <td><span style={{ fontWeight: 700 }}>{rule.label}</span></td>
                <td>{rule.weight} poeng</td>
                <td>{rule.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>Regelsettet ligger i <code>creatineScoring.ts</code>. Gummies vurderes ærlig mot effektiv daglig dose — de fleste underdoserer.</p>
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
      <section className="content-section">
        <div className="warning-box" style={{ marginBottom: 20 }}>
          <AlertTriangle size={22} />
          <div>
            <span style={{ fontWeight: 700 }}>Kun ekte produkter — verifisering pågår</span>
            <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.55 }}>
              {vStats.verified}/{vStats.total} kreatinprodukter verifisert mot ekte butikkside (1 produkt per time via automasjon).
              Uverifiserte rader kan ha feil pris/dose. Gummies underdoserer ofte — sjekk daglig dose.
            </p>
          </div>
        </div>
        <div className="section-heading">
          <span>Kreatin best i test</span>
          <h2>Fullstendig rangering</h2>
          <p>Rangert etter kreatindose per porsjon, formkvalitet og pris per gram kreatin. Pulver og gummies i samme motor, med formatfilter.</p>
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
