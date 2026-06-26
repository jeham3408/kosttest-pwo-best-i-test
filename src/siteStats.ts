import { listedProducts, testedProducts } from './data/pwoProducts'

export const siteStats = {
  testedCount: testedProducts.length,
  listedCount: new Set(listedProducts.map((product) => product.id)).size,
  unrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
}
