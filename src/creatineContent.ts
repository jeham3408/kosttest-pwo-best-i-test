import type { TestedCreatineProduct } from './data/creatineProducts'

export function generateCreatineContent(product: TestedCreatineProduct) {
  const formatLabel = product.format === 'gummies' ? 'kreatin gummies' : product.format === 'capsules' ? 'kreatin kapsler' : 'kreatinpulver'

  return {
    intro: `${product.name} fra ${product.brand} er rangert som #${product.rank} blant ${formatLabel} på Kosttest.no med ${product.score} poeng.`,
    doseSection: product.format === 'gummies'
      ? `Anbefalt porsjon gir ${product.creatinePerServingG} g kreatin. For full 5 g daglig dose (ISSN-anbefaling) trenger du ofte flere gummies enn produsenten anbefaler.`
      : `Hver porsjon (${product.servingSize}) inneholder ${product.creatinePerServingG} g ${product.creatineForm === 'monohydrate' ? 'kreatin monohydrat' : 'kreatin'}. ISSN anbefaler 3–5 g daglig for styrkeøkning.`,
    priceSection: `Prisen er ${product.priceNok} kr for ${product.packageSize}, som tilsvarer ca. ${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr per gram kreatin.`,
  }
}
