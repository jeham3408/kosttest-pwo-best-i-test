import { testedCreatineProducts } from '../data/creatineProducts'
import { testedProteinProducts } from '../data/proteinProducts'
import { testedProducts } from '../data/pwoProducts'
import type { CompareCategory } from './types'

export function resolveCompareBarItems(
  category: CompareCategory,
  ids: string[],
): { id: string; name: string }[] {
  const catalog =
    category === 'pwo'
      ? testedProducts
      : category === 'protein'
        ? testedProteinProducts
        : testedCreatineProducts

  return ids
    .map((id) => catalog.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ id: p!.id, name: p!.name }))
}
