import {
  calculatePriceGrade,
  PWO_FORMULA_MAX_POINTS,
  type GradeLetter,
  type TestedProduct,
} from '../pwoProducts'
import type { PwoBadgeContext } from './badges'
import { getPwoBadges } from './badges'
import { getPwoDataConfidence } from './dataConfidence'
import { calculatePwoValueIndex, getPumpMetric, PWO_BADGE_THRESHOLDS } from './metrics'

export type PwoEditorialSeverity = 'strong' | 'balanced' | 'limited' | 'incomplete'

export type PwoEditorialSummary = {
  bestFor: string
  importantToKnow: string
  strengths: string[]
  limitations: string[]
  priceAssessment: string
  dataStatus: string
  severity: PwoEditorialSeverity
  scoreExplanation: string
}

type IngredientSnapshot = {
  pumpPoints: number
  pumpEqMg: number
  pumpGrade: GradeLetter | undefined
  betaAlanineMg: number
  betaineMg: number
  taurineMg: number
  tyrosineMg: number
  glycerolMg: number
}

function fmtKr(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function fmtMg(n: number) {
  return n.toLocaleString('nb-NO')
}

function getIngredientSnapshot(product: TestedProduct): IngredientSnapshot {
  const pump = getPumpMetric(product)
  return {
    pumpPoints: pump.points,
    pumpEqMg: pump.citrullineEqMg,
    pumpGrade: pump.grade,
    betaAlanineMg: product.betaAlanineMg ?? product.extraDoses?.betaAlanine ?? 0,
    betaineMg: product.extraDoses?.betaine ?? 0,
    taurineMg: product.extraDoses?.taurine ?? 0,
    tyrosineMg: product.extraDoses?.tyrosine ?? 0,
    glycerolMg: product.glycerolMg ?? product.extraDoses?.glycerol ?? 0,
  }
}

function resolveSeverity(
  score: number,
  notFullyAssessed: boolean,
): PwoEditorialSeverity {
  if (notFullyAssessed) return 'incomplete'
  if (score < 34) return 'limited'
  if (score < 46) return 'balanced'
  return 'strong'
}

function buildScoreExplanation(product: TestedProduct, score: number): string {
  const pump = getPumpMetric(product)
  return (
    `Formelscore ${score}/${PWO_FORMULA_MAX_POINTS} bygger på deklarerte doser per porsjon — ` +
    `nitratboost/pump (${pump.points.toFixed(1).replace('.', ',')}/40 poeng), betain, beta-alanin, taurin, tyrosin, glyserol og elektrolytter etter publiserte vekter. ` +
    'Koffein inngår ikke i scoren.'
  )
}

function primaryIncompleteReason(
  product: TestedProduct,
  confidence: ReturnType<typeof getPwoDataConfidence>,
): string {
  if (confidence.reasons[0]) return confidence.reasons[0]
  if (!product.servingSize?.trim()) return 'Porsjonsstørrelse ikke oppgitt'
  if (product.caffeineMg === null) return 'Koffein ikke oppgitt'
  if (!product.gradeBreakdown?.length) return 'Ingen scoreoppdeling tilgjengelig'
  if (product.keyIngredients.length < 3) return 'Få ingredienser dokumentert'
  return 'Ufullstendig deklarasjon'
}

function buildDataStatus(product: TestedProduct): string {
  const confidence = getPwoDataConfidence(product)
  if (confidence.fullDeclaration) {
    return `Deklarasjon er komplett nok for rangering (datatillit: ${confidence.label.toLowerCase()}).`
  }
  const reason = primaryIncompleteReason(product, confidence)
  return `Datatillit ${confidence.label.toLowerCase()}: ${reason}.`
}

function buildPriceAssessment(
  product: TestedProduct,
  priceGrade: ReturnType<typeof calculatePriceGrade>,
  valueIndex: ReturnType<typeof calculatePwoValueIndex>,
  score: number,
  severity: PwoEditorialSeverity,
): string {
  const price = fmtKr(product.pricePerServing)
  if (severity === 'incomplete') {
    return `Pris ${price} kr/dose er oppgitt, men formelvurderingen er ikke fullstendig uten manglende deklarasjonsdata.`
  }
  if (priceGrade.grade === 'A' || priceGrade.grade === 'B') {
    if (score < 34) {
      return `Lav pris per dose (${price} kr, verdi ${priceGrade.grade}) — aktuelt ved budsjett, men deklarert dose er svakere enn høyere rangerte alternativer.`
    }
    return `Konkurransedyktig pris per dose (${price} kr, verdiindeks ${valueIndex.index}) — sammenlign mot formelscore før kjøp.`
  }
  if (priceGrade.grade === 'D' || priceGrade.grade === 'E' || priceGrade.grade === 'F') {
    return `Høy pris per dose (${price} kr, verdi ${priceGrade.grade}) — vurder om deklarert dose rettferdiggjør kostnaden mot billigere alternativer.`
  }
  return `Pris per dose ${price} kr (verdi ${priceGrade.grade}, indeks ${valueIndex.index}) — vises separat fra formelscoren.`
}

function collectStrengths(
  product: TestedProduct,
  ing: IngredientSnapshot,
  pumpStrong: boolean,
  score: number,
  severity: PwoEditorialSeverity,
): string[] {
  if (severity === 'incomplete' || severity === 'limited') {
    const fromData = product.strengths.slice(0, 1)
    return fromData.length ? fromData : []
  }

  const out: string[] = []

  if (pumpStrong && ing.pumpEqMg > 0) {
    out.push(`Deklarert nitratboost/pump: ${fmtMg(ing.pumpEqMg)} mg L-citrulline-ekvivalent (${ing.pumpGrade ?? '—'}).`)
  }
  if (ing.betaAlanineMg >= 3200) {
    out.push(`Beta-alanin ${fmtMg(ing.betaAlanineMg)} mg per dose i deklarasjonen.`)
  } else if (ing.betaAlanineMg >= 1600 && out.length < 3) {
    out.push(`Beta-alanin ${fmtMg(ing.betaAlanineMg)} mg — under toppdose, men dokumentert.`)
  }
  if (ing.betaineMg >= 1500 && out.length < 3) {
    out.push(`Betain ${fmtMg(ing.betaineMg)} mg oppgitt.`)
  }
  if (ing.taurineMg >= 1000 && out.length < 3) {
    out.push(`Taurin ${fmtMg(ing.taurineMg)} mg oppgitt.`)
  }
  if (ing.glycerolMg >= 1000 && out.length < 3) {
    out.push(`Glyserol ${fmtMg(ing.glycerolMg)} mg i deklarasjonen.`)
  }
  if (score >= 46 && out.length < 3) {
    out.push(`Formelscore ${score}/${PWO_FORMULA_MAX_POINTS} blant de høyeste i testen.`)
  }

  for (const s of product.strengths) {
    if (out.length >= 3) break
    if (!out.some((x) => x.includes(s.slice(0, 20)))) out.push(s)
  }

  return out.slice(0, 3)
}

function collectLimitations(
  product: TestedProduct,
  ing: IngredientSnapshot,
  pumpWeak: boolean,
  caffeine: number,
  hasCaffeine: boolean,
  score: number,
  severity: PwoEditorialSeverity,
  confidence: ReturnType<typeof getPwoDataConfidence>,
): string[] {
  const out: string[] = []

  if (severity === 'incomplete') {
    for (const r of confidence.reasons.slice(0, 2)) {
      out.push(r)
    }
    if (!out.length) out.push('Manglende data hindrer full sammenligning.')
    return out
  }

  if (score < 34) {
    out.push('Lav deklarert dose av flere sentrale PWO-ingredienser.')
    if (hasCaffeine && pumpWeak) {
      out.push('Mer stimulansfokusert enn komplett PWO-formel etter deklarasjon.')
    }
  }

  if (pumpWeak && (product.citrullineMg ?? 0) === 0) {
    out.push('Ingen L-citrulline oppgitt — begrenset nitratboost i deklarasjonen.')
  } else if (pumpWeak) {
    out.push(`Lav pump-score (${ing.pumpPoints.toFixed(1).replace('.', ',')}/40) etter deklarerte doser.`)
  }

  if (/uklar|malat.*ikke|proprietary|blend/i.test(product.citrullineForm)) {
    out.push('Uklar citrullin-form — pump-score er konservativ.')
  }

  if (caffeine >= 300) {
    out.push(`${caffeine} mg koffein per dose — høyt for mange nybegynnere.`)
  }

  for (const w of product.watchouts) {
    if (out.length >= 3) break
    if (!out.includes(w)) out.push(w)
  }

  return out.slice(0, 3)
}

function buildBestFor(
  product: TestedProduct,
  badgeCtx: PwoBadgeContext,
  severity: PwoEditorialSeverity,
  score: number,
  caffeine: number,
  hasCaffeine: boolean,
  ing: IngredientSnapshot,
  pumpStrong: boolean,
  pumpWeak: boolean,
  cheap: boolean,
  expensive: boolean,
  priceGrade: ReturnType<typeof calculatePriceGrade>,
  confidence: ReturnType<typeof getPwoDataConfidence>,
): string {
  const badges = getPwoBadges(product, badgeCtx)
  const price = fmtKr(product.pricePerServing)
  const pumpMg = fmtMg(ing.pumpEqMg)

  if (severity === 'incomplete') {
    const reason = primaryIncompleteReason(product, confidence).toLowerCase()
    const label = product.name.split(' ').slice(0, 3).join(' ')
    return `Ikke fullt vurdert — ${reason} (${label}).`
  }

  const budgetBadge = badges.find((b) => b.id === 'best-budsjett')
  if (budgetBadge) {
    if (score < PWO_BADGE_THRESHOLDS.budgetMinFormulaScore) {
      return `Deg som vil ha lavest pris per dose (${price} kr) — formelscore ${score} er under terskelen for «anbefalt billig valg».`
    }
    return `Deg som vil ha lavest pris per dose (${price} kr) blant PWO med brukbar formelscore (≥ ${PWO_BADGE_THRESHOLDS.budgetMinFormulaScore}, dette produktet ${score}).`
  }

  if (score < 11) {
    if (cheap) {
      if (hasCaffeine && pumpWeak) {
        return `Deg som vil ha rimelig koffein (${caffeine} mg) til lav pris (${price} kr/dose) — pump er ikke hovedfokus (score ${score}).`
      }
      return `Deg som prioriterer lav pris (${price} kr/dose) fremfor deklarert ingrediensdose (score ${score}).`
    }
    if (hasCaffeine && caffeine >= 150) {
      return `Deg som først og fremst ønsker ${caffeine} mg koffein — ikke maksimal ingrediensdose (score ${score}).`
    }
    return `Deg som ønsker enkel PWO med begrenset deklarert dose — score ${score}/${PWO_FORMULA_MAX_POINTS}.`
  }

  if (score < 34) {
    if (cheap) {
      if ((product.creatineMg ?? 0) >= 500) {
        return `Deg som vil ha kreatin (${fmtMg(product.creatineMg!)} mg) og PWO i én dose til lav pris (${price} kr/dose) — total formelscore ${score}.`
      }
      if (ing.pumpEqMg >= 1000 && ing.betaAlanineMg < 1600) {
        return `Deg som prioriterer pump (${pumpMg} mg ekv.) fremfor beta-alanin — rimelig per dose (${price} kr, verdi ${priceGrade.grade}).`
      }
      if (ing.betaAlanineMg >= 1600 && pumpWeak) {
        return `Deg som vil ha beta-alanin (${fmtMg(ing.betaAlanineMg)} mg) til lav pris — pump-dose er svakere (${pumpMg} mg ekv., score ${score}).`
      }
      if (hasCaffeine && caffeine < 200) {
        return `Deg som vil ha moderat koffein (${caffeine} mg) uten premium-pris — formelscore ${score}/${PWO_FORMULA_MAX_POINTS}.`
      }
      return `Deg som vil holde prisen nede (${price} kr/dose, verdi ${priceGrade.grade}) uten å prioritere maks deklarert dose (score ${score}).`
    }
    if (!hasCaffeine && pumpWeak) {
      return `Koffeinfri med ${pumpMg} mg pump-ekv. — begrenset nitratboost (score ${score}).`
    }
    if (!hasCaffeine) {
      return `Kveldstrening uten koffein — ${pumpMg} mg pump-ekv., score ${score}.`
    }
    if (caffeine >= 300 && pumpWeak) {
      return `${caffeine} mg koffein uten tilsvarende pump-dose (${pumpMg} mg ekv.) — score ${score}.`
    }
    if (caffeine >= 300) {
      return `${product.brand}: høy koffeindose (${caffeine} mg) med formelscore ${score}/${PWO_FORMULA_MAX_POINTS}.`
    }
    if (pumpWeak) {
      return `${caffeine} mg koffein og svak pump-dose — ${product.brand}, score ${score}.`
    }
    return `${product.brand}: enkel PWO med score ${score}/${PWO_FORMULA_MAX_POINTS} (verdi ${priceGrade.grade}).`
  }

  if (score < 46) {
    if (!hasCaffeine && pumpStrong) {
      return `Deg som prioriterer deklarert nitratboost (${pumpMg} mg ekv.) uten koffein — ${product.brand}.`
    }
    if (!hasCaffeine) {
      return `Trening sent på dagen — koffeinfri med formelscore ${score} og ${pumpMg} mg pump-ekv.`
    }
    if (caffeine <= 200 && pumpStrong) {
      return `Deg som vil ha moderat koffein (${caffeine} mg) og ${pumpMg} mg pump-ekv. — ${product.name.split(' ').slice(0, 2).join(' ')}.`
    }
    if (caffeine <= 200 && ing.betaineMg >= 1000) {
      return `Deg som vil ha betain (${fmtMg(ing.betaineMg)} mg) og moderat koffein (${caffeine} mg) — score ${score}.`
    }
    if (caffeine <= 200 && ing.taurineMg >= 1000) {
      return `Deg som tåler enklere stim-profil (${caffeine} mg koffein, ${fmtMg(ing.taurineMg)} mg taurin) — ${product.brand}.`
    }
    if (caffeine <= 200) {
      return `Deg som ønsker balansert, ikke maksimal dose — ${caffeine} mg koffein og score ${score}/${PWO_FORMULA_MAX_POINTS}.`
    }
    if (pumpStrong) {
      return `Deg som tåler ${caffeine} mg koffein og vil ha ${pumpMg} mg pump-ekv. — formelscore ${score}.`
    }
    return `Deg som tåler ${caffeine} mg koffein uten topp formelscore (${score}/${PWO_FORMULA_MAX_POINTS}) — pump er ikke hovedfokus.`
  }

  // score >= 46
  if (!hasCaffeine && pumpStrong) {
    return `Trening sent på dagen eller brukere som ønsker PWO uten koffein — ${pumpMg} mg pump-ekv. deklarert.`
  }
  if (!hasCaffeine) {
    return `Deg som vil ha koffeinfri PWO med høy formelscore (${score}) — sjekk pump-dose (${pumpMg} mg ekv.).`
  }
  if (caffeine <= 200 && pumpStrong) {
    return `Deg som vil ha gjennomarbeidet PWO uten svært høy koffeindose — ${caffeine} mg og ${pumpMg} mg pump-ekv.`
  }
  if (expensive) {
    return `Deg som prioriterer høy deklarert ingrediensdose (${score}/${PWO_FORMULA_MAX_POINTS}) fremfor lav pris (${price} kr/dose).`
  }
  if (pumpStrong) {
    return `Deg som prioriterer høy deklarert dose (${pumpMg} mg pump-ekv.) og ${caffeine} mg koffein — ${product.brand}.`
  }
  return `${product.brand}: høy formelscore (${score}) med ${caffeine} mg koffein — pump-dose er ikke topp i segmentet.`
}

function buildImportantToKnow(
  product: TestedProduct,
  severity: PwoEditorialSeverity,
  score: number,
  caffeine: number,
  pumpWeak: boolean,
  expensive: boolean,
  confidence: ReturnType<typeof getPwoDataConfidence>,
  limitations: string[],
): string {
  if (severity === 'incomplete') {
    const reason = primaryIncompleteReason(product, confidence).toLowerCase()
    return `Produktet mangler data som kreves for en full sammenligning (${reason}).`
  }

  if (score < 11) {
    return limitations[0] ?? 'Lav deklarert dose av sentrale PWO-ingredienser.'
  }

  if (score < 34 && pumpWeak && caffeine >= 200) {
    return 'Mer stimulansfokusert enn komplett PWO-formel etter deklarasjon.'
  }

  if (expensive && score >= 46) {
    return 'Høy deklarert dose, men pris per dose bør vurderes opp mot alternativer.'
  }

  if (pumpWeak && score >= 34) {
    return 'Svak pump-score i deklarasjonen — ikke primært et pump-produkt.'
  }

  if (caffeine >= 300) {
    return `${caffeine} mg koffein per dose — vurder egen toleranse.`
  }

  if (product.watchouts[0]) {
    return product.watchouts[0]
  }

  if (score >= 46) {
    return 'Sjekk koffeindose og pris per dose mot ditt behov — score måler bare deklarert formel.'
  }

  return 'Har enkelte relevante ingredienser, men lavere dose enn de sterkeste alternativene.'
}

/** Regelbasert redaksjonell oppsummering per PWO-produkt. */
export function getPwoEditorialSummary(
  product: TestedProduct,
  _allProducts: TestedProduct[],
  badgeCtx?: PwoBadgeContext,
): PwoEditorialSummary {
  const ctx = badgeCtx ?? { winners: {} as PwoBadgeContext['winners'], products: [] }
  const score = product.score
  const confidence = getPwoDataConfidence(product)
  const severity = resolveSeverity(score, confidence.notFullyAssessed)
  const caffeine = product.caffeineMg ?? 0
  const hasCaffeine = caffeine > 0
  const ing = getIngredientSnapshot(product)
  const pumpStrong = ing.pumpPoints >= 28
  const pumpWeak = ing.pumpPoints < 14
  const priceGrade = calculatePriceGrade(product.pricePerServing)
  const cheap = priceGrade.grade === 'A' || priceGrade.grade === 'B'
  const expensive = priceGrade.grade === 'D' || priceGrade.grade === 'E' || priceGrade.grade === 'F'
  const valueIndex = calculatePwoValueIndex(product)

  const limitations = collectLimitations(
    product,
    ing,
    pumpWeak,
    caffeine,
    hasCaffeine,
    score,
    severity,
    confidence,
  )

  return {
    bestFor: buildBestFor(
      product,
      ctx,
      severity,
      score,
      caffeine,
      hasCaffeine,
      ing,
      pumpStrong,
      pumpWeak,
      cheap,
      expensive,
      priceGrade,
      confidence,
    ),
    importantToKnow: buildImportantToKnow(
      product,
      severity,
      score,
      caffeine,
      pumpWeak,
      expensive,
      confidence,
      limitations,
    ),
    strengths: collectStrengths(product, ing, pumpStrong, score, severity),
    limitations,
    priceAssessment: buildPriceAssessment(product, priceGrade, valueIndex, score, severity),
    dataStatus: buildDataStatus(product),
    severity,
    scoreExplanation: buildScoreExplanation(product, score),
  }
}
