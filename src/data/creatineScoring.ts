import type { GradeLetter } from './pwoProducts'
import { letterFromRatio, letterFromScore, scoreLinear } from '../utils/gradingCore'

export type CreatineForm = 'monohydrate' | 'hcl' | 'malate' | 'blend' | 'unknown'
export type CreatineFormat = 'powder' | 'gummies' | 'capsules'

export type CreatineGradeBreakdown = {
  key: string
  label: string
  doseLabel: string
  grade: GradeLetter
  points: number
  maxPoints: number
  note: string
}

export type CreatineProductInput = {
  creatinePerServingG: number
  creatineForm: CreatineForm
  format: CreatineFormat
  priceNok: number
  packageSizeG: number
  /** For gummies/capsules: total units in package */
  unitsInPackage?: number
  /** For gummies/capsules: creatine mg per unit */
  creatineMgPerUnit?: number
}

const DOSE_WEIGHT = 60
const FORM_WEIGHT = 15
const PRICE_WEIGHT = 25

const FORM_MULTIPLIER: Record<CreatineForm, number> = {
  monohydrate: 1,
  hcl: 0.88,
  malate: 0.92,
  blend: 0.8,
  unknown: 0.7,
}

const FORMAT_MULTIPLIER: Record<CreatineFormat, number> = {
  powder: 1,
  capsules: 0.95,
  gummies: 0.85,
}

function totalCreatineInPack(input: CreatineProductInput): number {
  if (input.format === 'gummies' || input.format === 'capsules') {
    if (input.unitsInPackage && input.creatineMgPerUnit) {
      return (input.unitsInPackage * input.creatineMgPerUnit) / 1000
    }
    return input.packageSizeG * 0.75
  }
  return input.packageSizeG
}

/** ISSN: 3 g/dag minimum for effekt, 5 g er vanlig vedlikeholdsdose */
function doseRatio(creatinePerServingG: number, format: CreatineFormat): number {
  if (format === 'gummies') {
    return scoreLinear(creatinePerServingG, 1, 5)
  }
  return scoreLinear(creatinePerServingG, 3, 5)
}

export const creatineScoringRules = [
  {
    label: 'Kreatindose per porsjon',
    weight: DOSE_WEIGHT,
    note: '3 g minimum (ISSN), 5 g optimal vedlikeholdsdose. Gummies scores mot effektiv daglig dose.',
  },
  {
    label: 'Form og format',
    weight: FORM_WEIGHT,
    note: 'Monohydrat er gullstandard. Gummies og kapsler får moderat trekk for praktisk dosering.',
  },
  {
    label: 'Pris per g kreatin',
    weight: PRICE_WEIGHT,
    note: 'Lavere kr/g kreatin gir høyere poeng. Basert på total kreatin i pakken.',
  },
] as const

export function calculateCreatineGrade(input: CreatineProductInput) {
  const creatineInPackG = totalCreatineInPack(input)
  const pricePerGCreatine = input.priceNok / Math.max(creatineInPackG, 1)
  const priceRatio = 1 - scoreLinear(pricePerGCreatine, 0.25, 1.5)

  const doseR = doseRatio(input.creatinePerServingG, input.format)
  const dosePoints = doseR * DOSE_WEIGHT

  const formR = FORM_MULTIPLIER[input.creatineForm] * FORMAT_MULTIPLIER[input.format]
  const formPoints = formR * FORM_WEIGHT

  const pricePoints = priceRatio * PRICE_WEIGHT

  const score = Math.max(0, Math.min(100, Math.round(dosePoints + formPoints + pricePoints)))

  const gradeBreakdown: CreatineGradeBreakdown[] = [
    {
      key: 'dose',
      label: 'Kreatindose',
      doseLabel: `${input.creatinePerServingG} g/porsjon${input.format === 'gummies' ? ' (sjekk daglig dose)' : ''}`,
      grade: letterFromRatio(doseR),
      points: Math.round(dosePoints * 10) / 10,
      maxPoints: DOSE_WEIGHT,
      note: 'ISSN anbefaler 3–5 g kreatin monohydrat daglig for styrkeøkning.',
    },
    {
      key: 'form',
      label: 'Form og format',
      doseLabel: `${input.creatineForm} · ${input.format}`,
      grade: letterFromRatio(formR),
      points: Math.round(formPoints * 10) / 10,
      maxPoints: FORM_WEIGHT,
      note: 'Monohydrat er best dokumentert. Gummies krever ofte flere enheter for full dose.',
    },
    {
      key: 'price',
      label: 'Pris per g kreatin',
      doseLabel: `${pricePerGCreatine.toFixed(2).replace('.', ',')} kr/g`,
      grade: letterFromRatio(priceRatio),
      points: Math.round(pricePoints * 10) / 10,
      maxPoints: PRICE_WEIGHT,
      note: 'Basert på estimert total kreatin i pakken.',
    },
  ]

  return {
    score,
    overallGrade: letterFromScore(score),
    gradeBreakdown,
    pricePerGramCreatine: Math.round(pricePerGCreatine * 100) / 100,
    totalCreatineInPackG: Math.round(creatineInPackG * 10) / 10,
  }
}

export const creatineMethodNote =
  'Kreatin er et kronisk tilskudd — effekt bygger seg opp over dager/uker. Vi scorer dose per porsjon, formkvalitet og pris per gram kreatin. Gummies vurderes ærlig mot hvor mye kreatin du faktisk får i en anbefalt daglig dose.'

export const creatineSourceLinks = [
  { label: 'ISSN position stand: kreatin', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-0173-6' },
  { label: 'EFSA kreatin monohydrat', url: 'https://www.efsa.europa.eu/en/topics/topic/creatine' },
  { label: 'Examine.com — kreatin', url: 'https://examine.com/supplements/creatine/' },
]
