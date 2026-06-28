import type { TestedProteinProduct } from '../proteinProducts'
import { getProteinVerificationStatus } from '../proteinVerification'

export type ProteinDataConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

export type ProteinDataConfidence = {
  level: ProteinDataConfidenceLevel
  label: string
  reasons: string[]
  fullDeclaration: boolean
}

const CHECKLIST = [
  { key: 'serving', label: 'Porsjonsstørrelse oppgitt', test: (p: TestedProteinProduct) => p.servingSizeG > 0 },
  { key: 'protein', label: 'Protein per porsjon oppgitt', test: (p: TestedProteinProduct) => p.proteinPerServingG > 0 },
  { key: 'source', label: 'Proteintype oppgitt', test: (p: TestedProteinProduct) => Boolean(p.sourceType && p.sourceLabel) },
  { key: 'merchant', label: 'Butikklenke', test: (p: TestedProteinProduct) => Boolean(p.url?.trim()) },
  { key: 'verify', label: 'Produktkontroll', test: (p: TestedProteinProduct) => getProteinVerificationStatus(p.id) === 'verified' },
] as const

export function getProteinDataConfidence(product: TestedProteinProduct): ProteinDataConfidence {
  const passed = CHECKLIST.filter((c) => c.test(product))
  const failed = CHECKLIST.filter((c) => !c.test(product))
  const score = passed.length

  let level: ProteinDataConfidenceLevel = 'insufficient'
  if (score >= 5) level = 'high'
  else if (score >= 4) level = 'medium'
  else if (score >= 3) level = 'low'

  const label =
    level === 'high'
      ? 'God deklarasjon'
      : level === 'medium'
        ? 'Delvis deklarasjon'
        : level === 'low'
          ? 'Avgrensa deklarasjon'
          : 'Utilstrekkelig data'

  return {
    level,
    label,
    reasons: failed.map((c) => c.label),
    fullDeclaration: score >= 4 && product.proteinPer100g > 0,
  }
}

export function proteinDataConfidenceMeetsMinimum(
  level: ProteinDataConfidenceLevel,
  minimum: ProteinDataConfidenceLevel,
): boolean {
  const order: ProteinDataConfidenceLevel[] = ['insufficient', 'low', 'medium', 'high']
  return order.indexOf(level) >= order.indexOf(minimum)
}
