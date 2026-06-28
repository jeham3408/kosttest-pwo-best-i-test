import { testedCreatineProducts, type TestedCreatineProduct } from '../../data/creatineProducts'
import { hasDopingTestDisclosure } from '../../data/creatineScoring'
import { generateCreatineContent } from '../../creatineContent'
import {
  buildCreatineBadgeContext,
  formatCreatineDoping,
  formatCreatineMesh,
  formatCreatinePurity,
  formatCreatineSource,
  getCreatineBadges,
  getCreatineDataConfidence,
} from '../../data/creatine'
import { resolveCreatineTrust } from '../../data/trust/resolvers/creatine'
import { TRUST_LEVEL_COPY } from '../../data/trust/labels'
import type { CompareCategoryConfig, CompareFieldDef } from '../types'
import { formatScore, formatText } from '../format'

const badgeCtx = buildCreatineBadgeContext(testedCreatineProducts)

function shortName(product: TestedCreatineProduct): string {
  return product.name.split(/\s+/).slice(0, 3).join(' ')
}

export function getCreatineCompareFields(): CompareFieldDef<TestedCreatineProduct>[] {
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
      key: 'source',
      label: 'Råvare',
      group: 'documentation',
      priority: 90,
      diffRelevant: true,
      getValue: (p) => formatText(formatCreatineSource(p)),
    },
    {
      key: 'purity',
      label: 'Renhet',
      group: 'documentation',
      priority: 88,
      getValue: (p) => formatText(formatCreatinePurity(p.purityPercent)),
    },
    {
      key: 'mesh',
      label: 'Mesh',
      group: 'documentation',
      priority: 86,
      getValue: (p) => formatText(formatCreatineMesh(p.meshLabel)),
    },
    {
      key: 'dopingTest',
      label: 'Dopingtest',
      group: 'documentation',
      priority: 84,
      diffRelevant: true,
      getValue: (p) => formatText(formatCreatineDoping(p)),
    },
    {
      key: 'servingSize',
      label: 'Porsjonsstorleik',
      group: 'documentation',
      priority: 83,
      getValue: (p) => formatText(p.servingSize),
    },
    {
      key: 'dataStatus',
      label: 'Dokumentasjonsstatus',
      group: 'documentation',
      priority: 81,
      getValue: (p) => formatText(getCreatineDataConfidence(p).label),
    },
    {
      key: 'badges',
      label: 'Badge-ar',
      group: 'summary',
      priority: 79,
      getValue: (p) => {
        const badges = getCreatineBadges(p, badgeCtx)
        return formatText(badges.map((b) => b.shortLabel).join(', ') || 'Ingen badge')
      },
    },
    {
      key: 'trustLevel',
      label: 'Datatillit',
      group: 'documentation',
      priority: 82,
      diffRelevant: true,
      getValue: (p) => formatText(TRUST_LEVEL_COPY[resolveCreatineTrust(p).trustLevel].label),
    },
    {
      key: 'lastChecked',
      label: 'Sist kontrollert',
      group: 'documentation',
      priority: 80,
      getValue: (p) => formatText(resolveCreatineTrust(p).lastChecked),
    },
    {
      key: 'dataSource',
      label: 'Datakilde',
      group: 'documentation',
      priority: 78,
      getValue: (p) => formatText(resolveCreatineTrust(p).dataSource),
    },
    {
      key: 'pricePerGram',
      label: 'Pris per g kreatin',
      group: 'price',
      priority: 82,
      lowerIsBetter: true,
      diffRelevant: true,
      getValue: (p) => ({
        display: `${p.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr`,
        kind: 'number',
        raw: p.pricePerGramCreatine,
      }),
    },
    {
      key: 'bestFor',
      label: 'Passer best for',
      group: 'copy',
      priority: 50,
      getValue: (p) => formatText(generateCreatineContent(p).bestFor),
    },
    {
      key: 'importantToKnow',
      label: 'Viktig å vite',
      group: 'copy',
      priority: 48,
      getValue: (p) => formatText(p.watchouts[0] ?? '—'),
    },
  ]
}

export function generateCreatineCompareDiff(products: TestedCreatineProduct[]): string[] {
  if (products.length < 2) return []
  const [a, b] = products
  const bullets: string[] = []
  if (a.score !== b.score) {
    const higher = a.score > b.score ? a : b
    const lower = a.score > b.score ? b : a
    bullets.push(
      `${shortName(higher)} har høyere totalscore (${higher.score}) enn ${shortName(lower)} (${lower.score}).`,
    )
  }
  const dopingA = hasDopingTestDisclosure(a.dopingTestLabel)
  const dopingB = hasDopingTestDisclosure(b.dopingTestLabel)
  if (dopingA && !dopingB) {
    bullets.push(
      `${shortName(b)} mangler dokumentert dopingtest som ${shortName(a)} har.`,
    )
  } else if (dopingB && !dopingA) {
    bullets.push(
      `${shortName(a)} mangler dokumentert dopingtest som ${shortName(b)} har.`,
    )
  }
  return bullets.slice(0, 5)
}

export const creatineCompareConfig: CompareCategoryConfig<TestedCreatineProduct> = {
  category: 'creatine',
  title: 'Sammenlign kreatin',
  hubPath: '/tester/kreatin/',
  comparePath: '/tester/kreatin/sammenlign/',
  resolveProducts: (ids) =>
    ids
      .map((id) => testedCreatineProducts.find((p) => p.id === id))
      .filter((p): p is TestedCreatineProduct => Boolean(p)),
  getFields: getCreatineCompareFields,
  generateDiff: generateCreatineCompareDiff,
  getProductLabel: shortName,
}
