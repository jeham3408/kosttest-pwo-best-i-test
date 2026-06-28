#!/usr/bin/env node
/**
 * Performance sanity checks on build output.
 * Run: npm run perf:check (after build)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distAssets = join(process.cwd(), 'dist/assets')
let ok = 0
let fail = 0

const assert = (cond, msg) => {
  if (cond) ok++
  else {
    fail++
    console.error('FAIL:', msg)
  }
}

const files = readdirSync(distAssets).filter((f) => f.endsWith('.js') || f.endsWith('.css'))
assert(files.length > 0, 'dist/assets has bundles')

let totalJs = 0
const chunks = []
for (const f of files) {
  const size = statSync(join(distAssets, f)).size
  if (f.endsWith('.js')) {
    totalJs += size
    chunks.push({ name: f, kb: Math.round(size / 1024) })
  }
}

chunks.sort((a, b) => b.kb - a.kb)
console.log('JS chunks (top):')
for (const c of chunks.slice(0, 8)) console.log(`  ${c.kb} KB  ${c.name}`)

assert(totalJs < 900_000, `total JS < 900 KB (actual ${Math.round(totalJs / 1024)} KB)`)
assert(chunks.length >= 2, 'code splitting produces multiple JS chunks')

const indexHtml = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8')
assert(!indexHtml.includes('home-hero-banner.png'), 'index: no unused hero banner preload')
assert(indexHtml.includes('viewport-fit=cover'), 'index: safe area viewport')

console.log(`\nperf-check: ${ok} passed, ${fail} failed`)
if (fail) process.exit(1)
