#!/usr/bin/env node
/**
 * Mobil viewport smoke — sjekker at prerendered HTML ikke tvinger bredde > viewport.
 * Kjør: npm run mobile:check (etter build)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const widths = [320, 375, 390, 414, 768, 1024]
const keyPages = [
  'index.html',
  'tester/pwo/index.html',
  'tester/protein/index.html',
  'tester/kreatin/index.html',
  'pwo/peveo-maxed/index.html',
  'protein/bodylab-whey-100/index.html',
  'kreatin/nutritac-bare-creatine/index.html',
  '404/index.html',
  'om-kosttest/index.html',
]

let ok = 0
let fail = 0
const assert = (cond, msg) => {
  if (cond) ok++
  else {
    fail++
    console.error('FAIL:', msg)
  }
}

for (const page of keyPages) {
  const path = join(dist, page)
  const html = readFileSync(path, 'utf8')
  const rel = `/${page.replace(/index\.html$/, '')}`

  assert(/viewport.*width=device-width/i.test(html), `${rel}: viewport meta`)
  assert(!/100vw/.test(html), `${rel}: ingen hardkodet 100vw i HTML`)
  assert((html.match(/<h1[\s>]/gi) ?? []).length === 1, `${rel}: én H1`)

  for (const w of widths) {
    const tableMin = html.match(/min-width:\s*(\d+)px/g) ?? []
    for (const m of tableMin) {
      const n = Number(m.match(/\d+/)?.[0])
      if (n > w && n > 700) {
        assert(
          /ranking-cards-mobile|overflow-x:\s*auto/.test(html) || /ranking-table-wrap/.test(html),
          `${rel}: tabell min-width ${n}px har mobil-fallback (viewport ${w}px)`,
        )
      }
    }
  }
}

const appCss = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8')
assert(appCss.includes('overflow-x: clip'), 'App.css: clip horizontal overflow på root')
assert(appCss.includes('ranking-cards-mobile'), 'App.css: mobil produktkort')
assert(appCss.includes('@media (max-width:'), 'App.css: responsive breakpoints')

const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
assert(tokens.includes('--space-touch: 44px'), 'tokens: touch target 44px')

console.log(`\nmobile-check: ${ok} passed, ${fail} failed`)
if (fail) process.exit(1)
