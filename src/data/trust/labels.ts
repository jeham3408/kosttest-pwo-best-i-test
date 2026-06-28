/** Statusetiketter med konkrete forklaringer — ikke vage «verifisert». */

export const TRUST_LEVEL_COPY: Record<
  'high' | 'medium' | 'limited' | 'unranked',
  { label: string; short: string; explanation: string }
> = {
  high: {
    label: 'Høy datatillit',
    short: 'Høy tillit',
    explanation:
      'Sentrale dose- og produktdata er kontrollert mot primærkilde eller etikettdokumentasjon.',
  },
  medium: {
    label: 'Middels datatillit',
    short: 'Middels tillit',
    explanation: 'Nok data for rangering, men ett eller flere felt bør kontrolleres igjen.',
  },
  limited: {
    label: 'Begrenset datatillit',
    short: 'Begrenset tillit',
    explanation: 'Produktet er synlig, men bør ikke fremstå som fullt dokumentert.',
  },
  unranked: {
    label: 'Ikke rangert',
    short: 'Ikke rangert',
    explanation: 'Ikke nok kontrollerbar informasjon til å bruke den åpne modellen forsvarlig.',
  },
}

export const DATA_SOURCE_LABELS = {
  productLabel: {
    label: 'Kontrollert mot produktetikett',
    explanation: 'Dose og ingredienser er hentet fra deklarasjon på emballasje eller produktbilde.',
  },
  manufacturer: {
    label: 'Kontrollert mot produsentopplysninger',
    explanation: 'Data er hentet fra produsentens offentlige produktinformasjon.',
  },
  retailer: {
    label: 'Kontrollert mot forhandlerdata',
    explanation: 'Pris og produktdata er hentet fra butikkens produktside — kan avvike fra etikett.',
  },
  thirdParty: {
    label: 'Tredjepartsdokumentasjon oppgitt',
    explanation: 'Produsent eller testlab har lagt ut dokumentasjon som er sitert i testen.',
  },
  unknown: {
    label: 'Kilde ikke oppgitt per produkt',
    explanation: 'Se felles testgjennomgang eller send inn dokumentasjon.',
  },
} as const

export const LAB_TEST_LABELS = {
  notByKosttest: {
    label: 'Ikke laboratorietestet av Kosttest',
    explanation: 'Kosttest analyserer deklarasjon — vi har ikke eget labresultat for dette produktet.',
  },
  officialDiaas: {
    label: 'Offisiell DIAAS-test (produsent/lab)',
    explanation: 'DIAAS-score bygger på dokumentert laboratorietest av ferdig produkt.',
  },
  thirdParty: {
    label: 'Tredjepartsdokumentasjon oppgitt',
    explanation: 'Laboratoriedata fra produsent eller tredjepart er sitert — ikke test utført av Kosttest.',
  },
  notApplicable: {
    label: 'Ikke relevant for denne testen',
    explanation: 'Laboratorietest inngår ikke i vurderingsmodellen for denne kategorien.',
  },
} as const

export const DOCUMENTATION_STATUS_LABELS = {
  documented: { label: 'Dokumentert', explanation: 'Oppgitt av produsent eller funnet i åpne kilder.' },
  notDocumented: { label: 'Ikke dokumentert', explanation: 'Produsent har ikke oppgitt dette feltet.' },
  notFound: { label: 'Ikke funnet i åpne kilder', explanation: 'Vi har ikke funnet offentlig dokumentasjon.' },
  notApplicable: { label: 'Ikke relevant', explanation: 'Feltet gjelder ikke dette produktet.' },
  pending: { label: 'Venter på kontroll', explanation: 'Data skal kontrolleres før produktet kan rangeres.' },
} as const

export const DOPING_LABELS = {
  documented: { label: 'Dopingtest dokumentert', explanation: 'Produsent har oppgitt eller vi har funnet testreferanse.' },
  notDocumented: { label: 'Dopingtest ikke dokumentert', explanation: 'Ingen dokumentert dopingtest funnet i åpne kilder.' },
  notFound: { label: 'Ikke funnet i åpne kilder', explanation: 'Vi har søkt, men ikke funnet dokumentasjon.' },
} as const

export const MISSING_VALUE = 'Ikke oppgitt per produkt'
export const SITE_REVIEW_NOTE = 'Felles gjennomgang av testdata — se «Hvor ferske er dataene?»'
