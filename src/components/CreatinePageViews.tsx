import { CheckCircle2, ExternalLink, AlertTriangle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  creatineMethodNote,
  creatineScoringRules,
  creatineSourceLinks,
} from '../data/creatineScoring'
import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { CREATINE_RANKING_TIEBREAKER_NOTE, CREATINE_RANKING_TIEBREAKER_SHORT } from '../data/rankingNotes'
import { generateCreatineContent } from '../creatineContent'
import {
  applyCreatineFilters,
  buildCreatineBadgeContext,
  defaultCreatineFilters,
  formatCreatineDoping,
  formatCreatineMesh,
  formatCreatinePurity,
  formatCreatineSource,
  generateCreatineProductCopy,
  getCreatineBadges,
  getCreatineDataConfidence,
  parseCreatineFiltersFromSearch,
  creatineFiltersToSearchParams,
  suggestCreatineFilterRelaxations,
  type CreatineBadgeContext,
  type CreatineFilterState,
  CREATINE_BADGE_META,
} from '../data/creatine'
import ProductImage from './ProductImage'
import { MethodRulesCards, MethodBadgeCards } from './MethodRulesDisplay'
import AssessmentDisclaimer from './AssessmentDisclaimer'
import CompareToggle from './CompareToggle'
import ProductCompareBar from './ProductCompareBar'
import { resolveCompareBarItems } from '../compare'
import ProductDataQuality from './ProductDataQuality'
import ProductBadgeList from './ProductBadgeList'
import CreatineQuickFilters from './CreatineQuickFilters'
import ProductTrustStrip from './trust/ProductTrustStrip'
import CreatineFilterBar from './creatine/CreatineFilterBar'
import DataTransparencyPanel from './trust/DataTransparencyPanel'
import { TrustLevelExplainer } from './trust/ProductDataStatus'
import LastUpdatedNotice from './LastUpdatedNotice'
import HubPageBanner from './HubPageBanner'
import { resolveCreatineHubBannerId } from '../data/hubBanners'
import { resolveCreatineTrust } from '../data/trust/resolvers/creatine'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price)

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
  badgeCtx,
  onSelect,
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  products: TestedCreatineProduct[]
  badgeCtx: CreatineBadgeContext
  onSelect: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  return (
    <div className="ranking-cards-mobile" role="list" aria-label="Kreatinrangering">
      {products.map((p) => {
        const copy = generateCreatineProductCopy(p, badgeCtx)
        const badges = getCreatineBadges(p, badgeCtx)
        const data = getCreatineDataConfidence(p)
        const trust = resolveCreatineTrust(p)
        return (
        <article key={p.id} className="ranking-card creatine-ranking-card" role="listitem">
          <button type="button" className="pwo-ranking-card-hit" onClick={() => onSelect(p.id)}>
            <div className="ranking-card-head">
              <span className="rank-badge">#{p.rank}</span>
              <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin" />
              <div className="ranking-card-title">
                <strong>{p.name}</strong>
                <span>{p.brand} · {p.formLabel}</span>
                <ProductBadgeList badges={badges} compact />
              </div>
              <div className="ranking-card-score">
                <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
                <strong>{p.score}</strong>
              </div>
            </div>
            <dl className="ranking-card-stats creatine-ranking-card-stats">
              <div><dt>Råvare</dt><dd>{formatCreatineSource(p)}</dd></div>
              <div><dt>Renhet</dt><dd>{formatCreatinePurity(p.purityPercent)}</dd></div>
              <div><dt>Mesh</dt><dd>{formatCreatineMesh(p.meshLabel)}</dd></div>
              <div><dt>Dopingtest</dt><dd>{formatCreatineDoping(p)}</dd></div>
              <div><dt>Pris</dt><dd>{p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g</dd></div>
              <div><dt>Dose</dt><dd>{p.servingSize}</dd></div>
              <div><dt>Data</dt><dd>{data.label}</dd></div>
            </dl>
            <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
            <p className="pwo-card-watchout"><strong>Viktig å vite:</strong> {copy.importantToKnow}</p>
          </button>
          <div className="ranking-card-foot">
            <span>{p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin</span>
            <div className="ranking-card-foot-actions">
              {onCompareToggle && compareSelected ? (
                <CompareToggle
                  category="creatine"
                  productId={p.id}
                  selected={compareSelected(p.id)}
                  disabled={compareAtMax}
                  onToggle={(_, id) => onCompareToggle(id)}
                />
              ) : null}
              <ScoreBar score={p.score} />
            </div>
          </div>
        </article>
      )})}
    </div>
  )
}

export function CreatineRankingTable({
  products,
  badgeCtx,
  sortCol,
  sortAsc,
  onSort,
  onSelect,
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  products: TestedCreatineProduct[]
  badgeCtx: CreatineBadgeContext
  sortCol: string
  sortAsc: boolean
  onSort: (col: string) => void
  onSelect: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  const arrow = (col: string) => (sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : ' ⇅')

  return (
    <>
      <CreatineMobileRankingCards
        products={products}
        badgeCtx={badgeCtx}
        onSelect={onSelect}
        compareSelected={compareSelected}
        onCompareToggle={onCompareToggle}
        compareAtMax={compareAtMax}
      />
      <div className="table-shell ranking-table-desktop">
      <table className="ranking-table creatine-ranking-table">
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
            {onCompareToggle ? <th>Samanlikn</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const badges = getCreatineBadges(p, badgeCtx)
            const trust = resolveCreatineTrust(p)
            return (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <td><span className="rank-badge">#{p.rank}</span></td>
              <td className="product-cell">
                <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin fra Kosttest.no" />
                <div>
                  <span className="product-cell-name">{p.name}</span>
                  <span>{p.brand} · {p.formLabel}</span>
                  <ProductBadgeList badges={badges} compact maxVisible={1} />
                </div>
              </td>
              <td><span style={{ fontSize: 12 }}>{formatCreatineSource(p)}</span></td>
              <td><span style={{ fontSize: 12 }}>{formatCreatinePurity(p.purityPercent)}</span></td>
              <td><span style={{ fontSize: 12 }}>{formatCreatineMesh(p.meshLabel)}</span></td>
              <td><span style={{ fontSize: 12 }}>{formatCreatineDoping(p)}</span></td>
              <td><span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr</span></td>
              <td>
                <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
                <strong>{p.score}</strong>
                <ScoreBar score={p.score} />
                <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
              </td>
              {onCompareToggle && compareSelected ? (
                <td>
                  <CompareToggle
                    category="creatine"
                    productId={p.id}
                    selected={compareSelected(p.id)}
                    disabled={compareAtMax}
                    onToggle={(_, id) => onCompareToggle(id)}
                  />
                </td>
              ) : null}
            </tr>
          )})}
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
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  product: TestedCreatineProduct
  onBack: () => void
  onSelect: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  const badgeCtx = useMemo(() => buildCreatineBadgeContext(testedCreatineProducts), [])
  const badges = getCreatineBadges(product, badgeCtx)
  const copy = generateCreatineProductCopy(product, badgeCtx)
  const content = generateCreatineContent(product)
  const related = testedCreatineProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine)
    .slice(0, 4)

  return (
    <section className="content-section">
      <button type="button" className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Tilbake til kreatinrangering</button>
      <AssessmentDisclaimer className="assessment-disclaimer--spaced" category="creatine" />
      <ProductTrustStrip snapshot={resolveCreatineTrust(product)} />
      <div className="review-card">
        <ProductImage name={product.name} brand={product.brand} image={product.image} altSuffix="kreatin fra Kosttest.no" />
        <div className="review-body">
          <div className="review-heading">
            <div>
              <ProductBadgeList badges={badges} />
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
            <span>Renhet: {formatCreatinePurity(product.purityPercent)}</span>
            <span>Mesh: {formatCreatineMesh(product.meshLabel)}</span>
            <span>Dopingtest: {formatCreatineDoping(product)}</span>
            <span>{formatPrice(product.priceNok)} · {product.packageSize}</span>
            <span>{product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin</span>
          </div>
          <div className="product-highlight-row">
            <div><strong>Passer best for:</strong> {copy.bestFor}</div>
            <div><strong>Viktig å vite:</strong> {copy.importantToKnow}</div>
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
          <ProductDataQuality category="creatine" product={product} />
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
          {onCompareToggle && compareSelected ? (
            <div style={{ marginTop: 12 }}>
              <CompareToggle
                category="creatine"
                productId={product.id}
                selected={compareSelected(product.id)}
                disabled={compareAtMax}
                onToggle={(_, id) => onCompareToggle(id)}
              />
            </div>
          ) : null}
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
  const badgeCtx = useMemo(() => buildCreatineBadgeContext(testedCreatineProducts), [])
  const top = testedCreatineProducts.slice(0, 3)

  return (
    <section className="content-section" style={{ paddingTop: 24 }}>
      <div className="top-picks-grid">
        {top.map((p) => {
          const badges = getCreatineBadges(p, badgeCtx)
          return (
            <button key={p.id} type="button" className="top-pick-card" onClick={() => onSelect(p.id)}>
              <span className="test-badge">Test</span>
              <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="kreatin" />
              <span className="top-pick-rank">#{p.rank}</span>
              <strong>{p.brand} {p.name}</strong>
              <span>Score {p.score} · {formatCreatineSource(p)}</span>
              {badges.length ? <ProductBadgeList badges={badges} compact /> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function CreatineMetodeSection() {
  const badgeCards = Object.values(CREATINE_BADGE_META).map((b) => ({
    title: b.title,
    explanation: b.explanation,
    disclaimerText: b.disclaimerText,
  }))

  return (
    <section className="grade-system-section">
      <div className="section-heading section-heading--compact">
        <span>Kreatin karaktermodell</span>
        <h1>Råvare, renhet, mesh og dopingtest — ikke bland sammen</h1>
        <p>{creatineMethodNote}</p>
      </div>
      <div className="hub-duo-grid">
        <div style={{ padding: 16, background: 'var(--paper-strong)', borderRadius: 8, border: '2px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>Poeng- og dokumentasjonsmodell (modell B)</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Produkt blir ikke utelukket fra lista når dokumentasjon mangler. Manglende renhet, mesh eller dopingtest gir
            poengtrekk — uten dokumentasjon kan produktet ikke nå toppscore (100).
          </p>
        </div>
        <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Manglende data</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Vi bruker «Ikke dokumentert», «Ikke oppgitt av produsent», «Ikke funnet i åpne kilder» eller «Venter på
            kontroll» — aldri tomme celler eller em dash. Manglende felt er ikke presentert som dokumentert kvalitet.
          </p>
        </div>
      </div>
      <MethodRulesCards
        caption="Merkevare-kreatin veier tyngst. Dopingtest, renhet og mesh gir poengtrekk når dei mangler."
        rules={creatineScoringRules.map((rule) => ({
          label: rule.label,
          weight: rule.weight,
          note: rule.note,
        }))}
      />
      <div className="section-heading section-heading--compact" style={{ marginTop: 24 }}>
        <span>Merke</span>
        <h2>Kreatinbadger</h2>
        <p>Badger krev dokumenterbare kriterium — t.d. dopingtest-badge bare når minst ett produkt har dokumentert test.</p>
      </div>
      <MethodBadgeCards badges={badgeCards} />
      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>
          Regelsettet ligg i <code>creatineScoring.ts</code>. Vi skil råvare (Creapure m.m.), renhet, mesh og dopingtest
          visuelt og i score — dei blir aldri presentert som sterkare dokumentert enn kjelda tillèt.
        </p>
        <p style={{ marginTop: 12 }}>{CREATINE_RANKING_TIEBREAKER_NOTE}</p>
      </div>
    </section>
  )
}

export function CreatineLeaderboardBlock({
  onSelectProduct,
  onNavigatePath,
  sortCol,
  sortAsc,
  creapureFilter,
  onSort,
  onFilterChange,
  sortedProducts,
  compareSelected,
  onCompareToggle,
  compareAtMax,
  onOpenCompare,
  onClearCompare,
  compareCount = 0,
  compareMax = 3,
  compareIds = [],
  onRemoveCompare,
}: {
  onSelectProduct: (id: string) => void
  onNavigatePath?: (path: string) => void
  sortCol: string
  sortAsc: boolean
  creapureFilter: 'alle' | 'creapure'
  onSort: (col: string) => void
  onFilterChange: (f: 'alle' | 'creapure') => void
  sortedProducts: TestedCreatineProduct[]
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
  onOpenCompare?: () => void
  onClearCompare?: () => void
  compareCount?: number
  compareMax?: number
  compareIds?: string[]
  onRemoveCompare?: (id: string) => void
}) {
  const [filters, setFilters] = useState<CreatineFilterState>(() => {
    const base = defaultCreatineFilters()
    if (typeof window !== 'undefined') {
      return { ...base, ...parseCreatineFiltersFromSearch(new URLSearchParams(window.location.search)) }
    }
    return base
  })

  const syncUrl = useCallback((next: CreatineFilterState) => {
    if (typeof window === 'undefined') return
    const params = creatineFiltersToSearchParams(next)
    const qs = params.toString()
    const path = window.location.pathname
    window.history.replaceState(null, '', qs ? `${path}?${qs}` : path)
  }, [])

  const onAdvancedFilterChange = (next: CreatineFilterState) => {
    setFilters(next)
    syncUrl(next)
  }

  const onResetFilters = () => {
    const base = defaultCreatineFilters()
    setFilters(base)
    syncUrl(base)
  }

  const filteredProducts = useMemo(
    () => applyCreatineFilters(sortedProducts, filters),
    [sortedProducts, filters],
  )

  const badgeCtx = useMemo(() => buildCreatineBadgeContext(testedCreatineProducts), [])
  const relaxTips = suggestCreatineFilterRelaxations(filters)

  const heroTitle =
    creapureFilter === 'creapure' ? 'Creapure kreatin – sammenligning 2026' : 'Kreatin – sammenligning 2026'

  const heroLead = `${testedCreatineProducts.length} kreatinprodukter rangert etter merkevare-kreatin, renhet, mesh og dopingtest — ikke pris. Poengtrekk gis når dokumentasjon mangler; uten oppgitt data kan produktet ikke nå toppscore. ${CREATINE_RANKING_TIEBREAKER_SHORT}`

  return (
    <>
      <HubPageBanner bannerId={resolveCreatineHubBannerId(creapureFilter)} title={heroTitle} />
      <section className="hub-page-hero hub-page-hero--after-banner">
        <p className="lead">{heroLead}</p>
        <LastUpdatedNotice />
      </section>
      <section className="content-section" style={{ paddingTop: 0 }}>
        <CreatineQuickFilters onNavigate={(path) => onNavigatePath?.(path)} />
        <AssessmentDisclaimer category="creatine" />
        <details className="trust-explainer-details">
          <summary>Hva betyr datatillit?</summary>
          <TrustLevelExplainer />
          <p className="trust-hub-link">
            <a href="/hvor-ferske-er-dataene/">Les mer: Hvor ferske er dataene?</a>
          </p>
        </details>
      </section>
      <CreatineTopPicks onSelect={onSelectProduct} />
      <section className="content-section">
        <div className="section-heading">
          <span>Full rangering</span>
          <h2>Alle produkter i testen</h2>
          <p className="section-heading-note">{CREATINE_RANKING_TIEBREAKER_SHORT}</p>
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
        <CreatineFilterBar
          filters={filters}
          onChange={onAdvancedFilterChange}
          onReset={onResetFilters}
          resultCount={filteredProducts.length}
          totalCount={sortedProducts.length}
        />
        {filteredProducts.length === 0 ? (
          <div className="pwo-empty-state" role="status">
            <h3>Ingen produkter matcher filteret</h3>
            <ul>{relaxTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            <button type="button" className="button primary" onClick={onResetFilters}>Nullstill filter</button>
          </div>
        ) : (
          <CreatineRankingTable
            products={filteredProducts}
            badgeCtx={badgeCtx}
            sortCol={sortCol}
            sortAsc={sortAsc}
            onSort={onSort}
            onSelect={onSelectProduct}
            compareSelected={compareSelected}
            onCompareToggle={onCompareToggle}
            compareAtMax={compareAtMax}
          />
        )}
      </section>
      {onOpenCompare && onClearCompare ? (
        <ProductCompareBar
          category="creatine"
          count={compareCount}
          max={compareMax}
          items={resolveCompareBarItems('creatine', compareIds)}
          onCompare={onOpenCompare}
          onClear={onClearCompare}
          onRemove={onRemoveCompare ?? onCompareToggle ?? (() => {})}
        />
      ) : null}
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
