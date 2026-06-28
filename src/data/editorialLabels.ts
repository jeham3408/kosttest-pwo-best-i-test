/**
 * Standardiserte redaksjonelle formuleringer for offentlig tekst på Kosttest.no.
 */

export const EDITORIAL = {
  basedOnDeclaration: 'Basert på deklarert innhold',
  notLabTestedByKosttest: 'Ikke laboratorietestet av Kosttest med mindre annet er oppgitt',
  notDocumentedInSources: 'Ikke dokumentert i åpne kilder',
  priceLastChecked: 'Pris sist kontrollert',
  formulaScore: 'Formelscore',
  priceReference: 'Prisreferanse',
  dataLastChecked: 'Data sist kontrollert',
  openComparison:
    'Åpen, regelbasert sammenligning av kosttilskudd basert på deklarerte data og publiserte kriterier.',
  noMedicalClaims:
    'Kosttest analyserer deklarasjon — vi lover ikke medisinsk effekt, resultater eller trygghet for alle brukere.',
  supplementsOptional:
    'Kosttilskudd er ikke nødvendig for fremgang. Spør helsepersonell ved usikkerhet, spesielt ved graviditet, sykdom eller medisinbruk.',
  notBestForAll: 'Ingen enkeltprodukt er best for alle — velg etter mål, toleranse og datakvalitet.',
  declarationNotLab:
    'Deklarasjonsanalyse skiller seg fra laboratorietest. Manglende dokumentasjon betyr ikke automatisk dårlig produkt.',
} as const

export type EditorialKey = keyof typeof EDITORIAL
