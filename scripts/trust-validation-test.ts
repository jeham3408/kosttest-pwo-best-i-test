/**
 * Validering av datatillit mot produktregler.
 * Kjør: npm run trust:validate
 */
import { testedCreatineProducts } from '../src/data/creatineProducts'
import { testedProteinProducts } from '../src/data/proteinProducts'
import { listedProducts, testedProducts } from '../src/data/pwoProducts'
import { getPwoDataConfidence } from '../src/data/pwo/dataConfidence'
import { hasDopingTestDisclosure } from '../src/data/creatineScoring'
import {
  getPendingReviewItems,
  getProteinPendingReviewItems,
  MISSING_VALUE,
  resolveCreatineTrust,
  resolvePendingTrust,
  resolveProteinTrust,
  resolvePwoTrust,
  validateAllProductTrust,
} from '../src/data/trust'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) passed++
  else {
    failed++
    console.error('FAIL:', message)
  }
}

function findPwo(id: string) {
  const p = testedProducts.find((x) => x.id === id)
  if (!p) throw new Error(`PWO ${id} ikke funnet`)
  return p
}

function findProtein(id: string) {
  const p = testedProteinProducts.find((x) => x.id === id)
  if (!p) throw new Error(`Protein ${id} ikke funnet`)
  return p
}

console.log('=== Trust validation tests ===\n')

// Scenario: fullt dokumentert protein (audit)
const audited = resolveProteinTrust(findProtein('bodylab-whey-100'))
assert(audited.changeLog.length > 0, 'Fullt dokumentert protein har endringslogg')
assert(audited.sourceLinks.length > 0, 'Fullt dokumentert protein har kildelenker')
assert(audited.dataConfidence === 'medium' || audited.dataConfidence === 'high', 'Audited protein har datakvalitet')

// Scenario: delvis dokumentert protein (uten offisiell DIAAS)
const partial = testedProteinProducts.find((p) => !p.diaasIsOfficial)
if (partial) {
  const snap = resolveProteinTrust(partial)
  assert(snap.missingFields.some((f) => /DIAAS/i.test(f)), 'Delvis dokumentert protein viser manglende DIAAS')
  assert(snap.documentationStatus === 'incomplete' || snap.lastVerifiedAt !== MISSING_VALUE, 'Delvis protein har status')
}

// Scenario: produkt uten pris (pending PWO)
const pwoPending = getPendingReviewItems('pwo', listedProducts)
if (pwoPending[0]) {
  const snap = resolvePendingTrust(pwoPending[0])
  assert(snap.lastPriceCheckedAt === MISSING_VALUE, 'Pending uten pris viser manglende prisdato')
  assert(!snap.isRanked, 'Pending er ikke rangert')
}

// Scenario: produkt uten bilde — sjekk at trust ikke finner på data
const noImage = testedProducts.find((p) => !p.image?.trim())
if (noImage) {
  const snap = resolvePwoTrust(noImage)
  assert(Boolean(snap.lastVerifiedAt), 'Produkt uten bilde har fortsatt sist-kontrollert-streng')
}

// Scenario: produkt uten dopingtest (kreatin)
const noDoping = testedCreatineProducts.find((p) => !hasDopingTestDisclosure(p.dopingTestLabel))
if (noDoping) {
  const snap = resolveCreatineTrust(noDoping)
  assert(
    snap.dopingTestStatusCode === 'not_documented' || snap.dopingTestStatusCode === 'not_found_in_public_sources',
    'Uten dopingtest har eksplisitt status',
  )
}

// Scenario: produkt med ukjent råvare
const unknownRaw = testedCreatineProducts.find((p) => !p.isCreapure && !p.creatineBrand)
if (unknownRaw) {
  const snap = resolveCreatineTrust(unknownRaw)
  assert(snap.rawMaterialDocumentationStatus === 'not_documented', 'Ukjent råvare markert som ikke dokumentert')
}

// Scenario: utgått / pending
assert(pwoPending.some((p) => /utgått|utsolgt|deklarasjon/i.test(p.reason)), 'Pending-liste dekker utgått/deklarasjon')

// Scenario: venter på kontroll (protein kø)
const proteinPending = getProteinPendingReviewItems()
assert(proteinPending.length > 0, 'Protein har produkter som venter på kontroll')
for (const item of proteinPending.slice(0, 2)) {
  const snap = resolvePendingTrust(item)
  assert(snap.rankingStatus === 'pending_review', 'Protein pending har rankingStatus pending_review')
  assert(snap.missingFields.length > 0, 'Pending protein viser manglende felt')
}

// Kompakt visning — ingen tomme celler
const compact = resolvePwoTrust(findPwo(testedProducts[0]!.id))
assert(Boolean(compact.dataSourceShort), 'Kompakt visning har kilde')
assert(Boolean(compact.dataConfidence), 'Kompakt visning har datakvalitet')

// Validering på tvers av katalog
const issues = validateAllProductTrust()
const errors = issues.filter((i) => i.severity === 'error')
assert(errors.length === 0, `Ingen valideringsfeil (fant ${errors.length})`)

// Rangert PWO med høy tillit
const pwoHigh = testedProducts.find((p) => getPwoDataConfidence(p).level === 'high')
if (pwoHigh) {
  const snap = resolvePwoTrust(pwoHigh)
  assert(snap.laboratoryTestStatus === 'not_tested_by_kosttest', 'PWO er ikke lab-testet av Kosttest')
}

console.log(`\n=== Resultat: ${passed} passed, ${failed} failed ===`)
if (issues.length > 0) {
  console.log(`\nAdvarsler (${issues.length}):`)
  for (const issue of issues.slice(0, 15)) {
    console.log(`  [${issue.severity}] ${issue.productId}: ${issue.message}`)
  }
  if (issues.length > 15) console.log(`  … og ${issues.length - 15} til`)
}
if (failed > 0) process.exit(1)
console.log('OK')
