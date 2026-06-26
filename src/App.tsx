import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react'
import './App.css'
import JsonLd from './components/JsonLd'
import SubmissionPanel from './components/SubmissionPanel'
import UnrankedProductsSection from './components/UnrankedProductsSection'
import {
  calculateProductGrade,
  ingredientRules,
  lastUpdated,
  priceRule,
  sourceLinks,
  testedProducts,
  type GradeBreakdown,
  type GradeLetter,
  type TestedProduct,
} from './data/pwoProducts'
import { blogPosts } from './data/blog'
import { generateProductContent } from './productContent'
import LeaderboardSection from './LeaderboardSection'
import {
  ProteinLeaderboardBlock,
  ProteinMetodeSection,
  ProteinProductPageView,
} from './components/ProteinPageViews'
import { testedProteinProducts } from './data/proteinProducts'
import { getPageMeta, isCaseinProtein, isVeganProtein, isWheyProtein, normalizePath, parseRoute, type RouteState } from './routing'
import { siteStats } from './siteStats'
import { getRelatedProducts, kgPrice } from './utils/productHelpers'

const enablePwoScan = import.meta.env.VITE_ENABLE_PWO_SCAN === 'true'

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
  { grade: 'D', label: 'Under effektiv dose', description: 'Halvveis til minimum, men ikkje nok.' },
  { grade: 'E', label: 'Svært lavt', description: 'Rundt 25-50% av minimumsdosen.' },
  { grade: 'F', label: 'Tragisk lite', description: 'Manglar eller er under 25% av minimumsdosen.' },
]

const formatMg = (value: number) => `${Math.round(value).toLocaleString('nb-NO')} mg`

function ScoreBar({ product }: { product: TestedProduct }) {
  return (
    <div className="scorebar" aria-label={`${product.score} av 100 poeng`}>
      <span style={{ width: `${product.score}%` }} />
    </div>
  )
}

function ProductImage({ product }: { product: Pick<TestedProduct, 'name' | 'image'> }) {
  return (
    <div className="product-image">
      <img src={product.image} alt={`${product.name} – PWO fra Kosttest.no`} loading="lazy" decoding="async" width="150" height="150" />
    </div>
  )
}

function SortableTh({ label, col, sortCol, sortAsc, onSort }: { label: string; col: string; sortCol: string; sortAsc: boolean; onSort: (c: string) => void }) {
  const isPrice = ['price-asc','price-desc','kgprice-asc','kgprice-desc'].includes(sortCol)
  const active = (col === 'price' && isPrice) || sortCol === col
  const arrow = active ? (sortAsc ? ' ▲' : ' ▼') : ' ⇅'
  let mode = ''
  if (col === 'price' && active) {
    if (sortCol === 'price-asc' || sortCol === 'price-desc') mode = 'krukke'
    else if (sortCol === 'kgprice-asc' || sortCol === 'kgprice-desc') mode = 'kg'
  }
  return <th className={active ? 'sort-active' : ''} onClick={() => onSort(col)} style={{cursor:'pointer', whiteSpace:'nowrap'}}>
    {label}{mode ? <span style={{fontSize:10,fontWeight:400,opacity:0.6,marginLeft:2}}>/{mode}</span> : null}
    <span style={{fontSize:10,marginLeft:2,opacity:0.5}}>{arrow}</span>
  </th>
}

function RankingTable({ products, sortCol, sortAsc, onSort, kgPrice }: { products: TestedProduct[]; sortCol: string; sortAsc: boolean; onSort: (c: string) => void; kgPrice: (p: TestedProduct) => number }) {
  return (
    <div className="table-shell">
      <table className="ranking-table">
        <thead><tr><th>#</th><th>Produkt</th><SortableTh label="Pris" col="price" sortCol={sortCol} sortAsc={sortAsc} onSort={onSort} /><SortableTh label="Poeng" col="score" sortCol={sortCol} sortAsc={sortAsc} onSort={onSort} /></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.id}>
            <td><span className="rank-badge">#{p.rank}</span></td>
            <td className="product-cell"><ProductImage product={p} /><div><span>{p.name}</span><span>{p.brand} · {p.award}</span></div></td>
            <td><span style={{display:'block',fontSize:11,color:'var(--muted)'}}>{'kr ' + p.priceNok}</span><span style={{display:'block',fontSize:11,color:'var(--muted)'}}>{Math.round(kgPrice(p)).toLocaleString('nb-NO')} kr/kg</span></td>
            <td><span className={gradeClass(p.overallGrade)}>{p.overallGrade}</span><strong>{p.score}</strong><ScoreBar product={p} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

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

function GradingSystemSection() {
  return (
    <section className="grade-system-section" id="karakter">
      <div className="section-heading">
        <span>Karaktermodell</span>
        <h2>F til A, rekna automatisk</h2>
        <p>
          Kvar ingrediens får karakter etter dose. C betyr at produktet akkurat treff minimum
          effektiv dose. A betyr maks effektiv dose. B, D og E blir rekna ut frå avstanden mellom
          manglande dose, minimumsdose og maksdose.
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

      <div className="rules-table-shell">
        <table className="rules-table">
          <caption>Open vekting og dosegrenser for PWO-karakter.</caption>
          <thead>
            <tr>
              <th>Ingrediens</th>
              <th>Vekt</th>
              <th>E fra</th>
              <th>D fra</th>
              <th>C fra</th>
              <th>B fra</th>
              <th>A fra</th>
            </tr>
          </thead>
          <tbody>
            {ingredientRules.map((rule) => {
              const bDose = rule.cDoseMg + (rule.aDoseMg - rule.cDoseMg) / 2
              return (
                <tr key={rule.key}>
                  <td>
                    <span style={{fontWeight:700}}>{rule.label}</span>
                    <span>{rule.note}</span>
                  </td>
                  <td>{rule.weight} poeng</td>
                  <td>{formatMg(rule.cDoseMg * 0.25)}</td>
                  <td>{formatMg(rule.cDoseMg * 0.5)}</td>
                  <td>{formatMg(rule.cDoseMg)}</td>
                  <td>{formatMg(bDose)}</td>
                  <td>{formatMg(rule.aDoseMg)}</td>
                </tr>
              )
            })}
            <tr>
              <td>
                <span style={{fontWeight:700}}>{priceRule.label}</span>
                <span>Pris er eigen karakter. Låg pris hjelper, men kan ikkje redde svak formel.</span>
              </td>
              <td>{priceRule.weight} poeng</td>
              <td>≤ {priceRule.thresholdsNok.E} kr</td>
              <td>≤ {priceRule.thresholdsNok.D} kr</td>
              <td>≤ {priceRule.thresholdsNok.C} kr</td>
              <td>≤ {priceRule.thresholdsNok.B} kr</td>
              <td>≤ {priceRule.thresholdsNok.A} kr</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="open-method">
        <h3>Open testmetode</h3>
        <p>
          Regelsettet ligg i kode som <code>ingredientRules</code>, <code>priceRule</code> og{' '}
          <code>calculateProductGrade</code>. For kvar PWO normaliserer vi først citrulline-forma,
          legg inn deklarerte mg per full dose, gir F-A per ingrediens, multipliserer med vektinga,
          trekkjer for svært høg koffein og sorterer lista automatisk etter totalscore.
          Doseringsgrensene er basert på <a href="https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00383-4" target="_blank" rel="noreferrer">ISSN sine retningslinjer</a>.
        </p>
      </div>
    </section>
  )
}

function App({ initialPath = '/' }: { initialPath?: string }) {
  const initialRoute = parseRoute(initialPath)
  const [page, setPage] = useState<RouteState['page']>(initialRoute.page)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(initialRoute.selectedProduct)
  const [lbOpen, setLbOpen] = useState(false)
  const [sortCol, setSortCol] = useState(initialRoute.sortCol)
  const [sortAsc, setSortAsc] = useState(initialRoute.sortAsc)
  const [caffeineFilter, setCaffeineFilter] = useState<'alle' | 'med' | 'uten'>(initialRoute.caffeineFilter)
  const [betaFilter, setBetaFilter] = useState<'med' | 'uten'>(initialRoute.betaFilter)
  const [proteinFilter, setProteinFilter] = useState<'alle' | 'whey' | 'vegan' | 'kasein'>(initialRoute.proteinFilter)

  const toggleSort = (col: string) => {
    if (col === 'price') {
      const cycle = ['price-asc', 'price-desc', 'kgprice-asc', 'kgprice-desc', 'score']
      const cur = ['price-asc','price-desc','kgprice-asc','kgprice-desc'].includes(sortCol) ? sortCol : 'score'
      const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length]
      if (next === 'score') { setSortCol('score'); setSortAsc(false); return }
      setSortCol(next); setSortAsc(next.includes('asc')); return
    }
    if (sortCol === col) { setSortAsc(!sortAsc); return }
    setSortCol(col); setSortAsc(false)
  }

  const sortedProducts = useMemo(() => {
    let filtered = [...testedProducts]
    if (caffeineFilter === 'med') filtered = filtered.filter(p => (p.caffeineMg ?? 0) > 0)
    if (caffeineFilter === 'uten') filtered = filtered.filter(p => !p.caffeineMg || p.caffeineMg === 0)
    if (betaFilter === 'uten') filtered = filtered.map(p => ({ ...p, ...calculateProductGrade(p, { excludeBetaAlanine: true }) }))
    const cmp = (a: TestedProduct, b: TestedProduct) => {
      if (sortCol === 'price-asc' || sortCol === 'price-desc') return a.priceNok - b.priceNok
      if (sortCol === 'kgprice-asc' || sortCol === 'kgprice-desc') return kgPrice(a) - kgPrice(b)
      return (b.score ?? 0) - (a.score ?? 0) || a.priceNok - b.priceNok
    }
    return filtered.sort((a, b) => sortAsc ? cmp(b, a) : cmp(a, b)).map((p, i) => ({ ...p, rank: i + 1 }))
  }, [sortCol, sortAsc, caffeineFilter, betaFilter])

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
      if (sortCol === 'diaas') return b.diaasScore - a.diaasScore
      if (sortCol === 'iaas') return b.iaasScore - a.iaasScore
      if (sortCol === 'price-protein' || sortCol === 'price-protein-asc') return a.pricePerGramProtein - b.pricePerGramProtein
      return b.score - a.score || a.pricePerGramProtein - b.pricePerGramProtein
    }
    return filtered.sort((a, b) => (sortAsc ? cmp(b, a) : cmp(a, b))).map((p, i) => ({ ...p, rank: i + 1 }))
  }, [sortCol, sortAsc, proteinFilter])

  // URL sync on mount
  useEffect(() => {
    const syncFromUrl = () => {
      const route = parseRoute(window.location.pathname)
      setPage(route.page)
      setSelectedProduct(route.selectedProduct)
      setSortCol(route.sortCol)
      setSortAsc(route.sortAsc)
      setCaffeineFilter(route.caffeineFilter)
      setBetaFilter(route.betaFilter)
      setProteinFilter(route.proteinFilter)
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  // URL update on page change
  useEffect(() => {
    const base = window.location.origin
    let url = base + '/'
    if (page === 'lb-pwo') url = base + '/tester/pwo/'
    else if (page === 'lb-protein') url = base + '/tester/protein/'
    else if (page === 'protein-product' && selectedProduct) url = base + '/protein/' + selectedProduct + '/'
    else if (page === 'protein-guide') url = base + '/tester/protein/slik-velger-du/'
    else if (page === 'protein-metode') url = base + '/tester/protein/metode/'
    else if (page === 'blog') url = base + '/blogg/'
    else if (page === 'blog-post' && selectedProduct) url = base + '/blogg/' + selectedProduct + '/'
    else if (page === 'product' && selectedProduct) {
      const p = testedProducts.find(x => x.id === selectedProduct)
      const slug = p ? p.id : selectedProduct
      url = base + '/pwo/' + slug + '/'
    }
    else if (page === 'buying-guide') url = base + '/tester/pwo/slik-velger-du/'
    else if (page === 'metode') url = base + '/om-metoden/'
    window.history.pushState({}, '', url)
  }, [page, selectedProduct])

  const pageMeta = useMemo(
    () => getPageMeta({ page, selectedProduct, sortCol, sortAsc, caffeineFilter, betaFilter, proteinFilter }),
    [page, selectedProduct, sortCol, sortAsc, caffeineFilter, betaFilter, proteinFilter],
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

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageMeta.canonical
  }, [pageMeta])

  const seoPath =
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : normalizePath(initialPath)

  const ProductPage = ({ product }: { product: TestedProduct }) => {
    const content = generateProductContent(product)
    const related = getRelatedProducts(product)
    return (
    <section className="content-section">
      <button className="button secondary" onClick={() => { setPage('lb-pwo'); setSelectedProduct(null) }} style={{ marginBottom: 16 }}>← Tilbake til benchmark</button>
      <div className="review-card" style={{ gridTemplateColumns: '200px 1fr' }}>
        <ProductImage product={product} />
        <div className="review-body">
          <div className="review-heading">
            <div>
              <span className="award">{product.award}</span>
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
            <span>Pris: {formatPrice(product.priceNok)}</span>
            <span>{product.servings} porsjoner</span>
            <span>{formatPrice(product.pricePerServing)}/pors</span>
            <span>{product.servingSize} pr. dose</span>
          </div>

          <div className="ingredients-list" style={{ marginTop: 10 }}>
            {product.keyIngredients.map(i => <span key={i}>{i}</span>)}
          </div>

          <GradeBreakdownList breakdown={product.gradeBreakdown} />

          <div className="pros-cons" style={{ marginTop: 14 }}>
            <div>
              <h4><CheckCircle2 size={18} /> Vurdering</h4>
              <ul>
                <li><strong>Pump:</strong> {content.pumpAnalysis}</li>
                <li><strong>Passer for:</strong> {content.bestFor}</li>
                <li><strong>Passer ikke for:</strong> {content.notFor}</li>
                {product.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4><AlertTriangle size={18} /> Begrensninger</h4>
              <ul>
                {product.watchouts.map(w => <li key={w}>{w}</li>)}
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
                    <ProductImage product={item} />
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
      />
      <header className="site-header">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setPage('home'); setSelectedProduct(null) }} style={{ cursor: 'pointer' }}>
          <span>K</span> Kosttest.no
        </a>
        <nav aria-label="Hovednavigasjon" className="nav-main">
          <a href="/" onClick={(e) => { e.preventDefault(); setPage('home'); setSelectedProduct(null) }} className={page === 'home' ? 'nav-active' : ''}>Forside</a>
          <a href="/blogg/" onClick={(e) => { e.preventDefault(); setPage('blog') }} className={page === 'blog' ? 'nav-active' : ''}>Blogg</a>
          <div className="nav-dropdown" onMouseEnter={() => setLbOpen(true)} onMouseLeave={() => setLbOpen(false)}>
            <button className={'nav-link' + (page === 'lb-pwo' ? ' nav-active' : '')} onClick={() => setLbOpen(!lbOpen)}>PWO ▾</button>
            {lbOpen && <div className="nav-dropdown-menu">
              <a href="/tester/pwo/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setLbOpen(false) }}>PWO best i test</a>
              <a href="/tester/pwo/beste/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setLbOpen(false) }}>Beste PWO</a>
              <a href="/tester/pwo/sterkeste/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setLbOpen(false) }}>Sterkeste PWO</a>
              <a href="/tester/pwo/billigste/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setLbOpen(false) }}>Billigste PWO</a>
              <a href="/tester/pwo/stim-free/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setLbOpen(false) }}>Stim-free</a>
            </div>}
          </div>
          <a href="/tester/protein/" onClick={(e) => { e.preventDefault(); setPage('lb-protein'); setSelectedProduct(null) }} className={page === 'lb-protein' || page === 'protein-product' || page === 'protein-metode' || page === 'protein-guide' ? 'nav-active' : ''}>Protein</a>
          <a href="/tester/pwo/slik-velger-du/" onClick={(e) => { e.preventDefault(); setPage('buying-guide') }}>Kjøpsguide</a>
          <a href="/om-metoden/" onClick={(e) => { e.preventDefault(); setPage('metode') }}>Om metoden</a>
        </nav>
      </header>

      <main id="top">
        {page === 'home' && (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <p className="meta-line">Oppdatert {lastUpdated} · PWO og proteinpulver · ingen sponsede plasseringer</p>
                <h1>PWO og proteinpulver best i test 2026</h1>
                <p className="lead">Vi rangerer pre-workout etter ingredienser og proteinpulver etter DIAAS (primær) og pris per g protein — med IAAS vist for sammenligning. Ærlig, kildeåpen og uten betalte plasseringer.</p>
                <div className="hero-actions">
                  <button className="button primary" onClick={() => setPage('lb-pwo')}><ArrowDown size={18} /> PWO-rangering</button>
                  <button className="button primary" onClick={() => setPage('lb-protein')} style={{ background: 'var(--blue)' }}><ArrowDown size={18} /> Proteinpulver</button>
                  <button className="button secondary" onClick={() => setPage('metode')}><Scale size={18} /> Metoden</button>
                </div>
              </div>
              <div className="hero-board" aria-label="Topp produkter">
                {testedProducts.slice(0, 2).map((product) => (
                  <a className="hero-product" href="#" onClick={(e) => { e.preventDefault(); setSelectedProduct(product.id); setPage('product') }} key={product.id}>
                    <span>PWO #{product.rank}</span>
                    <ProductImage product={product} />
                    <span style={{fontWeight:700}}>{product.name}</span>
                    <small>{product.award}</small>
                  </a>
                ))}
                {testedProteinProducts.slice(0, 1).map((product) => (
                  <a className="hero-product" href="#" onClick={(e) => { e.preventDefault(); setSelectedProduct(product.id); setPage('protein-product') }} key={product.id}>
                    <span>Protein #{product.rank}</span>
                    <img src={product.image} alt={product.name} style={{ width: 80, height: 80, objectFit: 'contain' }} loading="lazy" />
                    <span style={{fontWeight:700}}>{product.brand}</span>
                    <small>DIAAS {product.diaasScore} · IAAS {product.iaasScore}</small>
                  </a>
                ))}
              </div>
            </section>
            <section className="summary-band">
              <div className="summary-grid">
                <div><Search size={21} /> <span style={{fontWeight:700}}>{siteStats.pwoListedCount}</span> PWO kartlagt<br /><span style={{fontSize:12,color:'var(--muted)'}}>{siteStats.pwoTestedCount} rangert</span></div>
                <div><FlaskConical size={21} /> <span style={{fontWeight:700}}>{siteStats.proteinTestedCount}</span> proteinpulver testet<br /><span style={{fontSize:12,color:'var(--muted)'}}>DIAAS + IAAS + pris/g</span></div>
                <div><ShieldCheck size={21} /> Åpen karaktermotor<br /><span style={{fontSize:12,color:'var(--muted)'}}>Ingen sponsede plasseringer</span></div>
              </div>
            </section>
            <section className="content-section intro-grid">
              <div><h2>Kort konklusjon</h2><p>{testedProducts[0].name} vinner med {testedProducts[0].score} poeng, takket være høy dose L-citrulline og beta-alanin. Se hele rangeringen under <a href="/tester/pwo/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo') }}>PWO best i test</a>.</p></div>
              <div className="warning-box"><AlertTriangle size={22} /><div><span style={{fontWeight:700}}>Viktig</span><p>PWO er ikke nødvendig for fremgang. Rådfør deg med helsepersonell ved usikkerhet.</p></div></div>
            </section>
            <section className="content-section" style={{paddingTop:0}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <a href="/blogg/" onClick={(e) => { e.preventDefault(); setPage('blog') }} style={{padding:16,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>📖 Blogg</span>
                  <p style={{fontSize:13,color:'var(--muted)',margin:'4px 0 0'}}>Lær om L-citrulline, beta-alanin, kreatin og alle PWO-ingredienser.</p>
                </a>
                <a href="/tester/pwo/slik-velger-du/" onClick={(e) => { e.preventDefault(); setPage('buying-guide') }} style={{padding:16,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🛒 Kjøpsguide</span>
                  <p style={{fontSize:13,color:'var(--muted)',margin:'4px 0 0'}}>Slik velger du riktig PWO basert på ingredienser og behov.</p>
                </a>
                <a href="/om-metoden/" onClick={(e) => { e.preventDefault(); setPage('metode') }} style={{padding:16,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>⚙️ Metode</span>
                  <p style={{fontSize:13,color:'var(--muted)',margin:'4px 0 0'}}>Åpen karaktermotor – slik regner vi ut poengene.</p>
                </a>
              </div>
            </section>
            <section className="content-section">
              <div className="section-heading"><span>Blogg</span><h2>Siste fra bloggen</h2></div>
              <div className="blog-grid">
                {blogPosts.slice(0, 4).map(post => (
                  <button key={post.id} className="blog-card" onClick={() => { setSelectedProduct(post.id); setPage('blog-post') }}>
                    <h3>{post.title}</h3><p>{post.excerpt}</p>
                    <span className="blog-meta">{post.category} · {post.readMinutes} min</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="content-section">
              <div className="section-heading"><span>Rangeringar</span><h2>Finn din PWO</h2></div>
              <div className="blog-grid">
                <a href="/tester/pwo/beste/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setSortCol('score'); setSortAsc(false); }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🏆 Beste PWO</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>Alle {siteStats.pwoTestedCount} produkter rangert etter score. Klikk for å se topplisten.</p>
                </a>
                <a href="/tester/pwo/stim-free/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setSortCol('score'); setCaffeineFilter('uten'); }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🧘 Stim-free</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>Koffeinfrie alternativ for kveldstrening. Best i test uten koffein.</p>
                </a>
                <a href="/tester/pwo/billigste/" onClick={(e) => { e.preventDefault(); setPage('lb-pwo'); setSortCol('kgprice-asc'); }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>💰 Best verdi</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>Rangert etter pris per kilogram. Mest effekt for pengene.</p>
                </a>
                <a href="/blogg/samanlikning-peveo-sickpump/" onClick={(e) => { e.preventDefault(); setPage('blog-post'); setSelectedProduct('samanlikning-peveo-sickpump'); }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>⚔️ Samanlikningar</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>Peveo Maxed vs NutriTac SickPump. Les våre produktsamanlikningar.</p>
                </a>
              </div>
            </section>
            <section className="content-section">
              <div className="section-heading"><span>Proteinpulver</span><h2>Protein best i test</h2></div>
              <div className="blog-grid">
                <a href="/tester/protein/" onClick={(e) => { e.preventDefault(); setPage('lb-protein') }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🥛 Beste proteinpulver</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>{siteStats.proteinTestedCount} merker — DIAAS primær, IAAS for sammenligning.</p>
                </a>
                <a href="/tester/protein/billigste/" onClick={(e) => { e.preventDefault(); setPage('lb-protein'); setSortCol('price-protein-asc'); setSortAsc(true) }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>💰 Billigst per g protein</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>MyProtein, Bodylab, Protein Series og flere.</p>
                </a>
                <a href="/tester/protein/vegan/" onClick={(e) => { e.preventDefault(); setPage('lb-protein'); setProteinFilter('vegan') }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🌱 Vegan protein</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>Soya og erte/ris — lavere DIAAS-estimat uten lab-test.</p>
                </a>
                <a href="/tester/protein/metode/" onClick={(e) => { e.preventDefault(); setPage('protein-metode') }} style={{padding:12,background:'var(--paper)',borderRadius:8,textDecoration:'none'}}>
                  <span style={{fontWeight:700}}>🧬 DIAAS vs IAAS</span>
                  <p style={{fontSize:12,color:'var(--muted)',margin:'4px 0 0'}}>DIAAS veier i scoren — IAAS viser aminosyreprofil.</p>
                </a>
              </div>
            </section>
            <GradingSystemSection />
          </>
        )}

        {page === 'blog' && (
          <section className="content-section">
            <div className="section-heading"><span>Blogg</span><h2>Ingredienser og vitenskap</h2></div>
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
          if (!post) return null
          return (<section className="content-section"><button className="button secondary" onClick={() => setPage('blog')} style={{marginBottom:16}}>← Blogg</button><article><h1>{post.title}</h1><p className="muted" style={{marginTop:-8}}>{post.category} · {post.readMinutes} min · Av Kosttest.no</p>
          {post.category === 'Samanlikning' && post.relatedProducts && (
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
          {post.relatedProducts && post.relatedProducts.length > 0 && post.category !== 'Samanlikning' && (
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

        {page === 'lb-pwo' && (
          <>
            <LeaderboardSection kgPrice={kgPrice} onSelectProduct={(id) => { setSelectedProduct(id); setPage('product') }} />
            <section className="content-section">
              <div className="section-heading"><span>PWO best i test</span><h2>Fullstendig rangering</h2><p>⇅ Klikk på kolonneoverskrift for å sortere</p></div>
              <div className="filter-bar">
                <span className="filter-label" style={{fontSize:11}}>Koffein:</span>
                {(['alle','med','uten'] as const).map(v => (<button key={v} className={'toggle-btn '+(caffeineFilter===v?'on':'off')} onClick={()=>setCaffeineFilter(v)}><span className="toggle-track"><span className="toggle-thumb"/></span><span className="toggle-label">{v==='alle'?'Alle':v==='med'?'Med':'Uten'}</span></button>))}
                <span className="filter-label" style={{fontSize:11,marginLeft:10}}>Beta-alanin:</span>
                {(['med','uten'] as const).map(v => (<button key={v} className={'toggle-btn '+(betaFilter===v?'on':'off')} onClick={()=>setBetaFilter(v)}><span className="toggle-track"><span className="toggle-thumb"/></span><span className="toggle-label">{v==='med'?'Med':'Uten'}</span></button>))}
              </div>
              <RankingTable products={sortedProducts} sortCol={sortCol} sortAsc={sortAsc} onSort={toggleSort} kgPrice={kgPrice} />
            </section>
            <UnrankedProductsSection />
            {enablePwoScan && <SubmissionPanel />}
            <section className="source-section" id="kilder"><div className="section-heading"><span>Kilder</span><h2>Åpne kilder</h2></div><ul className="source-list">{sourceLinks.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={15} /></a></li>)}</ul></section>
          </>
        )}

        {page === 'lb-protein' && (
          <ProteinLeaderboardBlock
            onSelectProduct={(id) => { setSelectedProduct(id); setPage('protein-product') }}
            sortCol={sortCol}
            sortAsc={sortAsc}
            proteinFilter={proteinFilter}
            onSort={toggleProteinSort}
            onFilterChange={setProteinFilter}
            sortedProducts={sortedProteinProducts}
          />
        )}

        {page === 'protein-product' && selectedProduct && (() => {
          const product = testedProteinProducts.find((p) => p.id === selectedProduct)
          if (!product) return null
          return (
            <ProteinProductPageView
              product={product}
              onBack={() => { setPage('lb-protein'); setSelectedProduct(null) }}
              onSelect={(id) => { setSelectedProduct(id); setPage('protein-product') }}
            />
          )
        })()}

        {page === 'protein-metode' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('lb-protein')} style={{ marginBottom: 16 }}>← Proteinrangering</button>
            <ProteinMetodeSection />
          </section>
        )}

        {page === 'protein-guide' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('lb-protein')} style={{ marginBottom: 16 }}>← Se rangeringen</button>
            <h1>Slik velger du proteinpulver – Kjøpsguide 2026</h1>
            <p className="muted" style={{ fontSize: 13, marginTop: -8 }}>Oppdatert juni 2026</p>
            <div style={{ marginTop: 24 }}>
              <h2>1. Forstå DIAAS og IAAS</h2>
              <p style={{ lineHeight: 1.65 }}>DIAAS (Digestible Indispensable Amino Acid Score) er FAO anbefalt gullstandard — den måler ileal fordøyelighet av essensielle aminosyrer. IAAS sammenligner bare aminosyreprofilen mot WHO-referansen. Vi viser begge, men DIAAS veier 70 % i totalscore. Offisiell DIAAS krever laboratorietest av ferdig blanding.</p>
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
              <p style={{ lineHeight: 1.65 }}>DIAAS (70 %) og pris per g protein (30 %). IAAS vises for sammenligning, men inngår ikke i poengberegningen.</p>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="button primary" onClick={() => setPage('lb-protein')}>Se hele proteinrangeringen</button>
            </div>
          </section>
        )}

        {page === 'product' && selectedProduct && (() => {
          const product = testedProducts.find(p => p.id === selectedProduct)
          if (!product) return null
          return <ProductPage product={product} />
        })()}

        {page === 'buying-guide' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('lb-pwo')} style={{marginBottom:16}}>← Se rangeringen</button>
            <h1>Slik velger du riktig PWO – Kjøpsguide 2026</h1>
            <p className="muted" style={{fontSize:13,marginTop:-8}}>Oppdatert mai 2026 · 7 minutters lesing</p>

            <div style={{marginTop:24}}>
              <h2>1. Hva er en PWO?</h2>
              <p style={{lineHeight:1.65}}>PWO (Pre-Workout) er et kosttilskudd du tar før trening for å øke energi, fokus, utholdenhet og muskelpump. De fleste PWO-er inneholder en blanding av stimulanter (koffein), aminosyrer (L-citrulline, beta-alanin) og andre aktive stoffer.</p>
            </div>

            <div style={{marginTop:24}}>
              <h2>2. Se etter disse ingrediensene</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:10}}>
                <div style={{background:'var(--paper)',padding:12,borderRadius:8}}>
                  <strong style={{color:'var(--accent)'}}>L-citrulline</strong>
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>Viktigste ingrediens for pump. Se etter 4000–10000 mg. Citrulline malate 2:1 gir ~67% reint L-citrulline.</p>
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
                  <p style={{fontSize:13,lineHeight:1.5,margin:'4px 0 0'}}>NO-boostere. Arginin har halv effekt, rødbetekstrakt 90% av L-citrulline.</p>
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

        {page === 'metode' && (
          <section className="content-section">
            <button className="button secondary" onClick={() => setPage('home')} style={{marginBottom:16}}>← Hjem</button>
            <GradingSystemSection />
          </section>
        )}
      </main>
    </>
  )
}

export default App
