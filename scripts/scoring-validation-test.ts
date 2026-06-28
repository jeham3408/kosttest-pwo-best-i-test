/**
 * Regel- og scorevalidering for PWO (og felles badge-logikk).
 * Kjør: npm run release:validate
 */
import { buildPwoBadgeContext, getPwoBadges } from '../src/data/pwo/badges'
import { getPwoDataConfidence } from '../src/data/pwo/dataConfidence'
import {
  calculatePwoValueIndex,
  compareFormulaThenPrice,
  isEligibleForBadges,
  PWO_BADGE_THRESHOLDS,
} from '../src/data/pwo/metrics'
import {
  calculateProductGrade,
  PWO_FORMULA_MAX_POINTS,
  testedProducts,
  type TestedProduct,
} from '../src/data/pwoProducts'
import { DOCUMENTATION_STATUS_LABELS } from '../src/data/trust/labels'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error('FAIL:', message)
  }
}

function baseFixture(overrides: Partial<TestedProduct> = {}): TestedProduct {
  const base = testedProducts[0]
  return {
    ...base,
    id: overrides.id ?? 'fixture-product',
    name: overrides.name ?? 'Fixture PWO',
    rank: overrides.rank ?? 99,
    ...overrides,
  }
}

console.log('=== Scoring & badge validation ===\n')

// --- PWO score bounds ---
for (const p of testedProducts) {
  assert(p.score >= 0, `${p.id}: score >= 0`)
  assert(p.score <= PWO_FORMULA_MAX_POINTS, `${p.id}: score <= ${PWO_FORMULA_MAX_POINTS}`)
  const calc = calculateProductGrade(p).score
  assert(calc === p.score, `${p.id}: beregnet score (${calc}) matcher lagret (${p.score})`)
}

// --- Prisreferanse endrer ikkje formelscore ---
for (const p of testedProducts.slice(0, 5)) {
  const expensive = { ...p, pricePerServing: p.pricePerServing + 500, priceNok: p.priceNok + 25000 }
  assert(
    calculateProductGrade(p).score === calculateProductGrade(expensive).score,
    `${p.id}: prisendring endrer ikkje formelscore`,
  )
  assert(
    calculatePwoValueIndex(p).formulaPart === calculatePwoValueIndex(expensive).formulaPart,
    `${p.id}: verdiindeks.formulaPart uavhengig av pris`,
  )
  assert(
    calculatePwoValueIndex(p).formulaPart === p.score,
    `${p.id}: verdiindeks bruker lagret formelscore`,
  )
}

// --- Lik formelscore → sorter på pris per dose ---
{
  const cheap = baseFixture({
    id: 'tie-cheap',
    score: 40,
    pricePerServing: 8,
    name: 'AAA Tie Cheap',
    caffeineMg: 200,
  })
  const dear = baseFixture({
    id: 'tie-dear',
    score: 40,
    pricePerServing: 20,
    name: 'BBB Tie Dear',
    caffeineMg: 200,
  })
  assert(
    compareFormulaThenPrice(cheap, dear) < 0,
    'Lik score: billigast sorterast først (compareFormulaThenPrice)',
  )
  const sorted = [dear, cheap].sort(compareFormulaThenPrice)
  assert(sorted[0].id === 'tie-cheap', 'Lik score: sort gir lågast pris først')
}

// --- Lik score og lik pris → alfabetisk ---
{
  const a = baseFixture({ id: 'tie-a', score: 35, pricePerServing: 12, name: 'Alpha' })
  const b = baseFixture({ id: 'tie-b', score: 35, pricePerServing: 12, name: 'Beta' })
  assert(compareFormulaThenPrice(a, b) < 0, 'Lik score og pris: alfabetisk tie-break')
}

// --- Badge eligibility ---
const ctx = buildPwoBadgeContext(testedProducts)

for (const p of testedProducts) {
  const badges = getPwoBadges(p, ctx)
  const eligible = isEligibleForBadges(p)
  if (!eligible) {
    assert(badges.length === 0, `${p.id}: utan badge-eligibility får ingen badge`)
  }
}

for (const p of testedProducts.filter((x) => getPwoDataConfidence(x).level === 'insufficient')) {
  assert(!isEligibleForBadges(p), `${p.id}: insufficient confidence → ikkje badge-eligible`)
}

// --- Best formel totalt ---
{
  const eligible = testedProducts.filter(isEligibleForBadges)
  const maxScore = Math.max(...eligible.map((p) => p.score))
  const winners = ctx.winners['best-formel-total']
  assert(winners.length >= 1, 'Best formel totalt har minst éin vinnar')
  for (const id of winners) {
    const p = testedProducts.find((x) => x.id === id)!
    assert(p.score === maxScore, `${id}: best-formel-total har høgast kvalifisert score (${maxScore})`)
    assert(isEligibleForBadges(p), `${id}: best-formel vinnar er badge-eligible`)
  }
}

// --- Badge-spesifikke reglar ---
for (const id of ctx.winners['best-koffeinfri-formel']) {
  const p = testedProducts.find((x) => x.id === id)!
  assert(!p.caffeineMg || p.caffeineMg === 0, `${id}: koffeinfri-vinnar utan koffein`)
  assert(isEligibleForBadges(p), `${id}: koffeinfri-vinnar er eligible`)
}

for (const id of ctx.winners['best-budsjett']) {
  const p = testedProducts.find((x) => x.id === id)!
  assert(p.score >= PWO_BADGE_THRESHOLDS.budgetMinFormulaScore, `${id}: budsjett-vinnar over min score`)
  assert(isEligibleForBadges(p), `${id}: budsjett-vinnar er eligible`)
}

for (const id of ctx.winners['best-verdi']) {
  const p = testedProducts.find((x) => x.id === id)!
  assert(isEligibleForBadges(p), `${id}: verdi-vinnar er eligible`)
  assert(p.score >= PWO_BADGE_THRESHOLDS.valueMinFormulaScore, `${id}: verdi-vinnar over min formelscore`)
}

for (const id of ctx.winners['sterkeste']) {
  const p = testedProducts.find((x) => x.id === id)!
  assert((p.caffeineMg ?? 0) >= PWO_BADGE_THRESHOLDS.strongestMinCaffeineMg, `${id}: sterkeste har nok koffein`)
  assert(p.score >= PWO_BADGE_THRESHOLDS.strongestMinFormulaScore, `${id}: sterkeste over min score`)
}

// --- Dokumentasjonsstatus: ikkje dokumentert ≠ ikkje relevant ---
assert(
  DOCUMENTATION_STATUS_LABELS.notDocumented.label !== DOCUMENTATION_STATUS_LABELS.notApplicable.label,
  'notDocumented og notApplicable har ulike etikettar',
)
assert(
  DOCUMENTATION_STATUS_LABELS.notDocumented.label !== DOCUMENTATION_STATUS_LABELS.notFound.label,
  'notDocumented og notFound er distinkte',
)

// --- Edge case fixtures (syntetisk) ---
{
  const noPrice = baseFixture({ id: 'no-price', pricePerServing: 0, priceNok: 0 })
  const vi = calculatePwoValueIndex(noPrice)
  assert(typeof vi.index === 'number' && !Number.isNaN(vi.index), 'Produkt utan pris: verdiindeks er tal (ikkje NaN)')
}

{
  const noCaffeine = baseFixture({ id: 'no-caf', caffeineMg: null })
  const conf = getPwoDataConfidence(noCaffeine)
  assert(conf.reasons.some((r) => /koffein/i.test(r)), 'Manglande koffein: dataConfidence nemner det')
}

{
  const limited = testedProducts.find((p) => getPwoDataConfidence(p).level === 'low')
  if (limited) {
    assert(
      !isEligibleForBadges(limited) || getPwoDataConfidence(limited).level !== 'insufficient',
      'Avgrensa datatillit: insufficient blokkerer badge',
    )
  }
}

{
  const longName = baseFixture({
    id: 'long-name',
    name: 'Super® Ultra-Max™ PWO «Extreme» 500g — limited edition batch #42',
  })
  assert(longName.name.length > 40, 'Langt namn + spesialteikn: fixture OK')
  assert(calculateProductGrade(longName).score >= 0, 'Langt namn: score bereknast')
}

// --- Alle tildelte badgar har grunnlag ---
assert(
  testedProducts.flatMap((p) => getPwoBadges(p, ctx)).every((b) => b.eligibilityReason.length > 5),
  'Alle badgar har eligibilityReason',
)

console.log(`\nResultat: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Alle scoring-valideringar OK')
