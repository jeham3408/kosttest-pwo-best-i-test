import type { GradeLetter } from '../pwoProducts'
import type { TestedCreatineProduct } from '../creatineProducts'
import {
  formatCreatineSourceLabel,
  hasDopingTestDisclosure,
  hasMeshDisclosure,
  hasPurityDisclosure,
  isBrandedCreatine,
} from '../creatineScoring'
import { disclosureLabels } from '../disclosureLabels'
import {
  creatineDataConfidenceMeetsMinimum,
  getCreatineDataConfidence,
  isFullyDocumentedCreatine,
  type CreatineDataConfidenceLevel,
} from './dataConfidence'

export const CREATINE_BADGE_THRESHOLDS = {
  budgetMinScore: 60,
  valueMinScore: 75,
  valueMaxPriceGrades: ['A', 'B', 'C'] as GradeLetter[],
  badgeMinDataConfidence: 'medium' as CreatineDataConfidenceLevel,
  bestPickMinScore: 85,
} as const

export function isCreatineRanked(product: TestedCreatineProduct): boolean {
  return product.score > 0
}

export function isEligibleForCreatineBadges(product: TestedCreatineProduct): boolean {
  if (!isCreatineRanked(product)) return false
  const conf = getCreatineDataConfidence(product)
  return creatineDataConfidenceMeetsMinimum(conf.level, CREATINE_BADGE_THRESHOLDS.badgeMinDataConfidence)
}

export function formatCreatinePurity(purityPercent: number | null): string {
  if (hasPurityDisclosure(purityPercent)) return `${purityPercent!.toString().replace('.', ',')} %`
  return disclosureLabels.notDisclosedByManufacturer
}

export function formatCreatineMesh(meshLabel: string | null): string {
  if (hasMeshDisclosure(meshLabel)) return meshLabel!
  return disclosureLabels.notDisclosedByManufacturer
}

export function formatCreatineDoping(product: TestedCreatineProduct): string {
  if (hasDopingTestDisclosure(product.dopingTestLabel)) return product.dopingTestLabel!
  if (isBrandedCreatine(product)) return disclosureLabels.notDocumented
  return disclosureLabels.notFoundInOpenSources
}

export function formatCreatineSource(product: TestedCreatineProduct): string {
  const label = formatCreatineSourceLabel(product)
  if (label === 'Ikke oppgitt') return disclosureLabels.notDisclosedByManufacturer
  return label
}

export function isMonohydrateForm(product: TestedCreatineProduct): boolean {
  return (
    product.form === 'monohydrate' ||
    product.form === 'monohydrate-creapure' ||
    product.form === 'micronized'
  )
}

const priceGradeThresholds: { grade: GradeLetter; max: number }[] = [
  { grade: 'A', max: 0.35 },
  { grade: 'B', max: 0.45 },
  { grade: 'C', max: 0.55 },
  { grade: 'D', max: 0.7 },
  { grade: 'E', max: 0.9 },
  { grade: 'F', max: Infinity },
]

export function calculateCreatinePriceGrade(pricePerGram: number): { grade: GradeLetter; label: string } {
  const row = priceGradeThresholds.find((t) => pricePerGram <= t.max)!
  return { grade: row.grade, label: `${pricePerGram.toFixed(2).replace('.', ',')} kr/g (${row.grade})` }
}

const priceGradeWeight: Record<GradeLetter, number> = {
  A: 1,
  B: 0.88,
  C: 0.72,
  D: 0.55,
  E: 0.38,
  F: 0.22,
}

export function calculateCreatineValueIndex(product: TestedCreatineProduct): {
  index: number
  qualityPart: number
  pricePart: number
  explanation: string
} {
  const priceGrade = calculateCreatinePriceGrade(product.pricePerGramCreatine).grade
  const qualityPart = product.score
  const pricePart = Math.round(priceGradeWeight[priceGrade] * 100)
  const index = Math.round(qualityPart * 0.72 + pricePart * 0.28)
  return {
    index,
    qualityPart,
    pricePart,
    explanation:
      `Verdiindeks ${index}/100 = 72 % kvalitetsscore (${qualityPart}) + 28 % prisreferanse (${priceGrade}). ` +
      'Endrer ikke kvalitetsscoren.',
  }
}

export function compareCreatineThenPrice(a: TestedCreatineProduct, b: TestedCreatineProduct): number {
  const scoreDiff = b.score - a.score
  if (scoreDiff !== 0) return scoreDiff
  const priceDiff = a.pricePerGramCreatine - b.pricePerGramCreatine
  if (priceDiff !== 0) return priceDiff
  return a.name.localeCompare(b.name, 'nb')
}

export function disclosureScore(product: TestedCreatineProduct): number {
  let n = 0
  if (isBrandedCreatine(product)) n++
  if (hasPurityDisclosure(product.purityPercent)) n++
  if (hasMeshDisclosure(product.meshLabel)) n++
  if (hasDopingTestDisclosure(product.dopingTestLabel)) n++
  return n
}

export { isFullyDocumentedCreatine }
