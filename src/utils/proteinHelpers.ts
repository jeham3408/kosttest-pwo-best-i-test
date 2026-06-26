import { testedProteinProducts, type TestedProteinProduct } from '../data/proteinProducts'

export function getRelatedProteinProducts(product: TestedProteinProduct, limit = 4): TestedProteinProduct[] {
  return testedProteinProducts
    .filter((candidate) => candidate.id !== product.id)
    .sort(
      (a, b) =>
        Math.abs(a.score - product.score) - Math.abs(b.score - product.score) || b.score - a.score,
    )
    .slice(0, limit)
}

export const proteinKgPrice = (product: TestedProteinProduct) =>
  product.priceNok / (product.packageSizeG / 1000)

export const proteinPricePerServing = (product: TestedProteinProduct) =>
  product.priceNok / product.servings
