export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export type GradeBreakdown = {
  key: string
  label: string
  doseLabel: string
  grade: GradeLetter
  points: number
  maxPoints: number
  note: string
}

export type IngredientRule = {
  key: string
  label: string
  weight: number
  cDoseMg: number
  aDoseMg: number
  note: string
}

export function scoreDose(doseMg: number | null | undefined, rule: IngredientRule): number {
  const dose = doseMg ?? 0
  if (dose <= 0) return 0

  const cDose = rule.cDoseMg
  const aDose = rule.aDoseMg
  const bDose = cDose + (aDose - cDose) / 2

  if (dose >= aDose) return 1
  if (dose >= bDose) {
    const t = (dose - bDose) / (aDose - bDose)
    return 0.85 + t * 0.15
  }
  if (dose >= cDose) {
    const t = (dose - cDose) / (bDose - cDose)
    return 0.7 + t * 0.15
  }
  if (dose >= cDose * 0.5) {
    const t = (dose - cDose * 0.5) / (cDose * 0.5)
    return 0.45 + t * 0.25
  }
  if (dose >= cDose * 0.25) {
    const t = (dose - cDose * 0.25) / (cDose * 0.25)
    return 0.2 + t * 0.25
  }

  const t = dose / (cDose * 0.25)
  return 0 + t * 0.2
}

export function letterFromScoreValue(score: number): GradeLetter {
  if (score >= 0.85) return 'A'
  if (score >= 0.7) return 'B'
  if (score >= 0.5) return 'C'
  if (score >= 0.3) return 'D'
  if (score >= 0.1) return 'E'
  return 'F'
}

export function letterFromScore(score: number): GradeLetter {
  if (score >= 61) return 'A'
  if (score >= 49) return 'B'
  if (score >= 36) return 'C'
  if (score >= 24) return 'D'
  if (score >= 12) return 'E'
  return 'F'
}

export function formatDose(doseMg: number | null | undefined) {
  if (doseMg === null || doseMg === undefined) return '0 mg'
  if (doseMg >= 1000) return `${(doseMg / 1000).toLocaleString('nb-NO')} g`
  return `${doseMg.toLocaleString('nb-NO')} mg`
}

export function scoreFromRules(
  rules: IngredientRule[],
  doseFor: (key: string) => number | null | undefined,
): { score: number; overallGrade: GradeLetter; gradeBreakdown: GradeBreakdown[] } {
  const gradeBreakdown = rules.map((rule) => {
    const dose = doseFor(rule.key)
    const raw = scoreDose(dose, rule)
    const points = raw * rule.weight
    return {
      key: rule.key,
      label: rule.label,
      doseLabel: formatDose(dose ?? 0),
      grade: letterFromScoreValue(raw),
      points,
      maxPoints: rule.weight,
      note: rule.note,
    }
  })

  const rawScore = gradeBreakdown.reduce((sum, item) => sum + item.points, 0)
  const score = Math.max(0, Math.min(100, Math.round(rawScore)))

  return {
    score,
    overallGrade: letterFromScore(score),
    gradeBreakdown,
  }
}

export const gradeColors: Record<GradeLetter, string> = {
  A: '#16824d',
  B: '#4b9f45',
  C: '#c7a01f',
  D: '#d27c22',
  E: '#c85032',
  F: '#b51f2b',
}
