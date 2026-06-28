import { useCallback, useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { testedProducts, sourceLinks } from '../../data/pwoProducts'
import { PWO_RANKING_TIEBREAKER_NOTE, PWO_RANKING_TIEBREAKER_SHORT } from '../../data/rankingNotes'
import { siteStats } from '../../siteStats'
import {
  applyPwoFilters,
  buildPwoBadgeContext,
  defaultPwoFilters,
  parsePwoFiltersFromSearch,
  pwoFiltersToSearchParams,
  suggestPwoFilterRelaxations,
  type PwoFilterState,
} from '../../data/pwo'
import AssessmentDisclaimer from '../AssessmentDisclaimer'
import LastUpdatedNotice from '../LastUpdatedNotice'
import LeaderboardSection from '../../LeaderboardSection'
import ProductCompareBar from '../ProductCompareBar'
import { resolveCompareBarItems } from '../../compare'
import PendingReviewSection from '../trust/PendingReviewSection'
import { TrustLevelExplainer } from '../trust/ProductDataStatus'
import SubmissionPanel from '../SubmissionPanel'
import PwoQuickFilters from '../PwoQuickFilters'
import PwoFilterBar from './PwoFilterBar'
import PwoRankingTable from './PwoRankingTable'
import { kgPrice } from '../../utils/productHelpers'

const enablePwoScan = import.meta.env.VITE_ENABLE_PWO_SCAN === 'true'

type PwoLeaderboardPageProps = {
  sortCol: string
  caffeineFilter: 'alle' | 'med' | 'uten'
  onNavigatePath: (path: string) => void
  onSelectProduct: (id: string) => void
  compareSelected: (id: string) => boolean
  onCompareToggle: (id: string) => void
  compareAtMax: boolean
  compareCount: number
  compareMax: number
  compareIds: string[]
  onRemoveCompare: (id: string) => void
  onOpenCompare: () => void
  onClearCompare: () => void
}

function filtersFromRoute(sortCol: string, caffeineFilter: 'alle' | 'med' | 'uten'): PwoFilterState {
  const base = defaultPwoFilters()
  base.caffeineMode = caffeineFilter
  if (sortCol === 'value') base.preset = 'value'
  if (sortCol === 'nybegynner') base.preset = 'nybegynner'
  if (typeof window !== 'undefined') {
    return { ...base, ...parsePwoFiltersFromSearch(new URLSearchParams(window.location.search)) }
  }
  return base
}

function heroForFilters(filters: PwoFilterState, sortCol: string, caffeineFilter: string) {
  if (filters.preset === 'value' || sortCol === 'value') {
    return {
      title: 'Best verdi PWO 2026',
      lead: `Produkt med formelscore ≥ 34 og verdikarakter A/B. Verdiindeks = 72 % formel + 28 % pris — endrer ikke formelscoren. ${PWO_RANKING_TIEBREAKER_SHORT}`,
    }
  }
  if (filters.preset === 'nybegynner' || sortCol === 'nybegynner') {
    return {
      title: 'Best PWO for nybegynnere 2026',
      lead: `Koffeinfri eller ≤ 200 mg koffein, dokumentert regelsett for nybegynnere. ${PWO_RANKING_TIEBREAKER_SHORT}`,
    }
  }
  if (caffeineFilter === 'uten') {
    return {
      title: 'Best koffeinfri formel 2026',
      lead: `Stim-free PWO rangert etter formelscore — koffein inngår ikke. ${PWO_RANKING_TIEBREAKER_SHORT}`,
    }
  }
  if (sortCol === 'kgprice-asc' || sortCol === 'kgprice-desc') {
    return {
      title: 'Laveste pris per dose – PWO 2026',
      lead: `Sortert på pris per dose. Badge «Laveste pris per dose» krever formelscore ≥ 28 — lav score betyr ikke anbefalt valg. ${PWO_RANKING_TIEBREAKER_SHORT}`,
    }
  }
  return {
    title: 'PWO best formel 2026',
    lead: `${siteStats.pwoTestedCount} pre-workout rangert etter ingredienser og dose — ikke laboratorietest. ${PWO_RANKING_TIEBREAKER_SHORT}`,
  }
}

export default function PwoLeaderboardPage(props: PwoLeaderboardPageProps) {
  return (
    <PwoLeaderboardPageInner
      key={`${props.sortCol}-${props.caffeineFilter}`}
      {...props}
    />
  )
}

function PwoLeaderboardPageInner({
  sortCol,
  caffeineFilter,
  onNavigatePath,
  onSelectProduct,
  compareSelected,
  onCompareToggle,
  compareAtMax,
  compareCount,
  compareMax,
  compareIds,
  onRemoveCompare,
  onOpenCompare,
  onClearCompare,
}: PwoLeaderboardPageProps) {
  const badgeCtx = useMemo(() => buildPwoBadgeContext(testedProducts), [])
  const [filters, setFilters] = useState<PwoFilterState>(() =>
    filtersFromRoute(sortCol, caffeineFilter),
  )

  const syncUrl = useCallback(
    (next: PwoFilterState) => {
      if (typeof window === 'undefined') return
      const params = pwoFiltersToSearchParams(next)
      const qs = params.toString()
      const path = window.location.pathname
      const url = qs ? `${path}?${qs}` : path
      window.history.replaceState(null, '', url)
    },
    [],
  )

  const onFilterChange = (next: PwoFilterState) => {
    setFilters(next)
    syncUrl(next)
  }

  const onReset = () => {
    const base = defaultPwoFilters()
    base.caffeineMode = caffeineFilter
    if (sortCol === 'value') base.preset = 'value'
    if (sortCol === 'nybegynner') base.preset = 'nybegynner'
    setFilters(base)
    syncUrl(base)
  }

  const filteredProducts = useMemo(
    () =>
      applyPwoFilters(testedProducts, filters, {
        excludeBetaAlanine: filters.betaAlanine === 'uten',
      }),
    [filters],
  )

  const hero = heroForFilters(filters, sortCol, caffeineFilter)
  const relaxTips = suggestPwoFilterRelaxations(filters)

  return (
    <>
      <section className="hub-page-hero">
        <p className="test-badge-inline">Deklarasjonsanalyse</p>
        <h1>{hero.title}</h1>
        <p className="lead">{hero.lead}</p>
        <LastUpdatedNotice />
      </section>

      <section className="content-section" style={{ paddingTop: 0 }}>
        <PwoQuickFilters onNavigate={onNavigatePath} />
        <AssessmentDisclaimer category="pwo" />
      </section>

      <section className="content-section trust-hub-section" style={{ paddingTop: 0 }}>
        <details className="trust-explainer-details">
          <summary>Hva betyr datatillit?</summary>
          <TrustLevelExplainer />
          <p className="trust-hub-link">
            <a href="/hvor-ferske-er-dataene/">Les mer: Hvor ferske er dataene?</a>
          </p>
        </details>
      </section>

      <LeaderboardSection kgPrice={kgPrice} onSelectProduct={onSelectProduct} />

      <section className="content-section">
        <div className="section-heading">
          <span>PWO best formel</span>
          <h2>Fullstendig rangering</h2>
          <p className="ranking-sort-note">
            Standard: høyest formelscore først · ved likt: lavest pris per dose · deretter alfabetisk. {PWO_RANKING_TIEBREAKER_NOTE}
          </p>
        </div>

        <PwoFilterBar
          filters={filters}
          onChange={onFilterChange}
          onReset={onReset}
          resultCount={filteredProducts.length}
          totalCount={testedProducts.length}
        />

        {filteredProducts.length === 0 ? (
          <div className="pwo-empty-state" role="status">
            <h3>Ingen produkter matcher filteret</h3>
            <p>Prøv å:</p>
            <ul>
              {relaxTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <button type="button" className="button primary" onClick={onReset}>
              Nullstill filter
            </button>
          </div>
        ) : (
          <PwoRankingTable
            products={filteredProducts}
            badgeCtx={badgeCtx}
            onSelect={onSelectProduct}
            compareSelected={compareSelected}
            onCompareToggle={onCompareToggle}
            compareAtMax={compareAtMax}
          />
        )}
      </section>

      <ProductCompareBar
        category="pwo"
        count={compareCount}
        max={compareMax}
        items={resolveCompareBarItems('pwo', compareIds)}
        onCompare={onOpenCompare}
        onClear={onClearCompare}
        onRemove={onRemoveCompare}
      />
      <PendingReviewSection category="pwo" />
      {enablePwoScan ? <SubmissionPanel /> : null}
      <section className="source-section" id="kilder">
        <div className="section-heading">
          <span>Kilder</span>
          <h2>Åpne kilder</h2>
        </div>
        <ul className="source-list">
          {sourceLinks.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
                <ExternalLink size={15} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
