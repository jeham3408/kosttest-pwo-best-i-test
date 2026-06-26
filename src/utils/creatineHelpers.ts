import { testedCreatineProducts } from '../data/creatineProducts'

export function getRelatedCreatineProducts(productId: string, limit = 3) {
  const current = testedCreatineProducts.find((p) => p.id === productId)
  if (!current) return testedCreatineProducts.slice(0, limit)
  return testedCreatineProducts
    .filter((p) => p.id !== productId && p.format === current.format)
    .slice(0, limit)
}
