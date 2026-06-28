import type { CompareCategory, CompareCategoryConfig, CompareProductHeader } from './types'
import { creatineCompareConfig } from './categories/creatine'
import { proteinCompareConfig } from './categories/protein'
import { pwoCompareConfig } from './categories/pwo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const configs: Record<CompareCategory, CompareCategoryConfig<any>> = {
  pwo: pwoCompareConfig,
  protein: proteinCompareConfig,
  creatine: creatineCompareConfig,
}

export function getCompareConfig(category: CompareCategory): CompareCategoryConfig<CompareProductHeader> {
  return configs[category]
}

export function getSortedFields(category: CompareCategory) {
  return getCompareConfig(category)
    .getFields()
    .slice()
    .sort((a, b) => b.priority - a.priority)
}

export { pwoCompareConfig, proteinCompareConfig, creatineCompareConfig }
