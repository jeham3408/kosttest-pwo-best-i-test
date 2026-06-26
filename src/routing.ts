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
  path: string
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
  const base = { path: route, selectedProduct: null as string | null, sortCol: 'score', sortAsc: false, caffeineFilter: 'alle' as const, betaFilter: 'med' as const }

  if (route === '/tester/pwo/beste' || route === '/tester/pwo' || route === '/tester') {
    return { ...base, page: 'lb-pwo' }
  }
  if (route === '/tester/pwo/sterkeste') {
    return { ...base, page: 'lb-pwo' }
  }
  if (route === '/tester/pwo/billigste') {
    return { ...base, page: 'lb-pwo', sortCol: 'kgprice-asc' }
  }
  if (route === '/tester/pwo/stim-free') {
    return { ...base, page: 'lb-pwo', caffeineFilter: 'uten' }
  }
  if (route === '/tester/pwo/nybegynner') {
    return { ...base, page: 'lb-pwo' }
  }
  if (route.startsWith('/tester/pwo/slik-velger-du')) {
    return { ...base, page: 'buying-guide' }
  }
  if (route.startsWith('/pwo/')) {
    const id = route.replace('/pwo/', '')
    return { ...base, page: 'product', selectedProduct: id }
  }
  if (route === '/blogg') {
    return { ...base, page: 'blog' }
  }
  if (route.startsWith('/blogg/')) {
    const slug = route.replace('/blogg/', '')
    return { ...base, page: 'blog-post', selectedProduct: slug }
  }
  if (route === '/om-metoden' || route === '/metode') {
    return { ...base, page: 'metode' }
  }
  if (route === '/kilder') {
    return { ...base, page: 'lb-pwo', path: '/kilder' }
  }

  return { ...base, page: 'home' }
}

const LEADERBOARD_VARIANTS: Record<string, { title: string; description: string; h1: string; lead: string }> = {
  '/tester/pwo/beste': {
    title: 'Beste PWO 2026 – Topp rangering | Kosttest.no',
    description: `Se topp ${siteStats.testedCount} PWO-produkter rangert etter ingredienser og effekt. Oppdatert åpen test.`,
    h1: 'Beste PWO i test 2026',
    lead: 'Alle produkter sortert etter totalscore fra vår åpne karaktermotor.',
  },
  '/tester/pwo/sterkeste': {
    title: 'Sterkeste PWO 2026 – Høyest score | Kosttest.no',
    description: 'Finn PWO med høyest poengsum for pump, utholdenhet og stimulanter.',
    h1: 'Sterkeste PWO i test',
    lead: 'Produkter med høyest totalscore – maks effekt per dose.',
  },
  '/tester/pwo/billigste': {
    title: 'Billigste PWO 2026 – Best verdi per kg | Kosttest.no',
    description: 'Sammenlign PWO etter pris per kilogram og finn mest effekt for pengene.',
    h1: 'Billigste PWO per kilogram',
    lead: 'Sortert etter pris per kg – se hvor mye pump du får for kronene.',
  },
  '/tester/pwo/stim-free': {
    title: 'Stim-free PWO 2026 – Uten koffein | Kosttest.no',
    description: 'Koffeinfrie pre-workout alternativer for kveldstrening og sensitivitet.',
    h1: 'Stim-free PWO uten koffein',
    lead: 'Kun produkter uten koffein – for trening sent på dagen.',
  },
  '/tester/pwo/nybegynner': {
    title: 'PWO for nybegynnere 2026 | Kosttest.no',
    description: 'Anbefalte pre-workout for deg som starter – moderate doser og tydelig innhold.',
    h1: 'PWO for nybegynnere',
    lead: 'Moderate doser og oversiktlige produkter for deg som er ny med PWO.',
  },
}

export function getLeaderboardHeading(path: string) {
  return LEADERBOARD_VARIANTS[path] ?? {
    title: 'PWO best i test 2026 – Fullstendig rangering | Kosttest.no',
    description: `Se hele rangeringen av ${siteStats.testedCount} PWO-produkter. Sorter på pris, effekt og ingredienser.`,
    h1: 'PWO best i test 2026',
    lead: 'Fullstendig rangering med åpen karaktermotor – ingen sponsede plasseringer.',
  }
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
    const variant = LEADERBOARD_VARIANTS[state.path]
    const canonicalPath = state.path === '/kilder' ? '/kilder' : (variant ? state.path : '/tester/pwo')
    const heading = getLeaderboardHeading(state.path === '/kilder' ? '/tester/pwo' : state.path)
    if (state.path === '/kilder') {
      return {
        title: 'Kilder og referanser – PWO-test | Kosttest.no',
        description: 'Åpne kilder, retningslinjer og referanser bak PWO-rangeringen på Kosttest.no.',
        canonical: `${SITE}/kilder/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    if (variant) {
      return {
        title: variant.title,
        description: variant.description,
        canonical: `${SITE}${canonicalPath}/`,
        ogType: 'website',
        ogImage: DEFAULT_OG,
      }
    }
    return {
      title: heading.title,
      description: heading.description,
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
