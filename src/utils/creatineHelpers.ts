import { testedCreatineProducts, type TestedCreatineProduct } from '../data/creatineProducts'

export function getRelatedCreatineProducts(product: TestedCreatineProduct, limit = 4): TestedCreatineProduct[] {
  return testedCreatineProducts
    .filter((p) => p.id !== product.id && p.formatType === product.formatType)
    .sort((a, b) => Math.abs(a.score - product.score) - Math.abs(b.score - product.score))
    .slice(0, limit)
}

export function isGummiesCreatine(product: TestedCreatineProduct) {
  return product.formatType === 'gummies'
}
