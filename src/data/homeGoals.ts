/** Validerte snarveier fra forsida — alle path/query er støtta av filter eller routing. */

export type HomeGoal = {
  label: string
  path: string
  hint: string
}

export type HomeGoalGroup = {
  id: 'pwo' | 'protein' | 'creatine'
  title: string
  rankingPath: string
  goals: HomeGoal[]
}

const WHEY_SOURCES =
  'whey-isolate,whey-concentrate,whey-blend,hydrolyzed-whey,clear-whey'

export const homeGoalGroups: HomeGoalGroup[] = [
  {
    id: 'pwo',
    title: 'Pre-workout (PWO)',
    rankingPath: '/tester/pwo/',
    goals: [
      {
        label: 'Mest pump',
        path: '/tester/pwo/sterkeste/',
        hint: 'Høyest formelscore — pump-ingredienser veier tungt i scoren',
      },
      {
        label: 'Uten koffein',
        path: '/tester/pwo/stim-free/',
        hint: '0 mg koffein per deklarasjon',
      },
      {
        label: 'Best verdi',
        path: '/tester/pwo/verdi/',
        hint: 'God formelscore og rimelig pris per dose',
      },
      {
        label: 'Lav koffein',
        path: '/tester/pwo/nybegynner/',
        hint: 'Koffeinfri eller maks 200 mg',
      },
      {
        label: 'Nybegynner',
        path: '/tester/pwo/nybegynner/',
        hint: 'Moderat stimulans og dokumentert deklarasjon',
      },
    ],
  },
  {
    id: 'protein',
    title: 'Proteinpulver',
    rankingPath: '/tester/protein/',
    goals: [
      {
        label: 'Whey',
        path: `/tester/protein/?source=${WHEY_SOURCES}`,
        hint: 'Isolate, concentrate og whey-blends',
      },
      {
        label: 'Laktosefri',
        path: '/tester/protein/?lactoseFree=1',
        hint: 'Dokumentert laktosefri eller laktosefattig',
      },
      {
        label: 'Vegansk',
        path: '/tester/protein/vegan/',
        hint: 'Plantebaserte proteiner',
      },
      {
        label: 'Best verdi',
        path: '/tester/protein/?preset=value',
        hint: 'Høy DIAAS-score og god pris per gram protein',
      },
    ],
  },
  {
    id: 'creatine',
    title: 'Kreatin',
    rankingPath: '/tester/kreatin/',
    goals: [
      {
        label: 'Best dokumentasjon',
        path: '/tester/kreatin/',
        hint: 'Sortert etter score der dokumentasjon gir poeng',
      },
      {
        label: 'Creapure',
        path: '/tester/kreatin/creapure/',
        hint: 'Produkter med Creapure eller merket råstoff',
      },
      {
        label: 'Best verdi',
        path: '/tester/kreatin/?preset=value',
        hint: 'God score og lav pris per gram kreatin',
      },
      {
        label: 'Dopingtest dokumentert',
        path: '/tester/kreatin/?doping=1',
        hint: 'Kun produkter med oppgitt dopingtest',
      },
    ],
  },
]
