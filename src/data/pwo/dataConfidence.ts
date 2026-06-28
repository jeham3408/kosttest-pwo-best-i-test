import type { TestedProduct } from '../pwoProducts'

export type DataConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

const levelRank: Record<DataConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
  insufficient: 0,
}

/** Samme pump-ekvivalent som i formelscoren (citrullin + arginin/2 + rødbete×0,9). */
export function pumpEquivalentMg(product: TestedProduct): number {
  const citrulline = product.citrullineMg ?? 0
  const arginine = product.extraDoses?.arginine ?? 0
  const beetroot = product.extraDoses?.beetroot ?? 0
  return citrulline + arginine * 0.5 + beetroot * 0.9
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
  const pumpEq = pumpEquivalentMg(product)
  const citrullineFormUnclear =
    Boolean(product.citrullineMg && product.citrullineMg > 0) &&
    /uklar|proprietary|blend/i.test(product.citrullineForm ?? '')
  const pumpDeclarationClear = pumpEq > 0 && !citrullineFormUnclear
  const caffeineKnown = product.caffeineMg !== null
  const hasBreakdown = Boolean(product.gradeBreakdown?.length)

  if (hasServing) {
    points += 1
  } else {
    reasons.push('Porsjonsstørrelse ikke oppgitt')
  }
  if (hasIngredients) points += 1
  else reasons.push('Få ingredienser dokumentert i tabellen')
  if (pumpDeclarationClear) points += 1
  else if (pumpEq > 0) reasons.push('Pump-ingrediens med uklar form eller ratio')
  else reasons.push('Ingen dokumentert pump-ingrediens (citrullin/rødbete/arginin)')
  if (caffeineKnown) points += 1
  else reasons.push('Koffein ikke oppgitt')
  if (hasBreakdown) points += 1

  const fullDeclaration =
    hasServing && hasIngredients && pumpDeclarationClear && caffeineKnown && hasBreakdown

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

/** Nok deklarasjonsdata til formelscore, plassering og «Best»-badges. */
export function isPwoFullyRankable(product: TestedProduct): boolean {
  return getPwoDataConfidence(product).fullDeclaration
}

export type PwoRankingDisplay = {
  fullyRanked: boolean
  showFormulaScore: boolean
  exclusionNote?: string
}

/** Skiller «venter på kontroll» fra kontrollerte produkter uten pump-ingrediens. */
export function getPwoRankingDisplay(product: TestedProduct): PwoRankingDisplay {
  if (isPwoFullyRankable(product)) {
    return { fullyRanked: true, showFormulaScore: true }
  }

  const { reasons } = getPwoDataConfidence(product)
  const onlyPumpMissing =
    reasons.length === 1 && reasons[0].includes('pump-ingrediens')

  if (onlyPumpMissing) {
    return {
      fullyRanked: false,
      showFormulaScore: true,
      exclusionNote: 'Mangler pump-ingrediens',
    }
  }

  return {
    fullyRanked: false,
    showFormulaScore: false,
    exclusionNote: 'Venter på kontroll',
  }
}
