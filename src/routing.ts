import { blogPosts } from './data/blog'
import { testedProducts } from './data/pwoProducts'
import {
  allSupplementCategories,
  getSupplementCategory,
  findSupplementProduct,
  type SupplementCategoryId,
} from './data/testCategories'
import { siteStats } from './siteStats'

export type AppPage =
  | 'home'
  | 'lb-pwo'
  | 'lb-supplement'
  | 'supplement-product'
  | 'blog'
  | 'blog-post'
  | 'product'
  | 'buying-guide'
  | 'metode'

export type RouteState = {
  page: AppPage
  selectedProduct: string | null
  supplementCategory: SupplementCategoryId | null
  sortCol: string
  sortAsc: boolean
  caffeineFilter: 'alle' | 'med' | 'uten'
  betaFilter: 'med' | 'uten'
}

export type PageMeta = {
  title: string
  description: string
  canonical: string
  ogType: string
  ogImage: string
}

const SITE = 'https://kosttest.no'
const DEFAULT_OG = `${SITE}/og-share.svg`

export function normalizePath(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/'
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function defaultRoute(): RouteState {
  return {
    page: 'home',
    selectedProduct: null,
    supplementCategory: null,
    sortCol: 'score',
    sortAsc: false,
    caffeineFilter: 'alle',
    betaFilter: 'med',
  }
}

export function parseRoute(path: string): RouteState {
  const route = normalizePath(path)

  for (const category of allSupplementCategories) {
    const lbPath = category.leaderboardPath.replace(/\/$/, '')
    if (route === lbPath || route === `${lbPath}/beste`) {
      return { ...defaultRoute(), page: 'lb-supplement', supplementCategory: category.id }
    }
    if (route.startsWith(category.productPathPrefix)) {
      const id = route.replace(category.productPathPrefix, '').replace(/\/$/, '')
      return {
        ...defaultRoute(),
        page: 'supplement-product',
        supplementCategory: category.id,
        selectedProduct: id,
      }
    }
  }

  if (route === '/tester/pwo/beste' || route === '/tester/pwo' || route === '/tester') {
    return { ...defaultRoute(), page: 'lb-pwo' }
  }
  if (route === '/tester/pwo/sterkeste') {
    return { ...defaultRoute(), page: 'lb-pwo' }
  }
  if (route === '/tester/pwo/billigste') {
    return { ...defaultRoute(), page: 'lb-pwo', sortCol: 'kgprice-asc' }
  }
  if (route === '/tester/pwo/stim-free') {
    return { ...defaultRoute(), page: 'lb-pwo', caffeineFilter: 'uten' }
  }
  if (route === '/tester/pwo/nybegynner') {
    return { ...defaultRoute(), page: 'lb-pwo' }
  }
  if (route.startsWith('/tester/pwo/slik-velger-du')) {
    return { ...defaultRoute(), page: 'buying-guide' }
  }
  if (route.startsWith('/pwo/')) {
    const id = route.replace('/pwo/', '').replace(/\/$/, '')
    return { ...defaultRoute(), page: 'product', selectedProduct: id }
  }
  if (route === '/blogg') {
    return { ...defaultRoute(), page: 'blog' }
  }
  if (route.startsWith('/blogg/')) {
    const slug = route.replace('/blogg/', '').replace(/\/$/, '')
    return { ...defaultRoute(), page: 'blog-post', selectedProduct: slug }
  }
  if (route === '/om-metoden' || route === '/metode') {
    return { ...defaultRoute(), page: 'metode' }
  }
  if (route === '/kilder') {
    return { ...defaultRoute(), page: 'home' }
  }

  return defaultRoute()
}

export function getPageMeta(state: RouteState): PageMeta {
  const def = {
    title: 'Kosttilskudd best i test 2026 | Ærlig rangering | Kosttest.no',
    description: `Vi rangerer kosttilskudd etter deklarert innhold, ikke markedsføring. ${siteStats.testedCount} PWO-produkter og ${siteStats.supplementTestedCount} produkter i andre tester.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
  }

  if (state.page === 'lb-supplement' && state.supplementCategory) {
    const category = getSupplementCategory(state.supplementCategory)
    if (category) {
      return {
        title: category.metaTitle,
        description: category.metaDescription,
        canonical: `${SITE}${category.leaderboardPath}`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
  }

  if (state.page === 'supplement-product' && state.supplementCategory && state.selectedProduct) {
    const product = findSupplementProduct(state.supplementCategory, state.selectedProduct)
    const category = getSupplementCategory(state.supplementCategory)
    if (product && category) {
      return {
        title: `${product.name} – Vurdering og score | Kosttest.no`,
        description: product.verdict.substring(0, 160),
        canonical: `${SITE}${category.productPathPrefix}${product.id}/`,
        ogType: 'product',
        ogImage: product.image || DEFAULT_OG,
      }
    }
  }

  if (state.page === 'lb-pwo') {
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
  if (state.page === 'metode') {
    return {
      title: 'Slik scorer vi kosttilskudd – Åpen karaktermotor | Kosttest.no',
      description: 'Se hvordan vår transparente karaktermotor regner ut poeng for PWO, kreatin, protein og mer.',
      canonical: `${SITE}/om-metoden/`,
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
    '/blogg',
    '/om-metoden',
    '/kilder',
    '/tester/pwo/slik-velger-du',
  ]

  for (const category of allSupplementCategories) {
    routes.push(category.leaderboardPath.replace(/\/$/, ''))
    for (const product of category.products) {
      routes.push(`${category.productPathPrefix.replace(/\/$/, '')}/${product.id}`)
    }
  }

  for (const product of testedProducts) {
    routes.push(`/pwo/${product.id}`)
  }
  for (const post of blogPosts) {
    routes.push(`/blogg/${post.slug}`)
  }

  return routes
}

export function buildSitemapXml(routes: string[], lastmod = new Date().toISOString().slice(0, 10)) {
  const priorityFor = (route: string) => {
    if (route === '/') return '1.0'
    if (route.startsWith('/tester/pwo/beste') || route === '/tester/pwo') return '0.9'
    if (route.startsWith('/tester/kreatin') || route.startsWith('/tester/proteinpulver')) return '0.85'
    if (route.startsWith('/blogg/') || route.startsWith('/pwo/') || route.startsWith('/kreatin/')) return '0.7'
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
