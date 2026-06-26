/**
 * Konsistenssjekk for produktpoeng på kosttest.no.
 *
 * Sjekker:
 * 1. Hardkodet score i produktobjekt-literaler vs calculateProductGrade()
 * 2. Bloggpoeng i blog.ts vs faktisk testedProducts[].score
 * 3. Duplikater i listedProducts (rangert produkt også «Ikke rangert»)
 * 4. siteStats vs filtrert listedProducts
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const {
  testedProducts,
  listedProducts,
  calculateProductGrade,
} = await import('../src/data/pwoProducts.ts')

const { siteStats } = await import('../src/siteStats.ts')

const blogSource = readFileSync(join(root, 'src/data/blog.ts'), 'utf8')
const pwoSource = readFileSync(join(root, 'src/data/pwoProducts.ts'), 'utf8')

let exitCode = 0
const issues = []

function fail(category, message) {
  issues.push({ category, message })
  exitCode = 1
}

// 1. Hardkodede score i kildefil vs calculateProductGrade()
const hardcodedPattern = /id:\s*'([^']+)'[\s\S]*?score:\s*(\d+)/g
const hardcodedScores = new Map()
let match
while ((match = hardcodedPattern.exec(pwoSource)) !== null) {
  hardcodedScores.set(match[1], Number(match[2]))
}

for (const product of testedProducts) {
  const calculated = calculateProductGrade(product).score
  const hardcoded = hardcodedScores.get(product.id)

  if (product.score !== calculated) {
    fail(
      'runtime-score',
      `${product.id}: testedProducts[].score=${product.score}, calculateProductGrade()=${calculated}`,
    )
  }

  if (hardcoded !== undefined && hardcoded !== calculated && hardcoded !== 0) {
    fail(
      'hardcoded-score',
      `${product.id}: hardkodet score=${hardcoded}, beregnet=${calculated}`,
    )
  }
}

// 2. Bloggpoeng vs testedProducts[].score (linje-for-linje for å unngå kryss-linje falske treff)
const scoreById = new Map(testedProducts.map((p) => [p.id, p.score]))

const blogAliases = [
  ['peveo-maxed', /\bPeveo Maxed\b/i],
  ['white-lion-supervillain', /\bWhite Lion Supervillain\b|\bSupervillain\b/i],
  ['nutritac-sickpump', /\bNutriTac SickPump VeinBlaster\b|\bSickPump VeinBlaster\b|\bSickPump\b/i],
  ['nutritac-midnight', /\bMidnight Pump Stim-Free\b|\bMidnight Pump\b/i],
  ['peveo-stim-free', /\bPeveo PWO-Stim-free\b|\bPWO-Stim-free\b/i],
  ['bsn-noxplode-50', /\bBSN N\.O\.-Xplode\b|\bN\.O\.-Xplode\b/i],
  ['gold-standard', /\bOptimum Nutrition Gold Standard\b|\bGold Standard\b/i],
  ['star-supreme', /\bStar Nutrition Supreme\b|\bSupreme\b/i],
]

const blogScorePatterns = [
  /\((\d+)\s*poeng\)/,
  /\((\d+)p\)/,
]

for (const line of blogSource.split('\n')) {
  for (const pattern of blogScorePatterns) {
    const scoreMatch = line.match(pattern)
    if (!scoreMatch) continue

    const mentioned = Number(scoreMatch[1])
    const aliasMatch = blogAliases.find(([, alias]) => alias.test(line))
    if (!aliasMatch) continue

    const [productId] = aliasMatch
    const actual = scoreById.get(productId)
    if (actual === undefined) continue

    if (mentioned !== actual) {
      fail(
        'blog-score',
        `blog.ts: ${productId} nevnt med ${mentioned} poeng, faktisk score=${actual} — «${line.trim().slice(0, 100)}…»`,
      )
    }
  }
}

// 3. Duplikater i listedProducts
const rankedIds = new Set(testedProducts.map((p) => p.id))
const listedIds = listedProducts.map((p) => p.id)
const duplicateIds = listedIds.filter(
  (id, index) => listedIds.indexOf(id) !== index,
)

for (const id of duplicateIds) {
  fail('listed-duplicate', `listedProducts: duplikat id '${id}'`)
}

const rankedAlsoUnranked = listedProducts.filter(
  (p) => rankedIds.has(p.id) && p.status !== 'Rangert',
)

for (const product of rankedAlsoUnranked) {
  fail(
    'listed-duplicate',
    `listedProducts: '${product.id}' finnes i testedProducts men har status '${product.status}'`,
  )
}

// 4. siteStats
const uniqueListedIds = new Set(listedProducts.map((p) => p.id))
const expectedListedCount = uniqueListedIds.size
const expectedUnrankedCount = listedProducts.filter((p) => p.status !== 'Rangert').length
const expectedTestedCount = testedProducts.length

if (siteStats.testedCount !== expectedTestedCount) {
  fail(
    'site-stats',
    `siteStats.testedCount=${siteStats.testedCount}, forventet ${expectedTestedCount}`,
  )
}

if (siteStats.listedCount !== expectedListedCount) {
  fail(
    'site-stats',
    `siteStats.listedCount=${siteStats.listedCount}, forventet ${expectedListedCount} (unike id-er)`,
  )
}

if (siteStats.unrankedCount !== expectedUnrankedCount) {
  fail(
    'site-stats',
    `siteStats.unrankedCount=${siteStats.unrankedCount}, forventet ${expectedUnrankedCount}`,
  )
}

// Rapport
if (issues.length === 0) {
  console.log('✅ Konsistenssjekk OK')
  console.log(`   ${testedProducts.length} testede produkter`)
  console.log(`   ${listedProducts.length} listede produkter (${expectedUnrankedCount} ikke rangert)`)
  console.log('   Ingen avvik i hardkodede score, blogg eller siteStats')
} else {
  console.error(`❌ ${issues.length} avvik funnet:\n`)
  const byCategory = Object.groupBy(issues, (i) => i.category)
  for (const [category, items] of Object.entries(byCategory)) {
    console.error(`[${category}]`)
    for (const item of items) {
      console.error(`  - ${item.message}`)
    }
    console.error('')
  }
}

process.exit(exitCode)
