import type { TestedProteinProduct } from '../../proteinProducts'
import { getProteinVerificationStatus, proteinVerificationQueue } from '../../proteinVerification'
import { lastUpdated, methodVersionLabel } from '../../siteMeta'
import { buildTrustSnapshot, resolveSourceLinks } from '../buildSnapshot'
import { MISSING_VALUE, SITE_REVIEW_NOTE } from '../labels'
import {
  buildProteinAuditChangeLog,
  getProteinAuditSourceLinks,
  getProteinAuditVerifiedDisplay,
} from '../proteinAudits'
import type { DataTrustLevel, ProductDataTrust, ProductTrustSnapshot } from '../types'

function queueItem(productId: string) {
  return proteinVerificationQueue.queue.find((q) => q.id === productId)
}

export function resolveProteinTrust(
  product: TestedProteinProduct,
  override?: ProductDataTrust,
  pageUrl = '',
): ProductTrustSnapshot {
  const dataTrust = product.dataTrust
  const merged = { ...dataTrust, ...override }
  const status = getProteinVerificationStatus(product.id)
  const auditVerified = getProteinAuditVerifiedDisplay(product.id)
  const queue = queueItem(product.id)

  const trustLevel: DataTrustLevel =
    merged.pendingReason || merged.rankingExclusionReason
      ? 'unranked'
      : merged.dataConfidence === 'limited'
        ? 'limited'
        : status === 'verified' && product.diaasIsOfficial
          ? 'high'
          : status === 'rejected'
            ? 'limited'
            : 'medium'

  const lastVerified =
    merged.lastVerifiedAt ??
    merged.lastChecked ??
    auditVerified?.date ??
    (status === 'verified' ? lastUpdated : MISSING_VALUE)

  const sourceLinks = resolveSourceLinks(
    merged,
    getProteinAuditSourceLinks(product.id).length
      ? getProteinAuditSourceLinks(product.id)
      : product.url
        ? [{ label: `Produktside hos ${product.merchant}`, url: product.url }]
        : [],
  )

  const documentationStatus =
    merged.documentationStatus ??
    (auditVerified ? 'verified_from_retailer' : status === 'verified' ? 'verified_from_retailer' : 'incomplete')

  const laboratoryTestStatus =
    merged.laboratoryTestStatus ??
    (product.diaasIsOfficial ? 'official_diaas_documented' : 'not_tested_by_kosttest')

  const changeLog = merged.changeLog ?? buildProteinAuditChangeLog(product.id)

  const missingFields: string[] = [...(merged.missingFields ?? [])]
  if (!product.diaasIsOfficial && !missingFields.some((f) => /DIAAS/i.test(f))) {
    missingFields.push('Offisiell DIAAS-test')
  }
  if (status === 'pending' && !missingFields.some((f) => /kontroll/i.test(f))) {
    missingFields.push('Full produktkontroll i kø')
  }

  return buildTrustSnapshot({
    category: 'protein',
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    slug: product.id,
    isRanked: status !== 'rejected',
    trustLevel,
    sourceType: sourceLinks.length > 1 ? 'multiple' : auditVerified ? 'retailer' : 'retailer',
    documentationStatus,
    laboratoryTestStatus,
    batchTestStatus: merged.batchTestStatus ?? 'not_applicable',
    dopingTestStatus: merged.dopingTestStatus ?? 'not_relevant',
    rawMaterialDocumentationStatus:
      merged.rawMaterialDocumentationStatus ??
      (product.diaasIsOfficial ? 'documented' : 'not_documented'),
    lastVerifiedAt: lastVerified,
    lastPriceCheckedAt:
      merged.lastPriceCheckedAt ??
      merged.priceLastChecked ??
      (auditVerified ? `${auditVerified.date} (${product.merchant})` : product.merchant ? `${lastUpdated} (${product.merchant})` : MISSING_VALUE),
    lastFormulaCheckedAt:
      merged.lastFormulaCheckedAt ??
      merged.declarationLastChecked ??
      (auditVerified ? auditVerified.date : MISSING_VALUE),
    lastUpdatedAt: merged.lastUpdatedAt ?? lastUpdated,
    lastCheckedNote: auditVerified ? undefined : status !== 'verified' ? SITE_REVIEW_NOTE : undefined,
    sourceLinks,
    dataSourceExplanation: auditVerified
      ? 'Produktdata kontrollert mot butikkens produktside og etikettinformasjon.'
      : undefined,
    changeLog,
    missingFields: [...new Set(missingFields)],
    methodVersion: methodVersionLabel,
    lastAttemptedCheck: merged.lastAttemptedCheck ?? queue?.lastAttemptAt ?? null,
    override: merged,
    pageUrl: pageUrl || `/protein/${product.id}/`,
    productUrl: product.url,
    score: product.score,
    rank: product.rank,
  })
}
