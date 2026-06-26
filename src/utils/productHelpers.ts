import { testedProducts, type TestedProduct } from '../data/pwoProducts'

export function getRelatedProducts(product: TestedProduct, limit = 4): TestedProduct[] {
  return testedProducts
    .filter((candidate) => candidate.id !== product.id)
    .sort(
      (a, b) =>
        Math.abs(a.score - product.score) - Math.abs(b.score - product.score) || b.score - a.score,
    )
    .slice(0, limit)
}

export const kgPrice = (product: TestedProduct) => {
  const packageMatch = product.packageSize.match(/([\d.,]+)\s*g/i)
  if (packageMatch) {
    return product.priceNok / (parseFloat(packageMatch[1].replace(',', '.')) / 1000)
  }
  const servingMatch = product.servingSize.match(/([\d.,]+)\s*g/i)
  if (servingMatch) {
    return product.priceNok / ((parseFloat(servingMatch[1].replace(',', '.')) * product.servings) / 1000)
  }
  return Infinity
}
