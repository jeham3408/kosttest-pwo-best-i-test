import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import './App.css'
import JsonLd from './components/JsonLd'
import ProductImage from './components/ProductImage'
import {
  calculatePriceGrade,
  ingredientRules,
  PWO_FORMULA_MAX_POINTS,
  priceRule,
  testedProducts,
  type GradeBreakdown,
  type GradeLetter,
  type TestedProduct,
} from './data/pwoProducts'
import { blogPosts } from './data/blog'
import { generateProductContent } from './productContent'
import { testedProteinProducts } from './data/proteinProducts'
import {
  ProteinLeaderboardBlock,
  ProteinMetodeSection,
  ProteinProductPageView,
} from './components/ProteinPageViews'
import {
  CreatineLeaderboardBlock,
  CreatineMetodeSection,
  CreatineProductPageView,
} from './components/CreatinePageViews'
import HomePage from './components/HomePage'
import SiteHeader from './components/SiteHeader'
import AssessmentDisclaimer from './components/AssessmentDisclaimer'
import ScoreLockup from './components/ScoreLockup'
import ProductDataQuality from './components/ProductDataQuality'
import DataFreshnessPage from './components/trust/DataFreshnessPage'
import OmKosttestPage from './components/OmKosttestPage'
import NotFoundPage from './components/NotFoundPage'
import ProductTrustStrip from './components/trust/ProductTrustStrip'
import { resolvePwoTrust } from './data/trust/resolvers/pwo'
import PwoLeaderboardPage from './components/pwo/PwoLeaderboardPage'
import PwoBadgeList from './components/pwo/PwoBadgeList'
import { buildPwoBadgeContext, getPwoBadges, calculatePwoValueIndex } from './data/pwo'
import { isPwoFullyRankable } from './data/pwo/dataConfidence'
import ProductCompareView from './components/ProductCompareView'
import ProductCompareBar from './components/ProductCompareBar'
import CompareCategoryNotice from './components/compare/CompareCategoryNotice'
import { resolveCompareBarItems } from './compare'
import CompareToggle from './components/CompareToggle'
import { useProductCompare, type CompareCategory } from './hooks/useProductCompare'
import {
  buildCompareUrl,
  pageToCompareCategory,
  parseCompareIdsFromSearch,
  parseCompareRoute,
  trackCompareEvent,
} from './compare'
import { PwoMethodRulesCards, type PwoMethodRuleItem } from './components/MethodRulesDisplay'
import SiteFooter, { KilderPageContent } from './components/SiteFooter'
import { testedCreatineProducts } from './data/creatineProducts'
import { PWO_RANKING_TIEBREAKER_NOTE, SITE_RANKING_TIEBREAKER_SHORT } from './data/rankingNotes'
import { getPageMeta, isCaseinProtein, isVeganProtein, isWheyProtein, normalizePath, parseRoute, routeToPath, type AppPage, type RouteState } from './routing'
import { getRelatedProducts } from './utils/productHelpers'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price)

const gradeClass = (grade: GradeLetter | undefined) => `grade-badge grade-${grade ?? 'F'}`

const gradeScale: Array<{ grade: GradeLetter; label: string; description: string }> = [
  { grade: 'A', label: 'Maks effektiv dose', description: 'Ved eller over øvre effektiv dose.' },
  { grade: 'B', label: 'Nær maks', description: 'Mellom minimum og maks effektiv dose.' },
  { grade: 'C', label: 'Minst effektiv dose', description: 'Treffer nedre effektive dose.' },
  { grade: 'D', label: 'Under effektiv dose', description: 'Halvveis til minimum, men ikke nok.' },
  { grade: 'E', label: 'Svært lavt', description: 'Rundt 25–50 % av minimumsdosen.' },
  { grade: 'F', label: 'Utilstrekkelig', description: 'Mangler eller er under 25 % av minimumsdosen.' },
]

const formatMg = (value: number) => `${Math.round(value).toLocaleString('nb-NO')} mg`

const pwoBadgeCtx = buildPwoBadgeContext(testedProducts)

function GradeBreakdownList({ breakdown }: { breakdown: GradeBreakdown[] | undefined }) {
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

function buildPwoMethodRules(): PwoMethodRuleItem[] {
  const ingredientCards: PwoMethodRuleItem[] = ingredientRules.map((rule) => {
    const bDose = rule.cDoseMg + (rule.aDoseMg - rule.cDoseMg) / 2
    return {
      key: rule.key,
      label: rule.label,
      weight: `${rule.weight} poeng`,
      note: rule.note,
      doses: [
        { grade: 'F fra', value: formatMg(rule.cDoseMg * 0.25) },
        { grade: 'E fra', value: formatMg(rule.cDoseMg * 0.5) },
        { grade: 'C fra', value: formatMg(rule.cDoseMg) },
        { grade: 'B fra', value: formatMg(bDose) },
        { grade: 'A fra', value: formatMg(rule.aDoseMg) },
      ],
    }
  })

  return [
    ...ingredientCards,
    {
      key: 'price',
      label: priceRule.label,
      weight: 'Referanse',
      note: 'Pris per dose påvirker ikke formelscoren. Vi viser pris som egen referansekarakter (A–F) og bruker lavest pris per dose kun som utslagsfaktor når to produkter har lik formelscore.',
      doses: [
        { grade: 'A', value: `≤ ${priceRule.thresholdsNok.A} kr` },
        { grade: 'B', value: `≤ ${priceRule.thresholdsNok.B} kr` },
        { grade: 'C', value: `≤ ${priceRule.thresholdsNok.C} kr` },
        { grade: 'D', value: `≤ ${priceRule.thresholdsNok.D} kr` },
        { grade: 'E', value: `≤ ${priceRule.thresholdsNok.E} kr` },
      ],
    },
    {
      key: 'tiebreak',
      label: 'Lik formelscore',
      weight: 'Rekkefølge',
      note: 'Ved lik formelscore rangeres lavest pris per dose øverst. Pris påvirker ikke poengsummen.',
    },
  ]
}

function GradingSystemSection() {
  return (
    <section className="grade-system-section" id="karakter">
      <div className="section-heading section-heading--compact">
        <span>Karaktermodell</span>
        <h2>F til A, beregnet automatisk</h2>
        <p>
          Hver ingrediens får karakter etter dose. C betyr at produktet treffer minimum
          effektiv dose. A betyr maks effektiv dose. B, D og E beregnes ut fra avstanden mellom
          manglende dose, minimumsdose og maksdose. Formelscoren er summen av ingredienspoeng
          (maks {PWO_FORMULA_MAX_POINTS} poeng).
        </p>
      </div>

      <div className="grade-scale" aria-label="Karakter skala">
        {gradeScale.map((item) => (
          <div className="grade-scale-card" key={item.grade}>
             <span className={gradeClass(item.grade)}>{item.grade}</span>
            <span style={{fontWeight:700}}>{item.label}</span>
            <p>{item.description}</p>
          </div>
        ))}
      </div>

      <PwoMethodRulesCards
        rules={buildPwoMethodRules()}
        caption="Åpen vekting og dosegrenser for PWO-formelscore."
      />

      <div className="open-method">
        <h3>Åpen testmetode</h3>
        <p>
          Regelsettet ligger i kode som <code>ingredientRules</code> og{' '}
          <code>calculateProductGrade</code>. For hver PWO normaliserer vi først citrullinformen,
          legger inn deklarerte mg per full dose, gir F–A per ingrediens, multipliserer med vektingen,
          trekker for svært høy arginindose og sorterer listen etter formelscore.
          Bitter orange (synefrin) står oppført på enkelte etiketter, men gir verken bonus eller trekk.
          Doseringsgrensene er basert på <a href="https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00383-4" target="_blank" rel="noreferrer">ISSN sine retningslinjer</a>.
        </p>
        <p style={{ marginTop: 12 }}>{PWO_RANKING_TIEBREAKER_NOTE}</p>
      </div>
    </section>
  )
}

function App({ initialPath = '/' }: { initialPath?: string }) {
  const initialRoute = parseRoute(initialPath)
  const [page, setPage] = useState<RouteState['page']>(initialRoute.page)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(initialRoute.selectedProduct)
  const [sortCol, setSortCol] = useState(initialRoute.sortCol)
  const [sortAsc, setSortAsc] = useState(initialRoute.sortAsc)
  const [caffeineFilter, setCaffeineFilter] = useState<'alle' | 'med' | 'uten'>(initialRoute.caffeineFilter)
  const [betaFilter, setBetaFilter] = useState<'med' | 'uten'>(initialRoute.betaFilter)
  const compare = useProductCompare()
  const [proteinFilter, setProteinFilter] = useState<'alle' | 'whey' | 'vegan' | 'kasein'>(initialRoute.proteinFilter)
  const [creapureFilter, setCreapureFilter] = useState<'alle' | 'creapure'>(initialRoute.creapureFilter)

  const currentRoute = (): RouteState => ({
    page,
    selectedProduct,
    sortCol,
    sortAsc,
    caffeineFilter,
    betaFilter,
    proteinFilter,
    creapureFilter,
  })

  const applyRoute = (path: string) => {
    const normalized = path.startsWith('/') ? path : `/${path}`
    const qIndex = normalized.indexOf('?')
    const pathname = qIndex >= 0 ? normalized.slice(0, qIndex) : normalized
    const search = qIndex >= 0 ? normalized.slice(qIndex) : ''
    const route = parseRoute(pathname)
    setPage(route.page)
    setSelectedProduct(route.selectedProduct)
    setSortCol(route.sortCol)
    setSortAsc(route.sortAsc)
    setCaffeineFilter(route.caffeineFilter)
    setBetaFilter(route.betaFilter)
    setProteinFilter(route.proteinFilter)
    setCreapureFilter(route.creapureFilter)
    window.history.pushState({}, '', window.location.origin + normalizePath(pathname) + search)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCompare = (category: CompareCategory) => {
    const ids = compare.getIds(category)
    const comparePage =
      category === 'pwo' ? 'compare-pwo' : category === 'protein' ? 'compare-protein' : 'compare-creatine'
    setPage(comparePage)
    const url = buildCompareUrl(category, ids)
    window.history.pushState({}, '', window.location.origin + url)
    trackCompareEvent({ type: 'compare_open', category, productIds: ids })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigate = (nextPage: AppPage, productId: string | null = null) => {
    applyRoute(routeToPath({ ...currentRoute(), page: nextPage, selectedProduct: productId }))
  }

  const toggleProteinSort = (col: string) => {
    if (sortCol === col) { setSortAsc(!sortAsc); return }
    setSortCol(col)
    setSortAsc(col === 'price-protein-asc' || col === 'price-protein')
  }

  const sortedProteinProducts = useMemo(() => {
    let filtered = [...testedProteinProducts]
    if (proteinFilter === 'whey') filtered = filtered.filter((p) => isWheyProtein(p.sourceType))
    if (proteinFilter === 'vegan') filtered = filtered.filter((p) => isVeganProtein(p.sourceType))
    if (proteinFilter === 'kasein') filtered = filtered.filter((p) => isCaseinProtein(p.sourceType))
    const cmp = (a: typeof testedProteinProducts[0], b: typeof testedProteinProducts[0]) => {
      if (sortCol === 'diaas') return b.diaasScore - a.diaasScore || b.score - a.score || a.pricePerGramProtein - b.pricePerGramProtein
      if (sortCol === 'iaas') return b.iaasScore - a.iaasScore || b.score - a.score || a.pricePerGramProtein - b.pricePerGramProtein
      if (sortCol === 'price-protein' || sortCol === 'price-protein-asc') return a.pricePerGramProtein - b.pricePerGramProtein
      return b.score - a.score || a.pricePerGramProtein - b.pricePerGramProtein
    }
    return filtered.sort((a, b) => (sortAsc ? cmp(b, a) : cmp(a, b))).map((p, i) => ({ ...p, rank: i + 1 }))
  }, [sortCol, sortAsc, proteinFilter])

  const toggleCreatineSort = (col: string) => {
    if (sortCol === col) { setSortAsc(!sortAsc); return }
    setSortCol(col)
    setSortAsc(col === 'price-g')
  }

  const sortedCreatineProducts = useMemo(() => {
    let filtered = [...testedCreatineProducts]
    if (creapureFilter === 'creapure') filtered = filtered.filter((p) => p.isCreapure)
    const cmp = (a: typeof testedCreatineProducts[0], b: typeof testedCreatineProducts[0]) => {
      if (sortCol === 'price-g') return a.pricePerGramCreatine - b.pricePerGramCreatine
      return b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine
    }
    return filtered.sort((a, b) => (sortAsc ? cmp(b, a) : cmp(a, b))).map((p, i) => ({ ...p, rank: i + 1 }))
  }, [sortCol, sortAsc, creapureFilter])

  // URL sync on mount
  useEffect(() => {
    const syncFromUrl = () => {
      const compareCategory = parseCompareRoute(window.location.pathname)
      if (compareCategory) {
        const ids = parseCompareIdsFromSearch(window.location.search)
        compare.setIds(compareCategory, ids)
        setPage(
          compareCategory === 'pwo'
            ? 'compare-pwo'
            : compareCategory === 'protein'
              ? 'compare-protein'
              : 'compare-creatine',
        )
        return
      }
      const route = parseRoute(window.location.pathname)
      setPage(route.page)
      setSelectedProduct(route.selectedProduct)
      setSortCol(route.sortCol)
      setSortAsc(route.sortAsc)
      setCaffeineFilter(route.caffeineFilter)
      setBetaFilter(route.betaFilter)
      setProteinFilter(route.proteinFilter)
      setCreapureFilter(route.creapureFilter)
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // URL update on state change — behold filter-paths (vegan, stim-free, osv.)
  useEffect(() => {
    if (page === 'not-found') return
    const compareCategory = pageToCompareCategory(page)
    if (compareCategory) {
      const ids = compare.getIds(compareCategory)
      const target = buildCompareUrl(compareCategory, ids)
      const current = window.location.pathname + window.location.search
      if (current !== target) {
        window.history.replaceState(null, '', window.location.origin + target)
      }
      return
    }
    const target = normalizePath(routeToPath(currentRoute()))
    const current = normalizePath(window.location.pathname)
    if (current === target) return
    window.history.pushState({}, '', window.location.origin + target)
  }, [page, selectedProduct, sortCol, sortAsc, caffeineFilter, betaFilter, proteinFilter, creapureFilter, compare.pwoIds, compare.proteinIds, compare.creatineIds])

  const seoPath =
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : normalizePath(initialPath)

  const pageMeta = useMemo(
    () => getPageMeta({ page, selectedProduct, sortCol, sortAsc, caffeineFilter, betaFilter, proteinFilter, creapureFilter }, seoPath),
    [page, selectedProduct, sortCol, sortAsc, caffeineFilter, betaFilter, proteinFilter, creapureFilter, seoPath],
  )

  useEffect(() => {
    document.title = pageMeta.title

    const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', value)
    }

    setMeta('name', 'description', pageMeta.description)
    setMeta('property', 'og:title', pageMeta.title)
    setMeta('property', 'og:description', pageMeta.description)
    setMeta('property', 'og:url', pageMeta.canonical)
    setMeta('property', 'og:type', pageMeta.ogType)
    setMeta('property', 'og:image', pageMeta.ogImage)
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('name', 'twitter:title', pageMeta.title)
    setMeta('name', 'twitter:description', pageMeta.description)
    setMeta('name', 'twitter:image', pageMeta.ogImage)

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageMeta.canonical

    const setRobots = (content: string | null) => {
      let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
      if (!content) {
        robots?.remove()
        return
      }
      if (!robots) {
        robots = document.createElement('meta')
        robots.name = 'robots'
        document.head.appendChild(robots)
      }
      robots.content = content
    }
    setRobots(pageMeta.robots ?? null)
  }, [pageMeta])

  const ProductPage = ({ product }: { product: TestedProduct }) => {
    const ranked = isPwoFullyRankable(product)
    const content = generateProductContent(product)
    const badges = getPwoBadges(product, pwoBadgeCtx)
    const valueIndex = ranked ? calculatePwoValueIndex(product) : null
    const related = getRelatedProducts(product)
    const priceGrade = ranked ? calculatePriceGrade(product.pricePerServing) : null
    return (
    <section className="content-section">
      <button className="button secondary" onClick={() => { setPage('lb-pwo'); setSelectedProduct(null) }} style={{ marginBottom: 16 }}>← Tilbake til benchmark</button>
      <AssessmentDisclaimer className="assessment-disclaimer--spaced" category="pwo" />
      <ProductTrustStrip snapshot={resolvePwoTrust(product)} />
      <div className="review-card">
        <ProductImage name={product.name} brand={product.brand} image={product.image} altSuffix="PWO fra Kosttest.no" />
        <div className="review-body">
          <div className="review-heading">
            <div>
              <PwoBadgeList badges={badges} />
              <h1 style={{ marginTop: 4, fontSize: 22 }}>
                {ranked ? `#${product.rank} ` : ''}
                {product.name}
              </h1>
              <p>{content.summary}</p>
            </div>
            <div className="score-lockup-wrap">
              <ScoreLockup
                grade={ranked ? product.overallGrade : undefined}
                score={ranked ? product.score : undefined}
                maxPoints={PWO_FORMULA_MAX_POINTS}
                pendingLabel={ranked ? undefined : 'Venter på kontroll'}
              />
            </div>
          </div>
          
          <div className="spec-row">
            <span>Pris/dose: {formatPrice(product.pricePerServing)}</span>
            {ranked && priceGrade && valueIndex ? (
              <span>Verdi (ref.): {priceGrade.grade} · indeks {valueIndex.index}</span>
            ) : (
              <span>Status: Ufullstendig deklarasjon — ikke rangert</span>
            )}
            {product.servings ? (
              <span>{product.servings} fulle doser per boks</span>
            ) : null}
            {product.servingSize ? <span>{product.servingSize}</span> : null}
          </div>

          <div className="product-highlight-row">
            <div><strong>Passer best for:</strong> {content.bestFor}</div>
            <div><strong>Viktig å vite:</strong> {content.importantToKnow}</div>
          </div>

          <div className="product-editorial-block" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.55 }}>
            <p style={{ margin: '0 0 8px' }}><strong>Datastatus:</strong> {content.dataStatus}</p>
            <p style={{ margin: '0 0 8px' }}><strong>Prisvurdering:</strong> {content.priceAssessment}</p>
            <p style={{ margin: 0 }}><strong>Score:</strong> {content.scoreExplanation}</p>
          </div>

          <div className="ingredients-list" style={{ marginTop: 10 }}>
            {product.keyIngredients.map(i => <span key={i}>{i}</span>)}
          </div>

          <GradeBreakdownList breakdown={product.gradeBreakdown} />

          <ProductDataQuality category="pwo" product={product} />

          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4><CheckCircle2 size={18} /> Styrker</h4>
              <ul>
                {content.strengths.length > 0 ? (
                  content.strengths.map((s) => <li key={s}>{s}</li>)
                ) : (
                  <li>Ingen tydelige styrker ut fra tilgjengelig deklarasjon.</li>
                )}
                <li><strong>Pump:</strong> {content.pumpAnalysis}</li>
              </ul>
            </div>
            <div>
              <h4><AlertTriangle size={18} /> Begrensninger</h4>
              <ul>
                {content.limitations.length > 0 ? (
                  content.limitations.map((w) => <li key={w}>{w}</li>)
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

          <div style={{ marginTop: 12 }}>
            <CompareToggle
              category="pwo"
              productId={product.id}
              selected={compare.isSelected('pwo', product.id)}
              disabled={compare.isAtMax('pwo') && !compare.isSelected('pwo', product.id)}
              onToggle={compare.toggle}
            />
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Lignende produkter i testen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {related.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(item.id)
                      setPage('product')
                    }}
                    style={{ border: '1px solid var(--border)', background: 'var(--paper)', borderRadius: 8, padding: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <ProductImage name={item.name} brand={item.brand} image={item.image} altSuffix="PWO fra Kosttest.no" />
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 6 }}>{item.name.split(' ').slice(0, 3).join(' ')}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>Score {item.score}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{marginTop:10,display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--muted)'}}>Del:</span>
            <a href={'https://www.facebook.com/sharer.php?u=https://kosttest.no/pwo/' + product.id + '/'} target="_blank" rel="noreferrer" style={{padding:'3px 8px',background:'#1877F2',color:'#fff',borderRadius:3,fontSize:11,textDecoration:'none'}}>Facebook</a>
            <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(product.name + ' – vurdering og score på Kosttest.no https://kosttest.no/pwo/' + product.id + '/')} target="_blank" rel="noreferrer" style={{padding:'3px 8px',background:'#000',color:'#fff',borderRadius:3,fontSize:11,textDecoration:'none'}}>X</a>
          </div>
        </div>
      </div>
    </section>
    )
  }

  return (
    <>
      <JsonLd
        path={seoPath}
        product={page === 'product' && selectedProduct ? testedProducts.find((p) => p.id === selectedProduct) : undefined}
        proteinProduct={page === 'protein-product' && selectedProduct ? testedProteinProducts.find((p) => p.id === selectedProduct) : undefined}
        creatineProduct={page === 'creatine-product' && selectedProduct ? testedCreatineProducts.find((p) => p.id === selectedProduct) : undefined}
      />
      <SiteHeader
        page={page}
        onNavigate={navigate}
        onNavigatePath={applyRoute}
        compareCount={compare.pwoIds.length + compare.proteinIds.length + compare.creatineIds.length}
        onOpenCompare={() => {
          if (compare.pwoIds.length) openCompare('pwo')
          else if (compare.proteinIds.length) openCompare('protein')
          else if (compare.creatineIds.length) openCompare('creatine')
        }}
      />

      <main id="top">
        {page === 'home' && <HomePage onNavigate={navigate} onNavigatePath={applyRoute} />}

        {page === 'blog' && (
          <section className="content-section">
            <div className="section-heading"><span>Blogg</span><h1>Ingredienser og vitenskap</h1></div>
            <div className="blog-grid">
              {blogPosts.map(post => (
                <button key={post.id} className="blog-card" onClick={() => { setSelectedProduct(post.id); setPage('blog-post') }}>
                  <h3>{post.title}</h3><p>{post.excerpt}</p>
                  <span className="blog-meta">{post.category} · {post.readMinutes} min</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {page === 'blog-post' && selectedProduct && (() => {
          const post = blogPosts.find(p => p.id === selectedProduct)
          if (!post) {
            return (
              <NotFoundPage
                title="Artikkelen finnes ikke"
                description="Blogginnlegget kan være flyttet eller slettet."
                onNavigateHome={() => { setPage('home'); setSelectedProduct(null) }}
                onNavigateTests={() => { setPage('blog'); setSelectedProduct(null) }}
              />
            )
          }
          return (<section className="content-section"><button className="button secondary" onClick={() => setPage('blog')} style={{marginBottom:16}}>← Blogg</button><article><h1>{post.title}</h1><p className="muted" style={{marginTop:-8}}>{post.category} · {post.readMinutes} min · Av Kosttest.no</p>
          {post.category === 'Sammenligning' && post.relatedProducts && (
            <div style={{display:'flex',gap:14,margin:'16px 0',padding:16,background:'var(--paper)',borderRadius:8}}>
              {post.relatedProducts.map(id => {
                const prod = testedProducts.find(p => p.id === id)
                if (!prod) return null
                return <button key={id} onClick={() => { setSelectedProduct(id); setPage('product') }} style={{flex:1,border:'none',background:'var(--bg)',borderRadius:6,padding:10,cursor:'pointer'}}>
                  <img src={prod.image} alt={prod.name} style={{width:'100%',maxWidth:120,height:'auto',display:'block',margin:'0 auto'}} loading="lazy" />
                  <span style={{display:'block',textAlign:'center',fontSize:12,fontWeight:600,marginTop:4}}>{prod.name.split(' ').slice(0,2).join(' ')}</span>
                  <span style={{display:'block',textAlign:'center',fontSize:11,color:'var(--muted)'}}>Score: {prod.score}</span>
                </button>
              })}
            </div>
          )}
          {post.content.map((p, i) => <p key={i} style={{marginTop:14,lineHeight:1.65}}>{p}</p>)}
          {post.relatedProducts && post.relatedProducts.length > 0 && post.category !== 'Sammenligning' && (
            <div style={{marginTop:24,padding:16,background:'var(--paper)',borderRadius:8}}>
              <h3 style={{fontSize:14,margin:'0 0 8px'}}>🔗 Produkter med dette innholdsstoffet</h3>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {post.relatedProducts.map(id => {
                  const prod = testedProducts.find(p => p.id === id)
                  if (!prod) return null
                  return <a key={id} href={'/pwo/' + id + '/'} onClick={(e) => { e.preventDefault(); setSelectedProduct(id); setPage('product') }} style={{padding:'4px 10px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:4,fontSize:12,textDecoration:'none',color:'var(--text)'}}>{prod.name.split(' ').slice(0,2).join(' ')}</a>
                })}
              </div>
            </div>
          )}
          <div style={{marginTop:24,display:'flex',gap:8}}>
            <span style={{fontSize:12,color:'var(--muted)',paddingTop:4}}>Del:</span>
            <a href={'https://www.facebook.com/sharer.php?u=https://kosttest.no/blogg/' + post.slug + '/'} target="_blank" rel="noreferrer" style={{padding:'4px 10px',background:'#1877F2',color:'#fff',borderRadius:4,fontSize:12,textDecoration:'none'}}>Facebook</a>
            <a href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(post.title + ' https://kosttest.no/blogg/' + post.slug + '/')} target="_blank" rel="noreferrer" style={{padding:'4px 10px',background:'#000',color:'#fff',borderRadius:4,fontSize:12,textDecoration:'none'}}>X</a>
          </div>
          </article></section>)
        })()}

        <CompareCategoryNotice message={compare.categoryNotice} onDismiss={compare.dismissNotice} />

        {page === 'lb-pwo' && (
          <PwoLeaderboardPage
            sortCol={sortCol}
            caffeineFilter={caffeineFilter}
            onNavigatePath={applyRoute}
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('product') }}
            compareSelected={(id) => compare.isSelected('pwo', id)}
            onCompareToggle={(id) => compare.toggle('pwo', id)}
            compareAtMax={compare.isAtMax('pwo')}
            compareCount={compare.pwoIds.length}
            compareMax={compare.maxCompare}
            compareIds={compare.pwoIds}
            onRemoveCompare={(id) => compare.remove('pwo', id)}
            onOpenCompare={() => openCompare('pwo')}
            onClearCompare={() => compare.clear('pwo')}
          />
        )}

        {page === 'lb-protein' && (
          <ProteinLeaderboardBlock
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('protein-product') }}
            onNavigatePath={applyRoute}
            sortCol={sortCol}
            sortAsc={sortAsc}
            proteinFilter={proteinFilter}
            onSort={toggleProteinSort}
            onFilterChange={setProteinFilter}
            sortedProducts={sortedProteinProducts}
            compareSelected={(id) => compare.isSelected('protein', id)}
            onCompareToggle={(id) => compare.toggle('protein', id)}
            compareAtMax={compare.isAtMax('protein')}
            onOpenCompare={() => openCompare('protein')}
            onClearCompare={() => compare.clear('protein')}
            compareCount={compare.proteinIds.length}
            compareMax={compare.maxCompare}
            compareIds={compare.proteinIds}
            onRemoveCompare={(id) => compare.remove('protein', id)}
          />
        )}

        {page === 'protein-product' && selectedProduct && (() => {
          const product = testedProteinProducts.find((p) => p.id === selectedProduct)
          if (!product) {
            return (
              <NotFoundPage
                title="Produktet finnes ikke"
                description="Proteinproduktet finnes ikke i databasen vår, eller lenken er utdatert."
                onNavigateHome={() => { setPage('home'); setSelectedProduct(null) }}
                onNavigateTests={() => { setPage('lb-protein'); setSelectedProduct(null) }}
              />
            )
          }
          return (
            <>
              <ProteinProductPageView
                product={product}
                onBack={() => { setPage('lb-protein'); setSelectedProduct(null) }}
                onSelect={(id) => { setSelectedProduct(id); setPage('protein-product') }}
                compareSelected={(id) => compare.isSelected('protein', id)}
                onCompareToggle={(id) => compare.toggle('protein', id)}
                compareAtMax={compare.isAtMax('protein')}
              />
              {compare.proteinIds.length > 0 ? (
                <ProductCompareBar
                  category="protein"
                  count={compare.proteinIds.length}
                  max={compare.maxCompare}
                  items={resolveCompareBarItems('protein', compare.proteinIds)}
                  onCompare={() => openCompare('protein')}
                  onClear={() => compare.clear('protein')}
                  onRemove={(id) => compare.remove('protein', id)}
                />
              ) : null}
            </>
          )
        })()}

        {page === 'protein-metode' && (
          <>
            <div className="page-back-bar">
              <button type="button" className="button secondary" onClick={() => setPage('lb-protein')}>← Proteinrangering</button>
            </div>
            <ProteinMetodeSection />
          </>
        )}

        {page === 'protein-guide' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('lb-protein')} style={{ marginBottom: 16 }}>← Se rangeringen</button>
            <h1>Slik velger du proteinpulver – Kjøpsguide 2026</h1>
            <p className="muted" style={{ fontSize: 13, marginTop: -8 }}>Oppdatert juni 2026</p>
            <div style={{ marginTop: 24 }}>
              <h2>1. Forstå DIAAS og IAAS</h2>
              <p style={{ lineHeight: 1.65 }}>DIAAS (Digestible Indispensable Amino Acid Score) er FAO anbefalt gullstandard — den måler ileal fordøyelighet av essensielle aminosyrer. IAAS sammenligner bare aminosyreprofilen mot WHO-referansen. Vi viser begge, men kun DIAAS styrer totalscore. Offisiell DIAAS krever laboratorietest av ferdig blanding.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>2. Whey vs kasein vs plante</h2>
              <ul style={{ lineHeight: 1.7 }}>
                <li><strong>Whey:</strong> Høyest DIAAS-estimat (typisk 97–109). Best etter trening.</li>
                <li><strong>Kasein:</strong> God DIAAS, langsom frigjøring — kveldsprotein.</li>
                <li><strong>Plante:</strong> Kan teoretisk optimaliseres med mikser (potet, soya, raps), men offisiell DIAAS krever test av ferdig produkt.</li>
              </ul>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>3. Hva teller i scoren?</h2>
              <p style={{ lineHeight: 1.65 }}>Kun DIAAS styrer totalscore. IAAS vises for sammenligning av aminosyreprofil, men inngår ikke i poengberegningen. Pris vises kun som referanse.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="button primary" onClick={() => setPage('lb-protein')}>Se hele proteinrangeringen</button>
            </div>
          </section>
        )}

        {page === 'lb-creatine' && (
          <CreatineLeaderboardBlock
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('creatine-product') }}
            onNavigatePath={applyRoute}
            sortCol={sortCol}
            sortAsc={sortAsc}
            creapureFilter={creapureFilter}
            onSort={toggleCreatineSort}
            onFilterChange={setCreapureFilter}
            sortedProducts={sortedCreatineProducts}
            compareSelected={(id) => compare.isSelected('creatine', id)}
            onCompareToggle={(id) => compare.toggle('creatine', id)}
            compareAtMax={compare.isAtMax('creatine')}
            onOpenCompare={() => openCompare('creatine')}
            onClearCompare={() => compare.clear('creatine')}
            compareCount={compare.creatineIds.length}
            compareMax={compare.maxCompare}
            compareIds={compare.creatineIds}
            onRemoveCompare={(id) => compare.remove('creatine', id)}
          />
        )}

        {page === 'compare-pwo' && (
          <ProductCompareView
            category="pwo"
            ids={compare.pwoIds}
            onBack={() => setPage('lb-pwo')}
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('product') }}
            onRemoveProduct={(id) => compare.remove('pwo', id)}
            onIdsChange={(ids) => compare.setIds('pwo', ids)}
          />
        )}

        {page === 'compare-protein' && (
          <ProductCompareView
            category="protein"
            ids={compare.proteinIds}
            onBack={() => setPage('lb-protein')}
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('protein-product') }}
            onRemoveProduct={(id) => compare.remove('protein', id)}
            onIdsChange={(ids) => compare.setIds('protein', ids)}
          />
        )}

        {page === 'compare-creatine' && (
          <ProductCompareView
            category="creatine"
            ids={compare.creatineIds}
            onBack={() => setPage('lb-creatine')}
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('creatine-product') }}
            onRemoveProduct={(id) => compare.remove('creatine', id)}
            onIdsChange={(ids) => compare.setIds('creatine', ids)}
          />
        )}

        {page === 'creatine-product' && selectedProduct && (() => {
          const product = testedCreatineProducts.find((p) => p.id === selectedProduct)
          if (!product) {
            return (
              <NotFoundPage
                title="Produktet finnes ikke"
                description="Kreatinproduktet finnes ikke i databasen vår, eller lenken er utdatert."
                onNavigateHome={() => { setPage('home'); setSelectedProduct(null) }}
                onNavigateTests={() => { setPage('lb-creatine'); setSelectedProduct(null) }}
              />
            )
          }
          return (
            <>
              <CreatineProductPageView
                product={product}
                onBack={() => { setPage('lb-creatine'); setSelectedProduct(null) }}
                onSelect={(id) => { setSelectedProduct(id); setPage('creatine-product') }}
                compareSelected={(id) => compare.isSelected('creatine', id)}
                onCompareToggle={(id) => compare.toggle('creatine', id)}
                compareAtMax={compare.isAtMax('creatine')}
              />
              {compare.creatineIds.length > 0 ? (
                <ProductCompareBar
                  category="creatine"
                  count={compare.creatineIds.length}
                  max={compare.maxCompare}
                  items={resolveCompareBarItems('creatine', compare.creatineIds)}
                  onCompare={() => openCompare('creatine')}
                  onClear={() => compare.clear('creatine')}
                  onRemove={(id) => compare.remove('creatine', id)}
                />
              ) : null}
            </>
          )
        })()}

        {page === 'creatine-metode' && (
          <>
            <div className="page-back-bar">
              <button type="button" className="button secondary" onClick={() => setPage('lb-creatine')}>← Kreatinrangering</button>
            </div>
            <CreatineMetodeSection />
          </>
        )}

        {page === 'creatine-guide' && (
          <section className="content-section">
            <button type="button" className="button secondary" onClick={() => setPage('lb-creatine')} style={{ marginBottom: 16 }}>← Se rangeringen</button>
            <h1>Slik velger du kreatin – Kjøpsguide 2026</h1>
            <p className="muted" style={{ fontSize: 13, marginTop: -8 }}>Oppdatert juni 2026</p>
            <div style={{ marginTop: 24 }}>
              <h2>1. Velg merkevare-kreatin om du kan</h2>
              <p style={{ lineHeight: 1.65 }}>Creapure® og andre merkevarer har kontrollert råstoff og høyest score hos oss. Produkter uten oppgitt merkevare kan fungere, men krever mer dokumentasjon fra produsenten.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>2. Krev dopingtest — også på Creapure</h2>
              <p style={{ lineHeight: 1.65 }}>Creapure sikrer råstoffkvalitet, men ferdigproduktet må testes separat. Se etter Cologne List®, Informed Sport eller tilsvarende — særlig om du konkurrerer. Vi trekker 15 poeng uten dokumentert produkttest, uansett merkevare.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>3. Daglig inntak</h2>
              <p style={{ lineHeight: 1.65 }}>ISSN anbefaler 3–5 g kreatin monohydrat daglig. Dette er uavhengig av merke og produkt — du doserer etter vekt og rutine, ikke etter hva produsentens skje sier.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>4. Krev renhet og mesh</h2>
              <p style={{ lineHeight: 1.65 }}>Se etter oppgitt renhet (f.eks. 99,9 %) og mesh (partikkelstørrelse). Mangler produsenten dette, trekker vi poeng — «mikronisert» alene er ikke nok.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <h2>5. Pris er ikke alt</h2>
              <p style={{ lineHeight: 1.65 }}>I kreatintesten teller merkevare, renhet, mesh og dopingtest. Pris vises kun som referanse og påvirker ikke plasseringen.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <button type="button" className="button primary" onClick={() => setPage('lb-creatine')}>Se hele kreatinrangeringen</button>
            </div>
          </section>
        )}

        {page === 'product' && selectedProduct && (() => {
          const product = testedProducts.find(p => p.id === selectedProduct)
          if (!product) {
            return (
              <NotFoundPage
                title="Produktet finnes ikke"
                description="PWO-produktet finnes ikke i databasen vår, eller lenken er utdatert."
                onNavigateHome={() => { setPage('home'); setSelectedProduct(null) }}
                onNavigateTests={() => { setPage('lb-pwo'); setSelectedProduct(null) }}
              />
            )
          }
          return (
            <>
              <ProductPage product={product} />
              {compare.pwoIds.length > 0 ? (
                <ProductCompareBar
                  category="pwo"
                  count={compare.pwoIds.length}
                  max={compare.maxCompare}
                  items={resolveCompareBarItems('pwo', compare.pwoIds)}
                  onCompare={() => openCompare('pwo')}
                  onClear={() => compare.clear('pwo')}
                  onRemove={(id) => compare.remove('pwo', id)}
                />
              ) : null}
            </>
          )
        })()}

        {page === 'buying-guide' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('lb-pwo')} style={{marginBottom:16}}>← Se rangeringen</button>
            <h1>Slik velger du riktig PWO – Kjøpsguide 2026</h1>
            <p className="muted" style={{fontSize:13,marginTop:-8}}>Oppdatert juni 2026 · 7 minutters lesing</p>

            <div style={{marginTop:24}}>
              <h2>1. Hva er en PWO?</h2>
              <p style={{lineHeight:1.65}}>PWO (Pre-Workout) er et kosttilskudd du ofte tar før trening. Mange produkter kombinerer stimulanter (koffein), aminosyrer (L-citrulline, beta-alanin) og andre aktive stoffer. Effekt varierer mellom personer — vi vurderer deklarert dose, ikke individuell effekt.</p>
            </div>

            <div style={{marginTop:24}}>
              <h2>2. Se etter disse ingrediensene</h2>
              <div className="hub-duo-grid" style={{ marginTop: 10, marginBottom: 0 }}>
                <div style={{background:'var(--paper)',padding:12,borderRadius:8}}>
                  <strong style={{color:'var(--accent)'}}>L-citrulline</strong>
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>Studeres for pump og blodgjennomstrømning. Se etter 4000–10000 mg deklarert L-citrulline-ekvivalent. Citrulline malate 2:1 gir ~67% reint L-citrulline.</p>
                </div>
                <div style={{background:'var(--paper)',padding:12,borderRadius:8}}>
                  <strong style={{color:'var(--accent)'}}>Beta-alanin</strong>
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>Forsinker melkesyre. Gir prikking i huden. Effekt krever daglig dosering over tid.</p>
                </div>
                <div style={{background:'var(--paper)',padding:12,borderRadius:8}}>
                  <strong>Koffein</strong>
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>100–200 mg for nybegynnere, 200–350 mg for erfarne. Over 400 mg kan gi bivirkninger.</p>
                </div>
                <div style={{background:'var(--paper)',padding:12,borderRadius:8}}>
                  <strong>Arginin / Rødbetekstrakt</strong>
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>NO-boostere i deklarasjonen. Arginin krediteres med halv vekt, rødbetekstrakt med 90% av L-citrulline i vår modell.</p>
                </div>
              </div>
            </div>

            <div style={{marginTop:24}}>
              <h2>3. Velg etter behov</h2>
              <ul style={{lineHeight:1.7}}>
                <li><strong>Maksimal pump:</strong> Velg produkt med 6000–10000 mg L-citrulline-ekvivalent</li>
                <li><strong>Best energi:</strong> 200–300 mg koffein + L-citrulline for synergi</li>
                <li><strong>Kveldstrening:</strong> Velg stim-free (uten koffein)</li>
                <li><strong>Nybegynner:</strong> Start med 100–200 mg koffein og moderat dosering</li>
                <li><strong>Beste verdi:</strong> Sammenlign pris per dose, ikke bare totalpris</li>
              </ul>
            </div>

            <div style={{marginTop:24}}>
              <h2>4. Unngå fellene</h2>
              <ul style={{lineHeight:1.7}}>
                <li><strong>Proprietary blends:</strong> Unngå produkter som ikke oppgir eksakte mengder</li>
                <li><strong>Underdosering:</strong> 500 mg L-citrulline gir lite effekt – se etter minst 3000 mg</li>
                <li><strong>For mye koffein:</strong> Over 400 mg kan gi hjertebank og søvnproblemer</li>
                <li><strong>BCAA-fyll:</strong> BCAA i PWO er unødvendig ved tilstrekkelig proteininntak</li>
              </ul>
            </div>

            <div style={{marginTop:24}}>
              <h2>5. Slik bruker vi testen</h2>
              <p style={{lineHeight:1.65}}>Vår rangering bruker en åpen karaktermotor som vektlegger L-citrulline, arginin, rødbetekstrakt, beta-alanin, betain, taurin, glyserol og elektrolytter. Koffein, kreatin og pris påvirker ikke scoren. Les mer på <a href="/om-metoden/" style={{color:'var(--accent)'}}>Om metoden</a>.</p>
            </div>

            <div style={{marginTop:24}}>
              <button className="button primary" onClick={() => setPage('lb-pwo')} style={{marginRight:10}}>Se hele rangeringen</button>
              <button className="button secondary" onClick={() => setPage('home')}>Til forsiden</button>
            </div>
          </section>
        )}

        {page === 'kilder' && <KilderPageContent />}

        {page === 'not-found' && (
          <NotFoundPage
            onNavigateHome={() => { setPage('home'); setSelectedProduct(null) }}
            onNavigateTests={() => { setPage('lb-pwo'); setSelectedProduct(null) }}
          />
        )}

        {page === 'om-kosttest' && <OmKosttestPage />}

        {page === 'data-freshness' && (
          <DataFreshnessPage onBack={() => setPage('home')} />
        )}

        {page === 'metode' && (
          <section className="content-section">
            <button type="button" className="button secondary" onClick={() => setPage('home')} style={{ marginBottom: 16 }}>← Forside</button>
            <div className="section-heading">
              <span>Metode</span>
              <h1>Slik tester vi kosttilskudd</h1>
              <p>Hver kategori har egen scoring tilpasset produkttypen. PWO vektlegger ingredienser per dose, protein bruker DIAAS, kreatin vektlegger merkevare på råstoff og dokumentasjon — med poengtrekk når data mangler. {SITE_RANKING_TIEBREAKER_SHORT}</p>
            </div>
            <div className="category-grid" style={{ marginBottom: 32 }}>
              <button type="button" className="editorial-card" onClick={() => setPage('metode')}>
                <span className="test-badge">PWO</span>
                <strong>Pre-workout</strong>
                <p>Ingredienser og dose per serving — åpen karaktermotor under.</p>
              </button>
              <button type="button" className="editorial-card" onClick={() => setPage('protein-metode')}>
                <span className="test-badge">Protein</span>
                <strong>DIAAS + IAAS</strong>
                <p>Kun DIAAS styrer score. IAAS for sammenligning.</p>
              </button>
              <button type="button" className="editorial-card" onClick={() => setPage('creatine-metode')}>
                <span className="test-badge test-badge-new">Kreatin</span>
                <strong>Merkevare og dopingtest</strong>
                <p>Creapure scorer høyest på råstoff. Dopingtest, renhet og mesh gir poengtrekk når produsent ikke dokumenterer dem.</p>
              </button>
            </div>
            <GradingSystemSection />
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}

export default App
