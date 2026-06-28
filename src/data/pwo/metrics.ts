import { calculatePriceGrade, type GradeLetter, type TestedProduct } from '../pwoProducts'
import { dataConfidenceMeetsMinimum, getPwoDataConfidence } from './dataConfidence'

export const PWO_BADGE_THRESHOLDS = {
  minimumRankedScore: 0,
  budgetMinFormulaScore: 28,
  valueMinFormulaScore: 34,
  valueMinPriceGrades: ['A', 'B'] as GradeLetter[],
  beginnerMaxCaffeineMg: 200,
  lowCaffeineMinMg: 1,
  lowCaffeineMaxMg: 200,
  lowCaffeineMinScore: 34,
  strongestMinCaffeineMg: 200,
  strongestMinFormulaScore: 46,
  badgeMinDataConfidence: 'medium' as const,
} as const

export function isPwoRanked(product: TestedProduct): boolean {
  return product.score >= PWO_BADGE_THRESHOLDS.minimumRankedScore
}

export function isEligibleForBadges(product: TestedProduct): boolean {
  if (!isPwoRanked(product)) return false
  const confidence = getPwoDataConfidence(product)
  return dataConfidenceMeetsMinimum(confidence.level, PWO_BADGE_THRESHOLDS.badgeMinDataConfidence)
}

export function getPumpMetric(product: TestedProduct): {
  points: number
  grade: GradeLetter | undefined
  citrullineEqMg: number
} {
  const row = product.gradeBreakdown?.find((g) => g.key === 'lCitrullineEq')
  const citrullineEqMg =
    (product.citrullineMg ?? 0) +
    ((product.extraDoses?.arginine ?? 0) * 0.5) +
    ((product.extraDoses?.beetroot ?? 0) * 0.9)
  return {
    points: row?.points ?? 0,
    grade: row?.grade,
    citrullineEqMg: Math.round(citrullineEqMg),
  }
}

export function isStimFree(product: TestedProduct): boolean {
  return !product.caffeineMg || product.caffeineMg === 0
}

export function hasLowCaffeine(product: TestedProduct): boolean {
  const mg = product.caffeineMg ?? 0
  return (
    mg >= PWO_BADGE_THRESHOLDS.lowCaffeineMinMg &&
    mg <= PWO_BADGE_THRESHOLDS.lowCaffeineMaxMg
  )
}

export function isBeginnerEligible(product: TestedProduct): boolean {
  const caffeine = product.caffeineMg ?? 0
  if (caffeine > PWO_BADGE_THRESHOLDS.beginnerMaxCaffeineMg) return false
  if (product.score < PWO_BADGE_THRESHOLDS.budgetMinFormulaScore) return false
  if (!isEligibleForBadges(product)) return false
  return true
}

/** Moderat profil — ikke ekstrem koffein eller svært høy enkelt-dose uten dokumentasjon. */
export function beginnerFitScore(product: TestedProduct): number {
  const caffeine = product.caffeineMg ?? 0
  const caffeinePenalty = caffeine === 0 ? 0 : Math.max(0, (caffeine - 150) / 200)
  const pump = getPumpMetric(product).points / 40
  return product.score * 0.65 + pump * 20 - caffeinePenalty * 8
}

const priceGradeWeight: Record<GradeLetter, number> = {
  A: 1,
  B: 0.88,
  C: 0.72,
  D: 0.55,
  E: 0.38,
  F: 0.22,
}

export function calculatePwoValueIndex(product: TestedProduct): {
  index: number
  formulaPart: number
  pricePart: number
  explanation: string
} {
  const priceGrade = calculatePriceGrade(product.pricePerServing).grade
  const formulaPart = product.score
  const pricePart = Math.round(priceGradeWeight[priceGrade] * 100)
  const index = Math.round(formulaPart * 0.72 + pricePart * 0.28)
  return {
    index,
    formulaPart,
    pricePart,
    explanation:
      `Verdiindeks ${index}/100 = 72 % formelscore (${formulaPart}) + 28 % prisreferanse (${priceGrade}, ${product.pricePerServing.toFixed(2).replace('.', ',')} kr/dose). ` +
      'Endrer ikke formelscoren eller hovudrangeringen.',
  }
}

export function compareFormulaThenPrice(a: TestedProduct, b: TestedProduct): number {
  const scoreDiff = b.score - a.score
  if (scoreDiff !== 0) return scoreDiff
  const priceDiff = a.pricePerServing - b.pricePerServing
  if (priceDiff !== 0) return priceDiff
  return a.name.localeCompare(b.name, 'nb')
}
