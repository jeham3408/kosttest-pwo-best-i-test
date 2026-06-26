import type { GradeLetter } from './pwoProducts'

export type CreatineForm = 'monohydrate' | 'micronized' | 'hcl' | 'malate' | 'buffered'
export type CreatineFormat = 'powder' | 'gummies'

/** Effektiv kreatin-monohydrat-ekvivalent per form (forskning + etikettpraksis). */
export const FORM_EQUIVALENCE: Record<CreatineForm, number> = {
  monohydrate: 1.0,
  micronized: 1.0,
  hcl: 0.95,
  malate: 0.92,
  buffered: 0.88,
}

export const creatineScoringRules = {
  doseWeight: 0.6,
  formWeight: 0.15,
  priceWeight: 0.25,
  targetDoseMg: { min: 3000, ideal: 5000 },
  summary:
    'Kreatin scores 60 % på dose (3–5 g vedlikeholdsdose per servering), 15 % på form (monohydrat = referanse) og 25 % på pris per g effektiv kreatin.',
}

export type CreatineGradeBreakdown = {
  key: string
  label: string
  grade: GradeLetter
  points: number
  maxPoints: number
  doseLabel: string
}

function gradeFromRatio(ratio: number): GradeLetter {
  if (ratio >= 0.9) return 'A'
  if (ratio >= 0.75) return 'B'
  if (ratio >= 0.6) return 'C'
  if (ratio >= 0.45) return 'D'
  return 'F'
}

function doseScore(creatineMgPerServing: number): { score: number; grade: GradeLetter; label: string } {
  const mg = creatineMgPerServing
  let score: number
  let label: string
  if (mg >= 3000 && mg <= 6000) {
    score = 100
    label = `${mg} mg/dose — full vedlikeholdsdose`
  } else if (mg >= 2000) {
    score = 75
    label = `${mg} mg/dose — under anbefalt 3 g`
  } else if (mg >= 1000) {
    score = 45
    label = `${mg} mg/dose — krever flere serveringer`
  } else {
    score = 15
    label = `${mg} mg/dose — for lav dose`
  }
  return { score, grade: gradeFromRatio(score / 100), label }
}

function formScore(form: CreatineForm): { score: number; grade: GradeLetter; label: string } {
  const eq = FORM_EQUIVALENCE[form]
  const score = Math.round(eq * 100)
  const labels: Record<CreatineForm, string> = {
    monohydrate: 'Kreatinmonohydrat (referanseform)',
    micronized: 'Mikronisert monohydrat',
    hcl: 'Kreatin HCl',
    malate: 'Kreatin malat',
    buffered: 'Bufret / Kre-Alkalyn',
  }
  return { score, grade: gradeFromRatio(eq), label: labels[form] }
}

function priceScore(pricePerGramCreatine: number): { score: number; grade: GradeLetter; label: string } {
  let score: number
  if (pricePerGramCreatine <= 0.35) score = 100
  else if (pricePerGramCreatine <= 0.5) score = 85
  else if (pricePerGramCreatine <= 0.7) score = 65
  else if (pricePerGramCreatine <= 1.0) score = 45
  else score = 25
  return {
    score,
    grade: gradeFromRatio(score / 100),
    label: `${pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin`,
  }
}

export function calculateCreatineGrade(input: {
  creatineMgPerServing: number
  creatineForm: CreatineForm
  pricePerGramCreatine: number
}): {
  score: number
  overallGrade: GradeLetter
  gradeBreakdown: CreatineGradeBreakdown[]
  effectiveCreatineMg: number
} {
  const dose = doseScore(input.creatineMgPerServing)
  const form = formScore(input.creatineForm)
  const price = priceScore(input.pricePerGramCreatine)

  const dosePts = dose.score * creatineScoringRules.doseWeight
  const formPts = form.score * creatineScoringRules.formWeight
  const pricePts = price.score * creatineScoringRules.priceWeight
  const score = Math.round(dosePts + formPts + pricePts)

  const effectiveCreatineMg = Math.round(input.creatineMgPerServing * FORM_EQUIVALENCE[input.creatineForm])

  const gradeBreakdown: CreatineGradeBreakdown[] = [
    {
      key: 'dose',
      label: 'Dose per servering',
      grade: dose.grade,
      points: dosePts,
      maxPoints: 60,
      doseLabel: dose.label,
    },
    {
      key: 'form',
      label: 'Form',
      grade: form.grade,
      points: formPts,
      maxPoints: 15,
      doseLabel: form.label,
    },
    {
      key: 'price',
      label: 'Pris per g kreatin',
      grade: price.grade,
      points: pricePts,
      maxPoints: 25,
      doseLabel: price.label,
    },
  ]

  return {
    score,
    overallGrade: gradeFromRatio(score / 100),
    gradeBreakdown,
    effectiveCreatineMg,
  }
}
