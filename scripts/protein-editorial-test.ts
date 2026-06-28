import {
  buildProteinBadgeContext,
  generateProteinProductCopy,
  getDiaasStatus,
  getProteinEditorialSummary,
  DIAAS_ESTIMATE_DISCLAIMER,
  isDocumentedLactoseFree,
  isVeganProduct,
  isWheyConcentrateType,
  isWheyIsolateType,
} from '../src/data/protein/index'
import { testedProteinProducts } from '../src/data/proteinProducts'

const ctx = buildProteinBadgeContext(testedProteinProducts)
let passed = 0
let failed = 0

const assert = (cond: boolean, msg: string) => (cond ? passed++ : (failed++, console.error('FAIL:', msg)))

const summary = (p: (typeof testedProteinProducts)[0]) =>
  getProteinEditorialSummary(p, testedProteinProducts, ctx)

// --- Scenario: whey concentrate ---
const concentrate = testedProteinProducts.find((p) => isWheyConcentrateType(p.sourceType))
if (concentrate) {
  const s = summary(concentrate)
  assert(/pris|gram protein/i.test(s.bestFor), 'concentrate: pris i bestFor')
} else console.warn('SKIP concentrate')

// --- Scenario: whey isolate ---
const isolate = testedProteinProducts.find(
  (p) => isWheyIsolateType(p.sourceType) && p.proteinPer100g >= 80 && p.id === 'esn-isoclear',
) ?? testedProteinProducts.find((p) => isWheyIsolateType(p.sourceType) && p.proteinPer100g >= 80)
if (isolate) {
  const s = summary(isolate)
  assert(/protein/i.test(s.bestFor), 'isolate: protein i bestFor')
} else console.warn('SKIP isolate')

// --- Scenario: casein ---
const casein = testedProteinProducts.find((p) => p.sourceType === 'casein')
if (casein) {
  assert(/kveld|langsom|casein/i.test(summary(casein).bestFor.toLowerCase()), 'casein bestFor')
} else console.warn('SKIP casein')

// --- Scenario: vegan ---
const vegan = testedProteinProducts.find((p) => isVeganProduct(p))
if (vegan) {
  const s = summary(vegan)
  assert(/plant|vegan/i.test(s.bestFor.toLowerCase()), 'vegan bestFor')
  assert(
    s.importantToKnow.includes(DIAAS_ESTIMATE_DISCLAIMER) || /plant|diaas/i.test(s.importantToKnow.toLowerCase()),
    'vegan disclaimer',
  )
} else console.warn('SKIP vegan')

// --- Scenario: laktosefri ---
const lactoseFree = testedProteinProducts.find((p) => isDocumentedLactoseFree(p))
if (lactoseFree) {
  assert(/laktose/i.test(summary(lactoseFree).bestFor.toLowerCase()), 'lactose-free bestFor')
} else console.warn('SKIP lactose-free')

// --- Scenario: identisk DIAAS-estimat, ulik pris ---
const byScore = new Map<number, typeof testedProteinProducts>()
for (const p of testedProteinProducts) {
  const list = byScore.get(p.score) ?? []
  list.push(p)
  byScore.set(p.score, list)
}
const sameScoreDiffPrice = [...byScore.values()].find(
  (list) => list.length >= 2 && new Set(list.map((p) => p.pricePerGramProtein)).size >= 2,
)
if (sameScoreDiffPrice) {
  const [a, b] = sameScoreDiffPrice.sort((x, y) => x.pricePerGramProtein - y.pricePerGramProtein)
  const sa = summary(a)
  const sb = summary(b)
  assert(sa.priceAssessment !== sb.priceAssessment || sa.bestFor !== sb.bestFor, 'same score diff price')
  assert(sa.limitations.some((l) => /estimat|identisk/i.test(l)), 'same score: estimat-advarsel')
} else console.warn('SKIP same score diff price')

// --- Scenario: høy proteinprosent, høy pris ---
const denseExpensive = testedProteinProducts.find(
  (p) => p.proteinPer100g >= 85 && p.pricePerGramProtein >= 1.2,
)
if (denseExpensive) {
  assert(/pris|kost/i.test(summary(denseExpensive).priceAssessment.toLowerCase()), 'dense expensive price')
} else console.warn('SKIP dense expensive')

// --- Scenario: lavere proteinprosent, god verdi ---
const valueWhey = testedProteinProducts.find((p) => ctx.winners['best-value-whey'].includes(p.id))
if (valueWhey) {
  assert(/verdi|pris|whey/i.test(summary(valueWhey).bestFor.toLowerCase()), 'value whey bestFor')
} else console.warn('SKIP value whey')

// --- DIAAS status ---
for (const p of testedProteinProducts) {
  const d = getDiaasStatus(p)
  assert(Boolean(d.label), `${p.id}: diaas label`)
  if (!p.diaasIsOfficial) {
    assert(d.kind === 'estimated' || d.kind === 'insufficient_data', `${p.id}: estimate kind`)
  }
}

// --- Alle produkter: ingen helsepåstander ---
const banned = /garantert|best for alle|trygg for alle|kurere/i
for (const p of testedProteinProducts) {
  const copy = generateProteinProductCopy(p, ctx, testedProteinProducts)
  assert(!banned.test(copy.bestFor), `${p.id}: no health claims in bestFor`)
  assert(!banned.test(copy.importantToKnow), `${p.id}: no health claims in importantToKnow`)
  if (getDiaasStatus(p).isEstimate) {
    assert(
      copy.importantToKnow.includes(DIAAS_ESTIMATE_DISCLAIMER) ||
        copy.limitations.some((l) => /estimat/i.test(l)),
      `${p.id}: estimate disclosed`,
    )
  }
}

console.log(`\n=== Protein editorial test: ${passed} passed, ${failed} failed ===`)
if (failed) process.exit(1)
console.log('OK')
