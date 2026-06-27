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
  | 'kilder'

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
  if (route === '/tester/pwo/nybegynner') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'score', sortAsc: false }
  }
  if (route.startsWith('/tester/pwo/slik-velger-du')) {
    return { ...defaultRoute(), page: 'buying-guide' }
  }
  if (route.startsWith('/pwo/')) {
    const id = route.replace('/pwo/', '')
    return { ...defaultRoute(), page: 'product', selectedProduct: id }
  }
  if (route === '/blogg') {
    return { ...defaultRoute(), page: 'blog' }
  }
  if (route.startsWith('/blogg/')) {
    const slug = route.replace('/blogg/', '')
    return { ...defaultRoute(), page: 'blog-post', selectedProduct: slug }
  }
  if (route === '/om-metoden' || route === '/metode') {
    return { ...defaultRoute(), page: 'metode' }
  }
  if (route === '/kilder') {
    return { ...defaultRoute(), page: 'kilder' }
  }

  return defaultRoute()
}

export function getPageMeta(state: RouteState): PageMeta {
  const def = {
    title: 'Kosttest.no – Tester og guider for kosttilskudd',
    description: `Uavhengige tester av kosttilskudd i Norge. ${siteStats.totalTestedCount} produkter i ${siteStats.categoryCount} kategorier — åpen metode, ingen sponsede plasseringer.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
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
      title: 'Slik tester vi kosttilskudd – Åpen metode | Kosttest.no',
      description: 'Uavhengig testmetode for PWO, proteinpulver og kreatin. Scoring-reglene ligger åpent i kode — ingen sponsede plasseringer.',
      canonical: `${SITE}/om-metoden/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }

  if (state.page === 'lb-creatine') {
    if (state.creapureFilter === 'creapure') {
      return {
        title: 'Creapure kreatin best i test 2026 | Kosttest.no',
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
      title: 'Kreatin best i test 2026 – Form, renhet og mesh | Kosttest.no',
      description: `${siteStats.creatineTestedCount} kreatinprodukter rangert etter merkevare-kreatin, renhet, mesh og dopingtest. Generisk uten test faller kraftig.`,
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
      description: 'Kreatinscoren skiller merkevare-kreatin fra generisk. Uten merkevare kreves dopingtest, renhet og mesh — ellers poengtrekk.',
      canonical: `${SITE}/tester/kreatin/metode/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'lb-protein') {
    if (state.proteinFilter === 'kasein') {
      return {
        title: 'Kasein proteinpulver best i test 2026 | Kosttest.no',
        description: 'Kasein rangert etter DIAAS-estimat — langsom frigjøring for kveldsbruk.',
        canonical: `${SITE}/tester/protein/kasein/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.proteinFilter === 'vegan') {
      return {
        title: 'Vegan proteinpulver best i test 2026 | Kosttest.no',
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
      title: 'Proteinpulver best i test 2026 – DIAAS + IAAS | Kosttest.no',
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
    if (state.caffeineFilter === 'uten') {
      return {
        title: 'Stim-free PWO best i test 2026 | Kosttest.no',
        description: 'Koffeinfrie pre-workout rangert etter ingredienser og dose — uten koffein i scoren.',
        canonical: `${SITE}/tester/pwo/stim-free/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (state.sortCol === 'kgprice-asc' || state.sortCol === 'kgprice-desc') {
      return {
        title: 'Billigste PWO per kg 2026 | Kosttest.no',
        description: `Sammenlign pris per kilogram på ${siteStats.pwoTestedCount} PWO-produkter. Se også effekt-score i hovedrangeringen.`,
        canonical: `${SITE}/tester/pwo/billigste/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    return {
      title: 'PWO best i test 2026 – Fullstendig rangering | Kosttest.no',
      description: `Se hele rangeringen av ${siteStats.pwoTestedCount} PWO-produkter. Sorter på pris, effekt og ingredienser.`,
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
  if (state.page === 'buying-guide') {
    return {
      title: 'Slik velger du riktig PWO – Kjøpsguide 2026 | Kosttest.no',
      description: 'Lær hvordan du velger beste PWO basert på ingredienser, koffein, pris og effekt.',
      canonical: `${SITE}/tester/pwo/slik-velger-du/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }

  return def
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
    '/tester/pwo/slik-velger-du',
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

  return html
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
}

export function routeToPath(state: RouteState): string {
  if (state.page === 'home') return '/'
  if (state.page === 'kilder') return '/kilder/'
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

  if (state.page === 'lb-pwo') {
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
