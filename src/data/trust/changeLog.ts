import type { ProductChangeEntry, ProductChangeType } from './types'

export function formatChangeSummary(entry: ProductChangeEntry): string {
  const parts: string[] = [entry.publicSummary]
  if (entry.affectsScore) parts.push('(påvirket score)')
  if (entry.affectsRanking) parts.push('(påvirket rangering)')
  if (entry.affectsPrice) parts.push('(påvirket pris)')
  return parts.join(' ')
}

export function buildPriceChangeEntry(
  date: string,
  beforeKr: number,
  afterKr: number,
  source: string,
): ProductChangeEntry {
  const fmt = (n: number) => n.toFixed(2).replace('.', ',')
  return {
    date,
    type: 'price',
    before: `${fmt(beforeKr)} kr`,
    after: `${fmt(afterKr)} kr`,
    source,
    affectsPrice: true,
    affectsScore: false,
    affectsRanking: false,
    publicSummary: `${date}: Pris oppdatert fra ${fmt(beforeKr)} kr til ${fmt(afterKr)} kr per dose.`,
  }
}

export function buildDeclarationChangeEntry(date: string, source: string): ProductChangeEntry {
  return {
    date,
    type: 'declaration',
    source,
    affectsScore: true,
    affectsRanking: true,
    publicSummary: `${date}: Deklarasjon kontrollert mot ny etikett.`,
  }
}

export function buildScoreChangeEntry(
  date: string,
  before: number,
  after: number,
  reason: string,
): ProductChangeEntry {
  return {
    date,
    type: 'score',
    before: String(before),
    after: String(after),
    affectsScore: true,
    affectsRanking: true,
    publicSummary: `${date}: Formelscore endret etter ${reason} (${before} → ${after}).`,
  }
}

export function buildPendingReviewChangeEntry(date: string, reason: string): ProductChangeEntry {
  return {
    date,
    type: 'status',
    affectsRanking: true,
    publicSummary: `${date}: Produkt flyttet til venter på kontroll fordi ${reason}.`,
  }
}

export function inferChangeType(text: string): ProductChangeType {
  const lower = text.toLowerCase()
  if (/pris/i.test(lower)) return 'price'
  if (/deklarasjon|etikett|dose/i.test(lower)) return 'declaration'
  if (/score|formel|rangering/i.test(lower)) return 'score'
  if (/venter|kontroll|status/i.test(lower)) return 'status'
  if (/formel/i.test(lower)) return 'formula'
  return 'other'
}
