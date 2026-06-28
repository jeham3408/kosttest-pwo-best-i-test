import {
  buildPwoBadgeContext,
  generatePwoProductCopy,
  getPwoEditorialSummary,
} from '../src/data/pwo/index'
import { getPwoDataConfidence } from '../src/data/pwo/dataConfidence'
import { calculatePriceGrade, testedProducts, type TestedProduct } from '../src/data/pwoProducts'

const ctx = buildPwoBadgeContext(testedProducts)
let passed = 0
let failed = 0

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++
  } else {
    failed++
    console.error('FAIL:', msg)
  }
}

function summaryFor(p: TestedProduct) {
  return getPwoEditorialSummary(p, testedProducts, ctx)
}

function copyFor(p: TestedProduct) {
  return generatePwoProductCopy(p, ctx, testedProducts)
}

// --- Uniqueness: max 2 identical bestFor ---
const byBestFor = new Map<string, string[]>()
for (const p of testedProducts) {
  const text = copyFor(p).bestFor
  const list = byBestFor.get(text) ?? []
  list.push(p.id)
  byBestFor.set(text, list)
}
for (const [text, ids] of byBestFor.entries()) {
  assert(ids.length <= 2, `bestFor brukt ${ids.length} ganger (>2): "${text.slice(0, 80)}…" — ${ids.join(', ')}`)
}

// --- Scenario 1: Høy formelscore, høy pris ---
const highScoreHighPrice = testedProducts.find(
  (p) => p.score >= 46 && ['D', 'E', 'F'].includes(calculatePriceGrade(p.pricePerServing).grade),
)
if (highScoreHighPrice) {
  const s = summaryFor(highScoreHighPrice)
  assert(s.severity === 'strong' || s.severity === 'incomplete', '1: severity for høy score')
  assert(
    /pris|verdi/i.test(s.priceAssessment) || /pris/i.test(s.importantToKnow),
    '1: pris omtales for dyrt toppprodukt',
  )
  assert(!/garantert|trygg|best i test/i.test(s.bestFor), '1: ingen overdrevne påstander')
} else {
  console.warn('SKIP scenario 1: ingen høy score + høy pris funnet')
}

// --- Scenario 2: Høy formelscore, koffeinfri (full deklarasjon) ---
const highStimFree = testedProducts
  .filter(
    (p) =>
      (!p.caffeineMg || p.caffeineMg === 0) &&
      p.score >= 34 &&
      !getPwoDataConfidence(p).notFullyAssessed,
  )
  .sort((a, b) => b.score - a.score)[0]
if (highStimFree) {
  const s = summaryFor(highStimFree)
  assert(/koffein|kveld|stim/i.test(s.bestFor.toLowerCase()), '2: koffeinfri profil i bestFor')
} else {
  console.warn('SKIP scenario 2')
}

// --- Scenario 3: Høy koffein, lav formelscore ---
const highCafLowScore = testedProducts.find((p) => (p.caffeineMg ?? 0) >= 300 && p.score < 34)
if (highCafLowScore) {
  const s = summaryFor(highCafLowScore)
  assert(s.severity === 'limited', '3: lav score gir limited severity')
  assert(!/sterk formel|solid pump|komplett pwo/i.test(s.bestFor.toLowerCase()), '3: ingen positive overdrivelser')
  assert(
    s.limitations.some((l) => /koffein|stimulans|dose/i.test(l)) || /koffein/i.test(s.bestFor),
    '3: koffein eller svak dose omtales',
  )
} else {
  console.warn('SKIP scenario 3')
}

// --- Scenario 4: Lav pris, lav formelscore ---
const cheapLow = testedProducts.find(
  (p) => p.score < 11 && ['A', 'B'].includes(calculatePriceGrade(p.pricePerServing).grade),
)
if (cheapLow) {
  const s = summaryFor(cheapLow)
  assert(/pris|budsjett/i.test(s.bestFor.toLowerCase()), '4: pris i bestFor for billig svak')
  assert(s.severity === 'limited', '4: limited severity')
} else {
  console.warn('SKIP scenario 4')
}

// --- Scenario 5: Middels score, god pris ---
const midGoodPrice = testedProducts.find(
  (p) => p.score >= 34 && p.score < 46 && ['A', 'B'].includes(calculatePriceGrade(p.pricePerServing).grade),
)
if (midGoodPrice) {
  const s = summaryFor(midGoodPrice)
  assert(s.severity === 'balanced', '5: balanced severity')
  assert(s.bestFor.length > 20, '5: konkret bestFor')
} else {
  console.warn('SKIP scenario 5')
}

// --- Scenario 6: Manglende deklarasjon ---
const incomplete = testedProducts.find((p) => getPwoDataConfidence(p).notFullyAssessed)
if (incomplete) {
  const s = summaryFor(incomplete)
  assert(s.severity === 'incomplete', '6: incomplete severity')
  assert(s.bestFor.startsWith('Ikke fullt vurdert'), '6: incomplete bestFor-prefix')
  assert(/mangler|manglende|ikke oppgitt/i.test(s.importantToKnow.toLowerCase()), '6: mangler-data i importantToKnow')
  assert(s.strengths.length <= 1, '6: få styrker ved incomplete')
} else {
  console.warn('SKIP scenario 6')
}

// --- Scenario 7: Manglende koffeinverdi ---
const missingCaf = testedProducts.find((p) => p.caffeineMg === null)
if (missingCaf) {
  const s = summaryFor(missingCaf)
  assert(s.severity === 'incomplete', '7: manglende koffein gir incomplete')
  assert(/koffein/i.test(s.dataStatus.toLowerCase()), '7: koffein i datastatus')
} else {
  console.warn('SKIP scenario 7')
}

// --- Scenario 8: Nesten identiske ingrediensprofiler ---
const byPump = new Map<number, TestedProduct[]>()
for (const p of testedProducts) {
  const pump = Math.round(p.gradeBreakdown?.find((g) => g.key === 'lCitrullineEq')?.points ?? 0)
  const list = byPump.get(pump) ?? []
  list.push(p)
  byPump.set(pump, list)
}
const similarPair = [...byPump.values()].find((list) => list.length >= 2)
if (similarPair) {
  const [a, b] = similarPair
  const sa = summaryFor(a)
  const sb = summaryFor(b)
  assert(sa.bestFor !== sb.bestFor, '8: lignende pump-profil skal ha ulik bestFor')
} else {
  console.warn('SKIP scenario 8')
}

// --- Scenario 9: Samme score, ulik pris ---
const byScore = new Map<number, TestedProduct[]>()
for (const p of testedProducts) {
  const list = byScore.get(p.score) ?? []
  list.push(p)
  byScore.set(p.score, list)
}
const scorePair = [...byScore.values()].find(
  (list) => list.length >= 2 && new Set(list.map((p) => p.pricePerServing)).size >= 2,
)
if (scorePair) {
  const [a, b] = scorePair.sort((x, y) => x.pricePerServing - y.pricePerServing)
  const sa = summaryFor(a)
  const sb = summaryFor(b)
  assert(sa.priceAssessment !== sb.priceAssessment || sa.bestFor !== sb.bestFor, '9: ulik pris skal skille tekst')
} else {
  console.warn('SKIP scenario 9')
}

// --- Scenario 10: Høy score, begrenset datakvalitet ---
const highIncomplete = testedProducts.find(
  (p) => p.score >= 46 && getPwoDataConfidence(p).notFullyAssessed,
)
if (highIncomplete) {
  const s = summaryFor(highIncomplete)
  assert(s.severity === 'incomplete', '10: høy score men incomplete data')
  assert(s.bestFor.startsWith('Ikke fullt vurdert'), '10: ikke positiv bestFor uten full data')
} else {
  console.warn('SKIP scenario 10')
}

// --- Alle produkter: påkrevde felt ---
const banned = /garantert|trygg for|best i test|solid pump|komplett pwo/i
for (const p of testedProducts) {
  const s = summaryFor(p)
  assert(Boolean(s.bestFor), `${p.id}: bestFor`)
  assert(Boolean(s.importantToKnow), `${p.id}: importantToKnow`)
  assert(Boolean(s.priceAssessment), `${p.id}: priceAssessment`)
  assert(Boolean(s.dataStatus), `${p.id}: dataStatus`)
  assert(Boolean(s.scoreExplanation), `${p.id}: scoreExplanation`)
  assert(!/enkel PWO med score/i.test(s.bestFor), `${p.id}: unngå generisk «enkel PWO med score»`)
  if (s.severity === 'limited' && p.score < 11) {
    assert(!banned.test(s.bestFor), `${p.id}: svakt produkt uten overdrivelse`)
  }
}

console.log(`\n=== PWO editorial test: ${passed} passed, ${failed} failed ===`)
if (failed) process.exit(1)
console.log('OK')
