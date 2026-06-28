#!/usr/bin/env node
/**
 * Static accessibility checks on built HTML + source patterns.
 * Run: npm run a11y:check (after build)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
let ok = 0
let fail = 0

const assert = (cond, msg) => {
  if (cond) ok++
  else {
    fail++
    console.error('FAIL:', msg)
  }
}

function walkHtml(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkHtml(p, files)
    else if (name.endsWith('.html')) files.push(p)
  }
  return files
}

const pages = walkHtml(dist)
assert(pages.length > 0, 'dist/ contains HTML files')

for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  const rel = file.replace(dist, '')
  assert(/lang="nb"/.test(html), `${rel}: html lang=nb`)
  assert(!/<h1[^>]*>[\s\S]*<h1/.test(html), `${rel}: single H1 (no duplicate h1 tags)`)
  assert(/<main/.test(html) || file.endsWith('/index.html'), `${rel}: main landmark or index`)
}

// Source checks
const appCss = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
assert(appCss.includes('--z-header'), 'tokens: z-index scale')
assert(appCss.includes('--focus-ring-color'), 'tokens: focus ring')
assert(appCss.includes('prefers-reduced-motion'), 'tokens: reduced motion')

const uiCss = readFileSync(join(process.cwd(), 'src/styles/ui-components.css'), 'utf8')
assert(uiCss.includes(':focus-visible'), 'ui: focus-visible styles')
assert(uiCss.includes('ui-sheet-panel'), 'ui: bottom sheet')

console.log(`\na11y-check: ${ok} passed, ${fail} failed`)
if (fail) process.exit(1)
