import { testedCreatineProducts, type TestedCreatineProduct } from './creatineProducts'
import { buildCreatineBadgeContext } from './creatine/badges'
import { buildProteinBadgeContext } from './protein/badges'
import { testedProteinProducts, type TestedProteinProduct } from './proteinProducts'
import { buildPwoBadgeContext, getPwoBadges } from './pwo/badges'
import { calculatePriceGrade, testedProducts, type TestedProduct } from './pwoProducts'
import { calculateProteinPriceGrade } from './protein/metrics'
import { calculateCreatinePriceGrade } from './creatine/metrics'

export type HomeWinnerCard = {
  category: 'pwo' | 'protein' | 'creatine'
  categoryLabel: string
  badgeLabel: string
  badgeExplanation: string
  productId: string
  productName: string
  brand: string
  scoreLabel: string
  priceLabel: string
  rankingPath: string
  comparePath: string
  productPath: string
}

const HOME_BADGE_COPY: Record<string, { label: string; explanation: string }> = {
  'best-formel-total': {
    label: 'Best formel',
    explanation: 'Høyest formelscore basert på deklarerte ingredienser og dose. Pris påvirker ikke plasseringen.',
  },
  'best-verdi': {
    label: 'Best verdi',
    explanation: 'Best balanse mellom kvalitetsscore og pris — ikke det samme som lavest pris alene.',
  },
  'best-value': {
    label: 'Best verdi',
    explanation: 'Best balanse mellom kvalitetsscore og pris per gram kreatin.',
  },
  'best-protein-profile': {
    label: 'Best proteinprofil',
    explanation: 'Høyest DIAAS-basert kvalitetsscore. Smak, toleranse og pris inngår ikke i denne badge-en.',
  },
  'best-value-whey': {
    label: 'Best verdi (whey)',
    explanation: 'Best balanse mellom DIAAS-estimat og pris blant whey-produkter.',
  },
  'best-documentation': {
    label: 'Best dokumentasjon',
    explanation: 'Flest dokumenterte felt: råstoff, renhet, mesh og dopingtest der oppgitt.',
  },
  'best-creapure': {
    label: 'Best Creapure-alternativ',
    explanation: 'Høyest score blant produkter med Creapure eller annet merket råstoff.',
  },
}

function firstWinner(ids: string[]): string | null {
  return ids[0] ?? null
}

function pwoCard(badgeId: string, product: TestedProduct): HomeWinnerCard {
  const copy = HOME_BADGE_COPY[badgeId] ?? { label: badgeId, explanation: '' }
  const price = calculatePriceGrade(product.pricePerServing)
  return {
    category: 'pwo',
    categoryLabel: 'PWO',
    badgeLabel: copy.label,
    badgeExplanation: copy.explanation,
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    scoreLabel: `Formelscore ${product.score}/84`,
    priceLabel: `${product.pricePerServing.toFixed(2).replace('.', ',')} kr/dose · karakter ${price.grade}`,
    rankingPath: '/tester/pwo/',
    comparePath: '/tester/pwo/sammenlign',
    productPath: `/pwo/${product.id}/`,
  }
}

function proteinCard(badgeId: string, product: TestedProteinProduct): HomeWinnerCard {
  const copy = HOME_BADGE_COPY[badgeId] ?? { label: badgeId, explanation: '' }
  const price = calculateProteinPriceGrade(product.pricePerGramProtein)
  return {
    category: 'protein',
    categoryLabel: 'Protein',
    badgeLabel: copy.label,
    badgeExplanation: copy.explanation,
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    scoreLabel: `DIAAS-score ${product.score} (estimat fra proteintype)`,
    priceLabel: `${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein · karakter ${price.grade}`,
    rankingPath: '/tester/protein/',
    comparePath: '/tester/protein/sammenlign',
    productPath: `/protein/${product.id}/`,
  }
}

function creatineCard(badgeId: string, product: TestedCreatineProduct): HomeWinnerCard {
  const copy = HOME_BADGE_COPY[badgeId] ?? { label: badgeId, explanation: '' }
  const price = calculateCreatinePriceGrade(product.pricePerGramCreatine)
  return {
    category: 'creatine',
    categoryLabel: 'Kreatin',
    badgeLabel: copy.label,
    badgeExplanation: copy.explanation,
    productId: product.id,
    productName: product.name,
    brand: product.brand,
    scoreLabel: `Kvalitetsscore ${product.score}/100`,
    priceLabel: `${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin · karakter ${price.grade}`,
    rankingPath: '/tester/kreatin/',
    comparePath: '/tester/kreatin/sammenlign',
    productPath: `/kreatin/${product.id}/`,
  }
}

export function getHomeWinnerCards(): HomeWinnerCard[] {
  const pwoCtx = buildPwoBadgeContext(testedProducts)
  const proteinCtx = buildProteinBadgeContext(testedProteinProducts)
  const creatineCtx = buildCreatineBadgeContext(testedCreatineProducts)

  const cards: HomeWinnerCard[] = []

  const pwoFormelId = firstWinner(pwoCtx.winners['best-formel-total'])
  const pwoVerdiId = firstWinner(pwoCtx.winners['best-verdi'])
  if (pwoFormelId) {
    const p = testedProducts.find((x) => x.id === pwoFormelId)!
    if (getPwoBadges(p, pwoCtx).some((b) => b.id === 'best-formel-total')) cards.push(pwoCard('best-formel-total', p))
  }
  if (pwoVerdiId) {
    const p = testedProducts.find((x) => x.id === pwoVerdiId)!
    cards.push(pwoCard('best-verdi', p))
  }

  const protProfId = firstWinner(proteinCtx.winners['best-protein-profile'])
  const protValId = firstWinner(proteinCtx.winners['best-value-whey'])
  if (protProfId) {
    const p = testedProteinProducts.find((x) => x.id === protProfId)!
    cards.push(proteinCard('best-protein-profile', p))
  }
  if (protValId) {
    const p = testedProteinProducts.find((x) => x.id === protValId)!
    cards.push(proteinCard('best-value-whey', p))
  }

  const creDocId = firstWinner(creatineCtx.winners['best-documentation'])
  const creValId = firstWinner(creatineCtx.winners['best-value'])
  if (creDocId) {
    const p = testedCreatineProducts.find((x) => x.id === creDocId)!
    cards.push(creatineCard('best-documentation', p))
  }
  if (creValId) {
    const p = testedCreatineProducts.find((x) => x.id === creValId)!
    cards.push(creatineCard('best-value', p))
  }

  return cards
}

/** Grupper vinnarkort per kategori for layout */
export function getHomeWinnersByCategory(): Record<'pwo' | 'protein' | 'creatine', HomeWinnerCard[]> {
  const all = getHomeWinnerCards()
  return {
    pwo: all.filter((c) => c.category === 'pwo'),
    protein: all.filter((c) => c.category === 'protein'),
    creatine: all.filter((c) => c.category === 'creatine'),
  }
}
