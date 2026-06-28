/** Kontrollerte statusverdier — ikke fritekst i datalag. */

export type DocumentationStatusKind =
  | 'verified_from_label'
  | 'verified_from_manufacturer'
  | 'verified_from_retailer'
  | 'incomplete'
  | 'unknown'

export type DataConfidenceKind = 'high' | 'medium' | 'limited'

export type LaboratoryTestStatusKind =
  | 'not_tested_by_kosttest'
  | 'third_party_documented'
  | 'batch_certificate_documented'
  | 'official_diaas_documented'
  | 'unknown'

export type DopingTestStatusKind =
  | 'documented'
  | 'not_documented'
  | 'not_found_in_public_sources'
  | 'not_relevant'
  | 'unknown'

export type BatchTestStatusKind =
  | 'documented'
  | 'not_documented'
  | 'not_found'
  | 'not_applicable'
  | 'pending'
  | 'unknown'

export type RawMaterialDocStatusKind =
  | 'documented'
  | 'not_documented'
  | 'not_found'
  | 'pending'
  | 'unknown'

export type RankingStatusKind = 'ranked' | 'pending_review' | 'excluded'

export const DOCUMENTATION_STATUS_KIND_LABELS: Record<
  DocumentationStatusKind,
  { label: string; explanation: string }
> = {
  verified_from_label: {
    label: 'Kontrollert mot produktetikett',
    explanation: 'Dose og ingredienser er hentet fra deklarasjon på emballasje eller produktbilde.',
  },
  verified_from_manufacturer: {
    label: 'Kontrollert mot produsentopplysninger',
    explanation: 'Data er hentet fra produsentens offentlige produktinformasjon.',
  },
  verified_from_retailer: {
    label: 'Kontrollert mot forhandlerdata',
    explanation: 'Pris og produktdata er hentet fra butikkens produktside — kan avvike fra etikett.',
  },
  incomplete: {
    label: 'Ufullstendig deklarasjon',
    explanation: 'Sentrale felt mangler for full sammenligning.',
  },
  unknown: {
    label: 'Kilde ikke oppgitt per produkt',
    explanation: 'Se felles testgjennomgang eller send inn dokumentasjon.',
  },
}

export const DATA_CONFIDENCE_KIND_LABELS: Record<
  DataConfidenceKind,
  { label: string; short: string; explanation: string }
> = {
  high: {
    label: 'Høy datatillit',
    short: 'Høy',
    explanation: 'Sentrale dose- og produktdata er kontrollert mot primærkilde eller etikettdokumentasjon.',
  },
  medium: {
    label: 'Middels datatillit',
    short: 'Middels',
    explanation: 'Nok data for rangering, men ett eller flere felt bør kontrolleres igjen.',
  },
  limited: {
    label: 'Begrenset datatillit',
    short: 'Begrenset',
    explanation: 'Produktet er synlig, men bør ikke fremstå som fullt dokumentert.',
  },
}

export const LABORATORY_TEST_STATUS_LABELS: Record<
  LaboratoryTestStatusKind,
  { label: string; explanation: string }
> = {
  not_tested_by_kosttest: {
    label: 'Ikke laboratorietestet av Kosttest',
    explanation: 'Kosttest analyserer deklarasjon — vi har ikke eget labresultat for dette produktet.',
  },
  third_party_documented: {
    label: 'Tredjepartsdokumentasjon oppgitt',
    explanation: 'Laboratoriedata fra produsent eller tredjepart er sitert — ikke test utført av Kosttest.',
  },
  batch_certificate_documented: {
    label: 'Batch-sertifikat dokumentert',
    explanation: 'Produsent har oppgitt batch- eller partidokumentasjon i åpne kilder.',
  },
  official_diaas_documented: {
    label: 'Offisiell DIAAS-test (produsent/lab)',
    explanation: 'DIAAS-score bygger på dokumentert laboratorietest av ferdig produkt.',
  },
  unknown: {
    label: 'Laboratoriestatus ukjent',
    explanation: 'Ingen dokumentert laboratorietest funnet i åpne kilder.',
  },
}

export const DOPING_TEST_STATUS_LABELS: Record<
  DopingTestStatusKind,
  { label: string; explanation: string }
> = {
  documented: {
    label: 'Dopingtest dokumentert',
    explanation: 'Produsent har oppgitt eller vi har funnet testreferanse.',
  },
  not_documented: {
    label: 'Dopingtest ikke dokumentert',
    explanation: 'Ingen dokumentert dopingtest funnet i åpne kilder.',
  },
  not_found_in_public_sources: {
    label: 'Ikke funnet i åpne kilder',
    explanation: 'Vi har søkt, men ikke funnet dokumentasjon.',
  },
  not_relevant: {
    label: 'Ikke relevant for denne testen',
    explanation: 'Dopingtest inngår ikke i vurderingsmodellen for denne kategorien.',
  },
  unknown: {
    label: 'Dopingteststatus ukjent',
    explanation: 'Status er ikke oppgitt per produkt.',
  },
}

export const BATCH_TEST_STATUS_LABELS: Record<
  BatchTestStatusKind,
  { label: string; explanation: string }
> = {
  documented: { label: 'Batchtest dokumentert', explanation: 'Parti-/batchdata er oppgitt.' },
  not_documented: { label: 'Batchtest ikke dokumentert', explanation: 'Ingen batchdokumentasjon funnet.' },
  not_found: { label: 'Ikke funnet i åpne kilder', explanation: 'Vi har ikke funnet batchdokumentasjon.' },
  not_applicable: { label: 'Ikke relevant', explanation: 'Batchtest inngår ikke i denne kategorien.' },
  pending: { label: 'Venter på kontroll', explanation: 'Batchdata skal kontrolleres.' },
  unknown: { label: 'Batchstatus ukjent', explanation: 'Ikke oppgitt per produkt.' },
}

export const RANKING_STATUS_LABELS: Record<RankingStatusKind, string> = {
  ranked: 'Rangert',
  pending_review: 'Venter på kontroll',
  excluded: 'Ikke rangert',
}
