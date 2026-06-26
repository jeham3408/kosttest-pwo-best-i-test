import { blogPosts, findBlogPost } from './data/blog'
import { testedProducts } from './data/pwoProducts'
import { siteStats } from './siteStats'

export type AppPage =
  | 'home'
  | 'lb-pwo'
  | 'blog'
  | 'blog-post'
  | 'product'
  | 'buying-guide'
  | 'metode'

export type RouteState = {
  page: AppPage
  selectedProduct: string | null
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

export function parseRoute(path: string): RouteState {
  const route = normalizePath(path)

  if (route === '/tester/pwo/beste' || route === '/tester/pwo' || route === '/tester') {
    return { page: 'lb-pwo', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/tester/pwo/sterkeste') {
    return { page: 'lb-pwo', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/tester/pwo/billigste') {
    return { page: 'lb-pwo', selectedProduct: null, sortCol: 'kgprice-asc', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/tester/pwo/stim-free') {
    return { page: 'lb-pwo', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'uten', betaFilter: 'med' }
  }
  if (route === '/tester/pwo/nybegynner') {
    return { page: 'lb-pwo', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route.startsWith('/tester/pwo/slik-velger-du')) {
    return { page: 'buying-guide', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route.startsWith('/pwo/')) {
    const id = route.replace('/pwo/', '')
    return { page: 'product', selectedProduct: id, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/blogg') {
    return { page: 'blog', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route.startsWith('/blogg/')) {
    const slug = route.replace('/blogg/', '')
    return { page: 'blog-post', selectedProduct: slug, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/om-metoden' || route === '/metode') {
    return { page: 'metode', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }
  if (route === '/kilder') {
    return { page: 'home', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
  }

  return { page: 'home', selectedProduct: null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle', betaFilter: 'med' }
}

export function getPageMeta(state: RouteState): PageMeta {
  const def = {
    title: 'PWO best i test 2026 | Ærlig PWO-rangering | Kosttest.no',
    description: `Vi rangerer pre-workout etter deklarert innhold, ikke markedsføring. ${siteStats.testedCount} produkter testet med åpen karaktermotor.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
  }

  if (state.page === 'lb-pwo') {
    return {
      title: 'PWO best i test 2026 – Fullstendig rangering | Kosttest.no',
      description: `Se hele rangeringen av ${siteStats.testedCount} PWO-produkter. Sorter på pris, effekt og ingredienser.`,
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
    const post = findBlogPost(state.selectedProduct)
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
      title: 'Slik scorer vi PWO – Åpen karaktermotor | Kosttest.no',
      description: 'Se hvordan vår transparente karaktermotor regner ut poeng for hvert produkt.',
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
    if (route.startsWith('/blogg/') || route.startsWith('/pwo/')) return '0.7'
    if (route.startsWith('/tester/pwo')) return '0.8'
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
