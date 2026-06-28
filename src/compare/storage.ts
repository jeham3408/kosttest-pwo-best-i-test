import type { CompareCategory } from './types'

const STORAGE_KEY = 'kosttest-compare-v1'

export type CompareStorageState = Record<CompareCategory, string[]>

const emptyState = (): CompareStorageState => ({
  pwo: [],
  protein: [],
  creatine: [],
})

export function loadCompareStorage(): CompareStorageState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<CompareStorageState>
    return {
      pwo: Array.isArray(parsed.pwo) ? parsed.pwo.slice(0, 3) : [],
      protein: Array.isArray(parsed.protein) ? parsed.protein.slice(0, 3) : [],
      creatine: Array.isArray(parsed.creatine) ? parsed.creatine.slice(0, 3) : [],
    }
  } catch {
    return emptyState()
  }
}

export function saveCompareStorage(state: CompareStorageState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new Event('kosttest-compare-change'))
  } catch {
    /* quota / private mode */
  }
}

export function subscribeCompareStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onStoreChange()
  window.addEventListener('kosttest-compare-change', handler)
  return () => window.removeEventListener('kosttest-compare-change', handler)
}
