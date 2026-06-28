import {
  calculatePriceGrade,
  PWO_FORMULA_MAX_POINTS,
  type TestedProduct,
} from '../../data/pwoProducts'
import { buildPwoBadgeContext, calculatePwoValueIndex, generatePwoProductCopy, getPwoBadges } from '../../data/pwo'
import { getPwoRankingDisplay } from '../../data/pwo/dataConfidence'
import { resolvePwoTrust } from '../../data/trust/resolvers/pwo'
import ProductImage from '../ProductImage'
import ScoreLockup from '../ScoreLockup'
import CompareToggle from '../CompareToggle'
import PwoBadgeList from './PwoBadgeList'
import DataTransparencyPanel from '../trust/DataTransparencyPanel'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 2 }).format(price)

function ScoreBar({ product }: { product: TestedProduct }) {
  const pct = Math.round((product.score / PWO_FORMULA_MAX_POINTS) * 100)
  return (
    <div className="scorebar" aria-label={`${product.score} av ${PWO_FORMULA_MAX_POINTS} formelpoeng`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

function caffeineLabel(mg: number | null) {
  if (!mg || mg === 0) return 'Koffeinfri'
  return `${mg} mg koffein`
}

export default function PwoRankingTable({
  products,
  badgeCtx,
  onSelect,
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  products: TestedProduct[]
  badgeCtx: ReturnType<typeof buildPwoBadgeContext>
  onSelect?: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  return (
    <>
      <div className="ranking-cards-mobile" role="list" aria-label="PWO-rangering">
        {products.map((p) => {
          const display = getPwoRankingDisplay(p)
          const copy = generatePwoProductCopy(p, badgeCtx)
          const priceGrade = display.fullyRanked ? calculatePriceGrade(p.pricePerServing) : null
          const valueIndex = display.fullyRanked ? calculatePwoValueIndex(p) : null
          const trust = resolvePwoTrust(p)
          const badges = getPwoBadges(p, badgeCtx)
          const pumpRow = p.gradeBreakdown?.find((g) => g.key === 'lCitrullineEq')

          return (
            <article
              key={p.id}
              className={`ranking-card pwo-ranking-card${display.fullyRanked ? '' : ' pwo-ranking-card--pending'}`}
              role="listitem"
            >
              <button type="button" className="pwo-ranking-card-hit" onClick={() => onSelect?.(p.id)}>
                <div className="ranking-card-head">
                  <span className="rank-badge">{display.fullyRanked ? `#${p.rank}` : '—'}</span>
                  <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="PWO" />
                  <div className="ranking-card-title">
                    <strong>{p.name}</strong>
                    <span>{p.brand}</span>
                    <PwoBadgeList badges={badges} compact />
                  </div>
                  <ScoreLockup
                    grade={display.showFormulaScore ? p.overallGrade : undefined}
                    score={display.showFormulaScore ? p.score : undefined}
                    maxPoints={PWO_FORMULA_MAX_POINTS}
                    compact
                    pendingLabel={display.showFormulaScore ? undefined : display.exclusionNote}
                  />
                </div>
                <dl className="ranking-card-stats pwo-ranking-card-stats">
                  <div><dt>Pris/dose</dt><dd>{formatPrice(p.pricePerServing)}</dd></div>
                  {display.fullyRanked && priceGrade && valueIndex ? (
                    <div><dt>Verdi (ref.)</dt><dd>{priceGrade.grade} · indeks {valueIndex.index}</dd></div>
                  ) : (
                    <div><dt>Status</dt><dd>{display.exclusionNote ?? 'Ufullstendig deklarasjon'}</dd></div>
                  )}
                  <div><dt>Koffein</dt><dd>{caffeineLabel(p.caffeineMg)}</dd></div>
                  {pumpRow ? (
                    <div><dt>Pump</dt><dd>{pumpRow.grade} · {pumpRow.doseLabel}</dd></div>
                  ) : null}
                </dl>
                <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
                <p className="pwo-card-bestfor"><strong>Passer best for:</strong> {copy.bestFor}</p>
                <p className="pwo-card-watchout"><strong>Viktig å vite:</strong> {copy.importantToKnow}</p>
              </button>
              <div className="ranking-card-foot">
                <span>
                  {p.servings ? `${p.servings} fulle doser per boks` : '—'}
                  {p.servingSize ? ` · ${p.servingSize}` : ''}
                </span>
                <div className="ranking-card-foot-actions">
                  {onCompareToggle && compareSelected ? (
                    <CompareToggle
                      category="pwo"
                      productId={p.id}
                      selected={compareSelected(p.id)}
                      disabled={compareAtMax}
                      onToggle={(_, id) => onCompareToggle(id)}
                    />
                  ) : null}
                  <ScoreBar product={p} />
                </div>
              </div>
              <DataTransparencyPanel snapshot={trust} variant="drawer" showFeedback={false} />
            </article>
          )
        })}
      </div>

      <div className="table-shell ranking-table-desktop">
        <table className="ranking-table pwo-ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Produkt</th>
              <th>Formel</th>
              <th>Pris / verdi</th>
              <th>Koffein</th>
              <th>Datatillit</th>
              {onCompareToggle ? <th>Sammenlign</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const display = getPwoRankingDisplay(p)
              const priceGrade = display.fullyRanked ? calculatePriceGrade(p.pricePerServing) : null
              const valueIndex = display.fullyRanked ? calculatePwoValueIndex(p) : null
              const trust = resolvePwoTrust(p)
              const badges = getPwoBadges(p, badgeCtx)
              return (
                <tr
                  key={p.id}
                  className={display.fullyRanked ? undefined : 'ranking-table-row--pending'}
                  onClick={() => onSelect?.(p.id)}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                >
                  <td>
                    <span className={`rank-badge${display.fullyRanked ? '' : ' rank-badge--pending'}`}>
                      {display.fullyRanked ? `#${p.rank}` : '—'}
                    </span>
                  </td>
                  <td className="product-cell">
                    <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="PWO" />
                    <div>
                      <span className="product-cell-name">{p.name}</span>
                      <span>{p.brand}</span>
                      <PwoBadgeList badges={badges} compact maxVisible={1} />
                    </div>
                  </td>
                  <td>
                    <ScoreLockup
                      grade={display.showFormulaScore ? p.overallGrade : undefined}
                      score={display.showFormulaScore ? p.score : undefined}
                      maxPoints={PWO_FORMULA_MAX_POINTS}
                      compact
                      pendingLabel={display.showFormulaScore ? undefined : display.exclusionNote}
                    />
                    {display.showFormulaScore ? <ScoreBar product={p} /> : null}
                  </td>
                  <td>
                    <span style={{ display: 'block', fontWeight: 600 }}>{formatPrice(p.pricePerServing)}/dose</span>
                    {display.fullyRanked && priceGrade && valueIndex ? (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        Verdi {priceGrade.grade} · indeks {valueIndex.index}
                      </span>
                    ) : (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        {display.exclusionNote ?? 'Ufullstendig deklarasjon'}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>{caffeineLabel(p.caffeineMg)}</td>
                  <td style={{ fontSize: 12 }}>
                    <DataTransparencyPanel snapshot={trust} variant="chip" showFeedback={false} />
                  </td>
                  {onCompareToggle && compareSelected ? (
                    <td>
                      <CompareToggle
                        category="pwo"
                        productId={p.id}
                        selected={compareSelected(p.id)}
                        disabled={compareAtMax}
                        onToggle={(_, id) => onCompareToggle(id)}
                      />
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
