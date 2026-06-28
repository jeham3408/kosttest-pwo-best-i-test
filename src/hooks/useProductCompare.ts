import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  EMPTY_COMPARE_STATE,
  loadCompareStorage,
  MAX_COMPARE_PRODUCTS,
  saveCompareStorage,
  subscribeCompareStorage,
  trackCompareEvent,
  type CompareCategory,
} from '../compare'

export type { CompareCategory } from '../compare'

const categoryLabels: Record<CompareCategory, string> = {
  pwo: 'PWO',
  protein: 'protein',
  creatine: 'kreatin',
}

export function useProductCompare() {
  const stored = useSyncExternalStore(
    subscribeCompareStorage,
    loadCompareStorage,
    () => EMPTY_COMPARE_STATE,
  )
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null)

  const pwoIds = stored.pwo
  const proteinIds = stored.protein
  const creatineIds = stored.creatine
  const hydrated = typeof window !== 'undefined'

  const updateCategory = useCallback(
    (category: CompareCategory, updater: (prev: string[]) => string[]) => {
      const current = loadCompareStorage()
      const nextIds = updater(current[category]).slice(0, MAX_COMPARE_PRODUCTS)
      saveCompareStorage({ ...current, [category]: nextIds })
    },
    [],
  )

  const getIds = useCallback(
    (category: CompareCategory) =>
      category === 'pwo' ? pwoIds : category === 'protein' ? proteinIds : creatineIds,
    [pwoIds, proteinIds, creatineIds],
  )

  const otherCategoriesWithItems = useCallback(
    (category: CompareCategory) => {
      const all: CompareCategory[] = ['pwo', 'protein', 'creatine']
      return all.filter((c) => c !== category && getIds(c).length > 0)
    },
    [getIds],
  )

  const toggle = useCallback(
    (category: CompareCategory, id: string) => {
      const others = otherCategoriesWithItems(category)
      const current = getIds(category)
      const removing = current.includes(id)

      if (!removing && others.length > 0) {
        const label = others.map((c) => categoryLabels[c]).join(' og ')
        setCategoryNotice(
          `Sammenligning må skje innenfor samme kategori. Tøm ${label}-valget først, eller fortsett bare med ${categoryLabels[category]}.`,
        )
        return
      }

      setCategoryNotice(null)
      updateCategory(category, (prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((x) => x !== id)
          trackCompareEvent({ type: 'compare_remove', category, productId: id, count: next.length })
          return next
        }
        let next: string[]
        if (prev.length >= MAX_COMPARE_PRODUCTS) {
          next = [...prev.slice(1), id]
        } else {
          next = [...prev, id]
        }
        trackCompareEvent({ type: 'compare_add', category, productId: id, count: next.length })
        return next
      })
    },
    [getIds, otherCategoriesWithItems, updateCategory],
  )

  const remove = useCallback(
    (category: CompareCategory, id: string) => {
      updateCategory(category, (prev) => {
        if (!prev.includes(id)) return prev
        const next = prev.filter((x) => x !== id)
        trackCompareEvent({ type: 'compare_remove', category, productId: id, count: next.length })
        return next
      })
    },
    [updateCategory],
  )

  const clear = useCallback(
    (category: CompareCategory) => {
      saveCompareStorage({ ...loadCompareStorage(), [category]: [] })
      trackCompareEvent({ type: 'compare_clear', category })
      setCategoryNotice(null)
    },
    [],
  )

  const setIds = useCallback(
    (category: CompareCategory, ids: string[]) => {
      const unique = [...new Set(ids)].slice(0, MAX_COMPARE_PRODUCTS)
      saveCompareStorage({ ...loadCompareStorage(), [category]: unique })
    },
    [],
  )

  const isSelected = useCallback(
    (category: CompareCategory, id: string) => getIds(category).includes(id),
    [getIds],
  )

  const isAtMax = useCallback(
    (category: CompareCategory) => getIds(category).length >= MAX_COMPARE_PRODUCTS,
    [getIds],
  )

  const dismissNotice = useCallback(() => setCategoryNotice(null), [])

  return useMemo(
    () => ({
      pwoIds,
      proteinIds,
      creatineIds,
      toggle,
      remove,
      clear,
      setIds,
      isSelected,
      getIds,
      isAtMax,
      maxCompare: MAX_COMPARE_PRODUCTS,
      categoryNotice,
      dismissNotice,
      hydrated,
    }),
    [
      pwoIds,
      proteinIds,
      creatineIds,
      toggle,
      remove,
      clear,
      setIds,
      isSelected,
      getIds,
      isAtMax,
      categoryNotice,
      dismissNotice,
      hydrated,
    ],
  )
}
