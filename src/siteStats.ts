import { testedCreatineProducts } from './data/creatineProducts'
import { testedProteinProducts } from './data/proteinProducts'
import { listedProducts, testedProducts } from './data/pwoProducts'

export const siteStats = {
  pwoTestedCount: testedProducts.length,
  pwoListedCount: listedProducts.length,
  pwoUnrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
  proteinTestedCount: testedProteinProducts.length,
  creatineTestedCount: testedCreatineProducts.length,
  creatinePowderCount: testedCreatineProducts.filter((p) => p.format === 'powder').length,
  creatineGummiesCount: testedCreatineProducts.filter((p) => p.format === 'gummies').length,
  /** @deprecated use pwoTestedCount */
  testedCount: testedProducts.length,
  /** @deprecated use pwoListedCount */
  listedCount: listedProducts.length,
  /** @deprecated use pwoUnrankedCount */
  unrankedCount: listedProducts.filter((product) => product.status !== 'Rangert').length,
}
