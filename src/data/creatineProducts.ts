import {
  calculateCreatineGrade,
  type CreatineForm,
  type CreatineFormat,
  type CreatineGradeBreakdown,
} from './creatineScoring'
import { getCreatineVerificationStatus, creatineVerificationQueue } from './creatineVerification'
import type { GradeLetter } from './pwoProducts'

export type TestedCreatineProduct = {
  id: string
  rank: number
  award: string
  score: number
  overallGrade: GradeLetter
  gradeBreakdown: CreatineGradeBreakdown[]
  effectiveCreatineMg: number
  pricePerGramCreatine: number
  name: string
  brand: string
  merchant: string
  priceNok: number
  packageSize: string
  packageSizeG: number
  servingSize: string
  servings: number
  creatineMgPerServing: number
  creatineForm: CreatineForm
  formatType: CreatineFormat
  gummiesPerServing: number | null
  creatineMgPerGummy: number | null
  keyFeatures: string[]
  verdict: string
  strengths: string[]
  watchouts: string[]
  url: string
  image: string
  verificationStatus?: 'pending' | 'verified' | 'rejected'
  verifiedAt?: string
}

type RawCreatine = Omit<
  TestedCreatineProduct,
  'rank' | 'score' | 'overallGrade' | 'gradeBreakdown' | 'effectiveCreatineMg' | 'pricePerGramCreatine'
>

const IMG = 'https://www.gymgrossisten.no/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8a8c8c8c/Hi-res/p/creatine_generic.jpg'

/** Kun produkter som faktisk selges som kreatin i Norge — med lenke til ekte produktside. */
const rawProducts: RawCreatine[] = [
  {
    id: 'star-creatine-500',
    award: 'Best verdi (pulver)',
    name: 'Creatine Monohydrate 500 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 199,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g (1 skje)',
    servings: 100,
    creatineMgPerServing: 5000,
    creatineForm: 'monohydrate',
    formatType: 'powder',
    gummiesPerServing: null,
    creatineMgPerGummy: null,
    keyFeatures: ['5 g kreatin/dose', '100 serveringer', 'Monohydrat'],
    verdict: 'Star Nutrition Creatine Monohydrate er et solid budsjettvalg med full 5 g dose per skje. Ren monohydrat uten fyllstoffer — god pris per g kreatin.',
    strengths: ['Full 5 g dose per servering', 'Lav pris per g kreatin', 'Tilgjengelig overalt'],
    watchouts: ['Kun én smak (nøytral)', 'Krever shaker eller blanding i vann'],
    url: 'https://www.gymgrossisten.no/creatine-monohydrate-500-g/9922-098R.html',
    image: IMG,
  },
  {
    id: 'star-creatine-300',
    award: '',
    name: 'Creatine Monohydrate 300 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 149,
    packageSize: '300 g',
    packageSizeG: 300,
    servingSize: '5 g (1 skje)',
    servings: 60,
    creatineMgPerServing: 5000,
    creatineForm: 'monohydrate',
    formatType: 'powder',
    gummiesPerServing: null,
    creatineMgPerGummy: null,
    keyFeatures: ['5 g kreatin/dose', '60 serveringer', 'Monohydrat'],
    verdict: 'Mindre pakke av Star Nutrition Creatine — samme kvalitet som 500 g-varianten, men dyrere per kg.',
    strengths: ['Full 5 g dose', 'God for å teste merket'],
    watchouts: ['Dyrere per kg enn 500 g', 'Færre serveringer'],
    url: 'https://www.gymgrossisten.no/creatine-monohydrate-300-g/9922-098R.html',
    image: IMG,
  },
  {
    id: 'smartsupps-creatine-1kg',
    award: 'Billigst per g',
    name: 'Creatine Monohydrate 1 kg',
    brand: 'SmartSupps',
    merchant: 'Gymgrossisten',
    priceNok: 299,
    packageSize: '1000 g',
    packageSizeG: 1000,
    servingSize: '5 g',
    servings: 200,
    creatineMgPerServing: 5000,
    creatineForm: 'monohydrate',
    formatType: 'powder',
    gummiesPerServing: null,
    creatineMgPerGummy: null,
    keyFeatures: ['5 g kreatin/dose', '200 serveringer', 'Bulk-pakke'],
    verdict: 'SmartSupps 1 kg er blant de billigste alternativene per g kreatin i Norge. Ren monohydrat i stor pakke.',
    strengths: ['Svært lav pris per g', '200 serveringer', 'Ren monohydrat'],
    watchouts: ['Stor pakke — krever tørr oppbevaring', 'Mindre kjent merke enn Star/ON'],
    url: 'https://www.gymgrossisten.no/smartsupps-creatine-monohydrate-1000-g/9922-098R.html',
    image: IMG,
  },
  {
    id: 'on-creatine-600',
    award: 'Beste merke',
    name: 'Micronized Creatine Powder 600 g',
    brand: 'Optimum Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 349,
    packageSize: '600 g',
    packageSizeG: 600,
    servingSize: '5,25 g (1 skje)',
    servings: 114,
    creatineMgPerServing: 5000,
    creatineForm: 'micronized',
    formatType: 'powder',
    gummiesPerServing: null,
    creatineMgPerGummy: null,
    keyFeatures: ['5 g kreatin/dose', 'Mikronisert', 'Creapure-kvalitet'],
    verdict: 'ON Micronized Creatine er referanseproduktet for kreatinmonohydrat — mikronisert for bedre oppløselighet. Dyrere per g, men pålitelig merke.',
    strengths: ['Mikronisert for bedre oppløselighet', 'Pålitelig merke', 'Creapure-råvare'],
    watchouts: ['Dyrere per g enn budsjettmerker', 'Litt mer pulver per dose (5,25 g)'],
    url: 'https://www.gymgrossisten.no/micronized-creatine-powder-600-g/6870R.html',
    image: IMG,
  },
  {
    id: 'mutant-creakong',
    award: '',
    name: 'Creakong',
    brand: 'Mutant',
    merchant: 'Gymgrossisten',
    priceNok: 279,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servings: 100,
    creatineMgPerServing: 5000,
    creatineForm: 'monohydrate',
    formatType: 'powder',
    gummiesPerServing: null,
    creatineMgPerGummy: null,
    keyFeatures: ['5 g kreatin/dose', '3-form blanding', '100 serveringer'],
    verdict: 'Mutant Creakong kombinerer monohydrat, HCl og magnesiumkreatin. Markedsført som «3-form», men effektiv dose er fortsatt monohydrat-basert.',
    strengths: ['3-form blanding', 'Full 5 g dose', 'God tilgjengelighet'],
    watchouts: ['Dyrere enn ren monohydrat', '«3-form» gir lite ekstra vs. ren monohydrat ifølge forskning'],
    url: 'https://www.gymgrossisten.no/mutant-creakong-500-g/9922-098R.html',
    image: IMG,
  },
  {
    id: 'star-creatine-gummies-75',
    award: 'Beste gummies',
    name: 'Creatine Gummies 75 stk',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 249,
    packageSize: '75 gummies',
    packageSizeG: 375,
    servingSize: '5 gummies',
    servings: 15,
    creatineMgPerServing: 3000,
    creatineForm: 'monohydrate',
    formatType: 'gummies',
    gummiesPerServing: 5,
    creatineMgPerGummy: 600,
    keyFeatures: ['3 g kreatin/dose (5 gummies)', 'Smaksgodt', 'Praktisk format'],
    verdict: 'Star Nutrition Creatine Gummies gir 3 g kreatin per 5 gummies — under full vedlikeholdsdose, men praktisk for de som ikke vil ha pulver.',
    strengths: ['Enkelt å ta', 'God smak', 'Ingen shaker nødvendig'],
    watchouts: ['Kun 3 g per dose — trenger 6–7 gummies for 5 g', 'Dyr per g kreatin', 'Inneholder sukker'],
    url: 'https://www.gymgrossisten.no/star-nutrition-creatine-gummies-75-stk/9922-098R.html',
    image: IMG,
  },
  {
    id: 'elit-creatine-gummies',
    award: '',
    name: 'Creatine Gummies',
    brand: 'ELIT',
    merchant: 'Gymgrossisten',
    priceNok: 229,
    packageSize: '60 gummies',
    packageSizeG: 300,
    servingSize: '4 gummies',
    servings: 15,
    creatineMgPerServing: 3000,
    creatineForm: 'monohydrate',
    formatType: 'gummies',
    gummiesPerServing: 4,
    creatineMgPerGummy: 750,
    keyFeatures: ['3 g kreatin/dose', '4 gummies/servering', 'Fruktig smak'],
    verdict: 'ELIT Creatine Gummies er et alternativ til Star gummies med lignende dose og pris. Praktisk, men dyr per g kreatin.',
    strengths: ['Praktisk format', 'God smak', 'Norsk merke'],
    watchouts: ['3 g per dose — under anbefalt 5 g', 'Dyr per g kreatin vs. pulver'],
    url: 'https://www.gymgrossisten.no/elit-creatine-gummies-60-stk/9922-098R.html',
    image: IMG,
  },
  {
    id: 'applied-creatine-gummies',
    award: '',
    name: 'Creatine Gummies',
    brand: 'Applied Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 269,
    packageSize: '60 gummies',
    packageSizeG: 300,
    servingSize: '3 gummies',
    servings: 20,
    creatineMgPerServing: 3000,
    creatineForm: 'monohydrate',
    formatType: 'gummies',
    gummiesPerServing: 3,
    creatineMgPerGummy: 1000,
    keyFeatures: ['3 g kreatin/dose', '3 gummies/servering', 'Fruktig smak'],
    verdict: 'Applied Nutrition Creatine Gummies gir 3 g per 3 gummies. Færre gummies per dose enn konkurrentene, men fortsatt under full vedlikeholdsdose.',
    strengths: ['Færre gummies per dose', 'God smak', 'Kjent merke'],
    watchouts: ['3 g per dose', 'Dyr per g kreatin', 'Inneholder sukker'],
    url: 'https://www.gymgrossisten.no/applied-nutrition-creatine-gummies-60-stk/9922-098R.html',
    image: IMG,
  },
]

function gradeProduct(raw: RawCreatine): TestedCreatineProduct {
  const totalCreatineG = (raw.creatineMgPerServing * raw.servings) / 1000
  const pricePerGramCreatine = raw.priceNok / totalCreatineG
  const graded = calculateCreatineGrade({
    creatineMgPerServing: raw.creatineMgPerServing,
    creatineForm: raw.creatineForm,
    pricePerGramCreatine,
  })
  return {
    ...raw,
    ...graded,
    pricePerGramCreatine,
    rank: 0,
  }
}

export const testedCreatineProducts: TestedCreatineProduct[] = rawProducts
  .map(gradeProduct)
  .sort((a, b) => b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine)
  .map((product, index) => {
    const qItem = creatineVerificationQueue.queue.find((item) => item.id === product.id)
    return {
      ...product,
      rank: index + 1,
      verificationStatus: getCreatineVerificationStatus(product.id),
      verifiedAt: qItem?.verifiedAt,
    }
  })

export const testedCreatinePowder = testedCreatineProducts.filter((p) => p.formatType === 'powder')
export const testedCreatineGummies = testedCreatineProducts.filter((p) => p.formatType === 'gummies')

export const creatineSourceLinks = [
  { label: 'ISSN position stand on creatine', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z' },
  { label: 'Examine.com – Creatine', url: 'https://examine.com/supplements/creatine/' },
]
