import type { TestedProteinProduct } from '../proteinProducts'
import type { ProteinSourceType } from '../proteinScoring'
import { getProteinDataConfidence, type ProteinDataConfidence } from './dataConfidence'
import {
  formatAllergenSummary,
  getDiaasStatus,
  getProteinPer100Kcal,
  isDocumentedLactoseFree,
  isDocumentedSweetenerFree,
  isDocumentedUnflavored,
  isVeganProduct,
  type DiaasStatusView,
} from './metrics'

export type LactoseStatus = 'documented_free' | 'documented_contains' | 'unknown'
export type SweetenerStatus = 'documented_free' | 'documented_contains' | 'unknown'
export type FlavorStatus = 'neutral' | 'flavoured' | 'unknown'

export type ProteinProductModel = {
  proteinType: ProteinSourceType
  proteinTypeLabel: string
  proteinPer100g: number
  proteinPerServing: number
  caloriesPer100g: number | null
  caloriesPerServing: number | null
  pricePerGramProtein: number
  diaasValue: number
  diaasScore: number
  diaasStatus: DiaasStatusView
  iaasValue: number
  lactoseStatus: LactoseStatus
  lactoseLabel: string
  veganStatus: 'vegan' | 'not_vegan'
  veganLabel: string
  sweetenerStatus: SweetenerStatus
  sweetenerLabel: string
  allergenData: string
  flavorStatus: FlavorStatus
  flavorLabel: string
  documentationStatus: string
  lastVerifiedAt: string | null
  dataConfidence: ProteinDataConfidence
  proteinPer100Kcal: number | null
}

function resolveLactoseStatus(product: TestedProteinProduct): LactoseStatus {
  if (product.lactoseFree === true || isDocumentedLactoseFree(product)) return 'documented_free'
  if (product.lactoseFree === false) return 'documented_contains'
  const text = [...product.watchouts, product.verdict].join(' ').toLowerCase()
  if (/inneholder laktose|laktose \(whey concentrate\)/i.test(text)) return 'documented_contains'
  return 'unknown'
}

function lactoseLabel(status: LactoseStatus): string {
  if (status === 'documented_free') return 'Dokumentert laktosefri/laktosefattig'
  if (status === 'documented_contains') return 'Inneholder laktose (dok.)'
  return 'Laktose: ikke oppgitt'
}

function resolveSweetenerStatus(product: TestedProteinProduct): SweetenerStatus {
  if (product.sweetenerFree === true || isDocumentedSweetenerFree(product)) return 'documented_free'
  if (product.sweetenerFree === false) return 'documented_contains'
  return 'unknown'
}

function sweetenerLabel(status: SweetenerStatus): string {
  if (status === 'documented_free') return 'Uten søtstoff (dok.)'
  if (status === 'documented_contains') return 'Med søtstoff'
  return 'Søtstoff: ikke oppgitt'
}

function resolveFlavorStatus(product: TestedProteinProduct): FlavorStatus {
  if (product.unflavored === true || isDocumentedUnflavored(product)) return 'neutral'
  if (product.unflavored === false) return 'flavoured'
  return 'unknown'
}

function flavorLabel(status: FlavorStatus): string {
  if (status === 'neutral') return 'Nøytral smak'
  if (status === 'flavoured') return 'Smakstilsett'
  return 'Smak: ikke oppgitt'
}

/** Kategori-spesifikk visningsmodell — avledet fra produktdata, uten å endre rangering. */
export function getProteinProductModel(product: TestedProteinProduct): ProteinProductModel {
  const dataConfidence = getProteinDataConfidence(product)
  const diaasStatus = getDiaasStatus(product)
  const lactoseStatus = resolveLactoseStatus(product)
  const sweetenerStatus = resolveSweetenerStatus(product)
  const flavorStatus = resolveFlavorStatus(product)
  const vegan = isVeganProduct(product)

  return {
    proteinType: product.sourceType,
    proteinTypeLabel: product.sourceLabel,
    proteinPer100g: product.proteinPer100g,
    proteinPerServing: product.proteinPerServingG,
    caloriesPer100g: product.caloriesPer100g ?? null,
    caloriesPerServing: product.caloriesPerServing ?? null,
    pricePerGramProtein: product.pricePerGramProtein,
    diaasValue: product.diaasValue,
    diaasScore: product.diaasScore,
    diaasStatus,
    iaasValue: product.iaasScore,
    lactoseStatus,
    lactoseLabel: lactoseLabel(lactoseStatus),
    veganStatus: vegan ? 'vegan' : 'not_vegan',
    veganLabel: vegan ? 'Vegansk' : 'Ikke vegansk',
    sweetenerStatus,
    sweetenerLabel: sweetenerLabel(sweetenerStatus),
    allergenData: formatAllergenSummary(product),
    flavorStatus,
    flavorLabel: flavorLabel(flavorStatus),
    documentationStatus: dataConfidence.label,
    lastVerifiedAt: product.verifiedAt ?? null,
    dataConfidence,
    proteinPer100Kcal: getProteinPer100Kcal(product),
  }
}
