import {
  calculatePriceGrade,
  PWO_FORMULA_MAX_POINTS,
  type TestedProduct,
} from '../pwoProducts'
import type { PwoBadgeContext } from './badges'
import { getPwoEditorialSummary, type PwoEditorialSummary } from './editorialSummary'
import { getPumpMetric } from './metrics'

export type PwoProductCopy = PwoEditorialSummary & {
  summary: string
  pumpAnalysis: string
  notFor: string
  bottomLine: string
}

function fmtKr(n: number) {
  return n.toFixed(2).replace('.', ',')
}

export function generatePwoProductCopy(
  product: TestedProduct,
  badgeCtx: PwoBadgeContext,
  allProducts?: TestedProduct[],
): PwoProductCopy {
  const editorial = getPwoEditorialSummary(product, allProducts ?? badgeCtx.products, badgeCtx)
  const score = product.score
  const priceGrade = calculatePriceGrade(product.pricePerServing)
  const expensive = priceGrade.grade === 'D' || priceGrade.grade === 'E' || priceGrade.grade === 'F'
  const caffeine = product.caffeineMg ?? 0
  const hasCaffeine = caffeine > 0
  const pump = getPumpMetric(product)
  const pumpStrong = pump.points >= 28
  const pumpWeak = pump.points < 14

  const hasCitrulline = (product.citrullineMg ?? 0) > 0
  const summary =
    `${product.name} (${product.brand}): ${score}/${PWO_FORMULA_MAX_POINTS} formelpoeng, karakter ${product.overallGrade}. ` +
    (hasCaffeine ? `${caffeine} mg koffein. ` : 'Koffeinfri. ') +
    (hasCitrulline
      ? `${product.citrullineMg!.toLocaleString('nb-NO')} mg L-citrulline-ekv. `
      : 'Mangler L-citrulline. ') +
    `Pris ${fmtKr(product.pricePerServing)} kr/dose (verdi ${priceGrade.grade}).`

  const pumpAnalysis = pumpStrong
    ? `Pump: ${pump.points.toFixed(1).replace('.', ',')}/40 poeng — ${pump.citrullineEqMg.toLocaleString('nb-NO')} mg ekvivalent (${pump.grade ?? '?'}).`
    : pumpWeak
      ? `Pump: ${pump.points.toFixed(1).replace('.', ',')}/40 — lav nitratboost i deklarasjonen.`
      : `Pump: ${pump.points.toFixed(1).replace('.', ',')}/40 — middels deklarert dose.`

  let notFor = 'Vanlig dosering og toleranse gjelder.'
  if (editorial.severity === 'incomplete') {
    notFor = 'Deg som trenger fullt dokumentert deklarasjon før valg.'
  } else if (score < 11) {
    notFor = 'Deg som vil ha dokumenterte doser for pump og formel.'
  } else if (caffeine >= 300) {
    notFor = `Koffeinfølsomme og nybegynnere (${caffeine} mg).`
  } else if (pumpWeak && score >= 46) {
    notFor = 'Deg som primært jakter høyest deklarert nitratboost.'
  }

  const bottomLine =
    editorial.severity === 'incomplete'
      ? 'Ikke fullt vurdert — manglende data kan skjule styrker eller svakheter.'
      : score >= 46
        ? expensive
          ? 'Høy formelscore — sjekk pris per dose mot verdiindeks.'
          : 'Høy formelscore etter deklarasjon — vurder koffein og pris individuelt.'
        : score >= 34
          ? 'Middels formel — finnes høyere score til lignende pris.'
          : score >= 11
            ? 'Begrenset formelscore — primært aktuelt ved lav pris eller spesifikke behov.'
            : 'Svak deklarert dose — sammenlign med høyere rangerte alternativer.'

  return {
    ...editorial,
    summary,
    pumpAnalysis,
    notFor,
    bottomLine,
  }
}

/** @deprecated Bruk generatePwoProductCopy */
export function generateProductContent(product: TestedProduct, badgeCtx?: PwoBadgeContext) {
  const ctx = badgeCtx ?? { winners: {} as PwoBadgeContext['winners'], products: [] }
  const copy = generatePwoProductCopy(product, ctx)
  return {
    ...copy,
    faq: [
      {
        question: `Hvor mye koffein i ${product.name}?`,
        answer:
          product.caffeineMg && product.caffeineMg > 0
            ? `${product.caffeineMg} mg per dose.`
            : 'Koffeinfri etter deklarasjon.',
      },
    ],
  }
}

export { getPwoEditorialSummary, type PwoEditorialSummary, type PwoEditorialSeverity } from './editorialSummary'
