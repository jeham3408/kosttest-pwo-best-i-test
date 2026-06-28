import type { ProductBadge } from '../badges/types'
import type { TestedProteinProduct } from '../proteinProducts'
import { getProteinDataConfidence } from './dataConfidence'
import {
  calculateProteinPriceGrade,
  calculateProteinValueIndex,
  compareProteinThenPrice,
  getProteinPer100Kcal,
  isBakingSuitable,
  isDocumentedLactoseFree,
  isDocumentedSweetenerFree,
  isEligibleForProteinBadges,
  isVeganProduct,
  isWheyProduct,
  PROTEIN_BADGE_THRESHOLDS,
} from './metrics'
import { isProfileBadgeEligible } from './editorialSummary'

export type ProteinBadgeId =
  | 'best-protein-profile'
  | 'best-value-whey'
  | 'best-lactose-free'
  | 'best-vegan'
  | 'best-protein-per-calorie'
  | 'best-no-sweetener'
  | 'best-budget'
  | 'best-baking'

const BADGE_META: Record<
  ProteinBadgeId,
  Omit<ProductBadge, 'eligibilityReason' | 'sourceMetric'> & { id: ProteinBadgeId }
> = {
  'best-protein-profile': {
    id: 'best-protein-profile',
    title: 'Best proteinprofil',
    shortLabel: 'Best profil',
    explanation:
      'Høyest DIAAS-basert kvalitetsscore i hele proteinlisten. Pris, smak og toleranse inngår ikke.',
    priority: 100,
  },
  'best-value-whey': {
    id: 'best-value-whey',
    title: 'Best verdi blant whey',
    shortLabel: 'Best whey-verdi',
    explanation:
      'Høyest verdiindeks blant whey-produkt med DIAAS-score ≥ 90 og prisreferanse A–C. Ikke det same som lavest pris.',
    priority: 90,
    disclaimerText: 'Verdiindeksen endrer ikke DIAAS-rangeringen.',
  },
  'best-lactose-free': {
    id: 'best-lactose-free',
    title: 'Best laktosefri',
    shortLabel: 'Best laktosefri',
    explanation:
      'Høyest DIAAS-score blant produkt dokumentert som laktosefri eller laktosefattig — ikke bare isolate uten laktose-markering.',
    priority: 85,
  },
  'best-vegan': {
    id: 'best-vegan',
    title: 'Best veganske protein',
    shortLabel: 'Best vegan',
    explanation: 'Høyest DIAAS-score blant plantebaserte produkt (soya, erte/ris m.m.).',
    priority: 84,
  },
  'best-protein-per-calorie': {
    id: 'best-protein-per-calorie',
    title: 'Best protein per kalori',
    shortLabel: 'Best g/kcal',
    explanation:
      'Mest protein per 100 kcal der kaloriinnhald er oppgitt i produktdata. Bare produkt med dokumenterte kalorier kan vinne.',
    priority: 82,
  },
  'best-no-sweetener': {
    id: 'best-no-sweetener',
    title: 'Best uten søtstoff',
    shortLabel: 'Uten søtstoff',
    explanation: 'Høyest DIAAS-score blant produkt der produsent/butikk dokumenterer at produktet er uten søtstoff.',
    priority: 80,
  },
  'best-budget': {
    id: 'best-budget',
    title: 'Best budsjett',
    shortLabel: 'Best budsjett',
    explanation: `Lavest pris per gram protein blant produkt med DIAAS-score ≥ ${PROTEIN_BADGE_THRESHOLDS.budgetMinDiaasScore}.`,
    priority: 78,
  },
  'best-baking': {
    id: 'best-baking',
    title: 'Best for baking eller matlaging',
    shortLabel: 'Best baking',
    explanation:
      'Høyest DIAAS-score blant produkt markert for baking/matlaging eller nøytral smak egna til mat.',
    priority: 76,
  },
}

export type ProteinBadgeContext = {
  winners: Record<ProteinBadgeId, string[]>
  products: TestedProteinProduct[]
}

function pickTop(
  products: TestedProteinProduct[],
  scoreFn: (p: TestedProteinProduct) => number,
  filterFn?: (p: TestedProteinProduct) => boolean,
): string[] {
  const pool = products.filter((p) => (filterFn ? filterFn(p) : isEligibleForProteinBadges(p)))
  if (!pool.length) return []
  const best = Math.max(...pool.map(scoreFn))
  return pool.filter((p) => scoreFn(p) === best).sort(compareProteinThenPrice).map((p) => p.id)
}

function pickBottomPrice(
  products: TestedProteinProduct[],
  filterFn: (p: TestedProteinProduct) => boolean,
): string[] {
  const pool = products.filter(filterFn)
  if (!pool.length) return []
  const min = Math.min(...pool.map((p) => p.pricePerGramProtein))
  return pool.filter((p) => p.pricePerGramProtein === min).sort(compareProteinThenPrice).map((p) => p.id)
}

export function buildProteinBadgeContext(products: TestedProteinProduct[]): ProteinBadgeContext {
  const hasSweetenerData = products.some((p) => isDocumentedSweetenerFree(p))
  const hasKcalData = products.some((p) => getProteinPer100Kcal(p) != null)
  const hasBakingData = products.some((p) => isBakingSuitable(p))

  const winners: Record<ProteinBadgeId, string[]> = {
    'best-protein-profile': pickTop(
      products,
      (p) => p.score,
      (p) => isProfileBadgeEligible(p),
    ),
    'best-value-whey': pickTop(
      products,
      (p) => calculateProteinValueIndex(p).index,
      (p) => {
        if (!isEligibleForProteinBadges(p) || !isWheyProduct(p)) return false
        if (p.score < PROTEIN_BADGE_THRESHOLDS.valueMinDiaasScore) return false
        if (p.proteinPer100g < PROTEIN_BADGE_THRESHOLDS.valueMinProteinPer100g) return false
        const grade = calculateProteinPriceGrade(p.pricePerGramProtein).grade
        return PROTEIN_BADGE_THRESHOLDS.valueMaxPriceGrades.includes(grade)
      },
    ),
    'best-lactose-free': pickTop(
      products,
      (p) => p.score,
      (p) => isEligibleForProteinBadges(p) && isDocumentedLactoseFree(p) && p.score >= PROTEIN_BADGE_THRESHOLDS.lactoseFreeMinScore,
    ),
    'best-vegan': pickTop(products, (p) => p.score, (p) => isEligibleForProteinBadges(p) && isVeganProduct(p)),
    'best-protein-per-calorie': hasKcalData
      ? pickTop(
          products,
          (p) => getProteinPer100Kcal(p) ?? 0,
          (p) => isEligibleForProteinBadges(p) && getProteinPer100Kcal(p) != null,
        )
      : [],
    'best-no-sweetener': hasSweetenerData
      ? pickTop(products, (p) => p.score, (p) => isEligibleForProteinBadges(p) && isDocumentedSweetenerFree(p))
      : [],
    'best-budget': pickBottomPrice(
      products,
      (p) =>
        isEligibleForProteinBadges(p) &&
        p.score >= PROTEIN_BADGE_THRESHOLDS.budgetMinDiaasScore &&
        p.proteinPer100g >= PROTEIN_BADGE_THRESHOLDS.budgetMinProteinPer100g,
    ),
    'best-baking': hasBakingData
      ? pickTop(products, (p) => p.score, (p) => isEligibleForProteinBadges(p) && isBakingSuitable(p))
      : [],
  }
  return { winners, products }
}

function eligibilityReason(product: TestedProteinProduct, id: ProteinBadgeId): string {
  switch (id) {
    case 'best-protein-profile':
      return `DIAAS-basert score ${product.score} — høyest i lista.`
    case 'best-value-whey': {
      const v = calculateProteinValueIndex(product)
      return `Verdiindeks ${v.index} blant whey (DIAAS ${product.score} + prisreferanse).`
    }
    case 'best-lactose-free':
      return `DIAAS ${product.score} — best blant dokumentert laktosefri/laktosefattig.`
    case 'best-vegan':
      return `DIAAS ${product.score} — best blant plantebaserte alternativ.`
    case 'best-protein-per-calorie':
      return `${getProteinPer100Kcal(product)?.toFixed(1).replace('.', ',')} g protein per 100 kcal.`
    case 'best-no-sweetener':
      return `DIAAS ${product.score} — best blant produkt dokumentert uten søtstoff.`
    case 'best-budget':
      return `${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein med DIAAS ≥ ${PROTEIN_BADGE_THRESHOLDS.budgetMinDiaasScore}.`
    case 'best-baking':
      return `DIAAS ${product.score} — best blant produkt egna til baking/matlaging.`
    default:
      return ''
  }
}

export function getProteinBadges(product: TestedProteinProduct, ctx: ProteinBadgeContext): ProductBadge[] {
  const badges: ProductBadge[] = []
  for (const id of Object.keys(BADGE_META) as ProteinBadgeId[]) {
    if (!ctx.winners[id].includes(product.id)) continue
    const meta = BADGE_META[id]
    badges.push({
      ...meta,
      eligibilityReason: eligibilityReason(product, id),
      sourceMetric: id === 'best-budget' ? `${product.pricePerGramProtein.toFixed(2)} kr/g` : `DIAAS-score ${product.score}`,
    })
  }
  return badges.sort((a, b) => b.priority - a.priority)
}

export { BADGE_META, getProteinDataConfidence }
