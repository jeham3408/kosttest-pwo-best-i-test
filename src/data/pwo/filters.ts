import { calculatePriceGrade, calculateProductGrade, type GradeLetter, type TestedProduct } from '../pwoProducts'
import type { DataConfidenceLevel } from './dataConfidence'
import { getPwoDataConfidence } from './dataConfidence'
import { compareFormulaThenPrice } from './metrics'

export type PwoFilterState = {
  scoreMin: number | null
  scoreMax: number | null
  priceGrades: GradeLetter[]
  dataConfidence: DataConfidenceLevel[]
  caffeineMin: number | null
  caffeineMax: number | null
  caffeineMode: 'alle' | 'med' | 'uten'
  betaAlanine: 'med' | 'uten'
  maxPricePerDose: number | null
  fullDeclarationOnly: boolean
  preset: 'default' | 'value' | 'nybegynner' | null
}

export const defaultPwoFilters = (): PwoFilterState => ({
  scoreMin: null,
  scoreMax: null,
  priceGrades: [],
  dataConfidence: [],
  caffeineMin: null,
  caffeineMax: null,
  caffeineMode: 'alle',
  betaAlanine: 'med',
  maxPricePerDose: null,
  fullDeclarationOnly: false,
  preset: null,
})

export function parsePwoFiltersFromSearch(params: URLSearchParams): PwoFilterState {
  const base = defaultPwoFilters()
  const num = (key: string) => {
    const v = params.get(key)
    return v != null && v !== '' ? Number(v) : null
  }
  base.scoreMin = num('scoreMin')
  base.scoreMax = num('scoreMax')
  base.caffeineMin = num('caffeineMin')
  base.caffeineMax = num('caffeineMax')
  base.maxPricePerDose = num('maxPrice')
  const pg = params.get('priceGrade')
  if (pg) base.priceGrades = pg.split(',').filter(Boolean) as GradeLetter[]
  const dc = params.get('data')
  if (dc) base.dataConfidence = dc.split(',').filter(Boolean) as DataConfidenceLevel[]
  const caf = params.get('caffeine')
  if (caf === 'med' || caf === 'uten' || caf === 'alle') base.caffeineMode = caf
  const beta = params.get('beta')
  if (beta === 'med' || beta === 'uten') base.betaAlanine = beta
  base.fullDeclarationOnly = params.get('fullDecl') === '1'
  const preset = params.get('preset')
  if (preset === 'value' || preset === 'nybegynner') base.preset = preset
  return base
}

export function pwoFiltersToSearchParams(filters: PwoFilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.scoreMin != null) p.set('scoreMin', String(filters.scoreMin))
  if (filters.scoreMax != null) p.set('scoreMax', String(filters.scoreMax))
  if (filters.caffeineMin != null) p.set('caffeineMin', String(filters.caffeineMin))
  if (filters.caffeineMax != null) p.set('caffeineMax', String(filters.caffeineMax))
  if (filters.maxPricePerDose != null) p.set('maxPrice', String(filters.maxPricePerDose))
  if (filters.priceGrades.length) p.set('priceGrade', filters.priceGrades.join(','))
  if (filters.dataConfidence.length) p.set('data', filters.dataConfidence.join(','))
  if (filters.caffeineMode !== 'alle') p.set('caffeine', filters.caffeineMode)
  if (filters.betaAlanine !== 'med') p.set('beta', filters.betaAlanine)
  if (filters.fullDeclarationOnly) p.set('fullDecl', '1')
  if (filters.preset) p.set('preset', filters.preset)
  return p
}

export function countActivePwoFilters(filters: PwoFilterState): number {
  let n = 0
  if (filters.scoreMin != null) n++
  if (filters.scoreMax != null) n++
  if (filters.priceGrades.length) n++
  if (filters.dataConfidence.length) n++
  if (filters.caffeineMin != null) n++
  if (filters.caffeineMax != null) n++
  if (filters.caffeineMode !== 'alle') n++
  if (filters.betaAlanine !== 'med') n++
  if (filters.maxPricePerDose != null) n++
  if (filters.fullDeclarationOnly) n++
  if (filters.preset) n++
  return n
}

export function applyPwoFilters(
  products: TestedProduct[],
  filters: PwoFilterState,
  options?: { excludeBetaAlanine?: boolean },
): TestedProduct[] {
  let list = [...products]

  if (filters.preset === 'value') {
    list = list.filter((p) => {
      const grade = calculatePriceGrade(p.pricePerServing).grade
      return p.score >= 34 && (grade === 'A' || grade === 'B')
    })
  }
  if (filters.preset === 'nybegynner') {
    list = list.filter((p) => !p.caffeineMg || p.caffeineMg <= 200)
  }
  if (filters.caffeineMode === 'med') list = list.filter((p) => (p.caffeineMg ?? 0) > 0)
  if (filters.caffeineMode === 'uten') list = list.filter((p) => !p.caffeineMg || p.caffeineMg === 0)
  if (filters.caffeineMin != null) list = list.filter((p) => (p.caffeineMg ?? 0) >= filters.caffeineMin!)
  if (filters.caffeineMax != null) list = list.filter((p) => (p.caffeineMg ?? 0) <= filters.caffeineMax!)
  if (filters.scoreMin != null) list = list.filter((p) => p.score >= filters.scoreMin!)
  if (filters.scoreMax != null) list = list.filter((p) => p.score <= filters.scoreMax!)
  if (filters.maxPricePerDose != null) list = list.filter((p) => p.pricePerServing <= filters.maxPricePerDose!)
  if (filters.priceGrades.length) {
    list = list.filter((p) => filters.priceGrades.includes(calculatePriceGrade(p.pricePerServing).grade))
  }
  if (filters.dataConfidence.length) {
    list = list.filter((p) => filters.dataConfidence.includes(getPwoDataConfidence(p).level))
  }
  if (filters.fullDeclarationOnly) {
    list = list.filter((p) => getPwoDataConfidence(p).fullDeclaration)
  }

  if (options?.excludeBetaAlanine || filters.betaAlanine === 'uten') {
    list = list.map((p) => ({ ...p, ...calculateProductGrade(p, { excludeBetaAlanine: true }) }))
  }

  return list.sort(compareFormulaThenPrice).map((p, i) => ({ ...p, rank: i + 1 }))
}

export function suggestPwoFilterRelaxations(filters: PwoFilterState): string[] {
  const tips: string[] = []
  if (filters.fullDeclarationOnly) tips.push('Slå av «bare full deklarasjon»')
  if (filters.scoreMin != null && filters.scoreMin > 40) tips.push('Senk minimum formelscore')
  if (filters.priceGrades.length === 1 && filters.priceGrades[0] === 'A') {
    tips.push('Inkluder også verdikarakter B')
  }
  if (filters.maxPricePerDose != null && filters.maxPricePerDose <= 15) {
    tips.push('Øk maks pris per dose')
  }
  if (filters.caffeineMode === 'uten' && filters.caffeineMin) tips.push('Fjern koffeinintervall — stim-free har 0 mg')
  if (!tips.length) tips.push('Nullstill filter og start med en snarvei (f.eks. Best formel totalt)')
  return tips
}
