import type { GradeLetter } from './pwoProducts'

/** mg per g protein — WHO/FAO/UNU 2007 reference pattern for adults */
export const WHO_REFERENCE_MG_PER_G = {
  histidine: 15,
  isoleucine: 30,
  leucine: 59,
  lysine: 45,
  methionineCystine: 22,
  phenylalanineTyrosine: 38,
  threonine: 23,
  tryptophan: 6,
  valine: 39,
} as const

export type AminoAcidProfile = {
  histidine: number
  isoleucine: number
  leucine: number
  lysine: number
  methionine: number
  cystine: number
  phenylalanine: number
  tyrosine: number
  threonine: number
  tryptophan: number
  valine: number
}

export type ProteinSourceType =
  | 'whey-isolate'
  | 'whey-concentrate'
  | 'whey-blend'
  | 'hydrolyzed-whey'
  | 'clear-whey'
  | 'casein'
  | 'egg'
  | 'soy-isolate'
  | 'pea-rice-blend'
  | 'beef-isolate'
  | 'potato-isolate'
  | 'plant-premium-blend'

export const TEMPLATE_PROFILES: Record<ProteinSourceType, AminoAcidProfile> = {
  'whey-isolate': {
    histidine: 16, isoleucine: 49, leucine: 105, lysine: 88,
    methionine: 20, cystine: 24, phenylalanine: 32, tyrosine: 28,
    threonine: 66, tryptophan: 18, valine: 53,
  },
  'whey-concentrate': {
    histidine: 15, isoleucine: 47, leucine: 100, lysine: 85,
    methionine: 19, cystine: 22, phenylalanine: 30, tyrosine: 26,
    threonine: 63, tryptophan: 17, valine: 51,
  },
  'whey-blend': {
    histidine: 15, isoleucine: 48, leucine: 102, lysine: 86,
    methionine: 19, cystine: 23, phenylalanine: 31, tyrosine: 27,
    threonine: 64, tryptophan: 17, valine: 52,
  },
  'hydrolyzed-whey': {
    histidine: 16, isoleucine: 50, leucine: 108, lysine: 90,
    methionine: 21, cystine: 25, phenylalanine: 33, tyrosine: 29,
    threonine: 67, tryptophan: 18, valine: 54,
  },
  'clear-whey': {
    histidine: 16, isoleucine: 49, leucine: 106, lysine: 89,
    methionine: 20, cystine: 24, phenylalanine: 32, tyrosine: 28,
    threonine: 66, tryptophan: 18, valine: 53,
  },
  casein: {
    histidine: 24, isoleucine: 42, leucine: 85, lysine: 72,
    methionine: 22, cystine: 8, phenylalanine: 42, tyrosine: 38,
    threonine: 42, tryptophan: 12, valine: 55,
  },
  egg: {
    histidine: 22, isoleucine: 45, leucine: 86, lysine: 70,
    methionine: 28, cystine: 12, phenylalanine: 56, tyrosine: 40,
    threonine: 44, tryptophan: 17, valine: 64,
  },
  'soy-isolate': {
    histidine: 23, isoleucine: 42, leucine: 70, lysine: 58,
    methionine: 14, cystine: 16, phenylalanine: 44, tyrosine: 32,
    threonine: 34, tryptophan: 14, valine: 42,
  },
  'pea-rice-blend': {
    histidine: 22, isoleucine: 38, leucine: 68, lysine: 52,
    methionine: 12, cystine: 14, phenylalanine: 40, tyrosine: 28,
    threonine: 32, tryptophan: 10, valine: 40,
  },
  'beef-isolate': {
    histidine: 28, isoleucine: 42, leucine: 78, lysine: 82,
    methionine: 22, cystine: 6, phenylalanine: 38, tyrosine: 28,
    threonine: 40, tryptophan: 12, valine: 48,
  },
  'potato-isolate': {
    histidine: 20, isoleucine: 40, leucine: 82, lysine: 55,
    methionine: 14, cystine: 16, phenylalanine: 38, tyrosine: 28,
    threonine: 36, tryptophan: 12, valine: 44,
  },
  'plant-premium-blend': {
    histidine: 22, isoleucine: 40, leucine: 72, lysine: 56,
    methionine: 14, cystine: 15, phenylalanine: 42, tyrosine: 30,
    threonine: 34, tryptophan: 12, valine: 42,
  },
}

/** Publiserte DIAAS-estimater per råvaretype (FAO ileal digestibility). */
export const DIAAS_PROXY: Record<ProteinSourceType, number> = {
  'whey-isolate': 1.09,
  'hydrolyzed-whey': 1.09,
  'clear-whey': 1.07,
  'whey-concentrate': 0.97,
  'whey-blend': 1.02,
  casein: 1.08,
  egg: 1.13,
  'soy-isolate': 0.91,
  'pea-rice-blend': 0.78,
  'beef-isolate': 0.92,
  'potato-isolate': 1.0,
  'plant-premium-blend': 0.95,
}

export type ProteinGradeBreakdown = {
  key: 'diaas'
  label: string
  doseLabel: string
  grade: GradeLetter
  points: number
  maxPoints: number
  note: string
}

export type ProteinProductInput = {
  sourceType: ProteinSourceType
  officialDiaas?: number | null
  aminoAcidProfile?: Partial<AminoAcidProfile>
  priceNok: number
  packageSizeG: number
  proteinPer100g: number
}

function letterFromRatio(ratio: number): GradeLetter {
  if (ratio >= 0.85) return 'A'
  if (ratio >= 0.7) return 'B'
  if (ratio >= 0.5) return 'C'
  if (ratio >= 0.3) return 'D'
  if (ratio >= 0.1) return 'E'
  return 'F'
}

function letterFromScore(score: number): GradeLetter {
  if (score >= 61) return 'A'
  if (score >= 49) return 'B'
  if (score >= 36) return 'C'
  if (score >= 24) return 'D'
  if (score >= 12) return 'E'
  return 'F'
}

/** IAAS — aminosyreprofil vs WHO-mønster (ignorerer fordøyelighet). */
export function calculateIAAS(profile: AminoAcidProfile): number {
  const ref = WHO_REFERENCE_MG_PER_G
  const ratios = [
    profile.histidine / ref.histidine,
    profile.isoleucine / ref.isoleucine,
    profile.leucine / ref.leucine,
    profile.lysine / ref.lysine,
    (profile.methionine + profile.cystine) / ref.methionineCystine,
    (profile.phenylalanine + profile.tyrosine) / ref.phenylalanineTyrosine,
    profile.threonine / ref.threonine,
    profile.tryptophan / ref.tryptophan,
    profile.valine / ref.valine,
  ]
  return Math.min(100, Math.round(Math.min(...ratios) * 100))
}

export function resolveProfile(input: ProteinProductInput): AminoAcidProfile {
  const base = { ...TEMPLATE_PROFILES[input.sourceType] }
  if (input.aminoAcidProfile) return { ...base, ...input.aminoAcidProfile }
  return base
}

const SCORE_MAX = 100

export function calculateProteinGrade(input: ProteinProductInput) {
  const profile = resolveProfile(input)
  const iaasScore = calculateIAAS(profile)

  const diaasIsOfficial = input.officialDiaas != null && input.officialDiaas > 0
  const diaasValue = diaasIsOfficial ? input.officialDiaas! : DIAAS_PROXY[input.sourceType]
  const diaasScore = Math.round(diaasValue * 100)

  const diaasRatio = Math.min(diaasValue, 1.15) / 1.15
  const diaasPoints = diaasRatio * SCORE_MAX

  const totalProteinG = (input.proteinPer100g / 100) * input.packageSizeG
  const pricePerGProtein = input.priceNok / totalProteinG

  const score = Math.max(0, Math.min(SCORE_MAX, Math.round(diaasPoints)))

  const gradeBreakdown: ProteinGradeBreakdown[] = [
    {
      key: 'diaas',
      label: 'DIAAS (kvalitet)',
      doseLabel: diaasIsOfficial
        ? `${diaasScore} — dokumentert lab-DIAAS`
        : `${diaasScore} — estimat (${input.sourceType})`,
      grade: letterFromRatio(diaasRatio),
      points: Math.round(diaasPoints * 10) / 10,
      maxPoints: SCORE_MAX,
      note: 'FAO anbefaler DIAAS fremfor IAAS — måler ileal fordøyelighet, ikke bare profil. Pris påvirker ikke rangeringen.',
    },
  ]

  return {
    score,
    overallGrade: letterFromScore(score),
    gradeBreakdown,
    iaasScore,
    diaasScore,
    diaasValue,
    diaasIsOfficial,
    aminoAcidProfile: profile,
    pricePerGramProtein: Math.round(pricePerGProtein * 100) / 100,
  }
}

export const proteinScoringRules = [
  {
    label: 'DIAAS',
    weight: SCORE_MAX,
    note: 'Eneste faktor i totalscore. FAO anbefaler DIAAS fremfor IAAS og PDCAAS. Pris vises kun som referanse.',
  },
  {
    label: 'Lik score',
    weight: 'Rekkefølge',
    note: 'Ved lik totalscore rangeres lavest kr/g protein øverst. Pris påvirker ikke poengsummen.',
  },
]

export const iaasVsDiaasExplanation = {
  iaas: {
    title: 'IAAS — aminosyreprofil',
    summary:
      'IAAS (Indispensable Amino Acid Score) sammenligner aminosyreprofilen mot WHO-referansen. Begrensende aminosyre bestemmer scoren.',
    limitation:
      'IAAS ser kun på hvilke aminosyrer som finnes — ikke hvor mye kroppen faktisk absorberer ved slutten av tynntarmen.',
  },
  diaas: {
    title: 'DIAAS — den beste målingen',
    summary:
      'DIAAS (Digestible Indispensable Amino Acid Score) er det FAO anbefaler som gullstandard. Den måler ileal fordøyelighet av hver essensiell aminosyre.',
    whyBest:
      'Der IAAS/PDCAAS kan overvurdere protein som ikke tas opp optimalt, justerer DIAAS for faktisk tilgjengelighet. Offisiell DIAAS krever laboratorietest av ferdig blanding.',
  },
}

export const formulationNote = `Teoretisk kan plante- eller egg-baserte mikser optimaliseres på papir (høy IAAS), men offisiell DIAAS kan ikke påstås før ferdig blanding er testet. Mikser som kombinerer potato protein isolate, soya og rapsfrø kan dekke hverandres begrensende aminosyrer — men den ferdige formuleringen må testes.`
