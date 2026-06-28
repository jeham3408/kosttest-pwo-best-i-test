/**
 * Datatillit — smoke- og integrasjonstestar.
 * Kjør: npm run trust:test
 */
import { testedCreatineProducts } from '../src/data/creatineProducts'
import { testedProteinProducts } from '../src/data/proteinProducts'
import { listedProducts, testedProducts } from '../src/data/pwoProducts'
import {
  getPwoPendingReviewItems,
  resolveCreatineTrust,
  resolveProteinTrust,
  resolvePwoTrust,
  TRUST_LEVEL_COPY,
} from '../src/data/trust'
import { getPwoDataConfidence } from '../src/data/pwo/dataConfidence'
import { hasDopingTestDisclosure } from '../src/data/creatineScoring'

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

function findPwo(id: string) {
  const p = testedProducts.find((x) => x.id === id)
  if (!p) throw new Error(`PWO ${id} ikkje funne`)
  return p
}

function findProtein(id: string) {
  const p = testedProteinProducts.find((x) => x.id === id)
  if (!p) throw new Error(`Protein ${id} ikkje funne`)
  return p
}

console.log('=== Trust system tests ===\n')

// Etikettar — ingen vage «verifisert»
for (const level of Object.keys(TRUST_LEVEL_COPY) as (keyof typeof TRUST_LEVEL_COPY)[]) {
  const copy = TRUST_LEVEL_COPY[level]
  assert(!/\bverifisert\b/i.test(copy.explanation), `Tillitsnivå ${level} bruker ikkje vage «verifisert»`)
  assert(copy.label.length > 3, `Tillitsnivå ${level} har label`)
}

// PWO — laboratorietest alltid «ikkje av Kosttest»
const pwoHigh = testedProducts.find((p) => getPwoDataConfidence(p).level === 'high')
if (pwoHigh) {
  const snap = resolvePwoTrust(pwoHigh)
  assert(snap.trustLevel === 'high', 'PWO med høg konfidens → høg datatillit')
  assert(snap.labTestStatus.includes('Ikke laboratorietestet'), 'PWO labtest-label er eksplisitt')
  assert(snap.isRanked, 'Rangert PWO er markert som rangert')
}

const pwoLimited = testedProducts.find((p) => getPwoDataConfidence(p).level === 'limited')
if (pwoLimited) {
  const snap = resolvePwoTrust(pwoLimited)
  assert(snap.trustLevel === 'limited', 'PWO med avgrensa konfidens → avgrensa tillit')
  assert(snap.missingFields.length > 0, 'Avgrensa PWO viser manglande felt')
}

// Ikkje finn på endringslogg utan data
for (const p of testedProducts.slice(0, 5)) {
  const snap = resolvePwoTrust(p)
  assert(Array.isArray(snap.changeLog), 'Endringslogg er array')
  for (const entry of snap.changeLog) {
    assert(Boolean(entry.publicSummary), 'Endringslogg har offentleg setning')
    assert(!/intern|api.?nøkkel|admin/i.test(entry.publicSummary), 'Ingen interne notat i logg')
  }
}

// Protein — audit med endringslogg
const proteinAudited = findProtein('bodylab-whey-100')
const proteinSnap = resolveProteinTrust(proteinAudited)
assert(proteinSnap.changeLog.length > 0, 'Bodylab har endringslogg frå audit JSON')
assert(proteinSnap.sourceLinks.length > 0, 'Bodylab har kjeldelenker frå audit')
for (const entry of proteinSnap.changeLog) {
  assert(entry.publicSummary.includes(':'), 'Endringslogg har dato-format')
}

// Protein utan offisiell DIAAS
const proteinEst = testedProteinProducts.find((p) => !p.diaasIsOfficial)
if (proteinEst) {
  const snap = resolveProteinTrust(proteinEst)
  assert(snap.missingFields.some((f) => /DIAAS/i.test(f)), 'Protein utan offisiell DIAAS viser manglande')
}

// Kreatin — dopingtest
const creatineWithDoping = testedCreatineProducts.find((p) => hasDopingTestDisclosure(p.dopingTestLabel))
const creatineWithoutDoping = testedCreatineProducts.find((p) => !hasDopingTestDisclosure(p.dopingTestLabel))
if (creatineWithDoping) {
  assert(
    resolveCreatineTrust(creatineWithDoping).dopingTestStatus.includes('dokumentert'),
    'Kreatin med doping viser dokumentert',
  )
}
if (creatineWithoutDoping) {
  const snap = resolveCreatineTrust(creatineWithoutDoping)
  assert(
    snap.dopingTestStatus.toLowerCase().includes('ikke dokumentert'),
    'Kreatin uten doping viser ikke dokumentert',
  )
  assert(snap.missingFields.some((f) => /Doping/i.test(f)), 'Manglande doping i missingFields')
}

// Pending review — ikkje rangert
const pending = getPwoPendingReviewItems(listedProducts)
assert(pending.length > 0, 'Minst eitt produkt ventar på kontroll')
for (const item of pending.slice(0, 3)) {
  assert(Boolean(item.reason), 'Pending har grunn')
  assert(item.missingFields.length > 0, 'Pending har manglande felt')
  assert(item.status !== 'Rangert', 'Pending er ikkje rangert')
}

// Manglande per-produkt dato — bruk MISSING_VALUE der relevant
const pendingSnap = resolvePwoTrust(findPwo(testedProducts[0]!.id))
assert(pendingSnap.lastChecked.length > 0, 'Sist kontrollert er alltid ein streng')

// Feedback-kontekst
assert(Boolean(pendingSnap.feedbackContext.productName), 'Feedback-kontekst har produktnamn')
assert(Boolean(pendingSnap.feedbackContext.pageUrl), 'Feedback-kontekst har pageUrl')

console.log(`\n=== Resultat: ${passed} passed, ${failed} failed ===`)
if (failed > 0) process.exit(1)
console.log('OK')
