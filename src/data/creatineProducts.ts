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
  pricePerGramCreatine: number
  totalCreatineInPackG: number
  name: string
  brand: string
  merchant: string
  priceNok: number
  packageSize: string
  packageSizeG: number
  servingSize: string
  servingSizeG: number
  servings: number
  creatinePerServingG: number
  creatineForm: CreatineForm
  format: CreatineFormat
  unitsInPackage?: number
  creatineMgPerUnit?: number
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
  | 'rank'
  | 'score'
  | 'overallGrade'
  | 'gradeBreakdown'
  | 'pricePerGramCreatine'
  | 'totalCreatineInPackG'
>

const IMG = '/images/creatine/generic-creatine.jpg'

const rawProducts: RawCreatine[] = [
  {
    id: 'star-creatine-500',
    award: 'Best verdi pulver',
    name: 'Kreatin Monohydrat 500 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 215,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 5,
    creatineForm: 'monohydrate',
    format: 'powder',
    keyFeatures: ['100 % mikronisert monohydrat', '5 g kreatin/dose', 'Vegansk', 'Smakløs'],
    verdict: 'Star Nutrition Kreatin Monohydrat er et rent, mikronisert monohydrat uten tilsetningsstoffer. 5 g per dose treffer ISSN-anbefalingen — og prisen per gram er blant de laveste i Norge.',
    strengths: ['Full 5 g dose', 'Rent monohydrat', 'Lav pris per gram', '100 porsjoner'],
    watchouts: ['Kan klump litt i kaldt vann', 'Kun pulver — ikke for deg som vil ha gummies'],
    url: 'https://www.gymgrossisten.no/kreatin-monohydrat-500-g/609.MASTER.html',
    image: IMG,
  },
  {
    id: 'star-creatine-300',
    award: 'Liten pakke',
    name: 'Kreatin Monohydrat 300 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 179,
    packageSize: '300 g',
    packageSizeG: 300,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 60,
    creatinePerServingG: 5,
    creatineForm: 'monohydrate',
    format: 'powder',
    keyFeatures: ['Samme formel som 500 g', '5 g kreatin/dose', 'Vegansk'],
    verdict: 'Mindre pakke av Star Nutritions rene monohydrat. Samme kvalitet som 500 g-varianten, men høyere pris per gram — best for deg som vil teste kreatin først.',
    strengths: ['Full 5 g dose', 'Rent monohydrat', 'Lavere inngangspris'],
    watchouts: ['Dyrere per gram enn 500 g', 'Færre porsjoner'],
    url: 'https://www.gymgrossisten.no/kreatin-monohydrat-300-g/609.MASTER.300.html',
    image: IMG,
  },
  {
    id: 'smartsupps-creatine-1kg',
    award: 'Storpack',
    name: 'Creatine Monohydrate 1 kg',
    brand: 'SmartSupps',
    merchant: 'Gymgrossisten',
    priceNok: 383,
    packageSize: '1000 g',
    packageSizeG: 1000,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 200,
    creatinePerServingG: 5,
    creatineForm: 'monohydrate',
    format: 'powder',
    keyFeatures: ['1 kg storpack', '5 g kreatin/dose', 'Mikronisert'],
    verdict: 'SmartSupps 1 kg er et solid storpack-alternativ med full 5 g dose. Prisen per gram er konkurransedyktig for deg som bruker kreatin fast.',
    strengths: ['200 porsjoner', 'Full dose', 'God pris per kg'],
    watchouts: ['Stor pakke — krever tørr oppbevaring', 'Ikke verifisert mot butikk ennå'],
    url: 'https://www.gymgrossisten.no/smartsupps-creatine-monohydrate-1000-g',
    image: IMG,
  },
  {
    id: 'on-creatine-600',
    award: 'Premium merke',
    name: 'Micronized Creatine Powder 600 g',
    brand: 'Optimum Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 449,
    packageSize: '600 g',
    packageSizeG: 600,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 120,
    creatinePerServingG: 5,
    creatineForm: 'monohydrate',
    format: 'powder',
    keyFeatures: ['Creapure-kvalitet', '5 g kreatin/dose', 'Mikronisert'],
    verdict: 'ON Micronized Creatine er et pålitelig premiumvalg med Creapure-kvalitet. Dyrere per gram enn Star Nutrition, men med etablert merke og dokumentert renhet.',
    strengths: ['Creapure-kvalitet', 'Full 5 g dose', 'Pålitelig merke'],
    watchouts: ['Høyere pris per gram', 'Ikke verifisert mot butikk ennå'],
    url: 'https://www.gymgrossisten.no/optimum-nutrition-micronized-creatine-powder-600-g',
    image: IMG,
  },
  {
    id: 'mutant-creakong',
    award: 'Blend',
    name: 'CreaKong',
    brand: 'Mutant',
    merchant: 'Gymgrossisten',
    priceNok: 399,
    packageSize: '500 g',
    packageSizeG: 500,
    servingSize: '5 g',
    servingSizeG: 5,
    servings: 100,
    creatinePerServingG: 4,
    creatineForm: 'blend',
    format: 'powder',
    keyFeatures: ['3 kreatinformer', 'Smakløs', 'Blend av monohydrat/HCl/malat'],
    verdict: 'Mutant CreaKong kombinerer flere kreatinformer. Lavere score på form fordi monohydrat alene er best dokumentert — og effektiv kreatindose kan variere.',
    strengths: ['Flere former', 'God løselighet', 'Kjent merke'],
    watchouts: ['Blend — ikke rent monohydrat', 'Lavere dokumentert dose enn 5 g ren monohydrat', 'Ikke verifisert ennå'],
    url: 'https://www.gymgrossisten.no/mutant-creakong-500-g',
    image: IMG,
  },
  {
    id: 'star-creatine-gummies-75',
    award: 'Best gummies',
    name: 'Creatine Gummies 75 stk',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 299,
    packageSize: '75 stk',
    packageSizeG: 300,
    servingSize: '3 gummies',
    servingSizeG: 12,
    servings: 25,
    creatinePerServingG: 3,
    creatineForm: 'monohydrate',
    format: 'gummies',
    unitsInPackage: 75,
    creatineMgPerUnit: 1000,
    keyFeatures: ['1 g kreatin per gummy', '3 gummies = 3 g kreatin', 'Smaksgod'],
    verdict: 'Star Nutrition Creatine Gummies gir 1 g kreatin per gummy — 3 gummies gir 3 g, under ISSN-optimum på 5 g. Praktisk, men dyrere per gram og krever 5 gummies for full dose.',
    strengths: ['Enkel å ta', 'God smak', '1 g per gummy'],
    watchouts: ['3 g per anbefalt porsjon — under 5 g optimum', '5 gummies nødvendig for full dose', 'Sukker/tilsetninger'],
    url: 'https://www.gymgrossisten.no/star-nutrition-creatine-gummies-75-stk',
    image: IMG,
  },
  {
    id: 'elit-creatine-gummies-60',
    award: 'Premium gummies',
    name: 'Creatine Gummies 60 stk',
    brand: 'Elit',
    merchant: 'Gymgrossisten',
    priceNok: 359,
    packageSize: '60 stk',
    packageSizeG: 240,
    servingSize: '2 gummies',
    servingSizeG: 10,
    servings: 30,
    creatinePerServingG: 2,
    creatineForm: 'monohydrate',
    format: 'gummies',
    unitsInPackage: 60,
    creatineMgPerUnit: 1000,
    keyFeatures: ['1 g kreatin per gummy', '2 gummies = 2 g kreatin'],
    verdict: 'Elit Creatine Gummies har 1 g kreatin per gummy, men anbefalt porsjon er bare 2 g — langt under effektiv dose. Dyrt per gram kreatin.',
    strengths: ['God smak', 'Enkel dosering'],
    watchouts: ['Kun 2 g per porsjon', 'Dyr per gram kreatin', 'Trenger 5 gummies for full dose'],
    url: 'https://www.gymgrossisten.no/elit-creatine-gummies-60-stk',
    image: IMG,
  },
  {
    id: 'applied-creatine-gummies-80',
    award: 'Mest gummies',
    name: 'Creatine Gummies 80 stk',
    brand: 'Applied Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 349,
    packageSize: '80 stk',
    packageSizeG: 320,
    servingSize: '4 gummies',
    servingSizeG: 16,
    servings: 20,
    creatinePerServingG: 3,
    creatineForm: 'monohydrate',
    format: 'gummies',
    unitsInPackage: 80,
    creatineMgPerUnit: 750,
    keyFeatures: ['750 mg per gummy', '4 gummies = 3 g kreatin'],
    verdict: 'Applied Creatine Gummies gir 750 mg per gummy — 4 gummies gir 3 g kreatin. Mer gummies i pakken, men fortsatt under 5 g optimum og høy pris per effektiv dose.',
    strengths: ['80 gummies i pakken', 'Varierte smaker'],
    watchouts: ['750 mg per gummy — lav', '3 g per porsjon', 'Dyr per gram effektiv kreatin'],
    url: 'https://www.gymgrossisten.no/applied-nutrition-creatine-gummies-80-stk',
    image: IMG,
  },
]

function gradeProduct(raw: RawCreatine): TestedCreatineProduct {
  const graded = calculateCreatineGrade({
    creatinePerServingG: raw.creatinePerServingG,
    creatineForm: raw.creatineForm,
    format: raw.format,
    priceNok: raw.priceNok,
    packageSizeG: raw.packageSizeG,
    unitsInPackage: raw.unitsInPackage,
    creatineMgPerUnit: raw.creatineMgPerUnit,
  })
  return { ...raw, ...graded, rank: 0 }
}

export const testedCreatineProducts: TestedCreatineProduct[] = rawProducts
  .map(gradeProduct)
  .sort((a, b) => b.score - a.score || a.pricePerGramCreatine - b.pricePerGramCreatine)
  .map((product, index) => {
    const qItem = creatineVerificationQueue.queue.find((item) => item.id === product.id)
    return {
      ...product,
      rank: index + 1,
      award: index === 0 ? product.award : index < 3 ? product.award : '',
      verificationStatus: getCreatineVerificationStatus(product.id),
      verifiedAt: qItem?.verifiedAt,
    }
  })

export const creatinePowderProducts = testedCreatineProducts.filter((p) => p.format === 'powder')
export const creatineGummyProducts = testedCreatineProducts.filter((p) => p.format === 'gummies')

export { creatineSourceLinks } from './creatineScoring'
