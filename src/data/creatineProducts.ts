import { calculateCreatineGrade, type CreatineForm, type CreatineGradeBreakdown } from './creatineScoring'
import { creatineImageFor } from './creatineImages'
import type { GradeLetter } from './pwoProducts'
import type { ProductDataTrust } from './trust/types'

export type TestedCreatineProduct = {
  id: string
  rank: number
  award: string
  score: number
  overallGrade: GradeLetter
  gradeBreakdown: CreatineGradeBreakdown[]
  formScore: number
  creatinePerServingG: number
  pricePerGramCreatine: number
  name: string
  brand: string
  merchant: string
  priceNok: number
  packageSize: string
  packageSizeG: number
  servingSize: string
  servingSizeG: number
  servings: number
  form: CreatineForm
  formLabel: string
  isCreapure: boolean
  isMicronized: boolean
  /** Merkevare på kreatin-råstoffet, f.eks. Creapure®. Null = ikke oppgitt. */
  creatineBrand: string | null
  /** Oppgitt renhet i % — null hvis ikke dokumentert av produsent/butikk. */
  purityPercent: number | null
  /** Oppgitt mesh / partikkelstørrelse — null hvis ikke dokumentert. */
  meshLabel: string | null
  /** Dokumentert dopingtest på ferdigproduktet — poengtrekk (−15) når ikke oppgitt, ikke utelukking fra lista. */
  dopingTestLabel: string | null
  keyFeatures: string[]
  verdict: string
  strengths: string[]
  watchouts: string[]
  url: string
  image: string
  /** Valfri utvidet datatillit — kun verifiserte felt. */
  dataTrust?: ProductDataTrust
}

type RawCreatine = Omit<
  TestedCreatineProduct,
  'rank' | 'score' | 'overallGrade' | 'gradeBreakdown' | 'formScore' | 'pricePerGramCreatine'
>


const rawProducts: RawCreatine[] = [
  {
    id: 'esn-ultrapure-creatine',
    award: 'Best renhet',
    name: 'Ultrapure Creatine',
    brand: 'ESN',
    merchant: 'Gymgrossisten',
    priceNok: 249,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate-creapure',
    formLabel: 'Creapure monohydrat',
    isCreapure: true,
    isMicronized: false,
    creatineBrand: 'Creapure®',
    purityPercent: 99.9,
    meshLabel: '200 mesh (Creapure)',
    dopingTestLabel: null,
    keyFeatures: ['Creapure', '500 g', '200 mesh', 'Uten smak'],
    verdict: 'ESN Ultrapure leverer Creapure med dokumentert renhet og mesh — solid kvalitet, men uten dokumentert dopingtest på produktet.',
    strengths: ['Creapure-sertifisert', '99,9 % renhet (Creapure-standard)', '200 mesh oppgitt'],
    watchouts: ['Ingen dokumentert dopingtest på ferdigproduktet', 'Dyrere per kg enn produkter uten merkevare-råstoff'],
    url: 'https://www.gymgrossisten.no/esn-ultrapure-creatine-500g',
    image: '',
  },
  {
    id: 'optimum-gold-creatine',
    award: 'Best dokumentert merke',
    name: 'Gold Standard 100% Creatine',
    brand: 'Optimum Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 299,
    packageSize: '317 g',
    packageSizeG: 317,
    servingSize: '3,4 g',
    servingSizeG: 3.4,
    servings: 93,
    creatinePerServingG: 3,
    form: 'monohydrate-creapure',
    formLabel: 'Creapure monohydrat',
    isCreapure: true,
    isMicronized: true,
    creatineBrand: 'Creapure®',
    purityPercent: 99.9,
    meshLabel: '200 mesh (Creapure)',
    dopingTestLabel: null,
    keyFeatures: ['Creapure', 'Mikronisert', '317 g', '200 mesh'],
    verdict: 'Pålitelig Creapure fra ON — mikronisert monohydrat med høy renhet, men uten dokumentert dopingtest på produktet.',
    strengths: ['Creapure', 'Mikronisert', 'Godt kjent merke'],
    watchouts: ['Ingen dokumentert dopingtest på ferdigproduktet', 'Alternativer uten merkevare-råstoff er billigere per kg'],
    url: 'https://www.gymgrossisten.no/gold-standard-100-creatine-317g',
    image: '',
  },
  {
    id: 'bodylab-creatine',
    award: 'Best verdi (kvalitet)',
    name: 'Creatine Monohydrate',
    brand: 'Bodylab',
    merchant: 'Tights',
    priceNok: 199,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate',
    formLabel: 'Kreatin monohydrat',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['500 g', 'Norsk favoritt', 'Smakløs'],
    verdict: 'Solid norsk standard — monohydrat til lav pris, men uten oppgitt merkevare på råstoff, renhetsdata eller dopingtest.',
    strengths: ['Lav pris per kg', 'Enkel smakløs formel', 'Tilgjengelig i Norge'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.tights.no/butikk/creatine-monohydrate-500g/',
    image: '',
  },
  {
    id: 'myprotein-creatine',
    award: 'Billigst uten merkevare-råstoff',
    name: 'Creatine Monohydrate',
    brand: 'MyProtein',
    merchant: 'MyProtein',
    priceNok: 179,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate',
    formLabel: 'Kreatin monohydrat',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['500 g', 'Impact-serien', 'Smakløs'],
    verdict: 'Billig monohydrat — god pris, men uten oppgitt merkevare på råstoff eller dokumentert kvalitet/dopingtest.',
    strengths: ['Lav pris', 'Stort utvalg smaker', '500 g pakke'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.myprotein.no/sports-nutrition/creatine-monohydrate-powder/10530050.html',
    image: '',
  },
  {
    id: 'star-creatine',
    award: 'Sterk norsk butikk',
    name: 'Creatine Monohydrate',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 219,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate',
    formLabel: 'Kreatin monohydrat',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['500 g', 'Norsk merke', 'Smakløs'],
    verdict: 'Star Nutrition Creatine er en ukomplisert monohydrat — god standard i norsk marked.',
    strengths: ['Tilgjengelig i Norge', 'Enkel formel', 'Lav pris per kg'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.gymgrossisten.no/star-nutrition-creatine-monohydrate-500g',
    image: '',
  },
  {
    id: 'scitec-creatine',
    award: 'Europeisk standard',
    name: '100% Creatine Monohydrate',
    brand: 'Scitec Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 229,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate',
    formLabel: 'Kreatin monohydrat',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['500 g', 'Pharma-grade', 'Smakløs'],
    verdict: 'Scitec 100% Creatine er ren monohydrat — solid mellomting mellom budget og Creapure.',
    strengths: ['Ren formel', 'God tilgjengelighet', '500 g pakke'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.gymgrossisten.no/scitec-nutrition-100-creatine-monohydrate-500g',
    image: '',
  },
  {
    id: 'dymatize-creatine',
    award: 'Mikronisert mono',
    name: 'Creatine Monohydrate',
    brand: 'Dymatize',
    merchant: 'Gymgrossisten',
    priceNok: 279,
    packageSize: '300 g',
    packageSizeG: 300,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 60,
    creatinePerServingG: 5,
    form: 'micronized',
    formLabel: 'Mikronisert monohydrat',
    isCreapure: false,
    isMicronized: true,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['300 g', 'Mikronisert', 'Smakløs'],
    verdict: 'Mikronisert monohydrat — oppløses lettere, men uten oppgitt merkevare på råstoff eller dokumentert test.',
    strengths: ['Mikronisert', 'Kjent merke', 'Ren pulverform'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.gymgrossisten.no/dymatize-creatine-monohydrate-300g',
    image: '',
  },
  {
    id: 'proteinfabrikken-creatine',
    award: 'Norsk nettbutikk',
    name: 'Creatine Monohydrate',
    brand: 'Proteinfabrikken',
    merchant: 'Proteinfabrikken',
    priceNok: 199,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    form: 'monohydrate',
    formLabel: 'Kreatin monohydrat',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['500 g', 'Norsk butikk', 'Smakløs'],
    verdict: 'Proteinfabrikken Creatine er en enkel monohydrat — god for daglig bruk til lav pris.',
    strengths: ['Lav pris', 'Norsk leverandør', '500 g pakke'],
    watchouts: ['Merkevare på råstoff ikke oppgitt', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.proteinfabrikken.no/creatine-monohydrate-500g',
    image: '',
  },
  {
    id: 'muscletech-cell-tech',
    award: 'Blandingsprodukt',
    name: 'Cell-Tech Creatine',
    brand: 'MuscleTech',
    merchant: 'Gymgrossisten',
    priceNok: 449,
    packageSize: '1,4 kg',
    packageSizeG: 1400,
    servingSize: '49 g',
    servingSizeG: 49,
    servings: 28,
    creatinePerServingG: 3,
    form: 'blend',
    formLabel: 'Kreatin + karbohydrat-blanding',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['Kreatin + karbohydrater', 'Smakssatt', '1,4 kg'],
    verdict: 'Cell-Tech er en gainer-lignende kreatinblanding — lavere ren kreatinandel og høyere pris per gram kreatin.',
    strengths: ['Smakssatt', 'Karbohydrater inkludert'],
    watchouts: ['Blanding, ikke ren mono', 'Dyr per gram kreatin', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.gymgrossisten.no/muscletech-cell-tech-creatine-1-4kg',
    image: '',
  },
  {
    id: 'bodylab-creatine-tabs',
    award: 'Praktisk format',
    name: 'Creatine Tabs',
    brand: 'Bodylab',
    merchant: 'Tights',
    priceNok: 149,
    packageSize: '120 tabletter',
    packageSizeG: 120,
    servingSize: '3 tabletter',
    servingSizeG: 3,
    servings: 40,
    creatinePerServingG: 3,
    form: 'capsules',
    formLabel: 'Kreatin-tabletter',
    isCreapure: false,
    isMicronized: false,
    creatineBrand: null,
    purityPercent: null,
    meshLabel: null,
    dopingTestLabel: null,
    keyFeatures: ['Tablettformat', '120 tabletter', 'Reisevennlig'],
    verdict: 'Praktiske tabletter, men kapsel/tablettform scorer lavere på renhet enn pulver. God som supplement på reise.',
    strengths: ['Enkelt å ta med', 'Ingen shaker'],
    watchouts: ['Merkevare på råstoff ikke oppgitt (tablett)', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.tights.no/butikk/creatine-tabs-120-tabletter/',
    image: '',
  },
  {
    id: 'nutritac-bare-creatine',
    award: 'Best Creapure totalt',
    name: 'Bare Kreatin Monohydrat (Creapure®)',
    brand: 'NutriTac',
    merchant: 'NutriTac',
    priceNok: 279,
    packageSize: '250 g',
    packageSizeG: 250,
    servingSize: '3 g',
    servingSizeG: 3,
    servings: 83,
    creatinePerServingG: 3,
    form: 'monohydrate-creapure',
    formLabel: 'Creapure monohydrat',
    isCreapure: true,
    isMicronized: false,
    creatineBrand: 'Creapure®',
    purityPercent: 99.9,
    meshLabel: null,
    dopingTestLabel: 'Cologne List®',
    keyFeatures: ['Creapure', '250 g', 'Cologne List®'],
    verdict:
      'NutriTac Bare Kreatin er Creapure med oppgitt renhet og Cologne List-dopingtest — sterkt valg for kvalitetsbevisste og utøvere.',
    strengths: ['Creapure-sertifisert', '99,9 % renhet oppgitt', 'Cologne List® (dopingtest)'],
    watchouts: ['Mindre pakke (250 g) enn mange konkurrenter', 'Mesh ikke oppgitt på produktsiden'],
    url: 'https://nutritac.no/products/bare-kreatin-monohydrat-creapure',
    image: '',
  },
]

function gradeProduct(raw: RawCreatine): TestedCreatineProduct {
  const graded = calculateCreatineGrade({
    form: raw.form,
    isCreapure: raw.isCreapure,
    creatineBrand: raw.creatineBrand,
    purityPercent: raw.purityPercent,
    meshLabel: raw.meshLabel,
    dopingTestLabel: raw.dopingTestLabel,
  })
  const totalCreatineG = raw.creatinePerServingG * raw.servings
  const pricePerGramCreatine = totalCreatineG > 0 ? raw.priceNok / totalCreatineG : 0
  return {
    ...raw,
    ...graded,
    image: creatineImageFor(raw.id) ?? '',
    pricePerGramCreatine: Math.round(pricePerGramCreatine * 100) / 100,
    rank: 0,
  }
}

export const testedCreatineProducts: TestedCreatineProduct[] = rawProducts
  .map(gradeProduct)
  .sort((a, b) => b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine)
  .map((product, index) => ({
    ...product,
    rank: index + 1,
    award: index === 0 ? product.award : index < 3 ? product.award : '',
  }))

export const creatineCategoryLinks = [
  { label: 'Beste kreatin', path: '/tester/kreatin/' },
  { label: 'Creapure', path: '/tester/kreatin/creapure/' },
  { label: 'Billigst per g', path: '/tester/kreatin/billigste/' },
  { label: 'Slik velger du', path: '/tester/kreatin/slik-velger-du/' },
  { label: 'Metode', path: '/tester/kreatin/metode/' },
]
