import type { TestedCreatineProduct } from '../creatineProducts'
import type { CreatineBadgeContext } from './badges'
import { getCreatineBadges } from './badges'
import { getCreatineDataConfidence } from './dataConfidence'
import {
  formatCreatineDoping,
  formatCreatineMesh,
  formatCreatinePurity,
  formatCreatineSource,
} from './metrics'

export type CreatineProductCopy = {
  bestFor: string
  importantToKnow: string
}

export function generateCreatineProductCopy(
  product: TestedCreatineProduct,
  badgeCtx: CreatineBadgeContext,
): CreatineProductCopy {
  const badges = getCreatineBadges(product, badgeCtx)
  const conf = getCreatineDataConfidence(product)

  let bestFor = product.verdict.split('.')[0] ?? product.formLabel
  if (badges.some((b) => b.id === 'best-doping-documented')) {
    bestFor = 'Utøvarar som vil ha dokumentert dopingtest på ferdig produkt — sjekk testreferanse.'
  } else if (badges.some((b) => b.id === 'best-creapure')) {
    bestFor = 'Merkevare-råstoff (Creapure) der produsent oppgir renhet — dopingtest kan likevel mangle.'
  } else if (badges.some((b) => b.id === 'best-budget')) {
    bestFor = 'Lav pris per gram monohydrat — dokumentasjon er ofte tynnare enn Creapure-alternativ.'
  }

  const importantParts: string[] = []
  importantParts.push(
    `Score ${product.score}/100 bygger på råvare, renhet, mesh og dopingtest — poengtrekk når felt mangler, ikke utelukking.`,
  )
  if (!formatCreatineDoping(product).includes('Cologne')) {
    importantParts.push(`Dopingtest: ${formatCreatineDoping(product)}.`)
  }
  if (conf.level !== 'high') {
    importantParts.push(`Dokumentasjon: ${conf.label.toLowerCase()} (${conf.disclosureCount}/${conf.maxDisclosures} felt).`)
  }
  if (product.watchouts[0]) importantParts.push(product.watchouts[0])

  return {
    bestFor,
    importantToKnow: importantParts.join(' '),
  }
}

export function formatCreatineDocSummary(product: TestedCreatineProduct): string {
  return `${formatCreatineSource(product)} · ${formatCreatinePurity(product.purityPercent)} · ${formatCreatineMesh(product.meshLabel)} · ${formatCreatineDoping(product)}`
}
