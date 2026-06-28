import type { TestedProteinProduct } from '../proteinProducts'
import type { ProteinBadgeContext } from './badges'
import { getProteinBadges } from './badges'
import { getProteinDataConfidence } from './dataConfidence'
import {
  calculateProteinPriceGrade,
  DIAAS_ESTIMATE_DISCLAIMER,
  getDiaasStatus,
  getProteinPer100Kcal,
  isEligibleForProteinBadges,
  isVeganProduct,
  isWheyConcentrateType,
  isWheyIsolateType,
} from './metrics'
import { getProteinProductModel } from './model'

export type ProteinEditorialSeverity = 'strong' | 'balanced' | 'limited' | 'incomplete'

export type ProteinEditorialSummary = {
  bestFor: string
  importantToKnow: string
  strengths: string[]
  limitations: string[]
  priceAssessment: string
  dataStatus: string
  severity: ProteinEditorialSeverity
}

function resolveSeverity(product: TestedProteinProduct): ProteinEditorialSeverity {
  const conf = getProteinDataConfidence(product)
  const diaas = getDiaasStatus(product)
  if (conf.level === 'insufficient' || diaas.kind === 'insufficient_data') return 'incomplete'
  if (product.score < 85) return 'limited'
  if (product.score < 95) return 'balanced'
  return 'strong'
}

function buildBestFor(
  product: TestedProteinProduct,
  badgeCtx: ProteinBadgeContext,
  severity: ProteinEditorialSeverity,
): string {
  if (severity === 'incomplete') {
    return 'Ikke nok tilgjengelige data til full vurdering.'
  }

  const badges = getProteinBadges(product, badgeCtx)
  const model = getProteinProductModel(product)

  if (badges.some((b) => b.id === 'best-lactose-free')) {
    return 'Deg som trenger dokumentert laktosefri eller laktosefattig protein — sjekk toleranse individuelt.'
  }
  if (badges.some((b) => b.id === 'best-vegan')) {
    return 'Deg som ønsker et plantebasert alternativ — aminosyreprofilen skiller seg fra whey.'
  }
  if (badges.some((b) => b.id === 'best-budget')) {
    return `Deg som prioriterer lav pris per gram protein (${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g).`
  }
  if (badges.some((b) => b.id === 'best-value-whey')) {
    return 'Deg som vil ha balanse mellom DIAAS-estimat og pris blant whey — ikke nødvendigvis best smak.'
  }
  if (badges.some((b) => b.id === 'best-protein-per-calorie') && model.proteinPer100Kcal != null) {
    return `Deg som vil ha mest protein per kalori (${model.proteinPer100Kcal.toFixed(1).replace('.', ',')} g/100 kcal).`
  }
  if (badges.some((b) => b.id === 'best-no-sweetener')) {
    return 'Deg som vil unngå søtstoff der produsent har dokumentert det.'
  }
  if (badges.some((b) => b.id === 'best-baking')) {
    return 'Deg som vil bruke nøytralt protein i baking eller matlaging.'
  }

  if (isWheyIsolateType(product.sourceType) && product.proteinPer100g >= 80) {
    return `Deg som ønsker høy proteinandel per porsjon (${product.proteinPerServingG} g/dose, ${product.proteinPer100g} g/100 g).`
  }
  if (isWheyConcentrateType(product.sourceType) && product.pricePerGramProtein <= 1.0) {
    return `Deg som prioriterer lav pris per gram protein (${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g).`
  }
  if (isVeganProduct(product)) {
    return 'Deg som ønsker et plantebasert alternativ — ikke direkte likt whey på DIAAS-estimat.'
  }
  if (product.sourceType === 'casein') {
    return 'Deg som ønsker langsommere frigjøring — typisk kveldsprotein.'
  }

  return `Deg som vil ha ${product.sourceLabel.toLowerCase()} med DIAAS-estimat ${product.diaasScore} — vurder pris og toleranse separat.`
}

function buildImportantToKnow(
  product: TestedProteinProduct,
  severity: ProteinEditorialSeverity,
): string {
  const diaas = getDiaasStatus(product)
  const model = getProteinProductModel(product)
  const parts: string[] = []

  if (severity === 'incomplete') {
    return 'Ikke nok tilgjengelige data til full vurdering.'
  }

  if (diaas.isEstimate) {
    parts.push(DIAAS_ESTIMATE_DISCLAIMER)
  }

  const protKcal = getProteinPer100Kcal(product)
  if (protKcal != null && protKcal < 8) {
    parts.push('Høyere energiinnhold per porsjon enn de mest protein-tette alternativene.')
  } else if (
    product.caloriesPerServing != null &&
    product.proteinPerServingG > 0 &&
    product.caloriesPerServing / product.proteinPerServingG > 6
  ) {
    parts.push('Høyere energiinnhold per gram protein enn mange isolate-alternativer.')
  }

  if (isVeganProduct(product) && product.score < 90) {
    parts.push('Plantebasert protein har ofte lavere DIAAS-estimat enn whey — ikke identisk kvalitet på papir.')
  }

  if (model.lactoseStatus === 'unknown' && isWheyConcentrateType(product.sourceType)) {
    parts.push('Laktosestatus er ikke dokumentert — concentrate kan inneholde laktose.')
  }

  if (product.watchouts[0] && !parts.includes(product.watchouts[0])) {
    parts.push(product.watchouts[0])
  }

  if (!parts.length) {
    const priceGrade = calculateProteinPriceGrade(product.pricePerGramProtein)
    parts.push(
      `Pris ${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein (${priceGrade.grade}) endrer ikke DIAAS-plasseringen.`,
    )
  }

  return parts.slice(0, 2).join(' ')
}

function collectStrengths(product: TestedProteinProduct, severity: ProteinEditorialSeverity): string[] {
  if (severity === 'incomplete') return []
  const out: string[] = []
  if (product.proteinPer100g >= 80) {
    out.push(`${product.proteinPer100g} g protein per 100 g.`)
  }
  if (product.proteinPerServingG >= 24) {
    out.push(`${product.proteinPerServingG} g protein per porsjon.`)
  }
  const protKcal = getProteinPer100Kcal(product)
  if (protKcal != null && protKcal >= 10) {
    out.push(`${protKcal.toFixed(1).replace('.', ',')} g protein per 100 kcal.`)
  }
  for (const s of product.strengths) {
    if (out.length >= 3) break
    if (!out.some((x) => x.includes(s.slice(0, 18)))) out.push(s)
  }
  return out.slice(0, 3)
}

function collectLimitations(product: TestedProteinProduct, severity: ProteinEditorialSeverity): string[] {
  const out: string[] = []
  if (severity === 'incomplete') {
    const conf = getProteinDataConfidence(product)
    return conf.reasons.slice(0, 2).length ? conf.reasons.slice(0, 2) : ['Utilstrekkelig deklarasjon for full sammenligning.']
  }
  if (getDiaasStatus(product).isEstimate) {
    out.push('DIAAS er estimat — like score betyr ikke identisk målt kvalitet.')
  }
  for (const w of product.watchouts) {
    if (out.length >= 3) break
    out.push(w)
  }
  return out.slice(0, 3)
}

export function getProteinEditorialSummary(
  product: TestedProteinProduct,
  _allProducts: TestedProteinProduct[],
  badgeCtx?: ProteinBadgeContext,
): ProteinEditorialSummary {
  const ctx = badgeCtx ?? { winners: {} as ProteinBadgeContext['winners'], products: [] }
  const severity = resolveSeverity(product)
  const model = getProteinProductModel(product)
  const priceGrade = calculateProteinPriceGrade(product.pricePerGramProtein)

  let priceAssessment = `Pris per gram protein: ${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr (referanse ${priceGrade.grade}) — vises separat fra DIAAS-rangeringen.`
  if (priceGrade.grade === 'A' || priceGrade.grade === 'B') {
    priceAssessment = `Konkurransedyktig pris (${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g, ${priceGrade.grade}) — sammenlign mot DIAAS-estimat før valg.`
  } else if (priceGrade.grade === 'D' || priceGrade.grade === 'E' || priceGrade.grade === 'F') {
    priceAssessment = `Høy pris per gram protein (${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g) — vurder om DIAAS og proteintetthet rettferdiggjør kostnaden.`
  }

  return {
    bestFor: buildBestFor(product, ctx, severity),
    importantToKnow: buildImportantToKnow(product, severity),
    strengths: collectStrengths(product, severity),
    limitations: collectLimitations(product, severity),
    priceAssessment,
    dataStatus: `${model.documentationStatus} · ${model.diaasStatus.label}`,
    severity,
  }
}

export function isProfileBadgeEligible(product: TestedProteinProduct): boolean {
  if (!isEligibleForProteinBadges(product)) return false
  const conf = getProteinDataConfidence(product)
  return conf.level === 'high' || conf.level === 'medium'
}
