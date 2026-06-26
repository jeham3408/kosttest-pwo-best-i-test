import { listedProducts, testedProducts } from './data/pwoProducts'

const testedIds = new Set(testedProducts.map((product) => product.id))
const unrankedProducts = listedProducts.filter(
  (product) => product.status !== 'Rangert' && !testedIds.has(product.id),
)

export const siteStats = {
  testedCount: testedProducts.length,
  listedCount: testedProducts.length + unrankedProducts.length,
  unrankedCount: unrankedProducts.length,
}
