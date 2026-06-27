import { calculateCreatineGrade, type CreatineForm, type CreatineGradeBreakdown } from './creatineScoring'
import { creatineImageFor } from './creatineImages'
import type { GradeLetter } from './pwoProducts'

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
  /** Merkevare på kreatin-råstoffet, f.eks. Creapure®. Null = generisk. */
  creatineBrand: string | null
  /** Oppgitt renhet i % — null hvis ikke dokumentert av produsent/butikk. */
  purityPercent: number | null
  /** Oppgitt mesh / partikkelstørrelse — null hvis ikke dokumentert. */
  meshLabel: string | null
  /** Dokumentert dopingtest — viktig særlig for generisk kreatin. */
  dopingTestLabel: string | null
  keyFeatures: string[]
  verdict: string
  strengths: string[]
  watchouts: string[]
  url: string
  image: string
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
    keyFeatures: ['Creapure', '5 g per dose', '100 doser', 'Uten smak'],
    verdict: 'ESN Ultrapure leverer Creapure med dokumentert renhet og mesh — topp kvalitet for daglig bruk.',
    strengths: ['Creapure-sertifisert', '99,9 % renhet (Creapure-standard)', '200 mesh oppgitt'],
    watchouts: ['Dyrere per kg enn generisk mono'],
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
    keyFeatures: ['Creapure', '3 g kreatin/dose', 'Mikronisert', '93 doser'],
    verdict: 'Pålitelig Creapure fra ON — mikronisert monohydrat med høy renhet. Anbefalt skje er 3 g; de fleste doserer opp til 3–5 g daglig selv.',
    strengths: ['Creapure', 'Mikronisert', 'Godt kjent merke'],
    watchouts: ['Anbefalt skje er 3 g — ta mer om du vil nå 5 g daglig'],
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
    keyFeatures: ['5 g per dose', '100 doser', 'Norsk favoritt'],
    verdict: 'Solid norsk standard — generisk monohydrat til lav pris, men uten merkevare-kreatin, renhetsdata eller dopingtest.',
    strengths: ['5 g per dose', 'Lav pris per kg', 'Enkel smakløs formel'],
    watchouts: ['Generisk mono — ikke Creapure', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.tights.no/butikk/creatine-monohydrate-500g/',
    image: '',
  },
  {
    id: 'myprotein-creatine',
    award: 'Billig full dose',
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
    keyFeatures: ['5 g per dose', '100 doser', 'Impact-serien'],
    verdict: 'Billig generisk monohydrat — god pris, men uten merkevare-kreatin eller dokumentert kvalitet/dopingtest.',
    strengths: ['5 g per dose', 'Lav pris', 'Stort utvalg smaker'],
    watchouts: ['Generisk mono', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['5 g per dose', '100 doser', 'Norsk merke'],
    verdict: 'Star Nutrition Creatine er en ukomplisert 5 g monohydrat — god standard i norsk marked.',
    strengths: ['Full dose', 'Tilgjengelig i Norge', 'Enkel formel'],
    watchouts: ['Generisk mono', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['5 g per dose', '100 doser', 'Pharma-grade'],
    verdict: 'Scitec 100% Creatine er ren monohydrat med 5 g per dose — solid mellomting mellom budget og Creapure.',
    strengths: ['5 g dose', 'Ren formel', 'God tilgjengelighet'],
    watchouts: ['Generisk mono', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['5 g per dose', 'Mikronisert', '60 doser'],
    verdict: 'Generisk mikronisert mono — oppløses lettere, men uten merkevare-kreatin eller dokumentert test.',
    strengths: ['Mikronisert', '5 g dose', 'Kjent merke'],
    watchouts: ['Generisk mono', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['5 g per dose', '100 doser', 'Norsk butikk'],
    verdict: 'Proteinfabrikken Creatine er en enkel 5 g monohydrat — god for daglig bruk til lav pris.',
    strengths: ['Full dose', 'Lav pris', 'Norsk leverandør'],
    watchouts: ['Generisk mono', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['3 g kreatin/dose', 'Karbohydrater', 'Smakssatt'],
    verdict: 'Cell-Tech er en gainer-lignende kreatinblanding — lavere ren kreatin per skje og høyere pris per gram kreatin.',
    strengths: ['Smakssatt', 'Karbohydrater inkludert'],
    watchouts: ['Kun 3 g kreatin', 'Blanding, ikke ren mono', 'Dyr per gram kreatin', 'Renhet, mesh og dopingtest ikke oppgitt'],
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
    keyFeatures: ['3 g kreatin/dose', '40 doser', 'Reisevennlig'],
    verdict: 'Praktiske tabletter, men kapsel/tablettform scorer lavere på renhet enn pulver. God som supplement på reise.',
    strengths: ['Enkelt å ta med', 'Ingen shaker'],
    watchouts: ['Generisk mono i tablettform', 'Renhet, mesh og dopingtest ikke oppgitt'],
    url: 'https://www.tights.no/butikk/creatine-tabs-120-tabletter/',
    image: '',
  },
  {
    id: 'nutritac-bare-creatine',
    award: 'Premium Creapure fra NutriTac',
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
    keyFeatures: ['Creapure', '250 g', '83 doser', 'Cologne List®'],
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
    creatinePerServingG: raw.creatinePerServingG,
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
