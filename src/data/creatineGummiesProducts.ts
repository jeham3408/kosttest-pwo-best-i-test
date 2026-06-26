import {
  letterFromScore,
  scoreDose,
  type GradeBreakdown,
  type GradeLetter,
  type IngredientRule,
} from '../utils/gradingCore'

export type CreatineGummyProduct = {
  id: string
  rank: number
  award: string
  score: number
  overallGrade?: GradeLetter
  gradeBreakdown?: GradeBreakdown[]
  name: string
  brand: string
  merchant: string
  priceNok: number
  packageSize: string
  servingSize: string
  servings: number
  pricePerServing: number
  creatineMg: number
  gummiesPerDose: number
  sugarG: number | null
  creatineForm: string
  keyIngredients: string[]
  verdict: string
  strengths: string[]
  watchouts: string[]
  url: string
  image: string
}

export const lastUpdated = '26. juni 2026'

export const ingredientRules: IngredientRule[] = [
  {
    key: 'creatineDose',
    label: 'Kreatin per dagsdose',
    weight: 50,
    cDoseMg: 3000,
    aDoseMg: 5000,
    note: 'Minimum 3 g kreatin daglig for prestasjonseffekt (EU-krav). A = 5 g.',
  },
  {
    key: 'gummiesPerDose',
    label: 'Gummies for effektiv dose',
    weight: 20,
    cDoseMg: 3000,
    aDoseMg: 4000,
    note: 'Færre gummies for full dose = enklere rutine. Invertert: 3 gummies = A, 5+ = D.',
  },
  {
    key: 'pricePerGram',
    label: 'Pris per gram kreatin',
    weight: 20,
    cDoseMg: 50,
    aDoseMg: 35,
    note: 'Gummies er dyrere enn pulver – vi sammenligner innen kategorien.',
  },
  {
    key: 'sugar',
    label: 'Sukker per dagsdose',
    weight: 10,
    cDoseMg: 3000,
    aDoseMg: 1000,
    note: 'Lavere sukker per dagsdose gir høyere score. Invertert skala.',
  },
]

function pricePerGramCreatine(product: CreatineGummyProduct) {
  const totalCreatineG = (product.creatineMg / 1000) * product.servings
  if (totalCreatineG <= 0) return Infinity
  return product.priceNok / totalCreatineG
}

function priceScoreNokPerGram(price: number) {
  if (!isFinite(price)) return 0
  if (price <= 2.5) return 100
  if (price <= 3.5) return 85
  if (price <= 4.0) return 70
  if (price <= 4.5) return 50
  return 25
}

function gummyConvenienceScore(gummies: number) {
  if (gummies <= 3) return 4000
  if (gummies === 4) return 3500
  if (gummies === 5) return 2500
  return 1500
}

function sugarScore(sugarG: number | null) {
  if (sugarG === null) return 2000
  if (sugarG <= 2) return 3000
  if (sugarG <= 4) return 2500
  if (sugarG <= 6) return 2000
  return 1000
}

export function calculateCreatineGummyGrade(product: CreatineGummyProduct) {
  const gradeBreakdown = ingredientRules.map((rule) => {
    let dose: number | null = null
    let doseLabel = ''

    if (rule.key === 'creatineDose') {
      dose = product.creatineMg
      doseLabel = `${(product.creatineMg / 1000).toLocaleString('nb-NO')} g`
    }
    if (rule.key === 'gummiesPerDose') {
      dose = gummyConvenienceScore(product.gummiesPerDose)
      doseLabel = `${product.gummiesPerDose} gummies`
    }
    if (rule.key === 'pricePerGram') {
      dose = priceScoreNokPerGram(pricePerGramCreatine(product))
      doseLabel = `${pricePerGramCreatine(product).toFixed(2).replace('.', ',')} kr/g`
    }
    if (rule.key === 'sugar') {
      dose = sugarScore(product.sugarG)
      doseLabel = product.sugarG !== null ? `${product.sugarG} g sukker` : 'Ukjent'
    }

    const raw = scoreDose(dose, rule)
    const points = raw * rule.weight
    return {
      key: rule.key,
      label: rule.label,
      doseLabel,
      grade: raw >= 0.85 ? 'A' : raw >= 0.7 ? 'B' : raw >= 0.5 ? 'C' : raw >= 0.3 ? 'D' : raw >= 0.1 ? 'E' : 'F',
      points,
      maxPoints: rule.weight,
      note: rule.note,
    } satisfies GradeBreakdown
  })

  const score = Math.max(0, Math.min(100, Math.round(gradeBreakdown.reduce((s, i) => s + i.points, 0))))
  return { score, overallGrade: letterFromScore(score), gradeBreakdown }
}

const rawProducts: Omit<CreatineGummyProduct, 'rank' | 'score' | 'overallGrade' | 'gradeBreakdown' | 'pricePerServing'>[] = [
  {
    id: 'elit-nutrition-gummies-60',
    award: 'Høyest dose',
    name: 'Creatine Gummies 60 stk Lemon',
    brand: 'Elit Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 359,
    packageSize: '60 gummies',
    servingSize: '3 gummies',
    servings: 20,
    creatineMg: 4500,
    gummiesPerDose: 3,
    sugarG: 2,
    creatineForm: 'Kreatinmonohydrat',
    keyIngredients: ['kreatinmonohydrat 4500 mg per dagsdose (3 gummies)'],
    verdict:
      'Høyest kreatindose i gummy-testen med 4,5 g per dagsdose. Stevia-søtet og færre gummies enn Applied Nutrition.',
    strengths: [
      '4,5 g kreatin per dagsdose – over minimum',
      'Kun 3 gummies per dag',
      'Stevia i stedet for mye sukker',
    ],
    watchouts: ['Dyr per gram kreatin sammenlignet med pulver', 'Kun 20 dagers forbruk'],
    url: 'https://www.gymgrossisten.no/creatine-gummies-60-gummies/820227-101.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Elit_Nutrition/Creatine_Gummies_60.jpg?sw=400',
  },
  {
    id: 'star-nutrition-gummies-75',
    award: 'Best i test',
    name: 'Creatine Gummies 75 stk Apple',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 299,
    packageSize: '75 gummies',
    servingSize: '3 gummies',
    servings: 25,
    creatineMg: 3000,
    gummiesPerDose: 3,
    sugarG: 5,
    creatineForm: 'Kreatinmonohydrat',
    keyIngredients: ['kreatinmonohydrat 3000 mg per dagsdose (3 gummies)'],
    verdict:
      'Tre gummies gir nøyaktig 3 g kreatin – minimum for prestasjonseffekt. Best pris i gummy-kategorien og stabil kreatinhold testet for holdbarhet.',
    strengths: [
      '3 g kreatin per dagsdose – treffer ISSN-minimum',
      'Lavest pris blant gummies i testen',
      '25 dagers forbruk',
      'Stabilitetstestet kreatinhold',
    ],
    watchouts: ['Inneholder sukker', 'Dyrere per gram enn pulver'],
    url: 'https://www.gymgrossisten.no/creatine-gummies-75-st/60941R.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Creatine_Gummies_75.jpg?sw=400',
  },
  {
    id: 'applied-nutrition-gummies-80',
    award: 'Million-smak',
    name: 'Creatine Gummies 80 stk Blackcurrant',
    brand: 'Applied Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 349,
    packageSize: '80 gummies',
    servingSize: '4 gummies',
    servings: 20,
    creatineMg: 3000,
    gummiesPerDose: 4,
    sugarG: 6,
    creatineForm: 'Kreatinmonohydrat',
    keyIngredients: ['kreatinmonohydrat 3000 mg per dagsdose (4 gummies)'],
    verdict:
      '3 g kreatin per dag, men krever 4 gummies. Million-smak er populær, men dyrere per gram og mer sukker enn Elit Nutrition.',
    strengths: ['3 g kreatin per dagsdose', 'Million-smak (solbær)', '80 gummies i esken'],
    watchouts: [
      '4 gummies per dag – flere enn Star Nutrition og Elit',
      'Høyere sukkerinnhold',
      'Dyr per gram kreatin',
    ],
    url: 'https://www.gymgrossisten.no/creatine-gummies-80-gummies-millions-blackcurrant/820227-1051.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Applied_Nutrition/Creatine_Gummies_80.jpg?sw=400',
  },
]

export const creatineGummyProducts: CreatineGummyProduct[] = rawProducts
  .map((product) => {
    const graded = calculateCreatineGummyGrade({
      ...product,
      rank: 0,
      score: 0,
      pricePerServing: product.priceNok / product.servings,
    })
    return {
      ...product,
      ...graded,
      pricePerServing: Math.round((product.priceNok / product.servings) * 100) / 100,
      rank: 0,
    }
  })
  .sort((a, b) => b.score - a.score || a.priceNok - b.priceNok)
  .map((product, index) => ({ ...product, rank: index + 1 }))
