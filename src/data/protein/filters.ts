import type { GradeLetter } from '../pwoProducts'
import type { TestedProteinProduct } from '../proteinProducts'
import type { ProteinSourceType } from '../proteinScoring'
import {
  getProteinDataConfidence,
  type ProteinDataConfidenceLevel,
} from './dataConfidence'
import {
  calculateProteinPriceGrade,
  compareProteinThenPrice,
  getProteinPer100Kcal,
  isCaseinSourceType,
  isDocumentedLactoseFree,
  isDocumentedSweetenerFree,
  isDocumentedUnflavored,
  isWheyConcentrateType,
  isWheyIsolateType,
} from './metrics'

export type ProteinFilterState = {
  sourceTypes: ProteinSourceType[]
  lactoseFreeOnly: boolean
  sweetenerFreeOnly: boolean
  flavorMode: 'alle' | 'smakstilsett' | 'noytral'
  diaasMin: number | null
  diaasMax: number | null
  diaasOfficialOnly: boolean
  maxPricePerGram: number | null
  minProteinPer100Kcal: number | null
  dataConfidence: ProteinDataConfidenceLevel[]
  availableInNorwayOnly: boolean
  preset: 'default' | 'value' | 'budget' | null
}

export const defaultProteinFilters = (): ProteinFilterState => ({
  sourceTypes: [],
  lactoseFreeOnly: false,
  sweetenerFreeOnly: false,
  flavorMode: 'alle',
  diaasMin: null,
  diaasMax: null,
  diaasOfficialOnly: false,
  maxPricePerGram: null,
  minProteinPer100Kcal: null,
  dataConfidence: [],
  availableInNorwayOnly: true,
  preset: null,
})

export function parseProteinFiltersFromSearch(params: URLSearchParams): Partial<ProteinFilterState> {
  const patch: Partial<ProteinFilterState> = {}
  const num = (key: string) => {
    const v = params.get(key)
    return v != null && v !== '' ? Number(v) : null
  }
  patch.diaasMin = num('diaasMin')
  patch.diaasMax = num('diaasMax')
  patch.maxPricePerGram = num('maxPriceG')
  patch.minProteinPer100Kcal = num('minProtKcal')
  const st = params.get('source')
  if (st) patch.sourceTypes = st.split(',').filter(Boolean) as ProteinSourceType[]
  const dc = params.get('data')
  if (dc) patch.dataConfidence = dc.split(',').filter(Boolean) as ProteinDataConfidenceLevel[]
  if (params.get('lactoseFree') === '1') patch.lactoseFreeOnly = true
  if (params.get('sweetenerFree') === '1') patch.sweetenerFreeOnly = true
  if (params.get('diaasOfficial') === '1') patch.diaasOfficialOnly = true
  const flavor = params.get('flavor')
  if (flavor === 'noytral' || flavor === 'smakstilsett') patch.flavorMode = flavor
  const preset = params.get('preset')
  if (preset === 'value' || preset === 'budget') patch.preset = preset
  if (params.get('no') === '0') patch.availableInNorwayOnly = false
  return patch
}

export function proteinFiltersToSearchParams(filters: ProteinFilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.diaasMin != null) p.set('diaasMin', String(filters.diaasMin))
  if (filters.diaasMax != null) p.set('diaasMax', String(filters.diaasMax))
  if (filters.maxPricePerGram != null) p.set('maxPriceG', String(filters.maxPricePerGram))
  if (filters.minProteinPer100Kcal != null) p.set('minProtKcal', String(filters.minProteinPer100Kcal))
  if (filters.sourceTypes.length) p.set('source', filters.sourceTypes.join(','))
  if (filters.dataConfidence.length) p.set('data', filters.dataConfidence.join(','))
  if (filters.lactoseFreeOnly) p.set('lactoseFree', '1')
  if (filters.sweetenerFreeOnly) p.set('sweetenerFree', '1')
  if (filters.diaasOfficialOnly) p.set('diaasOfficial', '1')
  if (filters.flavorMode !== 'alle') p.set('flavor', filters.flavorMode)
  if (filters.preset) p.set('preset', filters.preset)
  if (!filters.availableInNorwayOnly) p.set('no', '0')
  return p
}

export function countActiveProteinFilters(filters: ProteinFilterState): number {
  let n = 0
  if (filters.sourceTypes.length) n++
  if (filters.lactoseFreeOnly) n++
  if (filters.sweetenerFreeOnly) n++
  if (filters.flavorMode !== 'alle') n++
  if (filters.diaasMin != null) n++
  if (filters.diaasMax != null) n++
  if (filters.diaasOfficialOnly) n++
  if (filters.maxPricePerGram != null) n++
  if (filters.minProteinPer100Kcal != null) n++
  if (filters.dataConfidence.length) n++
  if (!filters.availableInNorwayOnly) n++
  if (filters.preset) n++
  return n
}

function matchesSourceFilter(product: TestedProteinProduct, types: ProteinSourceType[]): boolean {
  if (!types.length) return true
  return types.some((t) => {
    if (t === 'whey-isolate') return isWheyIsolateType(product.sourceType)
    if (t === 'whey-concentrate') return isWheyConcentrateType(product.sourceType)
    if (t === 'casein') return isCaseinSourceType(product.sourceType)
    return product.sourceType === t
  })
}

export function applyProteinFilters(products: TestedProteinProduct[], filters: ProteinFilterState): TestedProteinProduct[] {
  let list = [...products]

  if (filters.preset === 'value') {
    list = list.filter((p) => {
      const grade = calculateProteinPriceGrade(p.pricePerGramProtein).grade
      return p.score >= 90 && (grade === 'A' || grade === 'B' || grade === 'C')
    })
  }
  if (filters.preset === 'budget') {
    list = list.filter((p) => p.score >= 85)
  }

  if (filters.sourceTypes.length) {
    list = list.filter((p) => matchesSourceFilter(p, filters.sourceTypes))
  }
  if (filters.lactoseFreeOnly) {
    list = list.filter((p) => isDocumentedLactoseFree(p))
  }
  if (filters.sweetenerFreeOnly) {
    list = list.filter((p) => isDocumentedSweetenerFree(p))
  }
  if (filters.flavorMode === 'noytral') {
    list = list.filter((p) => isDocumentedUnflavored(p))
  }
  if (filters.flavorMode === 'smakstilsett') {
    list = list.filter((p) => !isDocumentedUnflavored(p))
  }
  if (filters.diaasMin != null) list = list.filter((p) => p.score >= filters.diaasMin!)
  if (filters.diaasMax != null) list = list.filter((p) => p.score <= filters.diaasMax!)
  if (filters.diaasOfficialOnly) list = list.filter((p) => p.diaasIsOfficial)
  if (filters.maxPricePerGram != null) {
    list = list.filter((p) => p.pricePerGramProtein <= filters.maxPricePerGram!)
  }
  if (filters.minProteinPer100Kcal != null) {
    list = list.filter((p) => {
      const v = getProteinPer100Kcal(p)
      return v != null && v >= filters.minProteinPer100Kcal!
    })
  }
  if (filters.dataConfidence.length) {
    list = list.filter((p) => filters.dataConfidence.includes(getProteinDataConfidence(p).level))
  }
  if (filters.availableInNorwayOnly) {
    list = list.filter((p) => p.availableInNorway !== false)
  }

  return list.sort(compareProteinThenPrice).map((p, i) => ({ ...p, rank: i + 1 }))
}

export function suggestProteinFilterRelaxations(filters: ProteinFilterState): string[] {
  const tips: string[] = []
  if (filters.diaasOfficialOnly) tips.push('Slå av «bare laboratoriemålt DIAAS» — ingen produkt har det enno')
  if (filters.lactoseFreeOnly) tips.push('Vis alle produkt — færre er dokumentert laktosefri')
  if (filters.sweetenerFreeOnly) tips.push('Fjern filter uten søtstoff — få produkt har dokumentert status')
  if (filters.minProteinPer100Kcal != null) tips.push('Fjern filter på protein per 100 kcal — få produkt har kaloridata')
  if (filters.diaasMin != null && filters.diaasMin > 95) tips.push('Senk minimum DIAAS-score')
  if (!tips.length) tips.push('Nullstill filter og start på nytt')
  return tips
}

export type { GradeLetter }
