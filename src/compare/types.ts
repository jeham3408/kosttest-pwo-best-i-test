export type CompareCategory = 'pwo' | 'protein' | 'creatine'

export type CompareValueKind =
  | 'number'
  | 'text'
  | 'score'
  | 'missing'
  | 'not-documented'
  | 'not-applicable'

export type CompareCell = {
  display: string
  raw?: number | null
  kind: CompareValueKind
  ariaLabel?: string
}

export type CompareFieldGroup =
  | 'summary'
  | 'score'
  | 'price'
  | 'ingredients'
  | 'documentation'
  | 'copy'

export type CompareFieldDef<TProduct> = {
  key: string
  label: string
  group: CompareFieldGroup
  priority: number
  getValue: (product: TProduct) => CompareCell
  /** Høgare tal = betre for markering (t.d. formelscore, dose) */
  higherIsBetter?: boolean
  /** Lågare tal = betre (t.d. pris per dose) */
  lowerIsBetter?: boolean
  /** Inkluder i automatisk skilnadsforklaring */
  diffRelevant?: boolean
}

export type CompareProductHeader = {
  id: string
  name: string
  brand: string
  image: string
  url?: string
  merchant?: string
}

export type CompareHighlight = {
  best: number[]
  worst: number[]
}

export type CompareCategoryConfig<TProduct extends CompareProductHeader> = {
  category: CompareCategory
  title: string
  hubPath: string
  comparePath: string
  resolveProducts: (ids: string[]) => TProduct[]
  getFields: () => CompareFieldDef<TProduct>[]
  generateDiff: (products: TProduct[]) => string[]
  getProductLabel: (product: TProduct) => string
}
