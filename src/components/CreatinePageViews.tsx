import { CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react'
import {
  creatineMethodNote,
  creatineScoringRules,
  creatineSourceLinks,
  hasMeshDisclosure,
  hasPurityDisclosure,
  hasDopingTestDisclosure,
  isBrandedCreatine,
} from '../data/creatineScoring'
import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { RANKING_TIEBREAKER_NOTE, RANKING_TIEBREAKER_SHORT } from '../data/rankingNotes'
import { generateCreatineContent } from '../creatineContent'
import ProductImage from './ProductImage'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price)

const formatPurity = (purityPercent: number | null) =>
  hasPurityDisclosure(purityPercent)
    ? `${purityPercent!.toString().replace('.', ',')} %`
    : '—'

const formatMesh = (meshLabel: string | null) => (hasMeshDisclosure(meshLabel) ? meshLabel! : '—')

const formatCreatineSource = (product: TestedCreatineProduct) =>
  product.creatineBrand ?? (isBrandedCreatine(product) ? 'Merkevare' : 'Generisk')

const formatDoping = (product: TestedCreatineProduct) => {
  if (hasDopingTestDisclosure(product.dopingTestLabel)) return product.dopingTestLabel!
  if (isBrandedCreatine(product)) return 'Merkevare'
  return '—'
}

const formatBreakdownPoints = (points: number, maxPoints: number) => {
  if (points < 0) return `${points.toString().replace('.', ',')} poeng`
  if (maxPoints > 0) return `${points.toString().replace('.', ',')}/${maxPoints} poeng`
  return `${points.toString().replace('.', ',')} poeng`
}

const gradeClass = (grade: GradeLetter | undefined) => `grade-badge grade-${grade ?? 'F'}`

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="scorebar" aria-label={`${score} av 100 poeng`}>
      <span style={{ width: `${score}%` }} />
    </div>
  )
}

function CreatineMobileRankingCards({
  products,
  onSelect,
}: {
  products: TestedCreatineProduct[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="ranking-cards-mobile" role="list" aria-label="Kreatinrangering">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          className="ranking-card"
          onClick={() => onSelect(p.id)}
          role="listitem"
        >
          <div className="ranking-card-head">
            <span className="rank-badge">#{p.rank}</span>
            <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin" />
            <div className="ranking-card-title">
              <strong>{p.name}</strong>
              <span>{p.brand} · {p.formLabel}</span>
              {p.creatineBrand && <span className="ranking-card-tag">{p.creatineBrand}</span>}
            </div>
            <div className="ranking-card-score">
              <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
              <strong>{p.score}</strong>
            </div>
          </div>
          <dl className="ranking-card-stats">
            <div><dt>Råvare</dt><dd>{formatCreatineSource(p)}</dd></div>
            <div><dt>Renhet</dt><dd>{formatPurity(p.purityPercent)}</dd></div>
            <div><dt>Mesh</dt><dd>{formatMesh(p.meshLabel)}</dd></div>
            <div><dt>Dopingtest</dt><dd>{formatDoping(p)}</dd></div>
          </dl>
          <div className="ranking-card-foot">
            <span>{p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin</span>
            <ScoreBar score={p.score} />
          </div>
        </button>
      ))}
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
    <>
      <CreatineMobileRankingCards products={products} onSelect={onSelect} />
      <div className="table-shell ranking-table-desktop">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Produkt</th>
            <th>Råvare</th>
            <th>Renhet</th>
            <th>Mesh</th>
            <th>Dopingtest</th>
            <th onClick={() => onSort('price-g')} style={{ cursor: 'pointer' }}>kr/g kr.{arrow('price-g')}</th>
            <th onClick={() => onSort('score')} style={{ cursor: 'pointer' }}>Poeng{arrow('score')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <td><span className="rank-badge">#{p.rank}</span></td>
              <td className="product-cell">
                <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin fra Kosttest.no" />
                <div>
                  <span>{p.name}</span>
                  <span>{p.brand} · {p.formLabel}</span>
                  {p.creatineBrand && <span style={{ fontSize: 10, color: 'var(--accent)', display: 'block' }}>{p.creatineBrand}</span>}
                </div>
              </td>
              <td><span style={{ fontSize: 12, color: isBrandedCreatine(p) ? 'var(--accent)' : 'var(--muted)' }}>{formatCreatineSource(p)}</span></td>
              <td><span style={{ fontSize: 12, color: hasPurityDisclosure(p.purityPercent) ? 'inherit' : 'var(--muted)' }}>{formatPurity(p.purityPercent)}</span></td>
              <td><span style={{ fontSize: 12, color: hasMeshDisclosure(p.meshLabel) ? 'inherit' : 'var(--muted)' }}>{formatMesh(p.meshLabel)}</span></td>
              <td><span style={{ fontSize: 12, color: hasDopingTestDisclosure(p.dopingTestLabel) ? 'inherit' : isBrandedCreatine(p) ? 'inherit' : 'var(--muted)' }}>{formatDoping(p)}</span></td>
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
    </>
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
  const related = testedCreatineProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine)
    .slice(0, 4)

  return (
    <section className="content-section">
      <button type="button" className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Tilbake til kreatinrangering</button>
      <div className="review-card">
        <ProductImage name={product.name} brand={product.brand} image={product.image} altSuffix="kreatin fra Kosttest.no" />
        <div className="review-body">
          <div className="review-heading">
            <div>
              {product.award && <span className="award">{product.award}</span>}
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
            <span>{product.formLabel}</span>
            <span>Råvare: {formatCreatineSource(product)}</span>
            <span>Renhet: {formatPurity(product.purityPercent)}</span>
            <span>Mesh: {formatMesh(product.meshLabel)}</span>
            <span>Dopingtest: {formatDoping(product)}</span>
            <span>{formatPrice(product.priceNok)} · {product.packageSize}</span>
            <span>{product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin</span>
          </div>
          <div style={{ marginTop: 10, padding: 12, background: 'var(--paper-strong)', borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
            <strong>Kun kvalitet teller.</strong> {creatineMethodNote}
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
                  <span>{item.doseLabel} · {formatBreakdownPoints(item.points, item.maxPoints)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4><CheckCircle2 size={18} /> Vurdering</h4>
              <ul>
                <li><strong>Råvare:</strong> {content.sourceAnalysis}</li>
                <li><strong>Renhet:</strong> {content.purityAnalysis}</li>
                <li><strong>Mesh:</strong> {content.meshAnalysis}</li>
                <li><strong>Dopingtest:</strong> {content.dopingAnalysis}</li>
                <li><strong>Form:</strong> {content.formAnalysis}</li>
                <li><strong>Pris:</strong> {content.priceAnalysis}</li>
                <li><strong>Passer for:</strong> {content.bestFor}</li>
                {product.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4><AlertTriangle size={18} /> Begrensninger</h4>
              <ul>
                {product.watchouts.map((w) => <li key={w}>{w}</li>)}
                <li><strong>Bunnlinje:</strong> {content.bottomLine}</li>
              </ul>
            </div>
          </div>
          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Ofte stilte spørsmål</summary>
            <div style={{ marginTop: 10 }}>
              {content.faq.map((f) => (
                <div key={f.question} style={{ marginBottom: 10 }}>
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
              <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Lignende produkter i testen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {related.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    style={{ border: '1px solid var(--border)', background: 'var(--paper)', borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <ProductImage name={item.name} brand={item.brand} image={item.image} altSuffix="kreatin" />
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 6 }}>{item.brand}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Score {item.score}</span>
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

function CreatineTopPicks({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="content-section" style={{ paddingTop: 24 }}>
      <div className="top-picks-grid">
        {testedCreatineProducts.slice(0, 3).map((p) => (
          <button key={p.id} type="button" className="top-pick-card" onClick={() => onSelect(p.id)}>
            <span className="test-badge">Test</span>
            <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin" />
            <span className="top-pick-rank">#{p.rank}</span>
            <strong>{p.brand} {p.name}</strong>
            <span>Score {p.score} · {p.creatineBrand ?? p.formLabel}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function CreatineMetodeSection() {
  return (
    <section className="grade-system-section">
      <div className="section-heading">
        <span>Kreatin karaktermodell</span>
        <h2>Kvalitet — merkevare, dokumentasjon og dopingtest</h2>
        <p>{creatineMethodNote}</p>
      </div>
      <div className="rules-table-shell">
        <table className="rules-table">
          <caption>Merkevare-kreatin veier tyngst. Generisk mono krever renhet, mesh og dopingtest.</caption>
          <thead><tr><th>Komponent</th><th>Vekt</th><th>Metode</th></tr></thead>
          <tbody>
            {creatineScoringRules.map((rule) => (
              <tr key={rule.label}>
                <td><span style={{ fontWeight: 700 }}>{rule.label}</span><span>{rule.note}</span></td>
                <td>{rule.weight}</td>
                <td>{rule.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="open-method">
        <p>{RANKING_TIEBREAKER_NOTE}</p>
      </div>
    </section>
  )
}

export function CreatineLeaderboardBlock({
  onSelectProduct,
  sortCol,
  sortAsc,
  creapureFilter,
  onSort,
  onFilterChange,
  sortedProducts,
}: {
  onSelectProduct: (id: string) => void
  sortCol: string
  sortAsc: boolean
  creapureFilter: 'alle' | 'creapure'
  onSort: (col: string) => void
  onFilterChange: (f: 'alle' | 'creapure') => void
  sortedProducts: TestedCreatineProduct[]
}) {
  return (
    <>
      <section className="hub-page-hero">
        <p className="test-badge-inline">Test</p>
        <h1>Kreatin best i test 2026</h1>
        <p className="lead">
          {testedCreatineProducts.length} kreatinprodukter rangert etter merkevare-kreatin, dokumentert renhet/mesh og dopingtest — ikke pris.
          Creapure og andre merkevarer scorer høyest; generisk uten test faller kraftig. {RANKING_TIEBREAKER_SHORT}
        </p>
      </section>
      <CreatineTopPicks onSelect={onSelectProduct} />
      <section className="content-section">
        <div className="section-heading">
          <span>Full rangering</span>
          <h2>Alle produkter i testen</h2>
          <p>{RANKING_TIEBREAKER_NOTE}</p>
        </div>
        <div className="filter-bar">
          <span className="filter-label" style={{ fontSize: 11 }}>Filter:</span>
          {(['alle', 'creapure'] as const).map((v) => (
            <button key={v} type="button" className={`toggle-btn ${creapureFilter === v ? 'on' : 'off'}`} onClick={() => onFilterChange(v)}>
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label">{v === 'alle' ? 'Alle' : 'Creapure'}</span>
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
