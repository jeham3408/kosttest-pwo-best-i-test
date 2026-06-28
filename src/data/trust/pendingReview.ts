import type { ListedProduct } from '../pwoProducts'
import { testedProteinProducts } from '../proteinProducts'
import { proteinVerificationQueue } from '../proteinVerification'
import { buildTrustSnapshot } from './buildSnapshot'
import { MISSING_VALUE } from './labels'
import { methodVersionLabel } from '../siteMeta'
import type { PendingReviewItem, ProductTrustSnapshot, TestCategory } from './types'

export function listedProductToPending(item: ListedProduct): PendingReviewItem | null {
  if (item.status === 'Rangert') return null
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    merchant: item.merchant,
    category: 'pwo',
    url: item.url,
    reason: item.reason,
    missingFields: inferMissingFields(item.reason),
    status: item.status,
    lastAttemptedCheck: null,
  }
}

function inferMissingFields(reason: string): string[] {
  const fields: string[] = []
  if (/deklarasjon|etikett|dose|teksttabell/i.test(reason)) fields.push('Full deklarasjon per dose')
  if (/utsolgt|utgått/i.test(reason)) fields.push('Tilgjengelig produktdata')
  if (/multipakke|variant/i.test(reason)) fields.push('Ensartet porsjonsdata')
  if (!fields.length) fields.push('Manuell dosekontroll')
  return fields
}

export function getProteinPendingReviewItems(): PendingReviewItem[] {
  const pendingIds = proteinVerificationQueue.queue
    .filter((item) => item.status === 'pending')
    .map((item) => item.id)

  return testedProteinProducts
    .filter((p) => pendingIds.includes(p.id))
    .map((product) => {
      const queue = proteinVerificationQueue.queue.find((q) => q.id === product.id)
      const missingFields: string[] = []
      if (!product.diaasIsOfficial) missingFields.push('Offisiell DIAAS-test')
      missingFields.push('Full produktkontroll av deklarasjon og pris')

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        merchant: product.merchant,
        category: 'protein' as const,
        url: product.url,
        reason:
          'Produktet er synlig med DIAAS-estimat, men venter på full kontroll av etikett, dose og pris før vi viser det som fullt vurdert.',
        missingFields,
        status: 'Venter på kontroll',
        lastAttemptedCheck: queue?.lastAttemptAt ?? null,
      }
    })
}

export function resolvePendingTrust(item: PendingReviewItem): ProductTrustSnapshot {
  const pageUrl =
    item.category === 'protein'
      ? `/protein/${item.id}/`
      : item.category === 'creatine'
        ? `/kreatin/${item.id}/`
        : item.url ?? '/tester/pwo/'

  return buildTrustSnapshot({
    category: item.category,
    productId: item.id,
    productName: item.name,
    brand: item.brand,
    slug: item.id,
    isRanked: false,
    trustLevel: 'unranked',
    sourceType: item.url ? 'retailer' : 'unknown',
    documentationStatus: 'incomplete',
    laboratoryTestStatus: 'unknown',
    batchTestStatus: 'pending',
    dopingTestStatus: item.category === 'creatine' ? 'unknown' : 'not_relevant',
    rawMaterialDocumentationStatus: 'pending',
    lastVerifiedAt: MISSING_VALUE,
    lastPriceCheckedAt: MISSING_VALUE,
    lastFormulaCheckedAt: MISSING_VALUE,
    lastUpdatedAt: MISSING_VALUE,
    sourceLinks: item.url ? [{ label: `Produktside hos ${item.merchant}`, url: item.url }] : [],
    dataSourceExplanation: item.reason,
    changeLog: [],
    missingFields: item.missingFields,
    methodVersion: methodVersionLabel,
    lastAttemptedCheck: item.lastAttemptedCheck,
    override: {
      rankingStatus: 'pending_review',
      rankingExclusionReason: item.reason,
      pendingReason: item.reason,
    },
    pageUrl,
    productUrl: item.url,
  })
}

export function getPwoPendingReviewItems(listed: ListedProduct[]): PendingReviewItem[] {
  return listed.map(listedProductToPending).filter((x): x is PendingReviewItem => x !== null)
}

export function getPendingReviewItems(category: TestCategory, listed?: ListedProduct[]): PendingReviewItem[] {
  if (category === 'pwo') return getPwoPendingReviewItems(listed ?? [])
  if (category === 'protein') return getProteinPendingReviewItems()
  return []
}
