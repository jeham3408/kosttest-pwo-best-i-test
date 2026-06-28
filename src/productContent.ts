import { testedProducts } from './data/pwoProducts'
import {
  buildPwoBadgeContext,
  generatePwoProductCopy,
  getPwoBadges,
  PWO_BADGE_THRESHOLDS,
  calculatePwoValueIndex,
} from './data/pwo'

export function generateProductContent(product: import('./data/pwoProducts').TestedProduct) {
  const badgeCtx = buildPwoBadgeContext(testedProducts)
  const copy = generatePwoProductCopy(product, badgeCtx)
  const hasCaffeine = (product.caffeineMg ?? 0) > 0
  return {
    ...copy,
    notFor: copy.notFor,
    faq: [
      {
        question: `Hva bør jeg vite om ${product.name} før bruk?`,
        answer: `${product.name} er et kosttilskudd solgt lovlig i Norge. Følg dosering på emballasjen og rådfør deg med helsepersonell ved usikkerhet.`,
      },
      {
        question: `Hvor mye koffein i ${product.name}?`,
        answer: hasCaffeine
          ? `${product.caffeineMg} mg per dose.`
          : 'Koffeinfri etter deklarasjon.',
      },
    ],
  }
}

export { generatePwoProductCopy, buildPwoBadgeContext, getPwoBadges, PWO_BADGE_THRESHOLDS, calculatePwoValueIndex }
