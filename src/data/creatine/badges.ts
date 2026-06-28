import type { ProductBadge } from '../badges/types'
import type { TestedCreatineProduct } from '../creatineProducts'
import { hasDopingTestDisclosure, isBrandedCreatine } from '../creatineScoring'
import { getCreatineDataConfidence } from './dataConfidence'
import {
  calculateCreatineValueIndex,
  compareCreatineThenPrice,
  disclosureScore,
  isEligibleForCreatineBadges,
  isFullyDocumentedCreatine,
  CREATINE_BADGE_THRESHOLDS,
} from './metrics'

export type CreatineBadgeId =
  | 'best-documentation'
  | 'best-value'
  | 'best-creapure'
  | 'best-doping-documented'
  | 'best-budget'
  | 'best-full-coverage'
  | 'best-single-pick'

const BADGE_META: Record<
  CreatineBadgeId,
  Omit<ProductBadge, 'eligibilityReason' | 'sourceMetric'> & { id: CreatineBadgeId }
> = {
  'best-documentation': {
    id: 'best-documentation',
    title: 'Best dokumentasjon',
    shortLabel: 'Best dokumentert',
    explanation: 'Flest dokumenterte felt (råvare, renhet, mesh, dopingtest) blant produkt i lista.',
    priority: 100,
  },
  'best-value': {
    id: 'best-value',
    title: 'Best verdi',
    shortLabel: 'Best verdi',
    explanation: 'Høyest verdiindeks — kvalitetsscore og pris per gram — uten å endre hovudscore.',
    priority: 90,
    disclaimerText: 'Verdiindeksen endrer ikke kvalitetsscoren.',
  },
  'best-creapure': {
    id: 'best-creapure',
    title: 'Best Creapure-alternativ',
    shortLabel: 'Best Creapure',
    explanation: 'Høyest kvalitetsscore blant produkt med Creapure eller annan oppgitt merkevare-råvare.',
    priority: 88,
  },
  'best-doping-documented': {
    id: 'best-doping-documented',
    title: 'Best med dokumentert dopingtest',
    shortLabel: 'Doping dokumentert',
    explanation: 'Høyest score blant produkt med dokumentert dopingtest på ferdig produkt.',
    priority: 86,
  },
  'best-budget': {
    id: 'best-budget',
    title: 'Best for lav pris per gram',
    shortLabel: 'Best budsjett',
    explanation: `Lavest pris per gram kreatin blant produkt med score ≥ ${CREATINE_BADGE_THRESHOLDS.budgetMinScore}.`,
    priority: 84,
  },
  'best-full-coverage': {
    id: 'best-full-coverage',
    title: 'Best full datadekning',
    shortLabel: 'Full dekning',
    explanation: 'All dokumentasjon (råvare, renhet, mesh, dopingtest) oppgitt — sjeldent i dagens data.',
    priority: 82,
  },
  'best-single-pick': {
    id: 'best-single-pick',
    title: 'Best enkelt val',
    shortLabel: 'Enkelt val',
    explanation: `Høyest score ≥ ${CREATINE_BADGE_THRESHOLDS.bestPickMinScore} med minst middels datatillit — tydelig kriterium, ikke markedsføring.`,
    priority: 80,
    disclaimerText: 'Et enkelt val basert på score og dokumentasjon — sjekk alltid egne krav.',
  },
}

export type CreatineBadgeContext = {
  winners: Record<CreatineBadgeId, string[]>
  products: TestedCreatineProduct[]
}

function pickTop(
  products: TestedCreatineProduct[],
  scoreFn: (p: TestedCreatineProduct) => number,
  filterFn?: (p: TestedCreatineProduct) => boolean,
): string[] {
  const pool = products.filter((p) => (filterFn ? filterFn(p) : isEligibleForCreatineBadges(p)))
  if (!pool.length) return []
  const best = Math.max(...pool.map(scoreFn))
  return pool.filter((p) => scoreFn(p) === best).sort(compareCreatineThenPrice).map((p) => p.id)
}

function pickBottomPrice(
  products: TestedCreatineProduct[],
  filterFn: (p: TestedCreatineProduct) => boolean,
): string[] {
  const pool = products.filter(filterFn)
  if (!pool.length) return []
  const min = Math.min(...pool.map((p) => p.pricePerGramCreatine))
  return pool.filter((p) => p.pricePerGramCreatine === min).sort(compareCreatineThenPrice).map((p) => p.id)
}

export function buildCreatineBadgeContext(products: TestedCreatineProduct[]): CreatineBadgeContext {
  const hasDoping = products.some((p) => hasDopingTestDisclosure(p.dopingTestLabel))
  const hasFull = products.some((p) => isFullyDocumentedCreatine(p))

  const winners: Record<CreatineBadgeId, string[]> = {
    'best-documentation': pickTop(products, (p) => disclosureScore(p)),
    'best-value': pickTop(
      products,
      (p) => calculateCreatineValueIndex(p).index,
      (p) => isEligibleForCreatineBadges(p) && p.score >= CREATINE_BADGE_THRESHOLDS.valueMinScore,
    ),
    'best-creapure': pickTop(
      products,
      (p) => p.score,
      (p) => isEligibleForCreatineBadges(p) && isBrandedCreatine(p),
    ),
    'best-doping-documented': hasDoping
      ? pickTop(products, (p) => p.score, (p) => isEligibleForCreatineBadges(p) && hasDopingTestDisclosure(p.dopingTestLabel))
      : [],
    'best-budget': pickBottomPrice(
      products,
      (p) => isEligibleForCreatineBadges(p) && p.score >= CREATINE_BADGE_THRESHOLDS.budgetMinScore,
    ),
    'best-full-coverage': hasFull
      ? pickTop(products, (p) => p.score, (p) => isFullyDocumentedCreatine(p))
      : [],
    'best-single-pick': pickTop(
      products,
      (p) => p.score,
      (p) =>
        isEligibleForCreatineBadges(p) &&
        p.score >= CREATINE_BADGE_THRESHOLDS.bestPickMinScore &&
        getCreatineDataConfidence(p).level !== 'insufficient',
    ),
  }
  return { winners, products }
}

function eligibilityReason(product: TestedCreatineProduct, id: CreatineBadgeId): string {
  switch (id) {
    case 'best-documentation':
      return `${disclosureScore(product)}/4 dokumenterte felt — flest i lista.`
    case 'best-value': {
      const v = calculateCreatineValueIndex(product)
      return `Verdiindeks ${v.index} (score ${product.score} + prisreferanse).`
    }
    case 'best-creapure':
      return `Score ${product.score} — best blant merkevare-råstoff (Creapure m.fl.).`
    case 'best-doping-documented':
      return `Score ${product.score} med dokumentert dopingtest: ${product.dopingTestLabel}.`
    case 'best-budget':
      return `${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g med score ≥ ${CREATINE_BADGE_THRESHOLDS.budgetMinScore}.`
    case 'best-full-coverage':
      return 'Råvare, renhet, mesh og dopingtest er oppgitt.'
    case 'best-single-pick':
      return `Score ${product.score} med ${getCreatineDataConfidence(product).label.toLowerCase()}.`
    default:
      return ''
  }
}

export function getCreatineBadges(product: TestedCreatineProduct, ctx: CreatineBadgeContext): ProductBadge[] {
  const badges: ProductBadge[] = []
  for (const id of Object.keys(BADGE_META) as CreatineBadgeId[]) {
    if (!ctx.winners[id].includes(product.id)) continue
    const meta = BADGE_META[id]
    badges.push({
      ...meta,
      eligibilityReason: eligibilityReason(product, id),
      sourceMetric: `Score ${product.score}`,
    })
  }
  return badges.sort((a, b) => b.priority - a.priority)
}

export { BADGE_META, getCreatineDataConfidence }
