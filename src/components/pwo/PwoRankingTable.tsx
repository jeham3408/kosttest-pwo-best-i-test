import {
  calculatePriceGrade,
  PWO_FORMULA_MAX_POINTS,
  type TestedProduct,
} from '../../data/pwoProducts'
import { buildPwoBadgeContext, calculatePwoValueIndex, generatePwoProductCopy, getPwoBadges } from '../../data/pwo'
import { isPwoFullyRankable } from '../../data/pwo/dataConfidence'
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
          const ranked = isPwoFullyRankable(p)
          const copy = generatePwoProductCopy(p, badgeCtx)
          const priceGrade = ranked ? calculatePriceGrade(p.pricePerServing) : null
          const valueIndex = ranked ? calculatePwoValueIndex(p) : null
          const trust = resolvePwoTrust(p)
          const badges = getPwoBadges(p, badgeCtx)
          const pumpRow = p.gradeBreakdown?.find((g) => g.key === 'lCitrullineEq')

          return (
            <article
              key={p.id}
              className={`ranking-card pwo-ranking-card${ranked ? '' : ' pwo-ranking-card--pending'}`}
              role="listitem"
            >
              <button type="button" className="pwo-ranking-card-hit" onClick={() => onSelect?.(p.id)}>
                <div className="ranking-card-head">
                  <span className="rank-badge">{ranked ? `#${p.rank}` : 'Venter'}</span>
                  <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="PWO" />
                  <div className="ranking-card-title">
                    <strong>{p.name}</strong>
                    <span>{p.brand}</span>
                    <PwoBadgeList badges={badges} compact />
                  </div>
                  <ScoreLockup
                    grade={ranked ? p.overallGrade : undefined}
                    score={ranked ? p.score : undefined}
                    maxPoints={PWO_FORMULA_MAX_POINTS}
                    compact
                    pendingLabel={ranked ? undefined : 'Venter på kontroll'}
                  />
                </div>
                <dl className="ranking-card-stats pwo-ranking-card-stats">
                  <div><dt>Pris/dose</dt><dd>{formatPrice(p.pricePerServing)}</dd></div>
                  {ranked && priceGrade && valueIndex ? (
                    <div><dt>Verdi (ref.)</dt><dd>{priceGrade.grade} · indeks {valueIndex.index}</dd></div>
                  ) : (
                    <div><dt>Status</dt><dd>Ufullstendig deklarasjon</dd></div>
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
              const ranked = isPwoFullyRankable(p)
              const copy = generatePwoProductCopy(p, badgeCtx)
              const priceGrade = ranked ? calculatePriceGrade(p.pricePerServing) : null
              const valueIndex = ranked ? calculatePwoValueIndex(p) : null
              const trust = resolvePwoTrust(p)
              const badges = getPwoBadges(p, badgeCtx)
              return (
                <tr key={p.id} onClick={() => onSelect?.(p.id)} style={onSelect ? { cursor: 'pointer' } : undefined}>
                  <td><span className="rank-badge">{ranked ? `#${p.rank}` : 'Venter'}</span></td>
                  <td className="product-cell">
                    <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="PWO" />
                    <div>
                      <span>{p.name}</span>
                      <span>{p.brand}</span>
                      <PwoBadgeList badges={badges} compact />
                      <span className="pwo-table-subcopy">{copy.bestFor}</span>
                    </div>
                  </td>
                  <td>
                    <ScoreLockup
                      grade={ranked ? p.overallGrade : undefined}
                      score={ranked ? p.score : undefined}
                      maxPoints={PWO_FORMULA_MAX_POINTS}
                      compact
                      pendingLabel={ranked ? undefined : 'Venter på kontroll'}
                    />
                    {ranked ? <ScoreBar product={p} /> : null}
                  </td>
                  <td>
                    <span style={{ display: 'block', fontWeight: 600 }}>{formatPrice(p.pricePerServing)}/dose</span>
                    {ranked && priceGrade && valueIndex ? (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        Verdi {priceGrade.grade} · indeks {valueIndex.index}
                      </span>
                    ) : (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        Ufullstendig deklarasjon
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>{caffeineLabel(p.caffeineMg)}</td>
                  <td style={{ fontSize: 12 }}>
                    <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
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
