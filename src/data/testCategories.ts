import { creatineProducts, ingredientRules as creatineRules, lastUpdated as creatineUpdated } from './creatineProducts'
import {
  creatineGummyProducts,
  ingredientRules as gummyRules,
  lastUpdated as gummyUpdated,
} from './creatineGummiesProducts'
import { proteinProducts, ingredientRules as proteinRules, lastUpdated as proteinUpdated } from './proteinProducts'
import type { GradeBreakdown, IngredientRule } from '../utils/gradingCore'

export type SupplementCategoryId = 'kreatin' | 'proteinpulver' | 'kreatin-gummies'

export type SupplementProductBase = {
  id: string
  rank: number
  award: string
  score: number
  name: string
  brand: string
  merchant: string
  priceNok: number
  packageSize: string
  servingSize: string
  servings: number
  pricePerServing: number
  keyIngredients: string[]
  verdict: string
  strengths: string[]
  watchouts: string[]
  url: string
  image: string
  overallGrade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  gradeBreakdown?: GradeBreakdown[]
}

export type SupplementCategory = {
  id: SupplementCategoryId
  slug: string
  label: string
  title: string
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroLead: string
  methodSummary: string
  productPathPrefix: string
  leaderboardPath: string
  lastUpdated: string
  ingredientRules: IngredientRule[]
  products: SupplementProductBase[]
}

export const supplementCategories: Record<SupplementCategoryId, SupplementCategory> = {
  kreatin: {
    id: 'kreatin',
    slug: 'kreatin',
    label: 'Kreatin',
    title: 'Kreatin best i test',
    metaTitle: 'Kreatin best i test 2026 – Ærlig rangering | Kosttest.no',
    metaDescription:
      'Vi rangerer kreatinmonohydrat etter dose, renhet og pris per gram. Faktasjekket mot norske butikker.',
    heroTitle: 'Kreatin best i test 2026',
    heroLead:
      'Rent kreatinmonohydrat rangert etter deklarert dose per porsjon, form/renhet og pris per gram kreatin – samme åpne metode som PWO-testen.',
    methodSummary:
      'Karaktermotoren vekter kreatindose (3–5 g), form/renhet (monohydrat vs. blandinger) og pris per gram. Basert på ISSN-retningslinjer.',
    productPathPrefix: '/kreatin/',
    leaderboardPath: '/tester/kreatin/',
    lastUpdated: creatineUpdated,
    ingredientRules: creatineRules,
    products: creatineProducts,
  },
  proteinpulver: {
    id: 'proteinpulver',
    slug: 'proteinpulver',
    label: 'Proteinpulver',
    title: 'Proteinpulver best i test',
    metaTitle: 'Proteinpulver best i test 2026 – Whey rangering | Kosttest.no',
    metaDescription:
      'Vi rangerer whey og proteinpulver etter protein per porsjon, proteinandel og pris per kg protein.',
    heroTitle: 'Proteinpulver best i test 2026',
    heroLead:
      'Myseprotein og proteinpulver rangert etter deklarert protein per shake, proteinandel i pulveret og pris per kg protein.',
    methodSummary:
      'Karaktermotoren vekter protein per porsjon (20–30 g), protein % av pulvervekt og pris per kg protein.',
    productPathPrefix: '/proteinpulver/',
    leaderboardPath: '/tester/proteinpulver/',
    lastUpdated: proteinUpdated,
    ingredientRules: proteinRules,
    products: proteinProducts,
  },
  'kreatin-gummies': {
    id: 'kreatin-gummies',
    slug: 'kreatin-gummies',
    label: 'Kreatin gummies',
    title: 'Kreatin gummies best i test',
    metaTitle: 'Kreatin gummies best i test 2026 | Kosttest.no',
    metaDescription:
      'Vi rangerer kreatin gummies etter dose per dag, antall gummies for effektiv dose, sukker og pris per gram kreatin.',
    heroTitle: 'Kreatin gummies best i test 2026',
    heroLead:
      'Kreatin i gummy-form rangert etter daglig dose, praktisk dosering (antall gummies), sukkerinnhold og pris per gram kreatin.',
    methodSummary:
      'Minimum 3 g kreatin daglig for prestasjonseffekt. Vi vekter dose, antall gummies, sukker og pris innen gummy-kategorien.',
    productPathPrefix: '/kreatin-gummies/',
    leaderboardPath: '/tester/kreatin-gummies/',
    lastUpdated: gummyUpdated,
    ingredientRules: gummyRules,
    products: creatineGummyProducts,
  },
}

export const allSupplementCategories = Object.values(supplementCategories)

export function getSupplementCategory(id: string | null | undefined): SupplementCategory | null {
  if (!id) return null
  return supplementCategories[id as SupplementCategoryId] ?? null
}

export function findSupplementProduct(categoryId: SupplementCategoryId, productId: string) {
  return supplementCategories[categoryId].products.find((p) => p.id === productId) ?? null
}

export function getSupplementCategoryFromPath(path: string): SupplementCategoryId | null {
  for (const category of allSupplementCategories) {
    if (path.startsWith(category.leaderboardPath.replace(/\/$/, '')) || path.startsWith(category.productPathPrefix)) {
      return category.id
    }
  }
  return null
}

export const totalSupplementProducts = allSupplementCategories.reduce((sum, c) => sum + c.products.length, 0)
