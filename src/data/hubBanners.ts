import { brand } from '../brand'

export type HubBannerId =
  | 'pwo'
  | 'pwo-stim-free'
  | 'protein'
  | 'protein-vegan'
  | 'creatine'
  | 'creatine-creapure'
  | 'metode'
  | 'om-kosttest'

type HubBannerAssets = {
  desktop: string
  mobile: string
  alt: string
}

export const hubBanners: Record<HubBannerId, HubBannerAssets> = {
  pwo: {
    desktop: brand.hubPwoDesktop,
    mobile: brand.hubPwoMobile,
    alt: 'PWO rangert etter deklarert formel — åpne regler og ingen kjøpte plasseringer på kosttest.no',
  },
  'pwo-stim-free': {
    desktop: brand.hubPwoStimFreeDesktop,
    mobile: brand.hubPwoStimFreeMobile,
    alt: 'Koffeinfri PWO etter formel — stim-free rangert uten koffein i scoren på kosttest.no',
  },
  protein: {
    desktop: brand.hubProteinDesktop,
    mobile: brand.hubProteinMobile,
    alt: 'Sammenlign protein etter etiketten — DIAAS-estimat og publiserte regler på kosttest.no',
  },
  'protein-vegan': {
    desktop: brand.hubProteinVeganDesktop,
    mobile: brand.hubProteinVeganMobile,
    alt: 'Vegansk protein etikett for etikett — plantebasert protein rangert på kosttest.no',
  },
  creatine: {
    desktop: brand.hubCreatineDesktop,
    mobile: brand.hubCreatineMobile,
    alt: 'Finn kreatin etter deklarasjon — dose, renhet og pris per gram på kosttest.no',
  },
  'creatine-creapure': {
    desktop: brand.hubCreatineCreapureDesktop,
    mobile: brand.hubCreatineCreapureMobile,
    alt: 'Creapure og ren kreatin — produkter med dokumentert merket råstoff på kosttest.no',
  },
  metode: {
    desktop: brand.hubMetodeDesktop,
    mobile: brand.homeHeroBannerMethodMobile,
    alt: 'Åpen metode — ingen kjøpte plasseringer. Regler, kilder og begrensninger er publisert på kosttest.no',
  },
  'om-kosttest': {
    desktop: brand.hubOmKosttestDesktop,
    mobile: brand.hubOmKosttestMobile,
    alt: 'Kosttest — uavhengig sammenligning og deklarasjonsanalyse for norske forbrukere',
  },
}

export function resolvePwoHubBannerId(caffeineFilter: 'alle' | 'med' | 'uten'): HubBannerId {
  return caffeineFilter === 'uten' ? 'pwo-stim-free' : 'pwo'
}

export function resolveProteinHubBannerId(proteinFilter: 'alle' | 'whey' | 'vegan' | 'kasein'): HubBannerId {
  return proteinFilter === 'vegan' ? 'protein-vegan' : 'protein'
}

export function resolveCreatineHubBannerId(creapureFilter: 'alle' | 'creapure'): HubBannerId {
  return creapureFilter === 'creapure' ? 'creatine-creapure' : 'creatine'
}
