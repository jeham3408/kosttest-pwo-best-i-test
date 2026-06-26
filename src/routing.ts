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
  | 'metode'
  | 'protein-metode'
  | 'creatine-metode'

export type RouteState = {
  page: AppPage
  selectedProduct: string | null
  sortCol: string
  sortAsc: boolean
  caffeineFilter: 'alle' | 'med' | 'uten'
  betaFilter: 'med' | 'uten'
  proteinFilter: 'alle' | 'whey' | 'vegan' | 'kasein'
  creatineFilter: 'alle' | 'pulver' | 'gummies'
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

const defaultRoute = (): RouteState => ({
  page: 'home',
  selectedProduct: null,
  sortCol: 'score',
  sortAsc: false,
  caffeineFilter: 'alle',
  betaFilter: 'med',
  proteinFilter: 'alle',
  creatineFilter: 'alle',
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
  if (route === '/tester/kreatin/gummies') {
    return { ...defaultRoute(), page: 'lb-creatine', creatineFilter: 'gummies' }
  }
  if (route === '/tester/kreatin/pulver') {
    return { ...defaultRoute(), page: 'lb-creatine', creatineFilter: 'pulver' }
  }
  if (route === '/tester/kreatin/metode' || route === '/om-metoden/kreatin') {
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
    return { ...defaultRoute(), page: 'home' }
  }

  return defaultRoute()
}

export function getPageMeta(state: RouteState): PageMeta {
  const def = {
    title: 'Kosttest.no – PWO, protein og kreatin best i test 2026',
    description: `Uavhengig rangering av PWO, proteinpulver og kreatin i Norge. ${siteStats.pwoTestedCount} PWO, ${siteStats.proteinTestedCount} protein og ${siteStats.creatineTestedCount} kreatinprodukter testet med åpen karaktermotor.`,
    canonical: `${SITE}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG,
  }

  if (state.page === 'lb-creatine') {
    return {
      title: 'Kreatin best i test 2026 – pulver og gummies | Kosttest.no',
      description: `${siteStats.creatineTestedCount} kreatinprodukter rangert etter dose, form og pris per gram. Inkluderer pulver og gummies.`,
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
  if (state.page === 'creatine-metode') {
    return {
      title: 'Slik scorer vi kreatin – dose + form + pris | Kosttest.no',
      description: 'Kreatin scores etter dose per porsjon (60 %), form/format (15 %) og pris per gram kreatin (25 %). Gummies vurderes mot effektiv daglig dose.',
      canonical: `${SITE}/tester/kreatin/metode/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
    }
  }
  if (state.page === 'lb-protein') {
    return {
      title: 'Proteinpulver best i test 2026 – DIAAS + IAAS | Kosttest.no',
      description: `${siteStats.proteinTestedCount} proteinpulver med DIAAS (primær) og IAAS. Score: DIAAS 70 % + pris per g protein 30 %.`,
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
      description: 'DIAAS (70 %) + pris per g protein (30 %) i scoren. IAAS vises for sammenligning. FAO anbefaler DIAAS som gullstandard.',
      canonical: `${SITE}/tester/protein/metode/`,
      ogType: 'article',
      ogImage: DEFAULT_OG,
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
    '/tester/protein',
    '/tester/protein/beste',
    '/tester/protein/billigste',
    '/tester/protein/vegan',
    '/tester/protein/kasein',
    '/tester/protein/slik-velger-du',
    '/tester/protein/metode',
    '/tester/kreatin',
    '/tester/kreatin/beste',
    '/tester/kreatin/pulver',
    '/tester/kreatin/gummies',
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

export function isVeganProtein(sourceType: string) {
  return sourceType === 'soy-isolate' || sourceType === 'pea-rice-blend'
}

export function isCaseinProtein(sourceType: string) {
  return sourceType === 'casein'
}

export function isWheyProtein(sourceType: string) {
  return !isVeganProtein(sourceType) && !isCaseinProtein(sourceType)
}

export function isCreatinePowder(format: string) {
  return format === 'powder' || format === 'capsules'
}

export function isCreatineGummies(format: string) {
  return format === 'gummies'
}
