import {
  BATCH_TEST_STATUS_LABELS,
  DOCUMENTATION_STATUS_KIND_LABELS,
  DOPING_TEST_STATUS_LABELS,
  LABORATORY_TEST_STATUS_LABELS,
  type BatchTestStatusKind,
  type DataConfidenceKind,
  type DocumentationStatusKind,
  type DopingTestStatusKind,
  type LaboratoryTestStatusKind,
  type RankingStatusKind,
  type RawMaterialDocStatusKind,
} from './enums'
import { DATA_SOURCE_LABELS, MISSING_VALUE, TRUST_LEVEL_COPY } from './labels'
import type {
  DataSourceKind,
  DataTrustLevel,
  ProductChangeEntry,
  ProductDataTrust,
  ProductTrustSnapshot,
  SourceTypeKind,
  TestCategory,
  TrustSourceLink,
} from './types'

export function mapTrustLevelToConfidence(level: DataTrustLevel): DataConfidenceKind {
  if (level === 'high') return 'high'
  if (level === 'medium') return 'medium'
  return 'limited'
}

export function mapConfidenceToTrustLevel(confidence: DataConfidenceKind): DataTrustLevel {
  if (confidence === 'high') return 'high'
  if (confidence === 'medium') return 'medium'
  return 'limited'
}

export function legacySourceKindToType(kind: DataSourceKind): SourceTypeKind {
  if (kind === 'product-label') return 'product-label'
  if (kind === 'manufacturer') return 'manufacturer'
  if (kind === 'retailer') return 'retailer'
  if (kind === 'third-party-doc') return 'multiple'
  return 'unknown'
}

export function resolveSourceTypeFromOverride(override?: ProductDataTrust): SourceTypeKind | undefined {
  if (override?.sourceType) return override.sourceType
  if (override?.dataSourceKind) return legacySourceKindToType(override.dataSourceKind)
  return undefined
}

export function resolveSourceLinks(override?: ProductDataTrust, fallback: TrustSourceLink[] = []): TrustSourceLink[] {
  return override?.sourceUrls ?? override?.sourceLinks ?? fallback
}

export function resolveLastVerified(override?: ProductDataTrust, fallback = MISSING_VALUE): string {
  return override?.lastVerifiedAt ?? override?.lastChecked ?? fallback
}

export function resolveLastPriceChecked(override?: ProductDataTrust, fallback = MISSING_VALUE): string {
  return override?.lastPriceCheckedAt ?? override?.priceLastChecked ?? fallback
}

export function resolveLastFormulaChecked(override?: ProductDataTrust, fallback = MISSING_VALUE): string {
  return override?.lastFormulaCheckedAt ?? override?.declarationLastChecked ?? fallback
}

export function sourceTypeLabel(sourceType: SourceTypeKind, linkCount: number): { label: string; short: string; explanation: string } {
  if (linkCount > 1 || sourceType === 'multiple') {
    return {
      label: 'Flere kilder',
      short: 'Flere kilder',
      explanation: 'Data er hentet fra mer enn én åpen kilde.',
    }
  }
  if (sourceType === 'product-label') {
    return { ...DATA_SOURCE_LABELS.productLabel, short: 'Etikett' }
  }
  if (sourceType === 'manufacturer') {
    return { ...DATA_SOURCE_LABELS.manufacturer, short: 'Produsent' }
  }
  if (sourceType === 'retailer') {
    return { ...DATA_SOURCE_LABELS.retailer, short: 'Forhandler' }
  }
  return { ...DATA_SOURCE_LABELS.unknown, short: 'Ukjent' }
}

export function documentationLabel(status: DocumentationStatusKind) {
  return DOCUMENTATION_STATUS_KIND_LABELS[status]
}

export function labStatusLabel(status: LaboratoryTestStatusKind) {
  return LABORATORY_TEST_STATUS_LABELS[status]
}

export function dopingStatusLabel(status: DopingTestStatusKind) {
  return DOPING_TEST_STATUS_LABELS[status]
}

export function batchStatusLabel(status: BatchTestStatusKind) {
  return BATCH_TEST_STATUS_LABELS[status]
}

export function rawMaterialStatusLabel(status: RawMaterialDocStatusKind): { label: string; explanation: string } {
  if (status === 'documented') {
    return { label: 'Råvare dokumentert', explanation: 'Produsent har oppgitt råvaremerke eller kvalitet.' }
  }
  if (status === 'not_documented') {
    return { label: 'Råvare ikke dokumentert', explanation: 'Ingen dokumentert råvareinformasjon funnet.' }
  }
  if (status === 'not_found') {
    return { label: 'Ikke funnet i åpne kilder', explanation: 'Vi har ikke funnet råvaredokumentasjon.' }
  }
  if (status === 'pending') {
    return { label: 'Venter på kontroll', explanation: 'Råvaredata skal kontrolleres.' }
  }
  return { label: 'Råvarestatus ukjent', explanation: 'Ikke oppgitt per produkt.' }
}

export function resolveRankingState(
  isRanked: boolean,
  override?: ProductDataTrust,
): { rankingStatus: RankingStatusKind; rankingExclusionReason?: string } {
  if (override?.rankingStatus) {
    return {
      rankingStatus: override.rankingStatus,
      rankingExclusionReason: override.rankingExclusionReason ?? override.pendingReason ?? undefined,
    }
  }
  if (!isRanked || override?.pendingReason) {
    return {
      rankingStatus: 'pending_review',
      rankingExclusionReason: override?.rankingExclusionReason ?? override?.pendingReason ?? undefined,
    }
  }
  return {
    rankingStatus: 'ranked',
    rankingExclusionReason: override?.rankingExclusionReason ?? undefined,
  }
}

type SnapshotBaseInput = {
  category: TestCategory
  productId: string
  productName: string
  brand: string
  slug: string
  isRanked: boolean
  trustLevel: DataTrustLevel
  sourceType: SourceTypeKind
  documentationStatus: DocumentationStatusKind
  laboratoryTestStatus: LaboratoryTestStatusKind
  batchTestStatus: BatchTestStatusKind
  dopingTestStatus: DopingTestStatusKind
  rawMaterialDocumentationStatus: RawMaterialDocStatusKind
  lastVerifiedAt: string
  lastPriceCheckedAt: string
  lastFormulaCheckedAt: string
  lastUpdatedAt: string
  lastCheckedNote?: string
  sourceLinks: TrustSourceLink[]
  dataSourceExplanation?: string
  changeLog: ProductChangeEntry[]
  missingFields: string[]
  methodVersion: string
  lastAttemptedCheck?: string | null
  override?: ProductDataTrust
  pageUrl: string
  productUrl?: string
  score?: number
  rank?: number
}

export function buildTrustSnapshot(input: SnapshotBaseInput): ProductTrustSnapshot {
  const override = input.override
  const { rankingStatus, rankingExclusionReason } = resolveRankingState(input.isRanked, override)
  const dataConfidence =
    override?.dataConfidence ?? mapTrustLevelToConfidence(input.trustLevel === 'unranked' ? 'limited' : input.trustLevel)
  const trustCopy = TRUST_LEVEL_COPY[input.trustLevel]
  const sourceCopy = sourceTypeLabel(input.sourceType, input.sourceLinks.length)
  const docCopy = documentationLabel(input.documentationStatus)
  const labCopy = labStatusLabel(input.laboratoryTestStatus)
  const batchCopy = batchStatusLabel(input.batchTestStatus)
  const dopingCopy = dopingStatusLabel(input.dopingTestStatus)
  const rawCopy = rawMaterialStatusLabel(input.rawMaterialDocumentationStatus)

  const lastVerifiedAt = resolveLastVerified(override, input.lastVerifiedAt)
  const lastPriceCheckedAt = resolveLastPriceChecked(override, input.lastPriceCheckedAt)
  const lastFormulaCheckedAt = resolveLastFormulaChecked(override, input.lastFormulaCheckedAt)
  const lastUpdatedAt = override?.lastUpdatedAt ?? input.lastUpdatedAt

  return {
    category: input.category,
    productId: input.productId,
    productName: input.productName,
    brand: input.brand,
    slug: input.slug,
    isRanked: input.isRanked && rankingStatus === 'ranked',
    rankingStatus,
    rankingExclusionReason,
    trustLevel: input.trustLevel,
    trustLevelExplanation: trustCopy.explanation,
    dataConfidence,
    documentationStatus: override?.documentationStatus ?? input.documentationStatus,
    sourceType: input.sourceType,
    laboratoryTestStatus: override?.laboratoryTestStatus ?? input.laboratoryTestStatus,
    batchTestStatusCode: override?.batchTestStatus ?? input.batchTestStatus,
    dopingTestStatusCode: override?.dopingTestStatus ?? input.dopingTestStatus,
    rawMaterialDocumentationStatus:
      override?.rawMaterialDocumentationStatus ?? input.rawMaterialDocumentationStatus,
    lastVerifiedAt,
    lastPriceCheckedAt,
    lastFormulaCheckedAt,
    lastUpdatedAt,
    lastChecked: lastVerifiedAt,
    lastCheckedNote: input.lastCheckedNote,
    priceLastChecked: lastPriceCheckedAt,
    declarationLastChecked: lastFormulaCheckedAt,
    dataSource: docCopy.label !== 'Kilde ikke oppgitt per produkt' ? docCopy.label : sourceCopy.label,
    dataSourceShort: sourceCopy.short,
    dataSourceExplanation: input.dataSourceExplanation ?? override?.dataSourceDetail ?? sourceCopy.explanation,
    sourceLinks: resolveSourceLinks(override, input.sourceLinks),
    labTestStatus: labCopy.label,
    labTestExplanation: labCopy.explanation,
    batchTestStatus: batchCopy.label,
    dopingTestStatus: dopingCopy.label,
    rawMaterialDocStatus: rawCopy.label,
    methodVersion: override?.methodVersion ?? input.methodVersion,
    changeLog: override?.changeLog ?? input.changeLog,
    missingFields: override?.missingFields ?? input.missingFields,
    pendingReason: rankingExclusionReason,
    lastAttemptedCheck: override?.lastAttemptedCheck ?? input.lastAttemptedCheck ?? null,
    feedbackContext: {
      category: input.category,
      productId: input.productId,
      slug: input.slug,
      productName: input.productName,
      score: input.score,
      rank: input.rank,
      lastChecked: lastVerifiedAt,
      productUrl: input.productUrl,
      pageUrl: input.pageUrl,
    },
  }
}
