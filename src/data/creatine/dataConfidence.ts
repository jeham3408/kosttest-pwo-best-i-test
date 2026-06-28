import type { TestedCreatineProduct } from '../creatineProducts'
import {
  hasDopingTestDisclosure,
  hasMeshDisclosure,
  hasPurityDisclosure,
  isBrandedCreatine,
} from '../creatineScoring'

export type CreatineDataConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

export type CreatineDataConfidence = {
  level: CreatineDataConfidenceLevel
  label: string
  reasons: string[]
  disclosureCount: number
  maxDisclosures: number
}

const FIELDS = [
  { key: 'brand', label: 'Merkevare/råvare oppgitt', test: (p: TestedCreatineProduct) => isBrandedCreatine(p) },
  { key: 'purity', label: 'Renhet oppgitt', test: (p: TestedCreatineProduct) => hasPurityDisclosure(p.purityPercent) },
  { key: 'mesh', label: 'Mesh oppgitt', test: (p: TestedCreatineProduct) => hasMeshDisclosure(p.meshLabel) },
  { key: 'doping', label: 'Dopingtest dokumentert', test: (p: TestedCreatineProduct) => hasDopingTestDisclosure(p.dopingTestLabel) },
  { key: 'merchant', label: 'Butikklenke', test: (p: TestedCreatineProduct) => Boolean(p.url?.trim()) },
] as const

export function getCreatineDataConfidence(product: TestedCreatineProduct): CreatineDataConfidence {
  const docFields = FIELDS.filter((f) => f.key !== 'merchant')
  const failed = FIELDS.filter((f) => !f.test(product))
  const docPassed = docFields.filter((f) => f.test(product)).length

  let level: CreatineDataConfidenceLevel = 'insufficient'
  if (docPassed >= 4) level = 'high'
  else if (docPassed >= 3) level = 'medium'
  else if (docPassed >= 2) level = 'low'

  const label =
    level === 'high'
      ? 'Full dokumentasjon'
      : level === 'medium'
        ? 'Delvis dokumentert'
        : level === 'low'
          ? 'Avgrensa dokumentasjon'
          : 'Utilstrekkelig data'

  return {
    level,
    label,
    reasons: failed.map((f) => f.label),
    disclosureCount: docPassed,
    maxDisclosures: docFields.length,
  }
}

export function creatineDataConfidenceMeetsMinimum(
  level: CreatineDataConfidenceLevel,
  minimum: CreatineDataConfidenceLevel,
): boolean {
  const order: CreatineDataConfidenceLevel[] = ['insufficient', 'low', 'medium', 'high']
  return order.indexOf(level) >= order.indexOf(minimum)
}

export function isFullyDocumentedCreatine(product: TestedCreatineProduct): boolean {
  return (
    (isBrandedCreatine(product) || product.form === 'monohydrate') &&
    hasPurityDisclosure(product.purityPercent) &&
    hasMeshDisclosure(product.meshLabel) &&
    hasDopingTestDisclosure(product.dopingTestLabel)
  )
}
