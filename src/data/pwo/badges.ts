import type { ProductBadge } from '../badges/types'
import { calculatePriceGrade, type TestedProduct } from '../pwoProducts'
import { getPwoDataConfidence } from './dataConfidence'
import {
  PWO_BADGE_THRESHOLDS,
  beginnerFitScore,
  calculatePwoValueIndex,
  compareFormulaThenPrice,
  getPumpMetric,
  hasLowCaffeine,
  isBeginnerEligible,
  isEligibleForBadges,
  isStimFree,
} from './metrics'

export type PwoBadgeId =
  | 'best-formel-total'
  | 'best-koffeinfri-formel'
  | 'best-verdi'
  | 'best-budsjett'
  | 'best-for-pump'
  | 'best-lav-koffein'
  | 'best-nybegynner'
  | 'sterkeste'

const BADGE_META: Record<
  PwoBadgeId,
  Omit<ProductBadge, 'eligibilityReason' | 'sourceMetric'> & { id: PwoBadgeId }
> = {
  'best-formel-total': {
    id: 'best-formel-total',
    title: 'Best formel totalt',
    shortLabel: 'Best formel',
    explanation:
      'Høyest gyldig formelscore i heile PWO-lista. Bygger bare på deklarerte ingredienser og dose — ikke pris.',
    priority: 100,
  },
  'best-koffeinfri-formel': {
    id: 'best-koffeinfri-formel',
    title: 'Best koffeinfri formel',
    shortLabel: 'Best koffeinfri',
    explanation: 'Høyast formelscore blant produkt uten koffein per deklarasjon.',
    priority: 90,
  },
  'best-verdi': {
    id: 'best-verdi',
    title: 'Best verdi',
    shortLabel: 'Best verdi',
    explanation:
      'Høyest verdiindeks: 72 % formelscore + 28 % prisreferanse per dose. Ikke det same som billigast.',
    priority: 85,
    disclaimerText: 'Verdiindeksen endrer ikke formelscoren.',
  },
  'best-budsjett': {
    id: 'best-budsjett',
    title: 'Laveste pris per dose',
    shortLabel: 'Laveste pris/dose',
    explanation: `Lavest pris per dose blant produkt med formelscore ≥ ${PWO_BADGE_THRESHOLDS.budgetMinFormulaScore}. Ikke det samme som beste valg for formel.`,
    priority: 80,
  },
  'best-for-pump': {
    id: 'best-for-pump',
    title: 'Best for pump',
    shortLabel: 'Best pump',
    explanation:
      'Høyest nitratboost/pump-poeng (L-citrulline-ekvivalent + arginin/2 + rødbete×0,9) i deklarasjonen.',
    priority: 75,
  },
  'best-lav-koffein': {
    id: 'best-lav-koffein',
    title: 'Best for lav koffein',
    shortLabel: 'Lav koffein',
    explanation: `Beste formel blant produkt med ${PWO_BADGE_THRESHOLDS.lowCaffeineMinMg}–${PWO_BADGE_THRESHOLDS.lowCaffeineMaxMg} mg koffein per dose.`,
    priority: 70,
  },
  'best-nybegynner': {
    id: 'best-nybegynner',
    title: 'Best for nybegynnere',
    shortLabel: 'Nybegynner',
    explanation:
      'Moderat koffein (≤ 200 mg eller koffeinfri), ryddig deklarasjon og formelscore over minimumsterskel. Ikke medisinske råd.',
    priority: 65,
  },
  sterkeste: {
    id: 'sterkeste',
    title: 'Sterkaste',
    shortLabel: 'Sterkaste',
    explanation: `Høyest samla formelscore blant produkt med ≥ ${PWO_BADGE_THRESHOLDS.strongestMinCaffeineMg} mg koffein og score ≥ ${PWO_BADGE_THRESHOLDS.strongestMinFormulaScore}.`,
    priority: 60,
    disclaimerText:
      'Sterk formel betyr ikke «mest koffein». Følg alltid dosering på emballasjen og test toleranse.',
  },
}

export type PwoBadgeContext = {
  winners: Record<PwoBadgeId, string[]>
  products: TestedProduct[]
}

function pickTop(
  products: TestedProduct[],
  scoreFn: (p: TestedProduct) => number,
  filterFn?: (p: TestedProduct) => boolean,
): string[] {
  const pool = products.filter((p) => (filterFn ? filterFn(p) : isEligibleForBadges(p)))
  if (!pool.length) return []
  const best = Math.max(...pool.map(scoreFn))
  return pool.filter((p) => scoreFn(p) === best).sort(compareFormulaThenPrice).map((p) => p.id)
}

function pickBottomPrice(products: TestedProduct[], filterFn: (p: TestedProduct) => boolean): string[] {
  const pool = products.filter(filterFn)
  if (!pool.length) return []
  const minPrice = Math.min(...pool.map((p) => p.pricePerServing))
  return pool.filter((p) => p.pricePerServing === minPrice).sort(compareFormulaThenPrice).map((p) => p.id)
}

export function buildPwoBadgeContext(products: TestedProduct[]): PwoBadgeContext {
  const winners: Record<PwoBadgeId, string[]> = {
    'best-formel-total': pickTop(products, (p) => p.score),
    'best-koffeinfri-formel': pickTop(
      products,
      (p) => p.score,
      (p) => isEligibleForBadges(p) && isStimFree(p),
    ),
    'best-verdi': pickTop(
      products,
      (p) => calculatePwoValueIndex(p).index,
      (p) => {
        if (!isEligibleForBadges(p) || p.score < PWO_BADGE_THRESHOLDS.valueMinFormulaScore) return false
        const grade = calculatePriceGrade(p.pricePerServing).grade
        return PWO_BADGE_THRESHOLDS.valueMinPriceGrades.includes(grade)
      },
    ),
    'best-budsjett': pickBottomPrice(
      products,
      (p) => isEligibleForBadges(p) && p.score >= PWO_BADGE_THRESHOLDS.budgetMinFormulaScore,
    ),
    'best-for-pump': pickTop(products, (p) => getPumpMetric(p).points),
    'best-lav-koffein': pickTop(
      products,
      (p) => p.score,
      (p) =>
        isEligibleForBadges(p) &&
        hasLowCaffeine(p) &&
        p.score >= PWO_BADGE_THRESHOLDS.lowCaffeineMinScore,
    ),
    'best-nybegynner': pickTop(products, (p) => beginnerFitScore(p), isBeginnerEligible),
    sterkeste: pickTop(
      products,
      (p) => p.score,
      (p) =>
        isEligibleForBadges(p) &&
        (p.caffeineMg ?? 0) >= PWO_BADGE_THRESHOLDS.strongestMinCaffeineMg &&
        p.score >= PWO_BADGE_THRESHOLDS.strongestMinFormulaScore,
    ),
  }
  return { winners, products }
}

function eligibilityReason(product: TestedProduct, id: PwoBadgeId, ctx: PwoBadgeContext): string {
  switch (id) {
    case 'best-formel-total':
      return `Formelscore ${product.score} — høyest blant ranked produkt med datakonfidens ≥ middels.`
    case 'best-koffeinfri-formel':
      return `Formelscore ${product.score} uten koffein i deklarasjonen.`
    case 'best-verdi': {
      const v = calculatePwoValueIndex(product)
      return `Verdiindeks ${v.index} (${v.explanation.split('.')[0]}).`
    }
    case 'best-budsjett':
      return `Lavest pris per dose (${product.pricePerServing.toFixed(2).replace('.', ',')} kr) med formelscore ≥ ${PWO_BADGE_THRESHOLDS.budgetMinFormulaScore}.`
    case 'best-for-pump': {
      const pump = getPumpMetric(product)
      return `Pump-poeng ${pump.points.toFixed(1).replace('.', ',')}/40 (${pump.citrullineEqMg.toLocaleString('nb-NO')} mg ekvivalent).`
    }
    case 'best-lav-koffein':
      return `Formelscore ${product.score} med ${product.caffeineMg} mg koffein — best i låg-koffein-segmentet.`
    case 'best-nybegynner':
      return `Nybegynner-score ${beginnerFitScore(product).toFixed(1).replace('.', ',')} (moderat koffein + formel).`
    case 'sterkeste':
      return `Formelscore ${product.score} med ${product.caffeineMg} mg koffein — høyest i «sterk formel med koffein»-segmentet.`
    default:
      return ctx.winners[id as PwoBadgeId]?.includes(product.id) ? 'Vinnar i kategori.' : ''
  }
}

function sourceMetric(product: TestedProduct, id: PwoBadgeId): string {
  switch (id) {
    case 'best-verdi':
      return `Verdiindeks ${calculatePwoValueIndex(product).index}`
    case 'best-budsjett':
      return `${product.pricePerServing.toFixed(2).replace('.', ',')} kr/dose`
    case 'best-for-pump':
      return `${getPumpMetric(product).points.toFixed(1)} pump-poeng`
    default:
      return `Formelscore ${product.score}`
  }
}

export function getPwoBadges(product: TestedProduct, ctx: PwoBadgeContext): ProductBadge[] {
  const badges: ProductBadge[] = []
  for (const id of Object.keys(BADGE_META) as PwoBadgeId[]) {
    if (!ctx.winners[id].includes(product.id)) continue
    const meta = BADGE_META[id]
    badges.push({
      ...meta,
      eligibilityReason: eligibilityReason(product, id, ctx),
      sourceMetric: sourceMetric(product, id),
    })
  }
  return badges.sort((a, b) => b.priority - a.priority)
}

export function getPrimaryPwoBadgeLabel(product: TestedProduct, ctx: PwoBadgeContext): string | null {
  const badges = getPwoBadges(product, ctx)
  return badges[0]?.shortLabel ?? null
}

export { BADGE_META, getPwoDataConfidence }
