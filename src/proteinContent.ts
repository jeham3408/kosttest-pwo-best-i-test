import { type TestedProteinProduct } from './data/proteinProducts'

export function generateProteinContent(product: TestedProteinProduct) {
  const diaasLabel = product.diaasIsOfficial
    ? `DIAAS ${product.diaasScore} (laboratorietestet)`
    : `DIAAS ${product.diaasScore} (estimat — ikke lab-testet ferdig blanding)`

  const summary =
    `${product.name} fra ${product.brand} scorer ${product.score} poeng (${product.overallGrade}) i vår proteinpulver-test. ` +
    `${diaasLabel} — primær kvalitetsmåling. ` +
    `IAAS ${product.iaasScore} viser aminosyreprofil for sammenligning. ` +
    `${product.proteinPerServingG} g protein per dose. ` +
    `Proteinkilde: ${product.sourceLabel}.`

  const diaasAnalysis = product.diaasIsOfficial
    ? `Offisiell DIAAS ${product.diaasScore} — måler ileal fordøyelighet av essensielle aminosyrer, ikke bare profil på papir.`
    : product.diaasScore >= 105
      ? `Høyt DIAAS-estimat (${product.diaasScore}) basert på ${product.sourceLabel}. Offisiell score krever lab-test av ferdig produkt.`
      : product.diaasScore >= 95
        ? `Solid DIAAS-estimat (${product.diaasScore}) — typisk whey/kasein-nivå.`
        : product.diaasScore >= 85
          ? `Akseptabelt DIAAS-estimat (${product.diaasScore}).`
          : `Lavere DIAAS-estimat (${product.diaasScore}) — planteblandinger scorer ofte lavere uten optimalisert miks og lab-test.`

  const iaasAnalysis =
    product.iaasScore >= 110
      ? `Sterk aminosyreprofil (IAAS ${product.iaasScore}) — dekker WHO-referansen godt på papir.`
      : product.iaasScore >= 100
        ? `God IAAS-profil (${product.iaasScore}) — typisk for kvalitets-whey.`
        : product.iaasScore >= 90
          ? `Akseptabel IAAS (${product.iaasScore}) — profil OK, men kun DIAAS styrer scoren.`
          : `Lavere IAAS (${product.iaasScore}) — begrensende aminosyrer i profilen. DIAAS kan likevel avvike ved bedre fordøyelighet.`

  const priceAnalysis =
    product.pricePerGramProtein <= 0.5
      ? `Referansepris: ${product.pricePerGramProtein.toFixed(2).replace('.', ',')} kr/g protein — påvirker ikke rangeringen.`
      : product.pricePerGramProtein <= 0.75
        ? `Konkurransedyktig pris per g protein (kun referanse).`
        : `Høyere pris per g protein — rangeringen er kun basert på DIAAS.`

  const bestFor =
    product.sourceType.includes('casein')
      ? 'Kveldsprotein og langsom frigjøring over natten.'
      : product.sourceType.includes('soy') || product.sourceType.includes('pea')
        ? 'Veganere — merk at offisiell DIAAS krever test av ferdig blanding.'
        : 'Daglig proteininntak etter trening.'

  const notFor =
    product.diaasIsOfficial
      ? 'Ingen spesielle begrensninger utover pris og allergener.'
      : 'De som krever dokumentert lab-DIAAS — vi viser estimat til ferdig produkt er testet.'

  const bottomLine =
    product.score >= 61
      ? `Anbefales. ${product.name} har sterk DIAAS og scorer høyt på kvalitet.`
      : product.score >= 49
        ? `Godt valg med noen kompromiss på DIAAS.`
        : product.score >= 36
          ? `Akseptabelt på kvalitet.`
          : `Under middels DIAAS — vurder høyere scorende produkter.`

  const faq = [
    {
      question: 'Hva er DIAAS — og hvorfor er det best?',
      answer:
        'DIAAS (Digestible Indispensable Amino Acid Score) er FAO anbefalt gullstandard. Den måler ileal fordøyelighet av hver essensiell aminosyre — altså hvor mye kroppen faktisk tar opp. Derfor er DIAAS eneste faktor i vår score.',
    },
    {
      question: 'Hva er IAAS?',
      answer:
        `IAAS (${product.iaasScore} for dette produktet) sammenligner aminosyreprofilen mot WHO-referansen uten å justere for fordøyelighet. Nyttig for sammenligning, men FAO anbefaler DIAAS fremfor IAAS.`,
    },
    {
      question: 'Hvorfor står det «estimat»?',
      answer: product.diaasIsOfficial
        ? 'Dette produktet har laboratorietestet DIAAS for ferdig blanding.'
        : 'Offisiell DIAAS kan ikke påstås uten test av ferdig produkt. Vi bruker publiserte DIAAS-estimater per proteintype til produktet er lab-testet.',
    },
    {
      question: 'Hva teller i totalscore?',
      answer: 'Kun DIAAS styrer totalscore. IAAS og pris vises for sammenligning, men inngår ikke i poengberegningen.',
    },
  ]

  return { summary, diaasAnalysis, iaasAnalysis, priceAnalysis, bestFor, notFor, bottomLine, faq }
}
