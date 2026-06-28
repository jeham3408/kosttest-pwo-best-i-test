export type {
  ProductDataTrust,
  ProductTrustSnapshot,
  PendingReviewItem,
  DataTrustLevel,
  ProductChangeEntry,
  TrustSourceLink,
} from './types'
export {
  TRUST_LEVEL_COPY,
  DATA_SOURCE_LABELS,
  MISSING_VALUE,
  DOCUMENTATION_STATUS_LABELS,
  DOPING_LABELS,
} from './labels'
export * from './enums'
export { formatChangeSummary, buildPriceChangeEntry, buildDeclarationChangeEntry } from './changeLog'
export { validateTrustSnapshot, validateAllProductTrust } from './validation'
export { resolvePwoTrust, resolvePwoTrustCompact } from './resolvers/pwo'
export { resolveProteinTrust } from './resolvers/protein'
export { resolveCreatineTrust } from './resolvers/creatine'
export {
  getPwoPendingReviewItems,
  getProteinPendingReviewItems,
  getPendingReviewItems,
  resolvePendingTrust,
  listedProductToPending,
} from './pendingReview'

import type { TestedCreatineProduct } from '../creatineProducts'
import type { TestedProteinProduct } from '../proteinProducts'
import type { TestedProduct } from '../pwoProducts'
import { resolveCreatineTrust } from './resolvers/creatine'
import { resolveProteinTrust } from './resolvers/protein'
import { resolvePwoTrust } from './resolvers/pwo'
import type { ProductDataTrust, ProductTrustSnapshot, TestCategory } from './types'

export function resolveProductTrust(
  category: TestCategory,
  product: TestedProduct | TestedProteinProduct | TestedCreatineProduct,
  options?: { override?: ProductDataTrust; pageUrl?: string },
): ProductTrustSnapshot {
  const pageUrl = options?.pageUrl ?? ''
  const override = options?.override
  if (category === 'pwo') return resolvePwoTrust(product as TestedProduct, override, pageUrl)
  if (category === 'protein') return resolveProteinTrust(product as TestedProteinProduct, override, pageUrl)
  return resolveCreatineTrust(product as TestedCreatineProduct, override, pageUrl)
}
