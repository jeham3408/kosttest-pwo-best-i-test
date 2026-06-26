import { listedProducts, testedProducts } from './data/pwoProducts'

export const siteStats = {
  testedCount: testedProducts.length,
  listedCount: listedProducts.length,
  unrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
}
