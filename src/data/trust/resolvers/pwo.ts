import type { TestedProduct } from '../../pwoProducts'
import { getPwoDataConfidence } from '../../pwo/dataConfidence'
import { lastUpdated, methodVersionLabel } from '../../siteMeta'
import { buildTrustSnapshot, legacySourceKindToType, resolveSourceLinks } from '../buildSnapshot'
import { MISSING_VALUE, SITE_REVIEW_NOTE } from '../labels'
import type { DataTrustLevel, ProductDataTrust, ProductTrustSnapshot } from '../types'

function mapConfidenceToTrust(level: ReturnType<typeof getPwoDataConfidence>['level']): DataTrustLevel {
  if (level === 'high') return 'high'
  if (level === 'medium') return 'medium'
  return 'limited'
}

export function resolvePwoTrust(
  product: TestedProduct,
  override?: ProductDataTrust,
  pageUrl = '',
): ProductTrustSnapshot {
  const dataTrust = product.dataTrust
  const merged = { ...dataTrust, ...override }
  const confidence = getPwoDataConfidence(product)
  const trustLevel = merged.pendingReason || merged.rankingExclusionReason ? 'unranked' : mapConfidenceToTrust(confidence.level)

  const hasUrl = Boolean(product.url?.trim())
  const sourceType =
    merged.sourceType ??
    (merged.dataSourceKind
      ? legacySourceKindToType(merged.dataSourceKind)
      : confidence.fullDeclaration
        ? 'product-label'
        : hasUrl
          ? 'retailer'
          : 'unknown')

  const documentationStatus =
    merged.documentationStatus ??
    (confidence.fullDeclaration ? 'verified_from_label' : hasUrl ? 'verified_from_retailer' : 'unknown')

  const sourceLinks = resolveSourceLinks(
    merged,
    product.url ? [{ label: `Produktside hos ${product.merchant}`, url: product.url }] : [],
  )

  const missingFields = merged.missingFields ?? confidence.reasons

  return buildTrustSnapshot({
    category: 'pwo',
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    slug: product.id,
    isRanked: true,
    trustLevel,
    sourceType: sourceLinks.length > 1 ? 'multiple' : sourceType,
    documentationStatus,
    laboratoryTestStatus: merged.laboratoryTestStatus ?? 'not_tested_by_kosttest',
    batchTestStatus: merged.batchTestStatus ?? 'not_applicable',
    dopingTestStatus: merged.dopingTestStatus ?? 'not_relevant',
    rawMaterialDocumentationStatus:
      merged.rawMaterialDocumentationStatus ??
      (product.citrullineForm && !/uklar/i.test(product.citrullineForm) && product.citrullineMg
        ? 'documented'
        : product.citrullineMg
          ? 'not_documented'
          : 'unknown'),
    lastVerifiedAt: merged.lastVerifiedAt ?? merged.lastChecked ?? lastUpdated,
    lastPriceCheckedAt:
      merged.lastPriceCheckedAt ??
      merged.priceLastChecked ??
      (product.merchant ? `${lastUpdated} (${product.merchant})` : MISSING_VALUE),
    lastFormulaCheckedAt:
      merged.lastFormulaCheckedAt ??
      merged.declarationLastChecked ??
      (confidence.fullDeclaration ? lastUpdated : MISSING_VALUE),
    lastUpdatedAt: merged.lastUpdatedAt ?? lastUpdated,
    lastCheckedNote: merged.lastVerifiedAt != null || merged.lastChecked != null ? undefined : SITE_REVIEW_NOTE,
    sourceLinks,
    changeLog: merged.changeLog ?? [],
    missingFields,
    methodVersion: methodVersionLabel,
    lastAttemptedCheck: merged.lastAttemptedCheck,
    override: merged,
    pageUrl: pageUrl || `/pwo/${product.id}/`,
    productUrl: product.url,
    score: product.score,
    rank: product.rank,
  })
}

export function resolvePwoTrustCompact(product: TestedProduct): Pick<
  ProductTrustSnapshot,
  'trustLevel' | 'lastChecked' | 'dataSource' | 'dataSourceShort' | 'dataConfidence' | 'lastVerifiedAt'
> {
  const snap = resolvePwoTrust(product)
  return {
    trustLevel: snap.trustLevel,
    lastChecked: snap.lastVerifiedAt,
    lastVerifiedAt: snap.lastVerifiedAt,
    dataSource: snap.dataSourceShort,
    dataSourceShort: snap.dataSourceShort,
    dataConfidence: snap.dataConfidence,
  }
}
