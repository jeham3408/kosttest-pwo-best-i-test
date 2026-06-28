import type { CompareCategory } from './types'

const STORAGE_KEY = 'kosttest-compare-v1'

export type CompareStorageState = Record<CompareCategory, string[]>

/** Stabil tom snapshot — må ikke være ny referanse per getSnapshot-kall (React #185). */
export const EMPTY_COMPARE_STATE: CompareStorageState = {
  pwo: [],
  protein: [],
  creatine: [],
}

let cachedRaw: string | null | undefined
let cachedSnapshot: CompareStorageState = EMPTY_COMPARE_STATE

function normalizeParsed(parsed: Partial<CompareStorageState>): CompareStorageState {
  return {
    pwo: Array.isArray(parsed.pwo) ? parsed.pwo.slice(0, 3) : [],
    protein: Array.isArray(parsed.protein) ? parsed.protein.slice(0, 3) : [],
    creatine: Array.isArray(parsed.creatine) ? parsed.creatine.slice(0, 3) : [],
  }
}

export function loadCompareStorage(): CompareStorageState {
  if (typeof window === 'undefined') return EMPTY_COMPARE_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) return cachedSnapshot
    cachedRaw = raw
    if (!raw) {
      cachedSnapshot = EMPTY_COMPARE_STATE
      return cachedSnapshot
    }
    cachedSnapshot = normalizeParsed(JSON.parse(raw) as Partial<CompareStorageState>)
    return cachedSnapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = EMPTY_COMPARE_STATE
    return cachedSnapshot
  }
}

export function saveCompareStorage(state: CompareStorageState): void {
  if (typeof window === 'undefined') return
  try {
    const normalized = normalizeParsed(state)
    const raw = JSON.stringify(normalized)
    window.localStorage.setItem(STORAGE_KEY, raw)
    cachedRaw = raw
    cachedSnapshot = normalized
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
