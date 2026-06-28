import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PROTEIN_RANKING_TIEBREAKER_NOTE, PROTEIN_RANKING_TIEBREAKER_SHORT } from '../data/rankingNotes'
import { formulationNote, iaasVsDiaasExplanation, proteinScoringRules } from '../data/proteinScoring'
import { proteinSourceLinks, testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'
import type { GradeLetter } from '../data/pwoProducts'
import { generateProteinContent } from '../proteinContent'
import { getRelatedProteinProducts } from '../utils/proteinHelpers'
import {
  applyProteinFilters,
  buildProteinBadgeContext,
  defaultProteinFilters,
  DIAAS_ESTIMATE_DISCLAIMER,
  formatProteinKcal,
  generateProteinProductCopy,
  getProteinBadges,
  getProteinDataConfidence,
  getProteinProductModel,
  parseProteinFiltersFromSearch,
  proteinFiltersToSearchParams,
  suggestProteinFilterRelaxations,
  type ProteinBadgeContext,
  type ProteinFilterState,
  PROTEIN_BADGE_META,
} from '../data/protein'
import ProteinLeaderboardSection from './ProteinLeaderboardSection'
import ProductImage from './ProductImage'
import { MethodRulesCards, MethodBadgeCards } from './MethodRulesDisplay'
import AssessmentDisclaimer from './AssessmentDisclaimer'
import LastUpdatedNotice from './LastUpdatedNotice'
import CompareToggle from './CompareToggle'
import ProductCompareBar from './ProductCompareBar'
import { resolveCompareBarItems } from '../compare'
import ProductDataQuality from './ProductDataQuality'
import ProteinVerificationBadge from './protein/ProteinVerificationBadge'
import ProteinQuickFilters from './ProteinQuickFilters'
import ProductBadgeList from './ProductBadgeList'
import ProteinFilterBar from './protein/ProteinFilterBar'
import DataTransparencyPanel from './trust/DataTransparencyPanel'
import PendingReviewSection from './trust/PendingReviewSection'
import ProductTrustStrip from './trust/ProductTrustStrip'
import { TrustLevelExplainer } from './trust/ProductDataStatus'
import { resolveProteinTrust } from '../data/trust/resolvers/protein'

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
  badgeCtx,
  onSelect,
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  products: TestedProteinProduct[]
  badgeCtx: ProteinBadgeContext
  onSelect: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  return (
    <div className="ranking-cards-mobile" role="list" aria-label="Proteinrangering">
      {products.map((p) => {
        const copy = generateProteinProductCopy(p, badgeCtx, products)
        const model = getProteinProductModel(p)
        const diaas = model.diaasStatus
        const data = getProteinDataConfidence(p)
        const badges = getProteinBadges(p, badgeCtx)
        const trust = resolveProteinTrust(p)
        return (
          <article key={p.id} className="ranking-card protein-ranking-card" role="listitem">
            <button type="button" className="pwo-ranking-card-hit" onClick={() => onSelect(p.id)}>
              <div className="ranking-card-head">
                <span className="rank-badge">#{p.rank}</span>
                <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="proteinpulver" />
                <div className="ranking-card-title">
                  <strong>{p.name}</strong>
                  <span>{p.brand} · {p.sourceLabel}</span>
                  <ProteinVerificationBadge productId={p.id} />
                  <ProductBadgeList badges={badges} compact />
                </div>
                <div className="ranking-card-score protein-quality-score">
                  <span className={gradeClass(p.overallGrade)} title="DIAAS-basert kvalitet">{p.overallGrade}</span>
                  <strong>{p.score}</strong>
                  <span className="score-sublabel">DIAAS</span>
                </div>
              </div>
              <dl className="ranking-card-stats protein-ranking-card-stats">
                <div><dt>Proteintype</dt><dd>{model.proteinTypeLabel}</dd></div>
                <div><dt>DIAAS</dt><dd title={diaas.explanation}>{diaas.shortLabel} · {diaas.label}</dd></div>
                <div><dt>Protein/dose</dt><dd>{model.proteinPerServing} g</dd></div>
                <div><dt>Protein/100 g</dt><dd>{model.proteinPer100g} g</dd></div>
                <div><dt>Pris</dt><dd>{model.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g</dd></div>
                <div><dt>Laktose</dt><dd>{model.lactoseLabel}</dd></div>
                <div><dt>Vegan</dt><dd>{model.veganLabel}</dd></div>
                <div><dt>Data</dt><dd>{data.label}</dd></div>
              </dl>
              {diaas.isEstimate ? (
                <p className="protein-estimate-note">{DIAAS_ESTIMATE_DISCLAIMER}</p>
              ) : null}
              <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
              <p className="pwo-card-bestfor"><strong>Passer best for:</strong> {copy.bestFor}</p>
              <p className="pwo-card-watchout"><strong>Viktig å vite:</strong> {copy.importantToKnow}</p>
            </button>
            <div className="ranking-card-foot">
              <span>{formatPrice(p.priceNok)} · {p.packageSize}</span>
              <div className="ranking-card-foot-actions">
                {onCompareToggle && compareSelected ? (
                  <CompareToggle
                    category="protein"
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
        )
      })}
    </div>
  )
}

export function ProteinRankingTable({
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
  products: TestedProteinProduct[]
  badgeCtx: ProteinBadgeContext
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
      <ProteinMobileRankingCards
        products={products}
        badgeCtx={badgeCtx}
        onSelect={onSelect}
        compareSelected={compareSelected}
        onCompareToggle={onCompareToggle}
        compareAtMax={compareAtMax}
      />
      <div className="table-shell ranking-table-desktop">
      <table className="ranking-table protein-ranking-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Produkt</th>
            <th onClick={() => onSort('diaas')} style={{ cursor: 'pointer' }}>DIAAS (kvalitet){arrow('diaas')}</th>
            <th onClick={() => onSort('iaas')} style={{ cursor: 'pointer' }}>IAAS (profil){arrow('iaas')}</th>
            <th onClick={() => onSort('price-protein')} style={{ cursor: 'pointer' }}>Pris kr/g{arrow('price-protein')}</th>
            <th>Data</th>
            {onCompareToggle ? <th>Sammenlign</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const model = getProteinProductModel(p)
            const diaas = model.diaasStatus
            const data = getProteinDataConfidence(p)
            const badges = getProteinBadges(p, badgeCtx)
            const trust = resolveProteinTrust(p)
            return (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
              <td><span className="rank-badge">#{p.rank}</span></td>
              <td className="product-cell">
                <ProductImage name={p.name} brand={p.brand} image={p.image} altSuffix="proteinpulver fra Kosttest.no" />
                <div>
                  <span>{p.name}</span>
                  <span>{p.brand} · {model.proteinTypeLabel}</span>
                  <ProteinVerificationBadge productId={p.id} />
                  <ProductBadgeList badges={badges} compact />
                </div>
              </td>
              <td>
                <span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span>
                <strong style={{ color: 'var(--accent)' }} title={diaas.explanation}>{diaas.shortLabel}</strong>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>{diaas.label}</span>
                <ScoreBar score={p.score} />
              </td>
              <td><span style={{ color: 'var(--muted)' }}>{p.iaasScore}</span></td>
              <td><span style={{ fontSize: 11 }}>{p.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g</span></td>
              <td style={{ fontSize: 12 }}>
                <DataTransparencyPanel snapshot={trust} variant="compact" showFeedback={false} />
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>{data.label}</span>
              </td>
              {onCompareToggle && compareSelected ? (
                <td>
                  <CompareToggle
                    category="protein"
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

export function ProteinProductPageView({
  product,
  onBack,
  onSelect,
  compareSelected,
  onCompareToggle,
  compareAtMax,
}: {
  product: TestedProteinProduct
  onBack: () => void
  onSelect: (id: string) => void
  compareSelected?: (id: string) => boolean
  onCompareToggle?: (id: string) => void
  compareAtMax?: boolean
}) {
  const badgeCtx = useMemo(() => buildProteinBadgeContext(testedProteinProducts), [])
  const badges = getProteinBadges(product, badgeCtx)
  const copy = generateProteinProductCopy(product, badgeCtx, testedProteinProducts)
  const model = getProteinProductModel(product)
  const diaas = model.diaasStatus
  const content = generateProteinContent(product)
  const related = getRelatedProteinProducts(product)

  return (
    <section className="content-section">
      <button className="button secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Tilbake til proteinrangering</button>
      <AssessmentDisclaimer className="assessment-disclaimer--spaced" category="protein" />
      <ProductTrustStrip snapshot={resolveProteinTrust(product)} />
      <div className="review-card">
        <ProductImage name={product.name} brand={product.brand} image={product.image} altSuffix="proteinpulver fra Kosttest.no" />
        <div className="review-body">
          <div className="review-heading">
            <div>
              <ProductBadgeList badges={badges} />
              <ProteinVerificationBadge productId={product.id} />
              <h1 style={{ marginTop: 4, fontSize: 22 }}>#{product.rank} {product.name}</h1>
              <p>{content.summary}</p>
            </div>
            <div className="score-lockup protein-quality-score">
              <span className={gradeClass(product.overallGrade)} title="DIAAS-basert kvalitet">{product.overallGrade}</span>
              <strong>{product.score}</strong>
              <span>/100 DIAAS</span>
            </div>
          </div>
          <div className="spec-row protein-spec-split">
            <span><strong>Kvalitet (DIAAS):</strong> {diaas.shortLabel} — {diaas.label}</span>
            <span><strong>IAAS (profil):</strong> {model.iaasValue}</span>
            <span>{model.proteinTypeLabel}</span>
            <span>{model.proteinPer100g} g protein/100 g · {model.proteinPerServing} g/dose</span>
            <span><strong>Pris (referanse):</strong> {model.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein</span>
            <span>{formatPrice(product.priceNok)} · {formatProteinKcal(product)}</span>
            <span><strong>Laktose:</strong> {model.lactoseLabel}</span>
            <span><strong>Vegan:</strong> {model.veganLabel}</span>
            <span><strong>Søtstoff:</strong> {model.sweetenerLabel}</span>
          </div>
          <div style={{ marginTop: 10, padding: 12, background: 'var(--paper-strong)', borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--accent)' }}>Kvalitet ≠ verdi ≠ toleranse.</strong>{' '}
            {diaas.explanation} IAAS ({model.iaasValue}) er forklarende profildata — inngår ikke i scoren. Pris endrer ikke plasseringen.
          </div>
          {diaas.isEstimate ? (
            <p className="protein-estimate-note" style={{ marginTop: 8 }}>{DIAAS_ESTIMATE_DISCLAIMER}</p>
          ) : null}
          <div className="product-highlight-row">
            <div><strong>Passer best for:</strong> {copy.bestFor}</div>
            <div><strong>Viktig å vite:</strong> {copy.importantToKnow}</div>
          </div>
          <div className="product-editorial-block" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55 }}>
            <p style={{ margin: '0 0 8px' }}><strong>Datastatus:</strong> {copy.dataStatus}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Prisvurdering:</strong> {copy.priceAssessment}</p>
            {model.lastVerifiedAt ? (
              <p style={{ margin: 0 }}><strong>Sist kontrollert:</strong> {model.lastVerifiedAt}</p>
            ) : null}
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
          <ProductDataQuality category="protein" product={product} />
          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4><CheckCircle2 size={18} /> Styrker</h4>
              <ul>
                {copy.strengths.length > 0 ? (
                  copy.strengths.map((s) => <li key={s}>{s}</li>)
                ) : (
                  <li>Ingen særskilte styrker utover generell proteintype.</li>
                )}
                <li><strong>DIAAS:</strong> {content.diaasAnalysis}</li>
              </ul>
            </div>
            <div>
              <h4><AlertTriangle size={18} /> Begrensninger</h4>
              <ul>
                {copy.limitations.length > 0 ? (
                  copy.limitations.map((w) => <li key={w}>{w}</li>)
                ) : (
                  <li>Ingen spesielle begrensninger utover pris og individuell toleranse.</li>
                )}
                <li><strong>Passer ikke for:</strong> {content.notFor}</li>
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
          {onCompareToggle && compareSelected ? (
            <div style={{ marginTop: 12 }}>
              <CompareToggle
                category="protein"
                productId={product.id}
                selected={compareSelected(product.id)}
                disabled={compareAtMax}
                onToggle={(_, id) => onCompareToggle(id)}
              />
            </div>
          ) : null}
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
  const badgeCards = Object.values(PROTEIN_BADGE_META).map((b) => ({
    title: b.title,
    explanation: b.explanation,
    disclaimerText: b.disclaimerText,
  }))

  return (
    <section className="grade-system-section">
      <div className="section-heading section-heading--compact">
        <span>Protein karaktermodell</span>
        <h1>Kvalitet, verdi og IAAS — ikke ett samlet «beste»-tall</h1>
        <p>
          <strong>Totalscore bygger bare på DIAAS-basert kvalitet.</strong> Pris per gram protein, smak, toleranse og
          bruksområde visast separat og kan gi badge — men endrer ikke plasseringen i hovudlista.
        </p>
      </div>
      <div className="hub-duo-grid">
        <div style={{ padding: 16, background: 'var(--paper-strong)', borderRadius: 8, border: '2px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--accent)' }}>Proteinkvalitet (DIAAS)</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            DIAAS måler kor godt proteinet kan nyttast i kroppen. {DIAAS_ESTIMATE_DISCLAIMER}
          </p>
        </div>
        <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Verdi (pris per gram protein)</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Pris per gram protein er referansekarakter A–F. Lav pris kan gi «Best budsjett» eller «Best verdi blant whey»,
            men ikke automatisk topplassering når DIAAS-estimatet er lågt.
          </p>
        </div>
      </div>
      <div className="hub-duo-grid" style={{ marginTop: 16 }}>
        <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{iaasVsDiaasExplanation.iaas.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{iaasVsDiaasExplanation.iaas.summary}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
            <strong>Forklaring, ikke score:</strong> {iaasVsDiaasExplanation.iaas.limitation}
          </p>
        </div>
        <div style={{ padding: 16, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{iaasVsDiaasExplanation.diaas.title}</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{iaasVsDiaasExplanation.diaas.summary}</p>
          <p style={{ fontSize: 12, margin: '10px 0 0', lineHeight: 1.5 }}>
            <strong>Hvordan vi bruker det:</strong> {iaasVsDiaasExplanation.diaas.whyBest}
          </p>
        </div>
      </div>
      <div className="section-heading section-heading--compact" style={{ marginTop: 24 }}>
        <span>Scoring</span>
        <h2>Totalscore</h2>
      </div>
      <MethodRulesCards
        caption="Åpen vekting for proteinpulver-karakter — bare DIAAS inngår i scoren."
        rules={proteinScoringRules.map((rule) => ({
          label: rule.label,
          weight: `${rule.weight} poeng`,
          note: rule.note,
        }))}
      />
      <div className="section-heading section-heading--compact" style={{ marginTop: 24 }}>
        <span>Merke</span>
        <h2>Proteinbadger</h2>
        <p>Hver badge har egne kriterier. Høg DIAAS alene avgjer ikke pris- eller bruksorienterte merke.</p>
      </div>
      <MethodBadgeCards
        caption="Badger blir bare tildelt når data støttar kriteriet — t.d. «Best uten søtstoff» bare ved dokumentert søtstofffrihet."
        badges={badgeCards}
      />
      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>
          Regelsettet ligg i <code>proteinScoring.ts</code>. Produkter uten lab-testet DIAAS får estimat basert på
          proteintype. Vi påstår aldri offisiell DIAAS uten dokumentert test av ferdig produkt, og vi skriv ikke som om
          høyere estimat automatisk betyr overlegen muskelvekst.
        </p>
        <p style={{ marginTop: 12 }}>{formulationNote}</p>
        <p style={{ marginTop: 12 }}>{PROTEIN_RANKING_TIEBREAKER_NOTE}</p>
      </div>
    </section>
  )
}

export function ProteinLeaderboardBlock({
  onSelectProduct,
  onNavigatePath,
  sortCol,
  sortAsc,
  proteinFilter,
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
  proteinFilter: 'alle' | 'whey' | 'vegan' | 'kasein'
  onSort: (col: string) => void
  onFilterChange: (f: 'alle' | 'whey' | 'vegan' | 'kasein') => void
  sortedProducts: TestedProteinProduct[]
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
  const [filters, setFilters] = useState<ProteinFilterState>(() => {
    const base = defaultProteinFilters()
    if (typeof window !== 'undefined') {
      return { ...base, ...parseProteinFiltersFromSearch(new URLSearchParams(window.location.search)) }
    }
    return base
  })

  const syncUrl = useCallback((next: ProteinFilterState) => {
    if (typeof window === 'undefined') return
    const params = proteinFiltersToSearchParams(next)
    const qs = params.toString()
    const path = window.location.pathname
    window.history.replaceState(null, '', qs ? `${path}?${qs}` : path)
  }, [])

  const onAdvancedFilterChange = (next: ProteinFilterState) => {
    setFilters(next)
    syncUrl(next)
  }

  const onResetFilters = () => {
    const base = defaultProteinFilters()
    setFilters(base)
    syncUrl(base)
  }

  const filteredProducts = useMemo(
    () => applyProteinFilters(sortedProducts, filters),
    [sortedProducts, filters],
  )

  const badgeCtx = useMemo(() => buildProteinBadgeContext(testedProteinProducts), [])
  const relaxTips = suggestProteinFilterRelaxations(filters)

  const heroTitle =
    proteinFilter === 'vegan'
      ? 'Vegan proteinpulver – sammenligning 2026'
      : proteinFilter === 'kasein'
        ? 'Kaseinprotein – sammenligning 2026'
        : proteinFilter === 'whey'
          ? 'Whey protein – sammenligning 2026'
          : 'Proteinpulver – sammenligning 2026'

  const heroLead =
    proteinFilter === 'vegan'
      ? `${sortedProducts.length} plantebaserte produkter rangert etter DIAAS. Soya og erte/ris-blends — pris påvirker ikke plasseringen. ${PROTEIN_RANKING_TIEBREAKER_SHORT}`
      : proteinFilter === 'kasein'
        ? `Kaseinprotein for langsom frigjøring — rangert etter DIAAS og IAAS. ${PROTEIN_RANKING_TIEBREAKER_SHORT}`
        : 'Rangert etter DIAAS (kvalitet). IAAS vises for sammenligning — pris påvirker ikke plasseringen. ' + PROTEIN_RANKING_TIEBREAKER_SHORT

  return (
    <>
      <section className="hub-page-hero">
        <p className="test-badge-inline">Deklarasjonsanalyse</p>
        <h1>{heroTitle}</h1>
        <p className="lead">{heroLead}</p>
        <LastUpdatedNotice />
      </section>
      <section className="content-section" style={{ paddingTop: 0 }}>
        <ProteinQuickFilters onNavigate={(path) => onNavigatePath?.(path)} />
        <AssessmentDisclaimer category="protein" />
        <details className="trust-explainer-details">
          <summary>Hva betyr datatillit?</summary>
          <TrustLevelExplainer />
          <p className="trust-hub-link">
            <a href="/hvor-ferske-er-dataene/">Les mer: Hvor ferske er dataene?</a>
          </p>
        </details>
      </section>
      <ProteinLeaderboardSection onSelectProduct={onSelectProduct} products={filteredProducts} />
      <section className="content-section">
        <div className="section-heading">
          <span>Proteinpulver – fullstendig rangering</span>
          <h2>Fullstendig rangering</h2>
          <p>
            <strong>Kvalitet (DIAAS)</strong> styrer plasseringen. <strong>IAAS</strong> viser aminosyreprofil.
            <strong> Pris per gram protein</strong> er referanse — ikke score. {DIAAS_ESTIMATE_DISCLAIMER}{' '}
            {PROTEIN_RANKING_TIEBREAKER_NOTE}
          </p>
        </div>
        <div className="filter-bar">
          <span className="filter-label" style={{ fontSize: 11 }}>Type (rute):</span>
          {(['alle', 'whey', 'vegan', 'kasein'] as const).map((v) => (
            <button key={v} type="button" className={`toggle-btn ${proteinFilter === v ? 'on' : 'off'}`} onClick={() => onFilterChange(v)}>
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label">{v === 'alle' ? 'Alle' : v === 'whey' ? 'Whey' : v === 'vegan' ? 'Vegan' : 'Kasein'}</span>
            </button>
          ))}
        </div>
        <ProteinFilterBar
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
          <ProteinRankingTable
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
          category="protein"
          count={compareCount}
          max={compareMax}
          items={resolveCompareBarItems('protein', compareIds)}
          onCompare={onOpenCompare}
          onClear={onClearCompare}
          onRemove={onRemoveCompare ?? onCompareToggle ?? (() => {})}
        />
      ) : null}
      <PendingReviewSection category="protein" />
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

