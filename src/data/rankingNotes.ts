/** Forklaring som skal stå på alle testers metode- og rangeringssider. */
export const RANKING_TIEBREAKER_NOTE =
  'Ved lik score rangeres det billigste produktet øverst: PWO etter lavest pris per porsjon, protein etter lavest kr/g protein, kreatin etter lavest kr/g kreatin. Pris påvirker ikke poengsummen — den brukes kun som rekkefølge når score er lik.'

export const RANKING_TIEBREAKER_SHORT = 'Lik score → billigst øverst. Pris påvirker ikke poengsummen.'

export function compareScoreThenPrice(scoreA: number, scoreB: number, priceA: number, priceB: number) {
  return scoreB - scoreA || priceA - priceB
}
