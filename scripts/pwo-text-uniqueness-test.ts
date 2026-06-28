import { buildPwoBadgeContext, generatePwoProductCopy } from '../src/data/pwo/index'
import { testedProducts } from '../src/data/pwoProducts'

const ctx = buildPwoBadgeContext(testedProducts)
const byText = new Map<string, string[]>()

for (const p of testedProducts) {
  const text = generatePwoProductCopy(p, ctx, testedProducts).bestFor
  const list = byText.get(text) ?? []
  list.push(p.id)
  byText.set(text, list)
}

const MAX_DUP = 2
let failed = false

for (const [text, ids] of byText.entries()) {
  if (ids.length > MAX_DUP) {
    failed = true
    console.error(`✗ Tekst brukt ${ids.length} ganger (> ${MAX_DUP}):`)
    console.error(`  "${text.slice(0, 100)}..."`)
    console.error(`  Produkt: ${ids.join(', ')}`)
  }
}

const svak = testedProducts.find((p) => p.score < 11)
const middels = testedProducts.find((p) => p.score >= 34 && p.score < 46)
const sterk = testedProducts.find((p) => p.score >= 46 && !generatePwoProductCopy(p, ctx).bestFor.startsWith('Ikke'))

console.log('\nEksempeltekster:')
for (const [label, p] of [
  ['Svak', svak],
  ['Middels', middels],
  ['Sterk', sterk],
] as const) {
  if (!p) continue
  const copy = generatePwoProductCopy(p, ctx, testedProducts)
  console.log(`\n[${label}] ${p.name} (${p.score} poeng)`)
  console.log('  bestFor:', copy.bestFor)
  console.log('  viktig:', copy.importantToKnow)
}

if (failed) {
  console.error('\nUniqueness-test feila')
  process.exit(1)
}
console.log('\nUniqueness-test OK')
