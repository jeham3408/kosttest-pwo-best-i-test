/** Protein/kreatin badge smoke tests */
import { testedCreatineProducts } from '../src/data/creatineProducts'
import { testedProteinProducts } from '../src/data/proteinProducts'
import { buildCreatineBadgeContext } from '../src/data/creatine/badges'
import { buildProteinBadgeContext, getProteinBadges } from '../src/data/protein/badges'
import { DIAAS_ESTIMATE_DISCLAIMER } from '../src/data/protein/metrics'

let ok = 0
let fail = 0
const assert = (c: boolean, m: string) => (c ? ok++ : (fail++, console.error('FAIL:', m)))

const pCtx = buildProteinBadgeContext(testedProteinProducts)
const cCtx = buildCreatineBadgeContext(testedCreatineProducts)

assert(pCtx.winners['best-protein-profile'].length > 0, 'protein profile winner')
assert(cCtx.winners['best-documentation'].length > 0, 'creatine doc winner')

for (const p of testedProteinProducts) {
  const badges = getProteinBadges(p, pCtx)
  for (const b of badges) {
    assert(!/verifisert/i.test(b.explanation), `protein badge ${b.id} no vague verified`)
  }
}

assert(DIAAS_ESTIMATE_DISCLAIMER.includes('laboratoriemåling'), 'DIAAS disclaimer')

const nutri = testedCreatineProducts.find((p) => p.dopingTestLabel)
if (nutri) {
  assert(cCtx.winners['best-doping-documented'].includes(nutri.id), 'doping badge to documented product')
}

console.log(`protein-badges: ${ok} ok, ${fail} fail`)
if (fail) process.exit(1)
