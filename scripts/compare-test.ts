import assert from 'node:assert/strict'
import {
  buildCompareUrl,
  getSortedFields,
  parseCompareIdsFromSearch,
  parseCompareRoute,
  pwoCompareConfig,
} from '../src/compare'
import { generatePwoCompareDiff } from '../src/compare/categories/pwo'

// URL parsing
assert.equal(parseCompareRoute('/tester/pwo/sammenlign/'), 'pwo')
assert.equal(parseCompareRoute('/tester/pwo/samanlikn/'), 'pwo')
assert.equal(parseCompareRoute('/tester/protein/sammenlign'), 'protein')
assert.deepEqual(parseCompareIdsFromSearch('?compare=peveo-maxed,nutritac-midnight'), [
  'peveo-maxed',
  'nutritac-midnight',
])
assert.equal(
  buildCompareUrl('pwo', ['a', 'b']),
  '/tester/pwo/sammenlign/?compare=a%2Cb',
)

// PWO fields cover required criteria
const fieldKeys = getSortedFields('pwo').map((f) => f.key)
const required = [
  'formulaScore',
  'rank',
  'pricePerDose',
  'valueRef',
  'caffeine',
  'pumpEq',
  'betaAlanine',
  'betaine',
  'taurine',
  'tyrosine',
  'glycerol',
  'electrolytes',
  'servingSize',
  'dataStatus',
  'lastChecked',
  'source',
  'badges',
  'bestFor',
  'importantToKnow',
]
for (const key of required) {
  assert.ok(fieldKeys.includes(key), `Missing PWO compare field: ${key}`)
}

// Diff engine produces factual bullets
const sample = pwoCompareConfig.resolveProducts(['peveo-maxed', 'nutritac-midnight'])
assert.ok(sample.length >= 2)
const diff = generatePwoCompareDiff(sample)
assert.ok(diff.length >= 1, 'Expected at least one diff bullet')
assert.ok(!/\bvinnar\b/i.test(diff.join(' ')), 'Diff must not use "vinnar"')
assert.ok(!/\btryggast\b/i.test(diff.join(' ')), 'Diff must not use medical claims')

console.log('✓ Compare URL parsing')
console.log('✓ PWO field coverage')
console.log('✓ Diff engine sanity')
console.log('\nAlle compare-testar OK')
