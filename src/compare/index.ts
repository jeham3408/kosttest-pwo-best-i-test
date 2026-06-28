export type { CompareCategory, CompareCell, CompareFieldDef, CompareProductHeader } from './types'
export { formatMg, formatPriceKr, formatScore, formatText, formatNotApplicable } from './format'
export { computeRowHighlight, highlightLabel } from './highlight'
export {
  COMPARE_QUERY_PARAM,
  MAX_COMPARE_PRODUCTS,
  buildCompareUrl,
  getCategoryHubPath,
  getComparePath,
  pageToCompareCategory,
  parseCompareIdsFromSearch,
  parseCompareRoute,
} from './url'
export { loadCompareStorage, saveCompareStorage, subscribeCompareStorage } from './storage'
export { resolveCompareBarItems } from './resolveBarItems'
export { trackCompareEvent, type CompareAnalyticsEvent } from './analytics'
export { getCompareConfig, getSortedFields, pwoCompareConfig, proteinCompareConfig, creatineCompareConfig } from './registry'
