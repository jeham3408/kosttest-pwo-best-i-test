import type { CompareCategory } from './types'

export const COMPARE_QUERY_PARAM = 'compare'
export const MAX_COMPARE_PRODUCTS = 3

const comparePaths: Record<CompareCategory, string> = {
  pwo: '/tester/pwo/sammenlign/',
  protein: '/tester/protein/sammenlign/',
  creatine: '/tester/kreatin/sammenlign/',
}

const hubPaths: Record<CompareCategory, string> = {
  pwo: '/tester/pwo/',
  protein: '/tester/protein/',
  creatine: '/tester/kreatin/',
}

export function getComparePath(category: CompareCategory): string {
  return comparePaths[category]
}

export function getCategoryHubPath(category: CompareCategory): string {
  return hubPaths[category]
}

export function parseCompareIdsFromSearch(search: string): string[] {
  const query = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(query)
  const raw = params.get(COMPARE_QUERY_PARAM)
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE_PRODUCTS)
}

export function buildCompareUrl(category: CompareCategory, ids: string[]): string {
  const base = getComparePath(category)
  if (!ids.length) return base
  const params = new URLSearchParams()
  params.set(COMPARE_QUERY_PARAM, ids.slice(0, MAX_COMPARE_PRODUCTS).join(','))
  return `${base}?${params.toString()}`
}

export function parseCompareRoute(path: string): CompareCategory | null {
  const normalized = path.replace(/\/+$/, '')
  if (normalized === '/tester/pwo/sammenlign' || normalized === '/tester/pwo/samanlikn') return 'pwo'
  if (normalized === '/tester/protein/sammenlign' || normalized === '/tester/protein/samanlikn') return 'protein'
  if (normalized === '/tester/kreatin/sammenlign' || normalized === '/tester/kreatin/samanlikn') return 'creatine'
  return null
}

export function pageToCompareCategory(page: string): CompareCategory | null {
  if (page === 'compare-pwo') return 'pwo'
  if (page === 'compare-protein') return 'protein'
  if (page === 'compare-creatine') return 'creatine'
  return null
}
