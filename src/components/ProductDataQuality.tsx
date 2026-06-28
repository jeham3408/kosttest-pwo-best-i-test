/**
 * @deprecated Bruk DataTransparencyPanel fra ./trust/DataTransparencyPanel
 */
import type { TestedCreatineProduct } from '../data/creatineProducts'
import type { TestedProteinProduct } from '../data/proteinProducts'
import type { TestedProduct } from '../data/pwoProducts'
import { resolveCreatineTrust, resolveProteinTrust, resolvePwoTrust } from '../data/trust'
import DataTransparencyPanel from './trust/DataTransparencyPanel'

/** Bakoverkompatibel wrapper — delegerer til DataTransparencyPanel. */
export default function ProductDataQuality({
  category,
  product,
}: {
  category: 'pwo' | 'protein' | 'creatine'
  product: TestedProduct | TestedProteinProduct | TestedCreatineProduct
}) {
  const snapshot =
    category === 'pwo'
      ? resolvePwoTrust(product as TestedProduct)
      : category === 'protein'
        ? resolveProteinTrust(product as TestedProteinProduct)
        : resolveCreatineTrust(product as TestedCreatineProduct)

  return <DataTransparencyPanel snapshot={snapshot} variant="full" />
}
