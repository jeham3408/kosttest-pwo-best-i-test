/** PWO — formelscore og pris som tiebreaker. */
export const PWO_RANKING_TIEBREAKER_NOTE =
  'Formelscoren bygger kun på ingredienser og dose. Ved lik formelscore rangeres det billigste produktet øverst (lavest pris per dose). Pris påvirker ikke poengsummen.'

export const PWO_RANKING_TIEBREAKER_SHORT =
  'Lik formelscore → billigst per dose øverst. Pris påvirker ikke poengsummen.'

/** Protein — DIAAS-score og pris som tiebreaker. */
export const PROTEIN_RANKING_TIEBREAKER_NOTE =
  'Proteinscoren bygger på DIAAS. IAAS blir vist for sammenligning. Ved lik score blir laveste pris per gram protein brukt som utslagsfaktor.'

export const PROTEIN_RANKING_TIEBREAKER_SHORT =
  'Lik DIAAS-score → billigst kr/g protein øverst. Pris påvirker ikke poengsummen.'

/** Kreatin — dokumentasjonsscore og pris som tiebreaker. */
export const CREATINE_RANKING_TIEBREAKER_NOTE =
  'Kreatinscoren bygger på råstoff, renhet, mesh og dokumentasjon. Ved lik score brukes laveste pris per gram kreatin som utslagsfaktor. Pris påvirker ikke poengsummen.'

export const CREATINE_RANKING_TIEBREAKER_SHORT =
  'Lik score → billigst kr/g kreatin øverst. Pris påvirker ikke poengsummen.'

/** @deprecated Bruk kategori-spesifikke konstanter (PWO_/PROTEIN_/CREATINE_). */
export const RANKING_TIEBREAKER_NOTE = PWO_RANKING_TIEBREAKER_NOTE

/** @deprecated Bruk kategori-spesifikke konstanter. */
export const RANKING_TIEBREAKER_SHORT = PWO_RANKING_TIEBREAKER_SHORT

export function compareScoreThenPrice(scoreA: number, scoreB: number, priceA: number, priceB: number) {
  return scoreB - scoreA || priceA - priceB
}
