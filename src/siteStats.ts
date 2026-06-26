import { testedProteinProducts } from './data/proteinProducts'
import { listedProducts, testedProducts } from './data/pwoProducts'

export const siteStats = {
  pwoTestedCount: testedProducts.length,
  pwoListedCount: new Set(listedProducts.map((product) => product.id)).size,
  pwoUnrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
  proteinTestedCount: testedProteinProducts.length,
  /** @deprecated use pwoTestedCount */
  testedCount: testedProducts.length,
  /** @deprecated use pwoListedCount */
  listedCount: new Set(listedProducts.map((product) => product.id)).size,
  /** @deprecated use pwoUnrankedCount */
  unrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
}
