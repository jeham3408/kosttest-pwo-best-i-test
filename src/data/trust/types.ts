import type {
  BatchTestStatusKind,
  DataConfidenceKind,
  DocumentationStatusKind,
  DopingTestStatusKind,
  LaboratoryTestStatusKind,
  RankingStatusKind,
  RawMaterialDocStatusKind,
} from './enums'

export type TestCategory = 'pwo' | 'protein' | 'creatine'

/** Offentlig datatillit — ikke det samme som formelscore. */
export type DataTrustLevel = 'high' | 'medium' | 'limited' | 'unranked'

/** @deprecated Bruk SourceTypeKind */
export type DataSourceKind =
  | 'product-label'
  | 'manufacturer'
  | 'retailer'
  | 'third-party-doc'
  | 'unknown'

export type SourceTypeKind =
  | 'product-label'
  | 'manufacturer'
  | 'retailer'
  | 'multiple'
  | 'unknown'

/** @deprecated Bruk LaboratoryTestStatusKind */
export type LabTestStatus =
  | 'not-by-kosttest'
  | 'third-party-documented'
  | 'official-diaas'
  | 'not-applicable'

/** @deprecated Bruk BatchTestStatusKind / DopingTestStatusKind */
export type DocumentedStatus =
  | 'documented'
  | 'not-documented'
  | 'not-found'
  | 'not-applicable'
  | 'pending'

export type ProductChangeType =
  | 'price'
  | 'declaration'
  | 'score'
  | 'status'
  | 'formula'
  | 'ranking'
  | 'other'

export type ProductChangeEntry = {
  date: string
  dateIso?: string
  type: ProductChangeType
  before?: string
  after?: string
  source?: string
  affectsScore?: boolean
  affectsRanking?: boolean
  affectsPrice?: boolean
  /** Offentlig setning — ingen interne notat */
  publicSummary: string
}

export type TrustSourceLink = {
  label: string
  url: string
}

/** Valfri utvidet metadata på produktpost — bruk bare verifiserte felt. */
export type ProductDataTrust = {
  lastVerifiedAt?: string | null
  lastPriceCheckedAt?: string | null
  lastFormulaCheckedAt?: string | null
  lastUpdatedAt?: string | null
  /** @deprecated Bruk lastVerifiedAt */
  lastChecked?: string | null
  lastCheckedIso?: string | null
  /** @deprecated Bruk lastPriceCheckedAt */
  priceLastChecked?: string | null
  /** @deprecated Bruk lastFormulaCheckedAt */
  declarationLastChecked?: string | null
  sourceUrls?: TrustSourceLink[]
  /** @deprecated Bruk sourceUrls */
  sourceLinks?: TrustSourceLink[]
  sourceType?: SourceTypeKind
  /** @deprecated Bruk sourceType */
  dataSourceKind?: DataSourceKind
  dataSourceDetail?: string | null
  documentationStatus?: DocumentationStatusKind
  dataConfidence?: DataConfidenceKind
  laboratoryTestStatus?: LaboratoryTestStatusKind
  /** @deprecated Bruk laboratoryTestStatus */
  labTestStatus?: LabTestStatus
  batchTestStatus?: BatchTestStatusKind
  dopingTestStatus?: DopingTestStatusKind
  rawMaterialDocumentationStatus?: RawMaterialDocStatusKind
  /** @deprecated Bruk rawMaterialDocumentationStatus */
  rawMaterialDocStatus?: DocumentedStatus
  methodVersion?: string | null
  changeLog?: ProductChangeEntry[]
  missingFields?: string[]
  lastAttemptedCheck?: string | null
  rankingStatus?: RankingStatusKind
  rankingExclusionReason?: string | null
  /** @deprecated Bruk rankingExclusionReason */
  pendingReason?: string | null
}

export type ProductTrustSnapshot = {
  category: TestCategory
  productId: string
  productName: string
  brand: string
  slug: string
  isRanked: boolean
  rankingStatus: RankingStatusKind
  rankingExclusionReason?: string
  trustLevel: DataTrustLevel
  trustLevelExplanation: string
  dataConfidence: DataConfidenceKind
  documentationStatus: DocumentationStatusKind
  sourceType: SourceTypeKind
  laboratoryTestStatus: LaboratoryTestStatusKind
  batchTestStatusCode: BatchTestStatusKind
  dopingTestStatusCode: DopingTestStatusKind
  rawMaterialDocumentationStatus: RawMaterialDocStatusKind
  /** Visningsverdi — kan være «Ikke oppgitt per produkt» */
  lastVerifiedAt: string
  lastPriceCheckedAt: string
  lastFormulaCheckedAt: string
  lastUpdatedAt: string
  /** @deprecated Bruk lastVerifiedAt */
  lastChecked: string
  lastCheckedNote?: string
  /** @deprecated Bruk lastPriceCheckedAt */
  priceLastChecked: string
  /** @deprecated Bruk lastFormulaCheckedAt */
  declarationLastChecked: string
  dataSource: string
  dataSourceShort: string
  dataSourceExplanation: string
  sourceLinks: TrustSourceLink[]
  labTestStatus: string
  labTestExplanation: string
  batchTestStatus: string
  dopingTestStatus: string
  rawMaterialDocStatus: string
  methodVersion: string
  changeLog: ProductChangeEntry[]
  missingFields: string[]
  /** @deprecated Bruk rankingExclusionReason */
  pendingReason?: string
  lastAttemptedCheck?: string | null
  feedbackContext: {
    category: TestCategory
    productId: string
    slug: string
    productName: string
    score?: number
    rank?: number
    lastChecked: string
    productUrl?: string
    pageUrl: string
  }
}

export type PendingReviewItem = {
  id: string
  name: string
  brand: string
  merchant: string
  category: TestCategory
  url?: string
  reason: string
  missingFields: string[]
  lastAttemptedCheck?: string | null
  status: string
}
