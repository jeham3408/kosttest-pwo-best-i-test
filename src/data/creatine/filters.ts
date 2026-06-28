import type { TestedCreatineProduct } from '../creatineProducts'
import {
  hasDopingTestDisclosure,
  hasMeshDisclosure,
  hasPurityDisclosure,
  isBrandedCreatine,
} from '../creatineScoring'
import {
  getCreatineDataConfidence,
  type CreatineDataConfidenceLevel,
} from './dataConfidence'
import { compareCreatineThenPrice, isMonohydrateForm } from './metrics'

export type CreatineFilterState = {
  rawMaterial: 'alle' | 'creapure' | 'branded' | 'generic' | 'unknown'
  dopingDocumented: boolean
  purityDocumented: boolean
  meshDocumented: boolean
  monohydrateOnly: boolean
  scoreMin: number | null
  maxPricePerGram: number | null
  dataConfidence: CreatineDataConfidenceLevel[]
  preset: 'default' | 'value' | 'budget' | null
}

export const defaultCreatineFilters = (): CreatineFilterState => ({
  rawMaterial: 'alle',
  dopingDocumented: false,
  purityDocumented: false,
  meshDocumented: false,
  monohydrateOnly: false,
  scoreMin: null,
  maxPricePerGram: null,
  dataConfidence: [],
  preset: null,
})

export function parseCreatineFiltersFromSearch(params: URLSearchParams): Partial<CreatineFilterState> {
  const patch: Partial<CreatineFilterState> = {}
  const num = (key: string) => {
    const v = params.get(key)
    return v != null && v !== '' ? Number(v) : null
  }
  patch.scoreMin = num('scoreMin')
  patch.maxPricePerGram = num('maxPriceG')
  const rm = params.get('raw')
  if (rm === 'creapure' || rm === 'branded' || rm === 'generic' || rm === 'unknown') patch.rawMaterial = rm
  const dc = params.get('data')
  if (dc) patch.dataConfidence = dc.split(',').filter(Boolean) as CreatineDataConfidenceLevel[]
  if (params.get('doping') === '1') patch.dopingDocumented = true
  if (params.get('purity') === '1') patch.purityDocumented = true
  if (params.get('mesh') === '1') patch.meshDocumented = true
  if (params.get('mono') === '1') patch.monohydrateOnly = true
  const preset = params.get('preset')
  if (preset === 'value' || preset === 'budget') patch.preset = preset
  return patch
}

export function creatineFiltersToSearchParams(filters: CreatineFilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.scoreMin != null) p.set('scoreMin', String(filters.scoreMin))
  if (filters.maxPricePerGram != null) p.set('maxPriceG', String(filters.maxPricePerGram))
  if (filters.rawMaterial !== 'alle') p.set('raw', filters.rawMaterial)
  if (filters.dataConfidence.length) p.set('data', filters.dataConfidence.join(','))
  if (filters.dopingDocumented) p.set('doping', '1')
  if (filters.purityDocumented) p.set('purity', '1')
  if (filters.meshDocumented) p.set('mesh', '1')
  if (filters.monohydrateOnly) p.set('mono', '1')
  if (filters.preset) p.set('preset', filters.preset)
  return p
}

export function countActiveCreatineFilters(filters: CreatineFilterState): number {
  let n = 0
  if (filters.rawMaterial !== 'alle') n++
  if (filters.dopingDocumented) n++
  if (filters.purityDocumented) n++
  if (filters.meshDocumented) n++
  if (filters.monohydrateOnly) n++
  if (filters.scoreMin != null) n++
  if (filters.maxPricePerGram != null) n++
  if (filters.dataConfidence.length) n++
  if (filters.preset) n++
  return n
}

export function applyCreatineFilters(products: TestedCreatineProduct[], filters: CreatineFilterState): TestedCreatineProduct[] {
  let list = [...products]

  if (filters.preset === 'value') {
    list = list.filter((p) => p.score >= 75)
  }
  if (filters.preset === 'budget') {
    list = list.filter((p) => p.score >= 40)
  }

  if (filters.rawMaterial === 'creapure') {
    list = list.filter((p) => p.isCreapure)
  } else if (filters.rawMaterial === 'branded') {
    list = list.filter((p) => isBrandedCreatine(p))
  } else if (filters.rawMaterial === 'generic') {
    list = list.filter((p) => !isBrandedCreatine(p) && p.form === 'monohydrate')
  } else if (filters.rawMaterial === 'unknown') {
    list = list.filter((p) => !isBrandedCreatine(p) && p.form !== 'monohydrate')
  }

  if (filters.dopingDocumented) list = list.filter((p) => hasDopingTestDisclosure(p.dopingTestLabel))
  if (filters.purityDocumented) list = list.filter((p) => hasPurityDisclosure(p.purityPercent))
  if (filters.meshDocumented) list = list.filter((p) => hasMeshDisclosure(p.meshLabel))
  if (filters.monohydrateOnly) list = list.filter((p) => isMonohydrateForm(p))
  if (filters.scoreMin != null) list = list.filter((p) => p.score >= filters.scoreMin!)
  if (filters.maxPricePerGram != null) {
    list = list.filter((p) => p.pricePerGramCreatine <= filters.maxPricePerGram!)
  }
  if (filters.dataConfidence.length) {
    list = list.filter((p) => filters.dataConfidence.includes(getCreatineDataConfidence(p).level))
  }

  return list.sort(compareCreatineThenPrice).map((p, i) => ({ ...p, rank: i + 1 }))
}

export function suggestCreatineFilterRelaxations(filters: CreatineFilterState): string[] {
  const tips: string[] = []
  if (filters.dopingDocumented) tips.push('Slå av «dokumentert dopingtest» — bare ett produkt har det')
  if (filters.meshDocumented && filters.purityDocumented && filters.dopingDocumented) {
    tips.push('Færre produkt har full dokumentasjon — prøv ett filter om gangen')
  }
  if (filters.scoreMin != null && filters.scoreMin > 80) tips.push('Senk minimum score')
  if (!tips.length) tips.push('Nullstill filter')
  return tips
}
