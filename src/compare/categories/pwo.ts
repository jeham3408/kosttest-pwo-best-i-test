import {
  calculatePriceGrade,
  PWO_FORMULA_MAX_POINTS,
  testedProducts,
  type TestedProduct,
} from '../../data/pwoProducts'
import { buildPwoBadgeContext, calculatePwoValueIndex, generatePwoProductCopy, getPwoBadges, getPumpMetric } from '../../data/pwo'
import { getPwoDataConfidence } from '../../data/pwo/dataConfidence'
import { resolvePwoTrust } from '../../data/trust/resolvers/pwo'
import { TRUST_LEVEL_COPY } from '../../data/trust/labels'
import type { CompareCategoryConfig, CompareFieldDef } from '../types'
import { formatMg, formatPriceKr, formatScore, formatText } from '../format'

const badgeCtx = buildPwoBadgeContext(testedProducts)

function shortName(product: TestedProduct): string {
  const words = product.name.split(/\s+/).slice(0, 3)
  return words.join(' ')
}

function citrullineEquivalent(product: TestedProduct): number {
  return getPumpMetric(product).citrullineEqMg
}

export function getPwoCompareFields(): CompareFieldDef<TestedProduct>[] {
  return [
    {
      key: 'formulaScore',
      label: 'Formelscore',
      group: 'score',
      priority: 100,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => formatScore(p.score, PWO_FORMULA_MAX_POINTS, p.overallGrade),
    },
    {
      key: 'rank',
      label: 'Rangering',
      group: 'score',
      priority: 95,
      lowerIsBetter: true,
      diffRelevant: true,
      getValue: (p) => ({
        display: p.rank != null ? `#${p.rank}` : '—',
        kind: 'number',
        raw: p.rank ?? undefined,
        ariaLabel: p.rank != null ? `Plass ${p.rank}` : 'Ikke rangert',
      }),
    },
    {
      key: 'pricePerDose',
      label: 'Pris per dose',
      group: 'price',
      priority: 90,
      lowerIsBetter: true,
      diffRelevant: true,
      getValue: (p) => formatPriceKr(p.pricePerServing),
    },
    {
      key: 'valueRef',
      label: 'Verdi (referanse)',
      group: 'price',
      priority: 88,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => {
        const pg = calculatePriceGrade(p.pricePerServing)
        const vi = calculatePwoValueIndex(p)
        return {
          display: `${pg.grade} · indeks ${vi.index}`,
          kind: 'number',
          raw: vi.index,
          ariaLabel: `Verdikarakter ${pg.grade}, verdiindeks ${vi.index}`,
        }
      },
    },
    {
      key: 'caffeine',
      label: 'Koffein per dose',
      group: 'ingredients',
      priority: 85,
      diffRelevant: true,
      getValue: (p) => {
        if (p.caffeineMg === null) return formatMg(null)
        if (p.caffeineMg === 0) {
          return { display: 'Koffeinfri (0 mg)', kind: 'number', raw: 0, ariaLabel: 'Koffeinfri' }
        }
        return formatMg(p.caffeineMg)
      },
    },
    {
      key: 'pumpEq',
      label: 'Nitratboost (citrullin-ekv.)',
      group: 'ingredients',
      priority: 84,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => {
        const eq = citrullineEquivalent(p)
        if (!eq && !p.citrullineMg) return formatMg(null)
        const pump = getPumpMetric(p)
        const grade = pump.grade ? ` (${pump.grade})` : ''
        return {
          display: `${eq.toLocaleString('nb-NO')} mg${grade}`,
          kind: 'number',
          raw: eq,
          ariaLabel: `${eq} milligram citrullin-ekvivalent`,
        }
      },
    },
    {
      key: 'betaAlanine',
      label: 'Beta-alanin',
      group: 'ingredients',
      priority: 80,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => formatMg(p.betaAlanineMg),
    },
    {
      key: 'betaine',
      label: 'Betain',
      group: 'ingredients',
      priority: 78,
      higherIsBetter: true,
      diffRelevant: true,
      getValue: (p) => formatMg(p.extraDoses?.betaine),
    },
    {
      key: 'taurine',
      label: 'Taurin',
      group: 'ingredients',
      priority: 76,
      higherIsBetter: true,
      getValue: (p) => formatMg(p.extraDoses?.taurine),
    },
    {
      key: 'tyrosine',
      label: 'Tyrosin',
      group: 'ingredients',
      priority: 74,
      higherIsBetter: true,
      getValue: (p) => formatMg(p.extraDoses?.tyrosine),
    },
    {
      key: 'glycerol',
      label: 'Glyserol',
      group: 'ingredients',
      priority: 72,
      higherIsBetter: true,
      getValue: (p) => formatMg(p.glycerolMg),
    },
    {
      key: 'electrolytes',
      label: 'Elektrolyttar',
      group: 'ingredients',
      priority: 70,
      getValue: (p) => {
        const v = p.extraDoses?.electrolytes
        if (v == null) return formatMg(null)
        return formatText(`${v.toLocaleString('nb-NO')} mg (deklarert)`)
      },
    },
    {
      key: 'servingSize',
      label: 'Porsjonsvekt',
      group: 'documentation',
      priority: 65,
      getValue: (p) => formatText(p.servingSize || null, 'Ikke oppgitt'),
    },
    {
      key: 'dataStatus',
      label: 'Dokumentasjonsstatus',
      group: 'documentation',
      priority: 60,
      diffRelevant: true,
      getValue: (p) => {
        const d = getPwoDataConfidence(p)
        const suffix = d.notFullyAssessed ? ' · ikke fullt vurdert' : ''
        return formatText(`${d.label}${suffix}`, 'Utilstrekkelig data')
      },
    },
    {
      key: 'trustLevel',
      label: 'Datatillit',
      group: 'documentation',
      priority: 59,
      diffRelevant: true,
      getValue: (p) => {
        const snap = resolvePwoTrust(p)
        return formatText(TRUST_LEVEL_COPY[snap.trustLevel].label)
      },
    },
    {
      key: 'lastChecked',
      label: 'Sist kontrollert',
      group: 'documentation',
      priority: 58,
      getValue: (p) => formatText(resolvePwoTrust(p).lastChecked),
    },
    {
      key: 'dataSource',
      label: 'Datakilde',
      group: 'documentation',
      priority: 57,
      diffRelevant: true,
      getValue: (p) => formatText(resolvePwoTrust(p).dataSource),
    },
    {
      key: 'labTest',
      label: 'Laboratorietest',
      group: 'documentation',
      priority: 56,
      getValue: (p) => formatText(resolvePwoTrust(p).labTestStatus),
    },
    {
      key: 'source',
      label: 'Produktkilde',
      group: 'documentation',
      priority: 55,
      getValue: (p) => formatText(p.merchant ? `${p.merchant}` : null),
    },
    {
      key: 'badges',
      label: 'Badge-ar',
      group: 'summary',
      priority: 55,
      getValue: (p) => {
        const badges = getPwoBadges(p, badgeCtx)
        if (!badges.length) return formatText('Ingen badge', 'Ingen badge')
        return formatText(badges.map((b: { shortLabel: string }) => b.shortLabel).join(', '))
      },
    },
    {
      key: 'bestFor',
      label: 'Passer best for',
      group: 'copy',
      priority: 50,
      getValue: (p) => formatText(generatePwoProductCopy(p, badgeCtx).bestFor),
    },
    {
      key: 'importantToKnow',
      label: 'Viktig å vite',
      group: 'copy',
      priority: 48,
      getValue: (p) => formatText(generatePwoProductCopy(p, badgeCtx).importantToKnow),
    },
  ]
}

export function generatePwoCompareDiff(products: TestedProduct[]): string[] {
  if (products.length < 2) return []

  const bullets: string[] = []
  const [a, b] = products
  const names = products.map(shortName)

  if (products.length === 2) {
    if (a.score !== b.score) {
      const higher = a.score > b.score ? a : b
      const lower = a.score > b.score ? b : a
      const reasons: string[] = []
      const pumpA = getPumpMetric(a).points
      const pumpB = getPumpMetric(b).points
      const betA = a.extraDoses?.betaine ?? 0
      const betB = b.extraDoses?.betaine ?? 0
      if (Math.abs(pumpA - pumpB) >= 3) {
        reasons.push('nitratboost/pump')
      }
      if (Math.abs(betA - betB) >= 500) {
        reasons.push('betain')
      }
      const reasonText = reasons.length ? `, hovudsakleg grunna ${reasons.join(' og ')}` : ''
      bullets.push(
        `${shortName(higher)} har høyere formelscore (${higher.score} av ${PWO_FORMULA_MAX_POINTS}) enn ${shortName(lower)} (${lower.score})${reasonText}.`,
      )
    } else {
      bullets.push(
        `${names[0]} og ${names[1]} har lik formelscore (${a.score} av ${PWO_FORMULA_MAX_POINTS}).`,
      )
    }

    const priceDiff = Math.abs(a.pricePerServing - b.pricePerServing)
    if (priceDiff >= 0.5) {
      const cheaper = a.pricePerServing < b.pricePerServing ? a : b
      const other = a.pricePerServing < b.pricePerServing ? b : a
      bullets.push(
        `${shortName(cheaper)} er ${priceDiff.toFixed(2).replace('.', ',')} kr rimelegare per dose enn ${shortName(other)}.`,
      )
    }

    const cafA = a.caffeineMg ?? 0
    const cafB = b.caffeineMg ?? 0
    if (cafA === 0 && cafB > 0) {
      bullets.push(`${shortName(a)} er koffeinfri, medan ${shortName(b)} inneheld ${cafB} mg koffein.`)
    } else if (cafB === 0 && cafA > 0) {
      bullets.push(`${shortName(b)} er koffeinfri, medan ${shortName(a)} inneheld ${cafA} mg koffein.`)
    } else if (Math.abs(cafA - cafB) >= 50) {
      const higher = cafA > cafB ? a : b
      const lower = cafA > cafB ? b : a
      bullets.push(
        `${shortName(higher)} har høyere koffeininnhald (${Math.max(cafA, cafB)} mg) enn ${shortName(lower)} (${Math.min(cafA, cafB)} mg).`,
      )
    }

    const dataA = getPwoDataConfidence(a)
    const dataB = getPwoDataConfidence(b)
    if (dataA.fullDeclaration && !dataB.fullDeclaration) {
      bullets.push(
        `${shortName(b)} mangler dokumentasjon på felt som ${shortName(a)} har — ikke det same som lav produktkvalitet.`,
      )
    } else if (dataB.fullDeclaration && !dataA.fullDeclaration) {
      bullets.push(
        `${shortName(a)} mangler dokumentasjon på felt som ${shortName(b)} har — ikke det same som lav produktkvalitet.`,
      )
    }

    if (a.score === b.score && a.pricePerServing !== b.pricePerServing) {
      const cheaper = a.pricePerServing < b.pricePerServing ? a : b
      bullets.push(
        `Lik eller nesten lik score — ${shortName(cheaper)} har betre pris per dose.`,
      )
    }
  } else {
    const scores = products.map((p) => p.score)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const top = products.filter((p) => p.score === maxScore)
    const bottom = products.filter((p) => p.score === minScore)
    if (maxScore !== minScore) {
      bullets.push(
        `Høyest formelscore: ${top.map(shortName).join(', ')} (${maxScore} av ${PWO_FORMULA_MAX_POINTS}). Lavest: ${bottom.map(shortName).join(', ')} (${minScore}).`,
      )
    }
    const prices = products.map((p) => p.pricePerServing)
    const minPrice = Math.min(...prices)
    const cheapest = products.filter((p) => p.pricePerServing === minPrice)
    if (prices.some((p) => p !== minPrice)) {
      bullets.push(`Lavest pris per dose: ${cheapest.map(shortName).join(', ')}.`)
    }
  }

  return bullets.slice(0, 6)
}

export const pwoCompareConfig: CompareCategoryConfig<TestedProduct> = {
  category: 'pwo',
  title: 'Sammenlign PWO',
  hubPath: '/tester/pwo/',
  comparePath: '/tester/pwo/sammenlign/',
  resolveProducts: (ids: string[]) =>
    ids
      .map((id) => testedProducts.find((p: TestedProduct) => p.id === id))
      .filter((p): p is TestedProduct => Boolean(p)),
  getFields: getPwoCompareFields,
  generateDiff: generatePwoCompareDiff,
  getProductLabel: shortName,
}
