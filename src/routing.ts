import { blogPosts } from './data/blog'
import { testedCreatineProducts } from './data/creatineProducts'
import { testedProteinProducts } from './data/proteinProducts'
import { testedProducts } from './data/pwoProducts'
import { siteStats } from './siteStats'

export type AppPage =
  | 'home'
  | 'lb-pwo'
  | 'lb-protein'
  | 'lb-creatine'
  | 'blog'
  | 'blog-post'
  | 'product'
  | 'protein-product'
  | 'creatine-product'
  | 'buying-guide'
  | 'protein-guide'
  | 'creatine-guide'
  | 'metode'
  | 'protein-metode'
  | 'creatine-metode'
  | 'compare-pwo'
  | 'compare-protein'
  | 'compare-creatine'
  | 'kilder'
  | 'om-kosttest'
  | 'data-freshness'
  | 'not-found'

export type RouteState = {
  page: AppPage
  selectedProduct: string | null
  sortCol: string
  sortAsc: boolean
  caffeineFilter: 'alle' | 'med' | 'uten'
  betaFilter: 'med' | 'uten'
  proteinFilter: 'alle' | 'whey' | 'vegan' | 'kasein'
  creapureFilter: 'alle' | 'creapure'
}

export type PageMeta = {
  title: string
  description: string
  canonical: string
  ogType: string
  ogImage: string
  /** noindex for dynamiske sammenlignings-URL-ar */
  robots?: string
}

const SITE = 'https://kosttest.no'
const DEFAULT_OG = `${SITE}/kosttest-open-graph-1200x630.png`

const defaultRoute = (): RouteState => ({
  page: 'home',
  selectedProduct: null,
  sortCol: 'score',
  sortAsc: false,
  caffeineFilter: 'alle',
  betaFilter: 'med',
  proteinFilter: 'alle',
  creapureFilter: 'alle',
})

export function normalizePath(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/'
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function parseRoute(path: string): RouteState {
  const route = normalizePath(path)

  if (route === '/tester/protein/beste' || route === '/tester/protein') {
    return { ...defaultRoute(), page: 'lb-protein', sortCol: 'score', sortAsc: false }
  }
  if (route === '/tester/protein/billigste') {
    return { ...defaultRoute(), page: 'lb-protein', sortCol: 'price-protein-asc', sortAsc: true }
  }
  if (route === '/tester/protein/vegan') {
    return { ...defaultRoute(), page: 'lb-protein', proteinFilter: 'vegan' }
  }
  if (route === '/tester/protein/kasein') {
    return { ...defaultRoute(), page: 'lb-protein', proteinFilter: 'kasein' }
  }
  if (route.startsWith('/tester/protein/slik-velger-du')) {
    return { ...defaultRoute(), page: 'protein-guide' }
  }
  if (route === '/tester/protein/sammenlign' || route === '/tester/protein/samanlikn') {
    return { ...defaultRoute(), page: 'compare-protein' }
  }
  if (route === '/tester/protein/metode' || route === '/om-metoden/protein') {
    return { ...defaultRoute(), page: 'protein-metode' }
  }
  if (route.startsWith('/protein/')) {
    const id = route.replace('/protein/', '')
    return { ...defaultRoute(), page: 'protein-product', selectedProduct: id }
  }

  if (route === '/tester/kreatin/beste' || route === '/tester/kreatin') {
    return { ...defaultRoute(), page: 'lb-creatine', sortCol: 'score', sortAsc: false }
  }
  if (route === '/tester/kreatin/creapure') {
    return { ...defaultRoute(), page: 'lb-creatine', creapureFilter: 'creapure' }
  }
  if (route === '/tester/kreatin/billigste') {
    return { ...defaultRoute(), page: 'lb-creatine', sortCol: 'price-g', sortAsc: true }
  }
  if (route.startsWith('/tester/kreatin/slik-velger-du')) {
    return { ...defaultRoute(), page: 'creatine-guide' }
  }
  if (route === '/tester/kreatin/sammenlign' || route === '/tester/kreatin/samanlikn') {
    return { ...defaultRoute(), page: 'compare-creatine' }
  }
  if (route === '/tester/kreatin/metode') {
    return { ...defaultRoute(), page: 'creatine-metode' }
  }
  if (route.startsWith('/kreatin/')) {
    const id = route.replace('/kreatin/', '')
    return { ...defaultRoute(), page: 'creatine-product', selectedProduct: id }
  }

  if (route === '/tester/pwo/beste' || route === '/tester/pwo' || route === '/tester') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'score', sortAsc: false }
  }
  if (route === '/tester/pwo/sterkeste') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'score', sortAsc: false }
  }
  if (route === '/tester/pwo/billigste') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'kgprice-asc', sortAsc: false }
  }
  if (route === '/tester/pwo/stim-free') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'score', sortAsc: false, caffeineFilter: 'uten' }
  }
  if (route === '/tester/pwo/verdi') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'value', sortAsc: false }
  }
  if (route === '/tester/pwo/nybegynner') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'nybegynner', sortAsc: false }
  }
  if (route.startsWith('/tester/pwo/slik-velger-du')) {
    return { ...defaultRoute(), page: 'buying-guide' }
  }
  if (route === '/tester/pwo/sammenlign' || route === '/tester/pwo/samanlikn') {
    return { ...defaultRoute(), page: 'compare-pwo' }
  }
  if (route.startsWith('/pwo/')) {
    const id = route.replace('/pwo/', '')
    return { ...defaultRoute(), page: 'product', selectedProduct: id }
  }
  if (route === '/blogg') {
    return { ...defaultRoute(), page: 'blog' }
  }
  if (route.startsWith('/blogg/')) {
    let slug = route.replace('/blogg/', '')
    slug = slug.replace(/^samanlikning-/, 'sammenligning-')
    return { ...defaultRoute(), page: 'blog-post', selectedProduct: slug }
  }
  if (route === '/om-metoden' || route === '/metode') {
    return { ...defaultRoute(), page: 'metode' }
  }
  if (route === '/kilder') {
    return { ...defaultRoute(), page: 'kilder' }
  }
  if (route === '/om-kosttest') {
    return { ...defaultRoute(), page: 'om-kosttest' }
  }
  if (route === '/hvor-ferske-er-dataene' || route === '/kor-ferske-er-dataa') {
    return { ...defaultRoute(), page: 'data-freshness' }
  }
  if (route === '/404') {
    return { ...defaultRoute(), page: 'not-found' }
  }

  if (route === '/') {
    return defaultRoute()
  }

  return { ...defaultRoute(), page: 'not-found' }
}

export function getPageMeta(state: RouteState, routePath?: string): PageMeta {
  const path = normalizePath(routePath ?? routeToPath(state))
  const def: PageMeta = {
    title: 'PWO, protein og kreatin — sammenlign etter deklarasjon | Kosttest.no',
    description: `Sammenlign ${siteStats.totalTestedCount} kosttilskudd i Norge med åpen metode. PWO, proteinpulver og kreatin rangert etter publiserte regler — uten betalte plasseringer.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
  }

  if (path === '/' || state.page === 'home') {
    return {
      ...def,
      title: 'Kosttest.no — sammenlign PWO, protein og kreatin',
      description:
        'Deklarasjonsanalyse av kosttilskudd i Norge. Finn PWO, protein og kreatin etter åpne kriterier — score, pris og datakvalitet synlig.',
    }
  }

  const pathLandingMeta: Record<string, PageMeta> = {
    '/tester/pwo/beste': {
      title: 'Beste PWO 2026 – Topp rangerte pre-workout | Kosttest.no',
      description: `De beste PWO-ene i Norge: ${siteStats.pwoTestedCount} pre-workout rangert etter ingredienser, dose per serving og åpen formelscore. Ingen sponsing.`,
      canonical: `${SITE}/tester/pwo/beste/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
    '/tester/pwo/sterkeste': {
      title: 'Sterkeste PWO 2026 – Høyest formelscore | Kosttest.no',
      description: 'Pre-workout med høyest formelscore etter deklarerte ingredienser og dose — ikke laboratorietest av Kosttest.',
      canonical: `${SITE}/tester/pwo/sterkeste/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
    '/tester/pwo/nybegynner': {
      title: 'Beste PWO for nybegynnere 2026 | Kosttest.no',
      description: 'Milde og balanserte PWO-er for deg som starter med pre-workout. Lavere koffein og oversiktlige doser — rangert etter deklarasjon.',
      canonical: `${SITE}/tester/pwo/nybegynner/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
    '/tester/pwo/verdi': {
      title: 'Best verdi PWO 2026 – God formel til lav pris | Kosttest.no',
      description: 'PWO med sterk formelscore og god verdikarakter (A/B). Skiller beste formel fra billigst — finn balansen mellom dose og pris.',
      canonical: `${SITE}/tester/pwo/verdi/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
    '/tester/protein/beste': {
      title: 'Beste proteinpulver 2026 – Topp rangert med DIAAS | Kosttest.no',
      description: `${siteStats.proteinTestedCount} proteinpulver rangert etter DIAAS-kvalitet. Finn det beste whey, vegan og kasein i Norge.`,
      canonical: `${SITE}/tester/protein/beste/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
    '/tester/kreatin/beste': {
      title: 'Beste kreatin 2026 – Topp rangert monohydrat | Kosttest.no',
      description: `${siteStats.creatineTestedCount} kreatinprodukter rangert etter merkevare-kreatin, renhet, mesh og dokumentasjon.`,
      canonical: `${SITE}/tester/kreatin/beste/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    },
  }

  if (pathLandingMeta[path]) {
    return pathLandingMeta[path]
  }

  const legacyDef = {
    title: 'Kosttest.no – Tester og guider for kosttilskudd',
    description: `Åpen sammenligning av kosttilskudd i Norge. ${siteStats.totalTestedCount} produkter i ${siteStats.categoryCount} kategorier — publiserte kriterier, ingen sponsede plasseringer.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
  }

  if (state.page === 'om-kosttest') {
    return {
      title: 'Om Kosttest.no – Sammenligning av kosttilskudd | Kosttest.no',
      description: 'Hvem står bak Kosttest, hva som vurderes, finansiering, kilder og hvordan feil rettes.',
      canonical: `${SITE}/om-kosttest/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'data-freshness') {
    return {
      title: 'Hvor ferske er dataene? – Datatillit og oppdatering | Kosttest.no',
      description:
        'Hvordan Kosttest oppdaterer priser, deklarasjoner og rangeringer. Forskjell på deklarasjonsanalyse og laboratorietest — og hvor du kan melde feil.',
      canonical: `${SITE}/hvor-ferske-er-dataene/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'kilder') {
    return {
      title: 'Kilder og referanser | Kosttest.no',
      description: 'Åpne kilder: butikker, merker, ISSN, FAO og vitenskapelige retningslinjer bak PWO-, protein- og kreatintestene.',
      canonical: `${SITE}/kilder/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'metode') {
    return {
      title: 'Slik vurderer vi kosttilskudd – Åpen metode | Kosttest.no',
      description: 'Regelbasert sammenligning av PWO, proteinpulver og kreatin. Scoring-reglene ligger åpent — ingen sponsede plasseringer.',
      canonical: `${SITE}/om-metoden/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }

  if (state.page === 'lb-creatine') {
    if (state.creapureFilter === 'creapure') {
      return {
        title: 'Creapure kreatin – sammenligning 2026 | Kosttest.no',
        description: 'Kreatin med Creapure-sertifisert monohydrat — rangert etter form, renhet og mesh.',
        canonical: `${SITE}/tester/kreatin/creapure/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.sortCol === 'price-g') {
      return {
        title: 'Billigst kreatin per gram 2026 | Kosttest.no',
        description: 'Pris per gram kreatin som referanse. Score bygger på form, renhet og mesh.',
        canonical: `${SITE}/tester/kreatin/billigste/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    return {
      title: 'Kreatin sammenligning 2026 – Form, renhet og mesh | Kosttest.no',
      description: `${siteStats.creatineTestedCount} kreatinprodukter rangert etter merkevare-kreatin, renhet, mesh og dopingtest. Uten dokumentert produkttest faller også Creapure.`,
      canonical: `${SITE}/tester/kreatin/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'creatine-product' && state.selectedProduct) {
    const product = testedCreatineProducts.find((p) => p.id === state.selectedProduct)
    if (product) {
      return {
        title: `${product.name} – Kreatin vurdering | Kosttest.no`,
        description: product.verdict.substring(0, 160),
        canonical: `${SITE}/kreatin/${product.id}/`,
        ogType: 'product',
        ogImage: product.image || DEFAULT_OG,
      }
    }
  }
  if (state.page === 'creatine-guide') {
    return {
      title: 'Slik velger du kreatin – Kjøpsguide 2026 | Kosttest.no',
      description: 'Lær hvordan du velger kreatin — monohydrat, Creapure og hva som faktisk teller i kvalitetstesten.',
      canonical: `${SITE}/tester/kreatin/slik-velger-du/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'creatine-metode') {
    return {
      title: 'Slik scorer vi kreatin – Form, renhet og mesh | Kosttest.no',
      description: 'Kreatinscoren vektlegger merkevare på råstoff, renhet, mesh og dopingtest. Manglende dokumentasjon gir poengtrekk — uten data kan produktet ikke nå toppscore.',
      canonical: `${SITE}/tester/kreatin/metode/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'lb-protein') {
    if (state.proteinFilter === 'kasein') {
      return {
        title: 'Kasein proteinpulver – sammenligning 2026 | Kosttest.no',
        description: 'Kasein rangert etter DIAAS-estimat — langsom frigjøring for kveldsbruk.',
        canonical: `${SITE}/tester/protein/kasein/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.proteinFilter === 'vegan') {
      return {
        title: 'Vegan proteinpulver – sammenligning 2026 | Kosttest.no',
        description: 'Soya og erte/ris-protein rangert etter DIAAS-estimat og IAAS-profil.',
        canonical: `${SITE}/tester/protein/vegan/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.sortCol === 'price-protein-asc') {
      return {
        title: 'Billigst proteinpulver per g protein 2026 | Kosttest.no',
        description: 'Pris per gram protein — kun referanse. Rangeringen bygger på DIAAS-kvalitet.',
        canonical: `${SITE}/tester/protein/billigste/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    return {
      title: 'Proteinpulver sammenligning 2026 – DIAAS + IAAS | Kosttest.no',
      description: `${siteStats.proteinTestedCount} proteinpulver rangert etter DIAAS (kvalitet). IAAS vises for sammenligning. Pris påvirker ikke scoren.`,
      canonical: `${SITE}/tester/protein/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'protein-product' && state.selectedProduct) {
    const product = testedProteinProducts.find((p) => p.id === state.selectedProduct)
    if (product) {
      return {
        title: `${product.name} – Proteinpulver vurdering | Kosttest.no`,
        description: product.verdict.substring(0, 160),
        canonical: `${SITE}/protein/${product.id}/`,
        ogType: 'product',
        ogImage: product.image || DEFAULT_OG,
      }
    }
  }
  if (state.page === 'protein-guide') {
    return {
      title: 'Slik velger du proteinpulver – Kjøpsguide 2026 | Kosttest.no',
      description: 'Lær hvordan du velger proteinpulver — DIAAS som primær kvalitetsmåling, IAAS for sammenligning.',
      canonical: `${SITE}/tester/protein/slik-velger-du/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'protein-metode') {
    return {
      title: 'Slik scorer vi proteinpulver – DIAAS vs IAAS | Kosttest.no',
      description: 'Kun DIAAS styrer proteinscore. IAAS vises for sammenligning. FAO anbefaler DIAAS som gullstandard.',
      canonical: `${SITE}/tester/protein/metode/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'lb-pwo') {
    if (state.sortCol === 'value') {
      return {
        title: 'Best verdi PWO 2026 – God formel til lav pris | Kosttest.no',
        description: 'PWO med sterk formelscore og verdikarakter A/B. Skiller beste formel fra billigst.',
        canonical: `${SITE}/tester/pwo/verdi/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.sortCol === 'nybegynner') {
      return {
        title: 'Beste PWO for nybegynnere 2026 | Kosttest.no',
        description: 'Milde PWO-er med koffeinfritt eller ≤ 200 mg koffein — rangert etter formelscore.',
        canonical: `${SITE}/tester/pwo/nybegynner/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.caffeineFilter === 'uten') {
      return {
        title: 'Stim-free PWO sammenligning 2026 | Kosttest.no',
        description: 'Koffeinfrie pre-workout rangert etter ingredienser og dose — uten koffein i scoren.',
        canonical: `${SITE}/tester/pwo/stim-free/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.sortCol === 'kgprice-asc' || state.sortCol === 'kgprice-desc') {
      return {
        title: 'Billigste PWO per kg 2026 | Kosttest.no',
        description: `Sammenlign pris per kilogram på ${siteStats.pwoTestedCount} PWO-produkter. Formelscore vises i hovedrangeringen.`,
        canonical: `${SITE}/tester/pwo/billigste/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    return {
      title: 'PWO best formel 2026 – Fullstendig rangering | Kosttest.no',
      description: `Se hele rangeringen av ${siteStats.pwoTestedCount} PWO-produkter etter formelscore. Verdikarakter vises separat.`,
      canonical: `${SITE}/tester/pwo/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'blog') {
    return {
      title: 'Blogg – Ingredienser og vitenskap | Kosttest.no',
      description: 'Kunnskapsbaserte artikler om L-citrulline, beta-alanin, kreatin, koffein og alle PWO-ingredienser.',
      canonical: `${SITE}/blogg/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'blog-post' && state.selectedProduct) {
    const post = blogPosts.find((p) => p.id === state.selectedProduct)
    if (post) {
      return {
        title: `${post.title} | Kosttest.no`,
        description: post.excerpt,
        canonical: `${SITE}/blogg/${post.slug}/`,
        ogType: 'article',
        ogImage: DEFAULT_OG,
      }
    }
  }
  if (state.page === 'product' && state.selectedProduct) {
    const product = testedProducts.find((p) => p.id === state.selectedProduct)
    if (product) {
      return {
        title: `${product.name} – Vurdering og score | Kosttest.no`,
        description: product.verdict.substring(0, 160),
        canonical: `${SITE}/pwo/${product.id}/`,
        ogType: 'product',
        ogImage: product.image || DEFAULT_OG,
      }
    }
  }
  if (state.page === 'compare-pwo') {
    return {
      title: 'Sammenlign PWO – side om side | Kosttest.no',
      description: 'Sammenlign opptil tre pre-workout produkt etter formelscore, pris, koffein og dokumentasjon.',
      canonical: `${SITE}/tester/pwo/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
      robots: 'noindex, follow',
    }
  }
  if (state.page === 'compare-protein') {
    return {
      title: 'Sammenlign proteinpulver | Kosttest.no',
      description: 'Sammenlign protein etter DIAAS, pris og dokumentasjon.',
      canonical: `${SITE}/tester/protein/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
      robots: 'noindex, follow',
    }
  }
  if (state.page === 'compare-creatine') {
    return {
      title: 'Sammenlign kreatin | Kosttest.no',
      description: 'Sammenlign kreatin etter score, råvare, renhet og pris.',
      canonical: `${SITE}/tester/kreatin/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
      robots: 'noindex, follow',
    }
  }
  if (state.page === 'buying-guide') {
    return {
      title: 'Slik velger du riktig PWO – Kjøpsguide 2026 | Kosttest.no',
      description: 'Lær hvordan du velger PWO basert på deklarerte ingredienser, koffein og pris — uten medisinske løfter.',
      canonical: `${SITE}/tester/pwo/slik-velger-du/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'not-found') {
    return {
      title: 'Siden finnes ikke | Kosttest.no',
      description: 'Siden du leter etter finnes ikke. Gå til forsiden eller testoversikten for PWO, protein og kreatin.',
      canonical: `${SITE}${path}/`,
      ogType: 'website',
      ogImage: DEFAULT_OG,
      robots: 'noindex, follow',
    }
  }

  return legacyDef
}

export function getAllPrerenderRoutes(): string[] {
  const routes = [
    '/',
    '/tester/pwo',
    '/tester/pwo/beste',
    '/tester/pwo/sterkeste',
    '/tester/pwo/billigste',
    '/tester/pwo/stim-free',
    '/tester/pwo/nybegynner',
    '/tester/pwo/verdi',
    '/tester/protein',
    '/tester/protein/beste',
    '/tester/protein/billigste',
    '/tester/protein/vegan',
    '/tester/protein/kasein',
    '/tester/protein/slik-velger-du',
    '/tester/protein/metode',
    '/tester/kreatin',
    '/tester/kreatin/beste',
    '/tester/kreatin/creapure',
    '/tester/kreatin/billigste',
    '/tester/kreatin/slik-velger-du',
    '/tester/kreatin/metode',
    '/blogg',
    '/om-metoden',
    '/kilder',
    '/om-kosttest',
    '/hvor-ferske-er-dataene',
    '/tester/pwo/slik-velger-du',
    '/404',
  ]

  for (const product of testedProducts) {
    routes.push(`/pwo/${product.id}`)
  }
  for (const product of testedProteinProducts) {
    routes.push(`/protein/${product.id}`)
  }
  for (const product of testedCreatineProducts) {
    routes.push(`/kreatin/${product.id}`)
  }
  for (const post of blogPosts) {
    routes.push(`/blogg/${post.slug}`)
  }

  return routes
}

export function buildSitemapXml(routes: string[], lastmod = new Date().toISOString().slice(0, 10)) {
  const priorityFor = (route: string) => {
    if (route === '/') return '1.0'
    if (route.startsWith('/tester/protein/beste') || route === '/tester/protein') return '0.9'
    if (route.startsWith('/tester/pwo/beste') || route === '/tester/pwo') return '0.9'
    if (route.startsWith('/tester/kreatin/beste') || route === '/tester/kreatin') return '0.9'
    if (route.startsWith('/blogg/') || route.startsWith('/pwo/') || route.startsWith('/protein/') || route.startsWith('/kreatin/')) return '0.7'
    if (route.startsWith('/tester/')) return '0.8'
    return '0.6'
  }

  const urls = routes
    .filter((route) => route !== '/404')
    .map((route) => {
      const loc = route === '/' ? `${SITE}/` : `${SITE}${route}/`
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priorityFor(route)}</priority>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function applyMetaToHtml(html: string, meta: PageMeta) {
  const esc = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')

  const upsertMeta = (source: string, pattern: RegExp, replacement: string) =>
    pattern.test(source) ? source.replace(pattern, replacement) : source.replace('</head>', `    ${replacement}\n  </head>`)

  let out = html
    .replace(/<title>.*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(meta.description)}" />`,
    )
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${esc(meta.canonical)}" />`)
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:type" content="${esc(meta.ogType)}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${esc(meta.title)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${esc(meta.description)}" />`,
    )
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${esc(meta.canonical)}" />`)
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${esc(meta.ogImage)}" />`,
    )

  out = upsertMeta(
    out,
    /<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:width" content="1200" />`,
  )
  out = upsertMeta(
    out,
    /<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:height" content="630" />`,
  )
  out = upsertMeta(
    out,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
  )
  out = upsertMeta(
    out,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  )
  out = upsertMeta(
    out,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${esc(meta.ogImage)}" />`,
  )

  if (meta.robots) {
    out = upsertMeta(
      out,
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${esc(meta.robots)}" />`,
    )
  } else {
    out = out.replace(/\s*<meta\s+name="robots"\s+content="[^"]*"\s*\/>/g, '')
  }

  return out
}

export function routeToPath(state: RouteState, pathHint?: string): string {
  if (state.page === 'not-found') {
    return pathHint ? normalizePath(pathHint) : '/404/'
  }
  if (state.page === 'home') return '/'
  if (state.page === 'kilder') return '/kilder/'
  if (state.page === 'om-kosttest') return '/om-kosttest/'
  if (state.page === 'data-freshness') return '/hvor-ferske-er-dataene/'
  if (state.page === 'metode') return '/om-metoden/'
  if (state.page === 'buying-guide') return '/tester/pwo/slik-velger-du/'
  if (state.page === 'protein-guide') return '/tester/protein/slik-velger-du/'
  if (state.page === 'protein-metode') return '/tester/protein/metode/'
  if (state.page === 'creatine-guide') return '/tester/kreatin/slik-velger-du/'
  if (state.page === 'creatine-metode') return '/tester/kreatin/metode/'
  if (state.page === 'blog') return '/blogg/'
  if (state.page === 'blog-post' && state.selectedProduct) {
    const post = blogPosts.find((entry) => entry.id === state.selectedProduct || entry.slug === state.selectedProduct)
    return `/blogg/${post?.slug ?? state.selectedProduct}/`
  }
  if (state.page === 'product' && state.selectedProduct) return `/pwo/${state.selectedProduct}/`
  if (state.page === 'protein-product' && state.selectedProduct) return `/protein/${state.selectedProduct}/`
  if (state.page === 'creatine-product' && state.selectedProduct) return `/kreatin/${state.selectedProduct}/`

  if (state.page === 'compare-pwo') return '/tester/pwo/sammenlign/'
  if (state.page === 'compare-protein') return '/tester/protein/sammenlign/'
  if (state.page === 'compare-creatine') return '/tester/kreatin/sammenlign/'

  if (state.page === 'lb-pwo') {
    if (state.sortCol === 'value') return '/tester/pwo/verdi/'
    if (state.sortCol === 'nybegynner') return '/tester/pwo/nybegynner/'
    if (state.caffeineFilter === 'uten') return '/tester/pwo/stim-free/'
    if (state.sortCol === 'kgprice-asc' || state.sortCol === 'kgprice-desc') return '/tester/pwo/billigste/'
    return '/tester/pwo/'
  }

  if (state.page === 'lb-protein') {
    if (state.proteinFilter === 'vegan') return '/tester/protein/vegan/'
    if (state.proteinFilter === 'kasein') return '/tester/protein/kasein/'
    if (state.sortCol === 'price-protein-asc') return '/tester/protein/billigste/'
    return '/tester/protein/'
  }

  if (state.page === 'lb-creatine') {
    if (state.creapureFilter === 'creapure') return '/tester/kreatin/creapure/'
    if (state.sortCol === 'price-g') return '/tester/kreatin/billigste/'
    return '/tester/kreatin/'
  }

  return '/'
}

export function isVeganProtein(sourceType: string) {
  return sourceType === 'soy-isolate' || sourceType === 'pea-rice-blend'
}

export function isCaseinProtein(sourceType: string) {
  return sourceType === 'casein'
}

export function isWheyProtein(sourceType: string) {
  return !isVeganProtein(sourceType) && !isCaseinProtein(sourceType)
}
