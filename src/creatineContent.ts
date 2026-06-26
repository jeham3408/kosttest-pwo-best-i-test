import { type TestedCreatineProduct } from './data/creatineProducts'

export function generateCreatineContent(product: TestedCreatineProduct) {
  const formatLabel = product.formatType === 'gummies' ? 'gummies' : 'pulver'
  const doseLabel =
    product.creatineMgPerServing >= 3000
      ? `${product.creatineMgPerServing} mg kreatin per dose — ${product.creatineMgPerServing >= 5000 ? 'full vedlikeholdsdose' : 'under full 5 g, men akseptabelt'}`
      : `${product.creatineMgPerServing} mg per dose — under anbefalt 3 g`

  const summary =
    `${product.name} fra ${product.brand} scorer ${product.score} poeng (${product.overallGrade}) i vår kreatin-test (${formatLabel}). ` +
    `${doseLabel}. ` +
    `${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin.`

  const doseAnalysis =
    product.creatineMgPerServing >= 5000
      ? 'Full 5 g vedlikeholdsdose per servering — optimalt for daglig bruk.'
      : product.creatineMgPerServing >= 3000
        ? '3 g per dose — under full 5 g, men kan kompenseres med ekstra servering.'
        : 'For lav dose per servering — krever flere gummies/porsjoner for effektiv dose.'

  const formAnalysis =
    product.creatineForm === 'monohydrate' || product.creatineForm === 'micronized'
      ? 'Monohydrat er den mest forskningsbaserte formen — referanse i scoren.'
      : `${product.creatineForm} — noe lavere form-score enn ren monohydrat.`

  const priceAnalysis =
    product.pricePerGramCreatine <= 0.4
      ? `Svært god pris: ${product.pricePerGramCreatine.toFixed(2).replace('.', ',')} kr/g kreatin.`
      : product.pricePerGramCreatine <= 0.7
        ? 'Konkurransedyktig pris per g kreatin.'
        : 'Høyere pris per g — typisk for gummies og premium-merker.'

  const bestFor =
    product.formatType === 'gummies'
      ? 'De som vil ha praktisk format uten shaker.'
      : 'Daglig kreatintilskudd til styrke og volum — billigst som pulver.'

  const notFor =
    product.formatType === 'gummies' && product.creatineMgPerServing < 5000
      ? 'De som vil ha full 5 g dose uten å spise mange gummies.'
      : 'De med nyresykdom bør konsultere lege før kreatin.'

  const bottomLine =
    product.score >= 70
      ? `Anbefales. ${product.name} kombinerer god dose og pris.`
      : product.score >= 55
        ? 'Godt valg med noen kompromiss på dose eller pris.'
        : 'Akseptabelt, men vurder høyere scorende alternativer.'

  const faq = [
    {
      question: 'Hvor mye kreatin trenger jeg?',
      answer: 'Forskning støtter 3–5 g kreatinmonohydrat daglig for vedlikehold. Loading (20 g/dag i 5–7 dager) er valgfritt.',
    },
    {
      question: 'Er gummies like bra som pulver?',
      answer:
        product.formatType === 'gummies'
          ? 'Samme kreatin, men gummies har ofte lavere dose per servering og høyere pris per g. Pulver er mer kostnadseffektivt.'
          : 'Pulver gir typisk full dose til lavest pris. Gummies er praktisk, men dyrere per g kreatin.',
    },
    {
      question: 'Hva teller i scoren?',
      answer: 'Dose per servering (60 %), form (15 %) og pris per g kreatin (25 %).',
    },
  ]

  return { summary, doseAnalysis, formAnalysis, priceAnalysis, bestFor, notFor, bottomLine, faq }
}
