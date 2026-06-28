import { buildPwoBadgeContext, getPwoBadges } from '../src/data/pwo/index'
import { testedProducts } from '../src/data/pwoProducts'

const ctx = buildPwoBadgeContext(testedProducts)

const checks = [
  {
    name: 'Best formel totalt finst',
    pass: ctx.winners['best-formel-total'].length >= 1,
  },
  {
    name: 'Best verdi er ikkje berre lågste pris utan formel',
    pass: (() => {
      const cheapest = [...testedProducts].sort((a, b) => a.pricePerServing - b.pricePerServing)[0]
      if (!ctx.winners['best-verdi'].includes(cheapest.id)) return true
      return cheapest.score >= 34
    })(),
  },
  {
    name: 'Koffeinfri vinnar har 0 mg koffein',
    pass: ctx.winners['best-koffeinfri-formel'].every((id) => {
      const p = testedProducts.find((x) => x.id === id)!
      return !p.caffeineMg || p.caffeineMg === 0
    }),
  },
  {
    name: 'Kvar tildelt badge har eligibilityReason',
    pass: testedProducts
      .flatMap((p) => getPwoBadges(p, ctx))
      .every((b) => b.eligibilityReason.length > 5 && b.sourceMetric.length > 0),
  },
]

let failed = 0
for (const c of checks) {
  console.log(c.pass ? '✓' : '✗', c.name)
  if (!c.pass) failed++
}

console.log('\nBadge-vinnarar:')
for (const key of Object.keys(ctx.winners) as (keyof typeof ctx.winners)[]) {
  const ids = ctx.winners[key]
  const names = ids.map((id) => testedProducts.find((p) => p.id === id)?.name ?? id)
  console.log(`  ${key}:`, names.join(', ') || '(ingen)')
}

if (failed > 0) {
  console.error(`\n${failed} test(s) feila`)
  process.exit(1)
}
console.log('\nAlle badge-testar OK')
