/** Felles badge-typer — gjenbrukbar struktur for PWO, protein og kreatin. */
export type ProductBadge = {
  id: string
  title: string
  shortLabel: string
  explanation: string
  eligibilityReason: string
  priority: number
  sourceMetric: string
  disclaimerText?: string
}

export type BadgeRule<TProduct, TContext> = {
  id: string
  title: string
  shortLabel: string
  explanation: string
  disclaimerText?: string
  priority: number
  /** Velg vinnar(ar) fra heile lista. Returner produkt-id. */
  pickWinners: (products: TProduct[], ctx: TContext) => string[]
  /** Forklar kvifor et produkt fekk badge. */
  eligibilityFor: (product: TProduct, ctx: TContext, winnerIds: string[]) => string | null
  sourceMetric: (product: TProduct, ctx: TContext) => string
}
