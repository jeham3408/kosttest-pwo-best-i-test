import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import type { SupplementCategory, SupplementProductBase } from '../data/testCategories'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price)

const gradeClass = (grade: string | undefined) => `grade-badge grade-${grade ?? 'F'}`

function ScoreBar({ product }: { product: SupplementProductBase }) {
  return (
    <div className="scorebar" aria-label={`${product.score} av 100 poeng`}>
      <span style={{ width: `${product.score}%` }} />
    </div>
  )
}

function ProductImage({ product, altSuffix }: { product: SupplementProductBase; altSuffix: string }) {
  return (
    <div className="product-image">
      <img
        src={product.image}
        alt={`${product.name} – ${altSuffix}`}
        loading="lazy"
        decoding="async"
        width="150"
        height="150"
      />
    </div>
  )
}

function GradeBreakdownList({ breakdown }: { breakdown: SupplementProductBase['gradeBreakdown'] }) {
  if (!breakdown?.length) return null
  return (
    <div className="grade-breakdown" aria-label="Karaktergrunnlag">
      {breakdown.map((item) => (
        <div className="grade-chip" key={item.key}>
          <span className={gradeClass(item.grade)}>{item.grade}</span>
          <div>
            <strong>{item.label}</strong>
            <span>
              {item.doseLabel} · {item.points.toFixed(1).replace('.', ',')}/{item.maxPoints} poeng
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

type SupplementLeaderboardProps = {
  category: SupplementCategory
  sortCol: string
  sortAsc: boolean
  onSort: (col: string) => void
  onSelectProduct: (id: string) => void
}

export function SupplementLeaderboard({
  category,
  sortCol,
  sortAsc,
  onSort,
  onSelectProduct,
}: SupplementLeaderboardProps) {
  const sorted = useMemo(() => {
    const products = [...category.products]
    const cmp = (a: SupplementProductBase, b: SupplementProductBase) => {
      if (sortCol === 'price-asc' || sortCol === 'price-desc') return a.priceNok - b.priceNok
      return (b.score ?? 0) - (a.score ?? 0) || a.priceNok - b.priceNok
    }
    return products.sort((a, b) => (sortAsc ? cmp(b, a) : cmp(a, b))).map((p, i) => ({ ...p, rank: i + 1 }))
  }, [category.products, sortCol, sortAsc])

  const toggleSort = (col: string) => onSort(col)

  return (
    <section className="content-section">
      <div className="section-heading">
        <span>{category.label}</span>
        <h1>{category.heroTitle}</h1>
        <p>{category.heroLead}</p>
        <p className="meta-line" style={{ marginTop: 8 }}>
          Oppdatert {category.lastUpdated} · {category.products.length} produkter · faktasjekket mot butikksider
        </p>
      </div>

      <div className="table-shell">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Produkt</th>
              <th
                className={sortCol.startsWith('price') ? 'sort-active' : ''}
                onClick={() => toggleSort(sortCol === 'price-asc' ? 'price-desc' : 'price-asc')}
                style={{ cursor: 'pointer' }}
              >
                Pris {sortCol === 'price-asc' ? '▲' : sortCol === 'price-desc' ? '▼' : '⇅'}
              </th>
              <th
                className={sortCol === 'score' ? 'sort-active' : ''}
                onClick={() => toggleSort('score')}
                style={{ cursor: 'pointer' }}
              >
                Poeng {sortCol === 'score' ? (sortAsc ? '▲' : '▼') : '⇅'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product) => (
              <tr key={product.id} onClick={() => onSelectProduct(product.id)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="rank-badge">#{product.rank}</span>
                </td>
                <td className="product-cell">
                  <ProductImage product={product} altSuffix={category.label} />
                  <div>
                    <span>{product.name}</span>
                    <span>
                      {product.brand} · {product.award}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                    {formatPrice(product.priceNok)}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                    {formatPrice(product.pricePerServing)}/pors
                  </span>
                </td>
                <td>
                  <span className={gradeClass(product.overallGrade)}>{product.overallGrade}</span>
                  <strong>{product.score}</strong>
                  <ScoreBar product={product} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="open-method" style={{ marginTop: 24 }}>
        <h3>Metode for {category.label.toLowerCase()}</h3>
        <p>{category.methodSummary}</p>
      </div>
    </section>
  )
}

type SupplementProductPageProps = {
  category: SupplementCategory
  product: SupplementProductBase
  onBack: () => void
  onSelectProduct: (id: string) => void
}

export function SupplementProductPage({ category, product, onBack, onSelectProduct }: SupplementProductPageProps) {
  const related = category.products.filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <section className="content-section">
      <button className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Tilbake til {category.label.toLowerCase()}-testen
      </button>
      <div className="review-card" style={{ gridTemplateColumns: '200px 1fr' }}>
        <ProductImage product={product} altSuffix={category.label} />
        <div className="review-body">
          <div className="review-heading">
            <div>
              <span className="award">{product.award}</span>
              <h1 style={{ marginTop: 4, fontSize: 22 }}>
                #{product.rank} {product.name}
              </h1>
              <p>{product.verdict}</p>
            </div>
            <div className="score-lockup">
              <span className={gradeClass(product.overallGrade)}>{product.overallGrade}</span>
              <strong>{product.score}</strong>
              <span>/100</span>
            </div>
          </div>

          <div className="spec-row">
            <span>Pris: {formatPrice(product.priceNok)}</span>
            <span>{product.servings} porsjoner</span>
            <span>{formatPrice(product.pricePerServing)}/pors</span>
            <span>{product.servingSize} pr. dose</span>
          </div>

          <div className="ingredients-list" style={{ marginTop: 10 }}>
            {product.keyIngredients.map((i) => (
              <span key={i}>{i}</span>
            ))}
          </div>

          <GradeBreakdownList breakdown={product.gradeBreakdown} />

          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4>
                <CheckCircle2 size={18} /> Styrker
              </h4>
              <ul>
                {product.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>
                <AlertTriangle size={18} /> Begrensninger
              </h4>
              <ul>
                {product.watchouts.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          <a
            className="source-link"
            href={product.url}
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Kjøp hos {product.merchant} <ExternalLink size={16} />
          </a>

          {related.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Andre produkter i {category.label.toLowerCase()}-testen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {related.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProduct(item.id)}
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--paper)',
                      borderRadius: 8,
                      padding: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <ProductImage product={item} altSuffix={category.label} />
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                      {item.name.split(' ').slice(0, 3).join(' ')}
                    </span>
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

export function SupplementMethodSection({ category }: { category: SupplementCategory }) {
  return (
    <section className="grade-system-section" id="karakter">
      <div className="section-heading">
        <span>Karaktermodell – {category.label}</span>
        <h2>F til A, rekna automatisk</h2>
        <p>{category.methodSummary}</p>
      </div>
      <div className="rules-table-shell">
        <table className="rules-table">
          <caption>Open vekting for {category.label.toLowerCase()}.</caption>
          <thead>
            <tr>
              <th>Kriterium</th>
              <th>Vekt</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            {category.ingredientRules.map((rule) => (
              <tr key={rule.key}>
                <td>
                  <span style={{ fontWeight: 700 }}>{rule.label}</span>
                </td>
                <td>{rule.weight} poeng</td>
                <td>{rule.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
