import {
  formatDose,
  letterFromScore,
  scoreDose,
  type GradeBreakdown,
  type GradeLetter,
  type IngredientRule,
} from '../utils/gradingCore'

export type CreatineProduct = {
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
  creatineForm: string
  purityScore: number
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
    label: 'Kreatin per porsjon',
    weight: 55,
    cDoseMg: 3000,
    aDoseMg: 5000,
    note: 'ISSN anbefaler 3–5 g kreatin daglig. C = 3 g, A = 5 g per porsjon.',
  },
  {
    key: 'purity',
    label: 'Form og renhet',
    weight: 25,
    cDoseMg: 70,
    aDoseMg: 100,
    note: 'Rent monohydrat/Creapure scorer høyest. Blandede former uten ekstra evidens trekker ned.',
  },
  {
    key: 'pricePerGram',
    label: 'Pris per gram kreatin',
    weight: 20,
    cDoseMg: 50,
    aDoseMg: 35,
    note: 'Lavere kr/g kreatin gir høyere score. Basert på deklarert innhold, ikke kampanjepris.',
  },
]

function pricePerGramCreatine(product: CreatineProduct) {
  const totalCreatineG =
    (product.creatineMg / 1000) * product.servings
  if (totalCreatineG <= 0) return Infinity
  return product.priceNok / totalCreatineG
}

function priceScoreNokPerGram(price: number) {
  if (!isFinite(price)) return 0
  if (price <= 0.35) return 100
  if (price <= 0.45) return 85
  if (price <= 0.55) return 70
  if (price <= 0.7) return 50
  if (price <= 0.9) return 30
  return 15
}

export function calculateCreatineGrade(product: CreatineProduct) {
  const gradeBreakdown = ingredientRules.map((rule) => {
    let dose: number | null = null
    if (rule.key === 'creatineDose') dose = product.creatineMg
    if (rule.key === 'purity') dose = product.purityScore
    if (rule.key === 'pricePerGram') dose = priceScoreNokPerGram(pricePerGramCreatine(product))

    const raw = scoreDose(dose, rule)
    const points = raw * rule.weight
    return {
      key: rule.key,
      label: rule.label,
      doseLabel:
        rule.key === 'pricePerGram'
          ? `${pricePerGramCreatine(product).toFixed(2).replace('.', ',')} kr/g`
          : rule.key === 'purity'
            ? `${product.purityScore} %`
            : formatDose(product.creatineMg),
      grade: raw >= 0.85 ? 'A' : raw >= 0.7 ? 'B' : raw >= 0.5 ? 'C' : raw >= 0.3 ? 'D' : raw >= 0.1 ? 'E' : 'F',
      points,
      maxPoints: rule.weight,
      note: rule.note,
    } satisfies GradeBreakdown
  })

  const score = Math.max(0, Math.min(100, Math.round(gradeBreakdown.reduce((s, i) => s + i.points, 0))))
  return { score, overallGrade: letterFromScore(score), gradeBreakdown }
}

const rawProducts: Omit<CreatineProduct, 'rank' | 'score' | 'overallGrade' | 'gradeBreakdown' | 'pricePerServing'>[] = [
  {
    id: 'star-nutrition-kreatin-500g',
    award: 'Best i test',
    name: 'Kreatin Monohydrat 500 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 215,
    packageSize: '500 g',
    servingSize: '5 g',
    servings: 100,
    creatineMg: 5000,
    creatineForm: '100 % mikronisert kreatinmonohydrat',
    purityScore: 100,
    keyIngredients: ['kreatinmonohydrat 5000 mg per porsjon'],
    verdict:
      'Rent kreatinmonohydrat uten tilsetningsstoffer. 5 g per porsjon treffer øvre effektiv dose og er enkelt å dosere daglig.',
    strengths: [
      '100 % rent kreatinmonohydrat',
      '5 g per porsjon – over ISSN-minimum',
      '100 porsjoner per pose',
      'Mikronisert for bedre oppløselighet',
    ],
    watchouts: ['Kampanjepris kan variere – sjekk butikk før kjøp'],
    url: 'https://www.gymgrossisten.no/creatine-monohydrate-500-g/609.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Creatine_Monohydrate_500g.jpg?sw=400',
  },
  {
    id: 'smartsupps-kreatin-1kg',
    award: 'Best verdi',
    name: 'Kreatin Monohydrat 1 kg',
    brand: 'SmartSupps',
    merchant: 'Gymgrossisten',
    priceNok: 383,
    packageSize: '1000 g',
    servingSize: '5 g',
    servings: 200,
    creatineMg: 5000,
    creatineForm: '100 % kreatinmonohydrat',
    purityScore: 100,
    keyIngredients: ['kreatinmonohydrat 5000 mg per porsjon'],
    verdict:
      'Stor pose med rent monohydrat til lav pris per gram. Samme effektive dose som Star Nutrition, men bedre verdi for langsiktig bruk.',
    strengths: [
      '200 porsjoner – varer lenge',
      'Lavest pris per gram kreatin i testen',
      'Vegansk og uten tilsetningsstoffer',
    ],
    watchouts: ['Kun tilgjengelig hos Gymgrossisten', 'Stor pose krever god oppbevaring'],
    url: 'https://www.gymgrossisten.no/smartsupps-creatine-monohydrate-1-kg/901905.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/SmartSupps/Creatine_1kg.jpg?sw=400',
  },
  {
    id: 'star-nutrition-kreatin-300g',
    award: 'Best for nybegynnere',
    name: 'Kreatin Monohydrat 300 g',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 179,
    packageSize: '300 g',
    servingSize: '5 g',
    servings: 60,
    creatineMg: 5000,
    creatineForm: '100 % mikronisert kreatinmonohydrat',
    purityScore: 100,
    keyIngredients: ['kreatinmonohydrat 5000 mg per porsjon'],
    verdict:
      'Samme rene formel som 500 g-versjonen, men mindre pose til lavere inngangspris. Godt valg for å teste kreatin.',
    strengths: ['Identisk formel som testvinneren', 'Lavere startpris', '5 g effektiv dose'],
    watchouts: ['Dyrere per gram enn 500 g og 1 kg'],
    url: 'https://www.gymgrossisten.no/creatine-monohydrate-300-g/609-3.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Creatine_Monohydrate_300g.jpg?sw=400',
  },
  {
    id: 'optimum-nutrition-creatine-600g',
    award: 'Internasjonalt merke',
    name: 'Creatine Powder 600 g',
    brand: 'Optimum Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 449,
    packageSize: '600 g',
    servingSize: '5,25 g',
    servings: 114,
    creatineMg: 5000,
    creatineForm: 'Mikronisert kreatinmonohydrat',
    purityScore: 95,
    keyIngredients: ['kreatinmonohydrat 5000 mg per porsjon'],
    verdict:
      'Solid internasjonal klassiker med rent monohydrat. Litt dyrere per gram enn norske alternativer, men kjent merke og god kvalitet.',
    strengths: ['Mikronisert monohydrat', 'Etablert merke', 'Nøytral smak'],
    watchouts: ['Høyere pris per gram enn Star Nutrition og SmartSupps'],
    url: 'https://www.gymgrossisten.no/optimum-nutrition-creatine-powder-600-g/10530.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Optimum_Nutrition/Creatine_600g.jpg?sw=400',
  },
  {
    id: 'mutant-creakong-300g',
    award: 'Flere kreatinformer',
    name: 'CreaKong 300 g',
    brand: 'Mutant',
    merchant: 'Gymgrossisten',
    priceNok: 297,
    packageSize: '300 g',
    servingSize: '6 g',
    servings: 50,
    creatineMg: 4000,
    creatineForm: 'Blanding av monohydrat, HCl og tri-kreatin malat',
    purityScore: 55,
    keyIngredients: [
      'kreatinmonohydrat',
      'kreatin-HCl',
      'tri-kreatin malat',
    ],
    verdict:
      'Kombinerer tre kreatinformer uten at noen enkeltform har bedre evidens enn monohydrat alene. Lavere renhetsscore og dyrere per gram.',
    strengths: ['Variasjon i kreatinformer', 'God smak (ananas)'],
    watchouts: [
      'Ingen form har sterkere evidens enn rent monohydrat',
      'Dyr per gram kreatin',
      'Lavere renhetsscore i vår modell',
    ],
    url: 'https://www.gymgrossisten.no/mutant-creakong-300-g/10528.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Mutant/CreaKong_300g.jpg?sw=400',
  },
]

export const creatineProducts: CreatineProduct[] = rawProducts
  .map((product) => {
    const graded = calculateCreatineGrade({ ...product, rank: 0, score: 0, pricePerServing: product.priceNok / product.servings })
    return {
      ...product,
      ...graded,
      pricePerServing: Math.round((product.priceNok / product.servings) * 100) / 100,
      rank: 0,
    }
  })
  .sort((a, b) => b.score - a.score || a.priceNok - b.priceNok)
  .map((product, index) => ({ ...product, rank: index + 1 }))
