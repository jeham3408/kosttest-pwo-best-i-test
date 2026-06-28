import type { TestedProteinProduct } from '../proteinProducts'
import type { ProteinBadgeContext } from './badges'
import {
  getProteinEditorialSummary,
  type ProteinEditorialSummary,
} from './editorialSummary'
import { calculateProteinPriceGrade, getDiaasStatus } from './metrics'
import { getProteinProductModel } from './model'

export type ProteinProductCopy = ProteinEditorialSummary & {
  diaasLine: string
  priceLine: string
}

export function generateProteinProductCopy(
  product: TestedProteinProduct,
  badgeCtx: ProteinBadgeContext,
  allProducts?: TestedProteinProduct[],
): ProteinProductCopy {
  const editorial = getProteinEditorialSummary(product, allProducts ?? badgeCtx.products, badgeCtx)
  const diaas = getDiaasStatus(product)
  const model = getProteinProductModel(product)
  const priceGrade = calculateProteinPriceGrade(product.pricePerGramProtein)

  return {
    ...editorial,
    diaasLine: `${diaas.shortLabel} — ${diaas.label}. ${diaas.explanation}`,
    priceLine: `${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein · referanse ${priceGrade.grade}${model.proteinPer100Kcal != null ? ` · ${model.proteinPer100Kcal.toFixed(1).replace('.', ',')} g/100 kcal` : ''}`,
  }
}

export function formatProteinKcal(product: TestedProteinProduct): string {
  if (product.caloriesPerServing != null) return `${product.caloriesPerServing} kcal/dose`
  if (product.caloriesPer100g != null) return `${product.caloriesPer100g} kcal/100 g`
  return 'Ikke oppgitt per produkt'
}

export { getProteinEditorialSummary, type ProteinEditorialSummary } from './editorialSummary'
