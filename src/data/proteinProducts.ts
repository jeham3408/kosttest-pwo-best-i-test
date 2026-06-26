import {
  letterFromScore,
  scoreDose,
  type GradeBreakdown,
  type GradeLetter,
  type IngredientRule,
} from '../utils/gradingCore'

export type ProteinProduct = {
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
  proteinG: number
  proteinPercent: number
  proteinType: string
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
    key: 'proteinPerServing',
    label: 'Protein per porsjon',
    weight: 45,
    cDoseMg: 20000,
    aDoseMg: 30000,
    note: 'C = 20 g, A = 30 g protein per shake. Målt i mg for konsistens med karaktermotoren.',
  },
  {
    key: 'proteinPercent',
    label: 'Proteinandel',
    weight: 35,
    cDoseMg: 70000,
    aDoseMg: 85000,
    note: 'Protein % av pulvervekt. C = 70 %, A = 85 %.',
  },
  {
    key: 'pricePerKgProtein',
    label: 'Pris per kg protein',
    weight: 20,
    cDoseMg: 350,
    aDoseMg: 250,
    note: 'Lavere kr per kg rent protein gir høyere score.',
  },
]

function pricePerKgProtein(product: ProteinProduct) {
  const totalProteinKg = (product.proteinG / 1000) * product.servings
  if (totalProteinKg <= 0) return Infinity
  return product.priceNok / totalProteinKg
}

function priceScoreNokPerKg(price: number) {
  if (!isFinite(price)) return 0
  if (price <= 250) return 100
  if (price <= 300) return 85
  if (price <= 350) return 70
  if (price <= 400) return 50
  if (price <= 450) return 30
  return 15
}

export function calculateProteinGrade(product: ProteinProduct) {
  const gradeBreakdown = ingredientRules.map((rule) => {
    let dose: number | null = null
    if (rule.key === 'proteinPerServing') dose = product.proteinG * 1000
    if (rule.key === 'proteinPercent') dose = product.proteinPercent * 1000
    if (rule.key === 'pricePerKgProtein') dose = priceScoreNokPerKg(pricePerKgProtein(product))

    const raw = scoreDose(dose, rule)
    const points = raw * rule.weight
    return {
      key: rule.key,
      label: rule.label,
      doseLabel:
        rule.key === 'pricePerKgProtein'
          ? `${Math.round(pricePerKgProtein(product)).toLocaleString('nb-NO')} kr/kg protein`
          : rule.key === 'proteinPercent'
            ? `${product.proteinPercent} %`
            : `${product.proteinG} g`,
      grade: raw >= 0.85 ? 'A' : raw >= 0.7 ? 'B' : raw >= 0.5 ? 'C' : raw >= 0.3 ? 'D' : raw >= 0.1 ? 'E' : 'F',
      points,
      maxPoints: rule.weight,
      note: rule.note,
    } satisfies GradeBreakdown
  })

  const score = Math.max(0, Math.min(100, Math.round(gradeBreakdown.reduce((s, i) => s + i.points, 0))))
  return { score, overallGrade: letterFromScore(score), gradeBreakdown }
}

const rawProducts: Omit<ProteinProduct, 'rank' | 'score' | 'overallGrade' | 'gradeBreakdown' | 'pricePerServing'>[] = [
  {
    id: 'star-nutrition-whey80-4kg',
    award: 'Best verdi',
    name: 'Whey-80 Myseprotein 4 kg',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 1129,
    packageSize: '4000 g',
    servingSize: '37 g',
    servings: 108,
    proteinG: 27,
    proteinPercent: 73,
    proteinType: 'Myseproteinkonsentrat (80 %)',
    keyIngredients: ['myseproteinkonsentrat', '27 g protein per porsjon'],
    verdict:
      'Nord-Europas mest solgte protein til lav kg-pris. 27 g protein per shake og god løselighet. Best valg for langsiktig bruk.',
    strengths: [
      'Lavest pris per kg protein i testen',
      '27 g protein per porsjon',
      'Over 20 smaker',
      '108 porsjoner per pose',
    ],
    watchouts: ['Inneholder søtningsmiddel (ikke Natural-varianten)', 'Stor pose krever plass'],
    url: 'https://www.gymgrossisten.no/whey-80-myseprotein-4-kg/5854R.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Whey80_4kg.jpg?sw=400',
  },
  {
    id: 'star-nutrition-whey80-1kg',
    award: 'Best i test',
    name: 'Whey-80 Myseprotein 1 kg',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 429,
    packageSize: '1000 g',
    servingSize: '37 g',
    servings: 27,
    proteinG: 27,
    proteinPercent: 73,
    proteinType: 'Myseproteinkonsentrat (80 %)',
    keyIngredients: ['myseproteinkonsentrat', '27 g protein per porsjon'],
    verdict:
      'Markedsledende whey-konsentrat med 27 g protein per porsjon og 73 % proteinandel. God balanse mellom pris, smak og kvalitet.',
    strengths: [
      '27 g protein per shake',
      '73 % protein i pulveret',
      '2075+ kundeanmeldelser',
      'Utmerket løselighet',
    ],
    watchouts: ['Dyrere per kg enn 4 kg-versjonen', 'Søtningsmiddel i de fleste smaker'],
    url: 'https://www.gymgrossisten.no/whey-80-vassleprotein-1-kg/585R.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Whey80_1kg.jpg?sw=400',
  },
  {
    id: 'smartsupps-whey-1kg',
    award: 'Best budsjett',
    name: 'Myseprotein 1 kg',
    brand: 'SmartSupps',
    merchant: 'Gymgrossisten',
    priceNok: 389,
    packageSize: '1000 g',
    servingSize: '30 g',
    servings: 33,
    proteinG: 24,
    proteinPercent: 80,
    proteinType: 'Myseproteinkonsentrat',
    keyIngredients: ['myseproteinkonsentrat', '24 g protein per porsjon'],
    verdict:
      'Rimelig whey fra SmartSupps med høy proteinandel. Litt lavere protein per shake enn Whey-80, men god pris.',
    strengths: ['Høy proteinandel (80 %)', 'Lavere pris enn Star Nutrition 1 kg', 'Enkel sammensetning'],
    watchouts: ['24 g protein per porsjon – under Whey-80', 'Færre smaksvarianter'],
    url: 'https://www.gymgrossisten.no/smartsupps-whey-protein-1-kg/901906.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/SmartSupps/Whey_1kg.jpg?sw=400',
  },
  {
    id: 'optimum-nutrition-gold-standard-908g',
    award: 'Premium whey',
    name: 'Gold Standard 100% Whey 908 g',
    brand: 'Optimum Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 549,
    packageSize: '908 g',
    servingSize: '30,4 g',
    servings: 29,
    proteinG: 24,
    proteinPercent: 79,
    proteinType: 'Whey isolat + konsentrat',
    keyIngredients: ['whey isolat', 'whey konsentrat', '24 g protein per porsjon'],
    verdict:
      'Internasjonal bestselger med whey isolat og konsentrat. God kvalitet, men dyrere per gram protein enn norske alternativer.',
    strengths: ['Whey isolat + konsentrat', 'Kjent internasjonalt merke', 'Bred tilgjengelighet'],
    watchouts: ['Høy pris per kg protein', '24 g protein per porsjon'],
    url: 'https://www.gymgrossisten.no/optimum-nutrition-gold-standard-100-whey-908-g/10531.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Optimum_Nutrition/Gold_Standard_Whey.jpg?sw=400',
  },
  {
    id: 'star-nutrition-whey100-1kg',
    award: 'Høyest proteinandel',
    name: 'Whey-100 Myseprotein 1 kg',
    brand: 'Star Nutrition',
    merchant: 'Gymgrossisten',
    priceNok: 499,
    packageSize: '1000 g',
    servingSize: '30 g',
    servings: 33,
    proteinG: 26,
    proteinPercent: 87,
    proteinType: 'Myseprotein isolat (100 %)',
    keyIngredients: ['myseprotein isolat', '26 g protein per porsjon'],
    verdict:
      'Isolat med 87 % protein i pulveret. Høyere renhet enn Whey-80, men dyrere og marginalt lavere protein per shake.',
    strengths: ['87 % protein i pulveret', 'Isolat – lavere fett og karbohydrater', '26 g protein per porsjon'],
    watchouts: ['Dyrere enn Whey-80', '26 g vs 27 g protein per shake'],
    url: 'https://www.gymgrossisten.no/whey-100-myseprotein-1-kg/585100R.html',
    image:
      'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8e8e8e8e/Star_Nutrition/Whey100_1kg.jpg?sw=400',
  },
]

export const proteinProducts: ProteinProduct[] = rawProducts
  .map((product) => {
    const graded = calculateProteinGrade({ ...product, rank: 0, score: 0, pricePerServing: product.priceNok / product.servings })
    return {
      ...product,
      ...graded,
      pricePerServing: Math.round((product.priceNok / product.servings) * 100) / 100,
      rank: 0,
    }
  })
  .sort((a, b) => b.score - a.score || a.priceNok - b.priceNok)
  .map((product, index) => ({ ...product, rank: index + 1 }))
