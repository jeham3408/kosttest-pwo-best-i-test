import type { CompareFieldDef, CompareHighlight, CompareProductHeader } from './types'
import { isComparableNumeric } from './format'

export function computeRowHighlight<T extends CompareProductHeader>(
  field: CompareFieldDef<T>,
  _products: T[],
  values: ReturnType<CompareFieldDef<T>['getValue']>[],
): CompareHighlight | null {
  if (!field.higherIsBetter && !field.lowerIsBetter) return null

  const numeric = values.map((cell, index) =>
    isComparableNumeric(cell) && cell.raw != null ? { index, raw: cell.raw } : null,
  ).filter((x): x is { index: number; raw: number } => x !== null)

  if (numeric.length < 2) return null

  const allSame = numeric.every((n) => n.raw === numeric[0].raw)
  if (allSame) return null

  const target = field.lowerIsBetter
    ? Math.min(...numeric.map((n) => n.raw))
    : Math.max(...numeric.map((n) => n.raw))
  const opposite = field.lowerIsBetter
    ? Math.max(...numeric.map((n) => n.raw))
    : Math.min(...numeric.map((n) => n.raw))

  const best = numeric.filter((n) => n.raw === target).map((n) => n.index)
  const worst = numeric.filter((n) => n.raw === opposite).map((n) => n.index)

  return { best, worst }
}

export function highlightLabel(kind: 'best' | 'worst'): { symbol: string; text: string } {
  return kind === 'best'
    ? { symbol: '↑', text: 'Best i sammenligningen' }
    : { symbol: '↓', text: 'Lavest i sammenligningen' }
}
