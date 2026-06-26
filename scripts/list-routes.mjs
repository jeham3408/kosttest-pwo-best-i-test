import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const STATIC_ROUTES = [
  { route: '/', type: 'forside', label: 'Forside' },
  { route: '/tester/pwo', type: 'leaderboard', label: 'PWO rangering' },
  { route: '/tester/pwo/beste', type: 'leaderboard', label: 'Beste PWO' },
  { route: '/tester/pwo/sterkeste', type: 'leaderboard', label: 'Sterkeste PWO' },
  { route: '/tester/pwo/billigste', type: 'leaderboard', label: 'Billigste PWO' },
  { route: '/tester/pwo/stim-free', type: 'leaderboard', label: 'Stim-free PWO' },
  { route: '/tester/pwo/nybegynner', type: 'leaderboard', label: 'Nybegynner PWO' },
  { route: '/tester/pwo/slik-velger-du', type: 'guide', label: 'Kjøpsguide' },
  { route: '/blogg', type: 'blogg', label: 'Bloggoversikt' },
  { route: '/om-metoden', type: 'metode', label: 'Om metoden' },
  { route: '/kilder', type: 'kilder', label: 'Kilder' },
]

function extractTestedProductIds(source) {
  const start = source.indexOf('export const testedProducts')
  const end = source.indexOf('export const listedProducts')
  if (start === -1 || end === -1) throw new Error('Kunne ikkje finne testedProducts i pwoProducts.ts')
  const block = source.slice(start, end)
  const ids = []
  const re = /id:\s*'([^']+)'/g
  let match
  while ((match = re.exec(block)) !== null) ids.push(match[1])
  return ids
}

function extractBlogSlugs(source) {
  const slugs = []
  const re = /slug:\s*'([^']+)'/g
  let match
  while ((match = re.exec(source)) !== null) slugs.push(match[1])
  return slugs
}

export async function getAllSiteRoutes() {
  const [productsSource, blogSource] = await Promise.all([
    readFile(resolve(root, 'src/data/pwoProducts.ts'), 'utf8'),
    readFile(resolve(root, 'src/data/blog.ts'), 'utf8'),
  ])

  const productIds = extractTestedProductIds(productsSource)
  const blogSlugs = extractBlogSlugs(blogSource)

  const routes = [
    ...STATIC_ROUTES,
    ...productIds.map((id) => ({ route: `/pwo/${id}`, type: 'produkt', label: id })),
    ...blogSlugs.map((slug) => ({ route: `/blogg/${slug}`, type: 'blogg-post', label: slug })),
  ]

  return routes
}

const format = process.argv.includes('--json') ? 'json' : 'text'
const routes = await getAllSiteRoutes()

if (format === 'json') {
  console.log(JSON.stringify({ total: routes.length, routes }, null, 2))
} else {
  const byType = routes.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1
    return acc
  }, {})

  console.log(`Totalt ${routes.length} sider:\n`)
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`  ${type}: ${count}`)
  }
  console.log('\nAlle ruter:')
  for (const item of routes) {
    console.log(`  ${item.route}/  [${item.type}] ${item.label}`)
  }
}
