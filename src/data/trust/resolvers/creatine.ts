import {
  formatCreatineSourceLabel,
  hasDopingTestDisclosure,
  hasMeshDisclosure,
  hasPurityDisclosure,
} from '../../creatineScoring'
import type { TestedCreatineProduct } from '../../creatineProducts'
import { lastUpdated, methodVersionLabel } from '../../siteMeta'
import { buildTrustSnapshot, resolveSourceLinks } from '../buildSnapshot'
import { MISSING_VALUE, SITE_REVIEW_NOTE } from '../labels'
import type { DataTrustLevel, ProductDataTrust, ProductTrustSnapshot } from '../types'
import type { DopingTestStatusKind } from '../enums'

export function resolveCreatineTrust(
  product: TestedCreatineProduct,
  override?: ProductDataTrust,
  pageUrl = '',
): ProductTrustSnapshot {
  const dataTrust = product.dataTrust
  const merged = { ...dataTrust, ...override }
  const hasPurity = hasPurityDisclosure(product.purityPercent)
  const hasMesh = hasMeshDisclosure(product.meshLabel)
  const hasDoping = hasDopingTestDisclosure(product.dopingTestLabel)
  const hasBrand = Boolean(product.isCreapure || product.creatineBrand)

  const docCount = [hasPurity, hasMesh, hasDoping, hasBrand].filter(Boolean).length
  const trustLevel: DataTrustLevel =
    merged.pendingReason || merged.rankingExclusionReason
      ? 'unranked'
      : docCount >= 3
        ? 'high'
        : docCount >= 2
          ? 'medium'
          : 'limited'

  const missingFields: string[] = [...(merged.missingFields ?? [])]
  if (!hasPurity) missingFields.push('Renhet')
  if (!hasMesh) missingFields.push('Mesh')
  if (!hasDoping) missingFields.push('Dopingtest')

  const dopingStatus: DopingTestStatusKind =
    merged.dopingTestStatus ??
    (hasDoping
      ? 'documented'
      : product.dopingTestLabel === null
        ? 'not_documented'
        : 'not_found_in_public_sources')

  const sourceLinks = resolveSourceLinks(
    merged,
    product.url ? [{ label: `Produktside hos ${product.merchant}`, url: product.url }] : [],
  )

  return buildTrustSnapshot({
    category: 'creatine',
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    slug: product.id,
    isRanked: true,
    trustLevel,
    sourceType: sourceLinks.length > 1 ? 'multiple' : 'retailer',
    documentationStatus: merged.documentationStatus ?? (docCount >= 2 ? 'verified_from_retailer' : 'incomplete'),
    laboratoryTestStatus: merged.laboratoryTestStatus ?? 'not_tested_by_kosttest',
    batchTestStatus: merged.batchTestStatus ?? 'not_applicable',
    dopingTestStatus: dopingStatus,
    rawMaterialDocumentationStatus:
      merged.rawMaterialDocumentationStatus ?? (hasBrand ? 'documented' : 'not_documented'),
    lastVerifiedAt: merged.lastVerifiedAt ?? merged.lastChecked ?? lastUpdated,
    lastPriceCheckedAt:
      merged.lastPriceCheckedAt ??
      merged.priceLastChecked ??
      (product.merchant ? `${lastUpdated} (${product.merchant})` : MISSING_VALUE),
    lastFormulaCheckedAt: merged.lastFormulaCheckedAt ?? merged.declarationLastChecked ?? lastUpdated,
    lastUpdatedAt: merged.lastUpdatedAt ?? lastUpdated,
    lastCheckedNote: merged.lastVerifiedAt != null || merged.lastChecked != null ? undefined : SITE_REVIEW_NOTE,
    sourceLinks,
    dataSourceExplanation: hasBrand
      ? `Råvare: ${formatCreatineSourceLabel(product)}`
      : undefined,
    changeLog: merged.changeLog ?? [],
    missingFields: [...new Set(missingFields)],
    methodVersion: methodVersionLabel,
    override: merged,
    pageUrl: pageUrl || `/kreatin/${product.id}/`,
    productUrl: product.url,
    score: product.score,
    rank: product.rank,
  })
}
