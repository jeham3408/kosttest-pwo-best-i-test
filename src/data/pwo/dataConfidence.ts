import type { TestedProduct } from '../pwoProducts'

export type DataConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

const levelRank: Record<DataConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  insufficient: 0,
}

export function dataConfidenceMeetsMinimum(
  level: DataConfidenceLevel,
  minimum: DataConfidenceLevel,
): boolean {
  return levelRank[level] >= levelRank[minimum]
}

export function getPwoDataConfidence(product: TestedProduct): {
  level: DataConfidenceLevel
  label: string
  reasons: string[]
  fullDeclaration: boolean
  notFullyAssessed: boolean
} {
  const reasons: string[] = []
  let points = 0

  const hasServing = Boolean(product.servingSize?.trim())
  const hasIngredients = product.keyIngredients.length >= 3
  const citrullineClear =
    Boolean(product.citrullineMg && product.citrullineMg > 0) &&
    !/uklar|proprietary|blend/i.test(product.citrullineForm)
  const caffeineKnown = product.caffeineMg !== null
  const hasBreakdown = Boolean(product.gradeBreakdown?.length)

  if (hasServing) {
    points += 1
  } else {
    reasons.push('Porsjonsstørrelse ikke oppgitt')
  }
  if (hasIngredients) points += 1
  else reasons.push('Få ingredienser dokumentert i tabellen')
  if (citrullineClear) points += 1
  else if (product.citrullineMg) reasons.push('Pump-ingrediens med uklar form eller ratio')
  if (caffeineKnown) points += 1
  else reasons.push('Koffein ikke oppgitt')
  if (hasBreakdown) points += 1

  const fullDeclaration = hasServing && hasIngredients && citrullineClear && caffeineKnown && hasBreakdown

  let level: DataConfidenceLevel
  if (points >= 5) level = 'high'
  else if (points >= 4) level = 'medium'
  else if (points >= 2) level = 'low'
  else level = 'insufficient'

  const label =
    level === 'high'
      ? 'Høy'
      : level === 'medium'
        ? 'Middels'
        : level === 'low'
          ? 'Lav'
          : 'Utilstrekkelig'

  return {
    level,
    label,
    reasons,
    fullDeclaration,
    notFullyAssessed: !fullDeclaration,
  }
}
