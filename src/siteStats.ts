import { listedProducts, testedProducts } from './data/pwoProducts'
import { allSupplementCategories, totalSupplementProducts } from './data/testCategories'

export const siteStats = {
  pwoTestedCount: testedProducts.length,
  supplementTestedCount: totalSupplementProducts,
  testedCount: testedProducts.length + totalSupplementProducts,
  listedCount: listedProducts.length + totalSupplementProducts,
  unrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
  supplementCategories: allSupplementCategories.map((c) => ({
    id: c.id,
    label: c.label,
    count: c.products.length,
    path: c.leaderboardPath,
  })),
}
