import { testedProteinProducts, type TestedProteinProduct } from '../../data/proteinProducts'
import {
  buildProteinBadgeContext,
  generateProteinProductCopy,
  getProteinBadges,
  getDiaasStatus,
  formatAllergenSummary,
  formatProteinKcal,
  getProteinProductModel,
} from '../../data/protein'
import { resolveProteinTrust } from '../../data/trust/resolvers/protein'
import { TRUST_LEVEL_COPY } from '../../data/trust/labels'
import { getProteinDataConfidence } from '../../data/protein/dataConfidence'
import type { CompareCategoryConfig, CompareFieldDef } from '../types'
import { formatScore, formatText } from '../format'

const badgeCtx = buildProteinBadgeContext(testedProteinProducts)

function shortName(product: TestedProteinProduct): string {
  return product.name.split(/\s+/).slice(0, 3).join(' ')
}

export function getProteinCompareFields(): CompareFieldDef<TestedProteinProduct>[] {
  return [
    {
      key: 'score',
      label: 'Totalscore',
      group: 'score',
      priority: 100,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => formatScore(p.score, 100, p.overallGrade),
    },
    {
      key: 'rank',
      label: 'Rangering',
      group: 'score',
      priority: 95,
      lowerIsBetter: true,
      getValue: (p) => ({
        display: p.rank != null ? `#${p.rank}` : '—',
        kind: 'number',
        raw: p.rank ?? undefined,
      }),
    },
    {
      key: 'diaas',
      label: 'DIAAS (kvalitet)',
      group: 'score',
      priority: 90,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => {
        const d = getDiaasStatus(p)
        return { display: `${d.shortLabel} (${d.label})`, kind: 'text', ariaLabel: d.explanation }
      },
    },
    {
      key: 'source',
      label: 'Proteintype',
      group: 'documentation',
      priority: 89,
      getValue: (p) => formatText(p.sourceLabel),
    },
    {
      key: 'proteinPer100g',
      label: 'Protein per 100 g',
      group: 'ingredients',
      priority: 86,
      higherIsBetter: true,
      getValue: (p) => formatText(`${p.proteinPer100g} g`),
    },
    {
      key: 'iaas',
      label: 'IAAS',
      group: 'score',
      priority: 88,
      higherIsBetter: true,
      getValue: (p) => ({ display: String(p.iaasScore), kind: 'number', raw: p.iaasScore }),
    },
    {
      key: 'proteinPerDose',
      label: 'Protein per dose',
      group: 'ingredients',
      priority: 85,
      higherIsBetter: true,
      getValue: (p) => ({
        display: `${p.proteinPerServingG} g`,
        kind: 'number',
        raw: p.proteinPerServingG,
      }),
    },
    {
      key: 'pricePerGram',
      label: 'Pris per g protein',
      group: 'price',
      priority: 84,
      lowerIsBetter: true,
      diffRelevant: true,
      getValue: (p) => ({
        display: `${p.pricePerGramProtein.toFixed(2).replace('.', ',')} kr`,
        kind: 'number',
        raw: p.pricePerGramProtein,
      }),
    },
    {
      key: 'allergen',
      label: 'Allergen',
      group: 'documentation',
      priority: 79,
      getValue: (p) => formatText(formatAllergenSummary(p)),
    },
    {
      key: 'lactose',
      label: 'Laktose',
      group: 'documentation',
      priority: 79,
      getValue: (p) => formatText(getProteinProductModel(p).lactoseLabel),
    },
    {
      key: 'vegan',
      label: 'Vegansk',
      group: 'documentation',
      priority: 78,
      getValue: (p) => formatText(getProteinProductModel(p).veganLabel),
    },
    {
      key: 'sweetener',
      label: 'Søtstoff',
      group: 'documentation',
      priority: 77,
      getValue: (p) => formatText(getProteinProductModel(p).sweetenerLabel),
    },
    {
      key: 'kcal',
      label: 'Kalorier',
      group: 'documentation',
      priority: 77,
      getValue: (p) => formatText(formatProteinKcal(p)),
    },
    {
      key: 'dataStatus',
      label: 'Dokumentasjonsstatus',
      group: 'documentation',
      priority: 75,
      getValue: (p) => formatText(getProteinDataConfidence(p).label),
    },
    {
      key: 'badges',
      label: 'Badge-ar',
      group: 'summary',
      priority: 73,
      getValue: (p) => {
        const badges = getProteinBadges(p, badgeCtx)
        return formatText(badges.map((b) => b.shortLabel).join(', ') || 'Ingen badge')
      },
    },
    {
      key: 'trustLevel',
      label: 'Datatillit',
      group: 'documentation',
      priority: 78,
      diffRelevant: true,
      getValue: (p) => formatText(TRUST_LEVEL_COPY[resolveProteinTrust(p).trustLevel].label),
    },
    {
      key: 'lastChecked',
      label: 'Sist kontrollert',
      group: 'documentation',
      priority: 76,
      getValue: (p) => formatText(resolveProteinTrust(p).lastChecked),
    },
    {
      key: 'dataSource',
      label: 'Datakilde',
      group: 'documentation',
      priority: 74,
      getValue: (p) => formatText(resolveProteinTrust(p).dataSource),
    },
    {
      key: 'labTest',
      label: 'Laboratorietest',
      group: 'documentation',
      priority: 72,
      getValue: (p) => formatText(resolveProteinTrust(p).labTestStatus),
    },
    {
      key: 'bestFor',
      label: 'Passer best for',
      group: 'copy',
      priority: 50,
      getValue: (p) => formatText(generateProteinProductCopy(p, badgeCtx).bestFor),
    },
    {
      key: 'importantToKnow',
      label: 'Viktig å vite',
      group: 'copy',
      priority: 48,
      getValue: (p) => formatText(generateProteinProductCopy(p, badgeCtx).importantToKnow),
    },
  ]
}

export function generateProteinCompareDiff(products: TestedProteinProduct[]): string[] {
  if (products.length < 2) return []
  const [a, b] = products
  const bullets: string[] = []
  if (a.score !== b.score) {
    const higher = a.score > b.score ? a : b
    const lower = a.score > b.score ? b : a
    bullets.push(
      `${shortName(higher)} har høyere totalscore (${higher.score}) enn ${shortName(lower)} (${lower.score}), hovudsakleg etter DIAAS-modellen.`,
    )
  }
  if (Math.abs(a.pricePerGramProtein - b.pricePerGramProtein) >= 0.05) {
    const cheaper = a.pricePerGramProtein < b.pricePerGramProtein ? a : b
    const diff = Math.abs(a.pricePerGramProtein - b.pricePerGramProtein)
    bullets.push(
      `${shortName(cheaper)} er ${diff.toFixed(2).replace('.', ',')} kr rimelegare per gram protein.`,
    )
  }
  return bullets.slice(0, 5)
}

export const proteinCompareConfig: CompareCategoryConfig<TestedProteinProduct> = {
  category: 'protein',
  title: 'Sammenlign proteinpulver',
  hubPath: '/tester/protein/',
  comparePath: '/tester/protein/sammenlign/',
  resolveProducts: (ids) =>
    ids
      .map((id) => testedProteinProducts.find((p) => p.id === id))
      .filter((p): p is TestedProteinProduct => Boolean(p)),
  getFields: getProteinCompareFields,
  generateDiff: generateProteinCompareDiff,
  getProductLabel: shortName,
}
