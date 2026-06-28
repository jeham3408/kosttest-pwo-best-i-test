/**
 * Datakonsistens og redaksjonell validering (utover scoring-validation-test).
 * Kjør: npm run data:validate
 */
import { testedCreatineProducts } from '../src/data/creatineProducts'
import { testedProteinProducts } from '../src/data/proteinProducts'
import { testedProducts } from '../src/data/pwoProducts'
import { buildPwoBadgeContext, generatePwoProductCopy } from '../src/data/pwo'
import { getPwoDataConfidence } from '../src/data/pwo/dataConfidence'
import { formatCreatineDoping, formatCreatinePurity } from '../src/data/creatine'
import { resolveCreatineTrust } from '../src/data/trust/resolvers/creatine'
import { resolveProteinTrust } from '../src/data/trust/resolvers/protein'
import { resolvePwoTrust } from '../src/data/trust/resolvers/pwo'
import { MISSING_VALUE } from '../src/data/trust/labels'
import { DOPING_TEST_STATUS_LABELS, LABORATORY_TEST_STATUS_LABELS } from '../src/data/trust/enums'

let passed = 0
let failed = 0
const assert = (c: boolean, m: string) => {
  if (c) passed++
  else {
    failed++
    console.error('FAIL:', m)
  }
}

console.log('=== Data & editorial validation ===\n')

const ctx = buildPwoBadgeContext(testedProducts)
const copies = testedProducts.map((p) => generatePwoProductCopy(p, ctx, testedProducts))
const bestForTexts = copies.map((c) => c.bestFor)
const uniqueBestFor = new Set(bestForTexts)
assert(
  uniqueBestFor.size >= testedProducts.length * 0.85,
  `«Passer best for» er variert (${uniqueBestFor.size}/${testedProducts.length} unike)`,
)

for (const p of testedProducts.filter((x) => x.score < 25)) {
  const copy = generatePwoProductCopy(p, ctx, testedProducts)
  assert(
    !/topp|beste valg|anbefales for alle|perfekt for/i.test(copy.bestFor),
    `Lav score uten for positiv anbefaling (${p.id})`,
  )
  assert(
    !/garantert|trygt for alle|beste på markedet/i.test(copy.importantToKnow),
    `Lav score uten effektpåstand (${p.id})`,
  )
}

for (const p of testedProducts) {
  const conf = getPwoDataConfidence(p)
  const snap = resolvePwoTrust(p)
  if (conf.level === 'limited' || conf.level === 'insufficient') {
    assert(snap.dataConfidence !== 'high', `Begrenset PWO-data ikke vist som høy tillit (${p.id})`)
  }
}

const datePattern = /^\d{1,2}\.\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\s+\d{4}$/i
for (const p of testedProducts.slice(0, 8)) {
  const snap = resolvePwoTrust(p)
  if (snap.lastVerifiedAt !== MISSING_VALUE && !snap.lastVerifiedAt.includes('(')) {
    assert(datePattern.test(snap.lastVerifiedAt), `PWO datoformat (${p.id}): ${snap.lastVerifiedAt}`)
  }
}

for (const p of testedProteinProducts.slice(0, 8)) {
  const snap = resolveProteinTrust(p)
  assert(snap.labTestStatus !== '0', `Protein lab-status ikke «0» (${p.id})`)
  if (!p.diaasIsOfficial) {
    assert(
      snap.laboratoryTestStatus !== 'official_diaas_documented',
      `Estimat-protein ikke markert som offisiell DIAAS-test (${p.id})`,
    )
  }
}

for (const p of testedCreatineProducts) {
  const purity = formatCreatinePurity(p.purityPercent)
  const doping = formatCreatineDoping(p)
  assert(purity !== '0', `Kreatin renhet ikke vist som 0 (${p.id})`)
  assert(doping !== '0', `Kreatin doping ikke vist som 0 (${p.id})`)
  const snap = resolveCreatineTrust(p)
  if (snap.dopingTestStatusCode === 'not_relevant') {
    assert(false, `Kreatin doping skal ikke være not_relevant (${p.id})`)
  }
}

assert(
  LABORATORY_TEST_STATUS_LABELS.not_tested_by_kosttest.label !== MISSING_VALUE,
  'Lab «ikke testet» er eksplisitt etikett',
)
assert(
  DOPING_TEST_STATUS_LABELS.not_relevant.label !== DOPING_TEST_STATUS_LABELS.not_documented.label,
  'Doping not_relevant ≠ not_documented',
)

for (const p of testedProteinProducts.filter((x) => resolveProteinTrust(x).dataConfidence === 'limited')) {
  assert(
    resolveProteinTrust(p).trustLevel !== 'high',
    `Protein med begrenset datakvalitet ikke «høy» tillit (${p.id})`,
  )
}

console.log(`\n=== Resultat: ${passed} passed, ${failed} failed ===`)
if (failed) process.exit(1)
console.log('OK')
