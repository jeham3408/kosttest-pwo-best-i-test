import type { GradeLetter } from './pwoProducts'

export type CreatineForm =
  | 'monohydrate-creapure'
  | 'monohydrate'
  | 'micronized'
  | 'hcl'
  | 'blend'
  | 'capsules'

export type CreatineGradeBreakdown = {
  key: string
  label: string
  grade: GradeLetter
  points: number
  maxPoints: number
  doseLabel: string
}

/** Trekk når produsent/butikk ikke oppgir renhet (% kreatin monohydrat). */
export const PURITY_DISCLOSURE_PENALTY = 10
/** Trekk når produsent/butikk ikke oppgir mesh / partikkelstørrelse. */
export const MESH_DISCLOSURE_PENALTY = 10
/** Trekk for generisk kreatin uten dokumentert dopingtest (Cologne List, Informed Sport m.fl.). */
export const GENERIC_DOPING_TEST_PENALTY = 15

const formQuality: Record<CreatineForm, number> = {
  'monohydrate-creapure': 100,
  monohydrate: 78,
  micronized: 80,
  hcl: 68,
  blend: 50,
  capsules: 44,
}

const formLabels: Record<CreatineForm, string> = {
  'monohydrate-creapure': 'Creapure monohydrat',
  monohydrate: 'Generisk kreatin monohydrat',
  micronized: 'Generisk mikronisert monohydrat',
  hcl: 'Kreatin HCl',
  blend: 'Blanding / matrix',
  capsules: 'Kapsler / tabletter',
}

function gradeFromScore(score: number): GradeLetter {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  if (score >= 30) return 'E'
  return 'F'
}

function formatPurityLabel(purityPercent: number) {
  const text = purityPercent.toString().replace('.', ',')
  return `${text} % renhet`
}

export function getCreatineBrandLabel(input: {
  creatineBrand?: string | null
  isCreapure?: boolean
}) {
  const label = input.creatineBrand?.trim()
  if (label) return label
  return input.isCreapure ? 'Creapure®' : null
}

export function isBrandedCreatine(input: {
  creatineBrand?: string | null
  isCreapure?: boolean
}) {
  return Boolean(getCreatineBrandLabel(input))
}

export function hasPurityDisclosure(purityPercent: number | null | undefined) {
  return purityPercent != null && purityPercent > 0
}

export function hasMeshDisclosure(meshLabel: string | null | undefined) {
  return Boolean(meshLabel?.trim())
}

export function hasDopingTestDisclosure(dopingTestLabel: string | null | undefined) {
  return Boolean(dopingTestLabel?.trim())
}

export function calculateCreatineGrade(input: {
  form: CreatineForm
  isCreapure?: boolean
  creatineBrand?: string | null
  purityPercent?: number | null
  meshLabel?: string | null
  dopingTestLabel?: string | null
}) {
  const branded = isBrandedCreatine(input)
  const brandLabel = getCreatineBrandLabel(input)
  const formKey = branded ? 'monohydrate-creapure' : input.form
  const formBase = formQuality[formKey]
  const formGrade = gradeFromScore(formBase)

  const purityDeclared = hasPurityDisclosure(input.purityPercent)
  const meshDeclared = hasMeshDisclosure(input.meshLabel)
  const dopingDeclared = hasDopingTestDisclosure(input.dopingTestLabel)

  const purityPenalty = purityDeclared ? 0 : PURITY_DISCLOSURE_PENALTY
  const meshPenalty = meshDeclared ? 0 : MESH_DISCLOSURE_PENALTY
  const dopingPenalty = !branded && !dopingDeclared ? GENERIC_DOPING_TEST_PENALTY : 0

  const score = Math.max(0, formBase - purityPenalty - meshPenalty - dopingPenalty)

  const gradeBreakdown: CreatineGradeBreakdown[] = [
    {
      key: 'form',
      label: branded ? 'Merkevare-kreatin' : 'Form og type',
      grade: formGrade,
      points: formBase,
      maxPoints: 100,
      doseLabel: branded ? brandLabel! : formLabels[formKey],
    },
    {
      key: 'purity',
      label: 'Kreatinrenhet oppgitt',
      grade: purityDeclared ? 'A' : 'D',
      points: -purityPenalty,
      maxPoints: 0,
      doseLabel: purityDeclared
        ? formatPurityLabel(input.purityPercent!)
        : `Ikke oppgitt (−${PURITY_DISCLOSURE_PENALTY} poeng)`,
    },
    {
      key: 'mesh',
      label: 'Kreatin mesh oppgitt',
      grade: meshDeclared ? 'A' : 'D',
      points: -meshPenalty,
      maxPoints: 0,
      doseLabel: meshDeclared
        ? input.meshLabel!
        : `Ikke oppgitt (−${MESH_DISCLOSURE_PENALTY} poeng)`,
    },
    {
      key: 'doping',
      label: 'Dopingtest dokumentert',
      grade: dopingDeclared ? 'A' : branded ? 'B' : 'F',
      points: -dopingPenalty,
      maxPoints: 0,
      doseLabel: dopingDeclared
        ? input.dopingTestLabel!
        : branded
          ? 'Merkevare-kreatin med egen kvalitetssikring — produkttest valgfritt'
          : `Generisk uten test (−${GENERIC_DOPING_TEST_PENALTY} poeng)`,
    },
  ]

  return {
    score,
    overallGrade: gradeFromScore(score),
    gradeBreakdown,
    formScore: formQuality[formKey],
  }
}

export const creatineScoringRules = [
  {
    label: 'Merkevare vs. generisk kreatin',
    weight: 'Grunnscore',
    note: 'Creapure og annet merkevare-kreatin scorer høyest. Generisk mono/mikronisert starter lavere — da er dokumentasjon ekstra viktig.',
  },
  {
    label: 'Kreatinrenhet oppgitt',
    weight: `−${PURITY_DISCLOSURE_PENALTY} poeng`,
    note: 'Produsent/butikk må oppgi renhet i prosent (f.eks. 99,9 %).',
  },
  {
    label: 'Kreatin mesh oppgitt',
    weight: `−${MESH_DISCLOSURE_PENALTY} poeng`,
    note: 'Partikkelstørrelse (mesh) må være oppgitt — «mikronisert» alene er ikke nok.',
  },
  {
    label: 'Dopingtest (kun generisk)',
    weight: `−${GENERIC_DOPING_TEST_PENALTY} poeng`,
    note: 'Uten merkevare-kreatin krever vi dokumentert dopingtest (Cologne List®, Informed Sport, NSF m.fl.). Konkurransesportive bør unngå generisk uten test.',
  },
  {
    label: 'Lik score',
    weight: 'Rekkefølge',
    note: 'Ved lik totalscore rangeres lavest kr/g kreatin øverst. Pris påvirker ikke poengsummen.',
  },
]

export const creatineMethodNote =
  'Kreatinscoren er 100 % kvalitet. Merkevare-kreatin (Creapure m.fl.) veier tyngst. Generisk mono må dokumentere renhet, mesh og dopingtest — ellers trekkes det poeng. Pris påvirker ikke poengsummen, men ved lik score rangeres billigst kr/g kreatin øverst.'

export const creatineSourceLinks = [
  { label: 'ISSN position stand: kreatin', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8' },
  { label: 'Creapure — kvalitetsstandard', url: 'https://www.creapure.com/' },
  { label: 'Cologne List — dopingtest av kosttilskudd', url: 'https://www.koelnerliste.com/' },
]
