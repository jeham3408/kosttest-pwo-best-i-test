import { type TestedProduct } from './data/pwoProducts'

const gradeLabels: Record<string, string> = {
  A: 'Maksimal effektiv dose',
  B: 'Nær maksimal effektiv dose',
  C: 'Minimum effektiv dose',
  D: 'Under effektiv dose',
  E: 'Svært lav dose',
  F: 'Mangler eller ubetydelig',
}

export function generateProductContent(product: TestedProduct) {
  const hasCaffeine = (product.caffeineMg ?? 0) > 0
  const hasCitrulline = (product.citrullineMg ?? 0) > 0
  const hasBetaAlanine = (product.betaAlanineMg ?? 0) > 0
  const pumpMg = (product.citrullineMg ?? 0) + ((product.extraDoses?.arginine ?? 0) * 0.5) + ((product.extraDoses?.beetroot ?? 0) * 0.9)
  
  const summary = `${product.name} fra ${product.brand} scorer ${product.score} poeng (${product.overallGrade}) i vår test. ` + (
    hasCitrulline 
      ? `Med ${product.citrullineMg?.toLocaleString('nb-NO')} mg L-citrulline-ekvivalent gir den solid pump. `
      : `Produktet mangler L-citrulline, som er den viktigste ingrediensen for pump. `
  ) + (
    hasBetaAlanine 
      ? `Beta-alanin på ${product.betaAlanineMg?.toLocaleString('nb-NO')} mg bidrar til utholdenhet. `
      : `Ingen beta-alanin tilsatt. `
  ) + (
    hasCaffeine
      ? `Koffeininnholdet er på ${product.caffeineMg} mg per dose.`
      : `Koffeinfritt produkt, egnet for kveldstrening.`
  )

  const pumpAnalysis = hasCitrulline
    ? `Kombinert pump-ekvivalent: ${Math.round(pumpMg).toLocaleString('nb-NO')} mg. Dette gir ${product.gradeBreakdown?.find(g => g.key === 'lCitrullineEq')?.grade ?? '?'} i karakter, som tilsvarer "${gradeLabels[product.gradeBreakdown?.find(g => g.key === 'lCitrullineEq')?.grade ?? 'F']}". `
    : `Uten L-citrulline eller arginin er pump-scoren svært lav. Produktet får F i pump. `

  const bestFor = hasCaffeine
    ? `Erfarne brukere som ønsker ` + (hasCitrulline ? 'solid pump' : 'energi') + ` og stimulans.`
    : `De som trener sent på kvelden eller er koffeinfølsomme.`

  const notFor = hasCaffeine && (product.caffeineMg ?? 0) >= 300
    ? `Nybegynnere eller koffeinfølsomme (${product.caffeineMg} mg koffein er høyt).`
    : `De som ønsker maksimal pump (mangler L-citrulline).`

  const bottomLine = product.score >= 46
    ? `Anbefales på det sterkeste. ${product.name} er blant de beste PWO-ene på markedet.`
    : product.score >= 34
    ? `Et godt middels alternativ, men det finnes bedre valg for samme pris.`
    : product.score >= 11
    ? `Under middels. Vurder et produkt med høyere score for bedre effekt.`
    : `Svært lav score. Anbefales ikke.`

  const faq = [
    { question: `Er ${product.name} trygg å bruke?`, answer: `Ja, ${product.name} fra ${product.brand} er et lovlig kosttilskudd. Følg anbefalt dosering. Rådfør deg med lege hvis du er usikker.` },
    { question: `Hvor mye koffein inneholder ${product.name}?`, answer: hasCaffeine ? `${product.name} inneholder ${product.caffeineMg} mg koffein per dose.` : `${product.name} er koffeinfritt og egnet for kveldstrening.` },
    { question: `Hva er den viktigste ingrediensen i ${product.name}?`, answer: hasCitrulline ? `L-citrulline er den viktigste ingrediensen for pump, med ${product.citrullineMg} mg ekvivalent per dose.` : `Produktet mangler L-citrulline, som er den viktigste ingrediensen for pump.` },
    { question: `Hvordan doserer jeg ${product.name}?`, answer: `Følg anbefalingen på emballasjen. Start med halv dose for å teste toleranse.` },
  ]

  return { summary, pumpAnalysis, bestFor, notFor, bottomLine, faq }
}
