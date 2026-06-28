/** Gjenbrukbar metode- og troverdighetstekst — bokmål, uten produktendringer. */

export type MethodDisclosureCategory = 'pwo' | 'protein' | 'creatine' | 'general'

export const METHOD_DISCLOSURE_TITLE = 'Slik vurderes produktet'

export const METHOD_DISCLOSURE_BODY =
  'Vurderingen bygger på deklarert produktinformasjon, tilgjengelige kilder og Kosttest sin publiserte metode. Laboratorietest er bare oppgitt når slik dokumentasjon faktisk finnes.'

export const METHOD_DISCLOSURE_MISSING_DATA =
  'Manglende dokumentasjon vises som manglende dokumentasjon, ikke automatisk som lav kvalitet.'

export const CATEGORY_METHOD_SUMMARY: Record<MethodDisclosureCategory, string | null> = {
  pwo: 'PWO rangeres etter deklarerte ingredienser og dose. Pris vises separat og endrer ikke formelscoren.',
  protein:
    'Protein sammenlignes etter proteintype, proteininnhold, estimert eller dokumentert proteinkvalitet og pris per gram protein.',
  creatine:
    'Kreatin sammenlignes etter dokumentasjon, råvareopplysninger, renhet, pris og tilgjengelige kvalitetsdata.',
  general: null,
}

export const CATEGORY_METHOD_LINK: Record<MethodDisclosureCategory, { href: string; label: string }> = {
  pwo: { href: '/om-metoden/', label: 'Full PWO-metode' },
  protein: { href: '/tester/protein/metode/', label: 'Full proteinmetode' },
  creatine: { href: '/tester/kreatin/metode/', label: 'Full kreatinmetode' },
  general: { href: '/om-kosttest/', label: 'Om Kosttest og metoden' },
}
