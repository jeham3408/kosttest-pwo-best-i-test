/**
 * Konfigurasjon for kosttilskudd-faktasjekk per kategori.
 * Utvid med nye kategorier (omega-3, vitamin-d) ved å legge til her + produktdata.
 */
export const KOSTTILSKUDD_CATEGORIES = {
  creatine: {
    id: 'creatine',
    label: 'Kreatin (pulver + gummies)',
    queuePath: 'src/data/creatineVerificationQueue.json',
    productsPath: 'src/data/creatineProducts.ts',
    statusMd: 'data/creatine-verification-status.md',
    reportsDir: 'data/creatine-verifications',
    cron: '0 * * * *',
    verifySkill: 'kosttilskudd-faktasjekk',
  },
  protein: {
    id: 'protein',
    label: 'Proteinpulver',
    queuePath: 'src/data/proteinVerificationQueue.json',
    productsPath: 'src/data/proteinProducts.ts',
    statusMd: 'data/protein-verification-status.md',
    reportsDir: 'data/protein-verifications',
    cron: '*/5 * * * *',
    verifySkill: 'kosttest-protein-verify',
  },
}

/** Rekkefølge for timevis kosttilskudd-automasjon — roterer én produkt per kjøring */
export const KOSTTILSKUDD_ROTATION = ['creatine', 'protein']

export const MASTER_STATUS_MD = 'data/kosttilskudd-verification-status.md'
export const MASTER_QUEUE_PATH = 'src/data/kosttilskuddMasterQueue.json'
