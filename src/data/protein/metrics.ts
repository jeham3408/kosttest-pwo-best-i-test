import type { GradeLetter } from '../pwoProducts'
import type { TestedProteinProduct } from '../proteinProducts'
import type { ProteinSourceType } from '../proteinScoring'
import {
  getProteinDataConfidence,
  proteinDataConfidenceMeetsMinimum,
  type ProteinDataConfidenceLevel,
} from './dataConfidence'

export function isVeganSourceType(sourceType: ProteinSourceType): boolean {
  return sourceType === 'soy-isolate' || sourceType === 'pea-rice-blend'
}

export function isCaseinSourceType(sourceType: ProteinSourceType): boolean {
  return sourceType === 'casein'
}

export function isWheySourceType(sourceType: ProteinSourceType): boolean {
  return (
    sourceType === 'whey-isolate' ||
    sourceType === 'whey-concentrate' ||
    sourceType === 'whey-blend' ||
    sourceType === 'hydrolyzed-whey' ||
    sourceType === 'clear-whey'
  )
}

export const PROTEIN_BADGE_THRESHOLDS = {
  budgetMinDiaasScore: 85,
  budgetMinProteinPer100g: 65,
  valueMinDiaasScore: 90,
  valueMinProteinPer100g: 70,
  valueMaxPriceGrades: ['A', 'B', 'C'] as GradeLetter[],
  badgeMinDataConfidence: 'medium' as ProteinDataConfidenceLevel,
  lactoseFreeMinScore: 88,
  profileMinDataConfidence: 'medium' as ProteinDataConfidenceLevel,
} as const

export const DIAAS_ESTIMATE_DISCLAIMER =
  'Estimert DIAAS betyr at verdien bygger på proteintype og tilgjengelig forskning, ikke en laboratoriemåling av akkurat dette produktet.'

export type DiaasStatusKind = 'lab_measured' | 'estimated' | 'unavailable' | 'insufficient_data'

export type DiaasStatusView = {
  kind: DiaasStatusKind
  label: string
  shortLabel: string
  scoreDisplay: string | null
  isEstimate: boolean
  explanation: string
}

export function getDiaasStatus(product: TestedProteinProduct): DiaasStatusView {
  const confidence = getProteinDataConfidence(product)

  if (confidence.level === 'insufficient' || product.proteinPer100g <= 0 || product.proteinPerServingG <= 0) {
    return {
      kind: 'insufficient_data',
      label: 'Ikke nok data',
      shortLabel: 'Ikke nok data',
      scoreDisplay: null,
      isEstimate: false,
      explanation: 'Manglende protein- eller deklarasjonsdata — DIAAS kan ikke presenteres forsvarlig.',
    }
  }

  if (product.diaasIsOfficial) {
    return {
      kind: 'lab_measured',
      label: 'Laboratoriemålt for dette produktet',
      shortLabel: `${product.diaasScore} (lab)`,
      scoreDisplay: String(product.diaasScore),
      isEstimate: false,
      explanation: 'DIAAS-score bygger på dokumentert laboratorietest av ferdig produkt.',
    }
  }

  if (product.score <= 0 || !product.sourceType) {
    return {
      kind: 'unavailable',
      label: 'Ikke tilgjengelig',
      shortLabel: 'Ikke tilgjengelig',
      scoreDisplay: null,
      isEstimate: false,
      explanation: 'Proteinkvalitet er ikke beregnet for dette produktet.',
    }
  }

  return {
    kind: 'estimated',
    label: 'Estimert fra proteintype',
    shortLabel: `${product.diaasScore} (estimat)`,
    scoreDisplay: String(product.diaasScore),
    isEstimate: true,
    explanation: DIAAS_ESTIMATE_DISCLAIMER,
  }
}

/** @deprecated Bruk getDiaasStatus */
export function formatDiaasStatus(product: TestedProteinProduct): {
  label: string
  isEstimate: boolean
  explanation: string
} {
  const d = getDiaasStatus(product)
  return {
    label: d.shortLabel,
    isEstimate: d.isEstimate,
    explanation: d.explanation,
  }
}

export function isProteinRanked(product: TestedProteinProduct): boolean {
  return product.score > 0
}

export function isEligibleForProteinBadges(product: TestedProteinProduct): boolean {
  if (!isProteinRanked(product)) return false
  const conf = getProteinDataConfidence(product)
  return proteinDataConfidenceMeetsMinimum(conf.level, PROTEIN_BADGE_THRESHOLDS.badgeMinDataConfidence)
}

export function isWheyIsolateType(sourceType: ProteinSourceType): boolean {
  return (
    sourceType === 'whey-isolate' ||
    sourceType === 'hydrolyzed-whey' ||
    sourceType === 'clear-whey'
  )
}

export function isWheyConcentrateType(sourceType: ProteinSourceType): boolean {
  return sourceType === 'whey-concentrate'
}

export function isWheyProduct(product: TestedProteinProduct): boolean {
  return isWheySourceType(product.sourceType)
}

export function isVeganProduct(product: TestedProteinProduct): boolean {
  return isVeganSourceType(product.sourceType)
}

export function isCaseinProduct(product: TestedProteinProduct): boolean {
  return isCaseinSourceType(product.sourceType)
}

/** Bare når dokumentert i produktdata — ikke anta fra isolate alene. */
export function isDocumentedLactoseFree(product: TestedProteinProduct): boolean {
  if (product.lactoseFree === true) return true
  if (product.lactoseFree === false) return false
  const text = [...product.keyFeatures, ...product.strengths, product.sourceLabel].join(' ').toLowerCase()
  const claimsFree = /laktosefri|laktosefattig|laktose-redusert/i.test(text)
  const warnsLactose = [...product.watchouts, product.verdict].some((t) =>
    /inneholder laktose|laktose \(whey concentrate\)|ikke for alvorlig intoleranse/i.test(t),
  )
  return claimsFree && !warnsLactose
}

export function isDocumentedSweetenerFree(product: TestedProteinProduct): boolean {
  if (product.sweetenerFree === true) return true
  if (product.sweetenerFree === false) return false
  const text = [...product.keyFeatures, ...product.strengths, product.name].join(' ').toLowerCase()
  return /uten søtstoff|uten søtstoff|no sweetener|unsweetened/i.test(text)
}

export function isDocumentedUnflavored(product: TestedProteinProduct): boolean {
  if (product.unflavored === true) return true
  const text = [...product.keyFeatures, product.name].join(' ').toLowerCase()
  return /nøytral|unflavored|uten smak|natural/i.test(text)
}

export function isBakingSuitable(product: TestedProteinProduct): boolean {
  if (product.suitableForBaking === true) return true
  const text = [...product.keyFeatures, ...product.strengths, product.verdict].join(' ').toLowerCase()
  return /baking|matlaging|bake/i.test(text)
}

export function getProteinPer100Kcal(product: TestedProteinProduct): number | null {
  if (product.caloriesPer100g != null && product.caloriesPer100g > 0) {
    return (product.proteinPer100g / product.caloriesPer100g) * 100
  }
  if (product.caloriesPerServing != null && product.caloriesPerServing > 0 && product.proteinPerServingG > 0) {
    return (product.proteinPerServingG / product.caloriesPerServing) * 100
  }
  return null
}

const priceGradeThresholds: { grade: GradeLetter; max: number }[] = [
  { grade: 'A', max: 0.85 },
  { grade: 'B', max: 1.0 },
  { grade: 'C', max: 1.2 },
  { grade: 'D', max: 1.45 },
  { grade: 'E', max: 1.75 },
  { grade: 'F', max: Infinity },
]

export function calculateProteinPriceGrade(pricePerGram: number): { grade: GradeLetter; label: string } {
  const row = priceGradeThresholds.find((t) => pricePerGram <= t.max)!
  return { grade: row.grade, label: `${pricePerGram.toFixed(2).replace('.', ',')} kr/g protein (${row.grade})` }
}

const priceGradeWeight: Record<GradeLetter, number> = {
  A: 1,
  B: 0.88,
  C: 0.72,
  D: 0.55,
  E: 0.38,
  F: 0.22,
}

export function calculateProteinValueIndex(product: TestedProteinProduct): {
  index: number
  diaasPart: number
  pricePart: number
  explanation: string
} {
  const priceGrade = calculateProteinPriceGrade(product.pricePerGramProtein).grade
  const diaasPart = product.score
  const pricePart = Math.round(priceGradeWeight[priceGrade] * 100)
  const index = Math.round(diaasPart * 0.72 + pricePart * 0.28)
  return {
    index,
    diaasPart,
    pricePart,
    explanation:
      `Verdiindeks ${index}/100 = 72 % DIAAS-score (${diaasPart}) + 28 % prisreferanse (${priceGrade}, ${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g). ` +
      'Endrer ikke DIAAS-rangeringen.',
  }
}

export function compareProteinThenPrice(a: TestedProteinProduct, b: TestedProteinProduct): number {
  const scoreDiff = b.score - a.score
  if (scoreDiff !== 0) return scoreDiff
  const priceDiff = a.pricePerGramProtein - b.pricePerGramProtein
  if (priceDiff !== 0) return priceDiff
  return a.name.localeCompare(b.name, 'nb')
}

export function formatAllergenSummary(product: TestedProteinProduct): string {
  if (product.allergenNote?.trim()) return product.allergenNote.trim()
  const fromWatchouts = product.watchouts.find((w) => /allergen|melk|soya|egg/i.test(w))
  return fromWatchouts ?? 'Ikke oppgitt per produkt'
}
