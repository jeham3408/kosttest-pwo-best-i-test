#!/usr/bin/env node
/**
 * Lister alle sider på kosttest.no, gruppert etter type.
 * Brukes av design/oversikt-automasjonen for systematisk gjennomgang.
 *
 * Kjør: node scripts/list-routes.mjs [--json]
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const GROUP_RULES = [
  { key: 'forside', label: 'Forside', match: (r) => r === '/' },
  { key: 'leaderboard', label: 'Leaderboard / tester', match: (r) => r.startsWith('/tester') },
  { key: 'produkt', label: 'Produktsider', match: (r) => r.startsWith('/pwo/') },
  { key: 'blogg', label: 'Blogg', match: (r) => r.startsWith('/blogg') },
  { key: 'info', label: 'Info / metode / kilder', match: (r) => r === '/om-metoden' || r === '/kilder' },
]

async function loadRoutes() {
  const sitemapPath = resolve(root, 'public/sitemap.xml')
  const xml = await readFile(sitemapPath, 'utf8')
  const routes = [...xml.matchAll(/<loc>https:\/\/kosttest\.no([^<]*)<\/loc>/g)].map((m) => {
    const path = m[1].replace(/\/$/, '') || '/'
    return path
  })
  return [...new Set(routes)].sort()
}

function groupRoutes(routes) {
  const groups = Object.fromEntries(GROUP_RULES.map((g) => [g.key, { label: g.label, routes: [] }]))
  const other = []

  for (const route of routes) {
    const group = GROUP_RULES.find((g) => g.match(route))
    if (group) groups[group.key].routes.push(route)
    else other.push(route)
  }

  if (other.length) groups.other = { label: 'Annet', routes: other }
  return groups
}

const routes = await loadRoutes()
const groups = groupRoutes(routes)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: routes.length, groups }, null, 2))
} else {
  console.log(`Totalt ${routes.length} sider:\n`)
  for (const { label, routes: groupRoutes } of Object.values(groups)) {
    console.log(`## ${label} (${groupRoutes.length})`)
    for (const r of groupRoutes) console.log(`  ${r}`)
    console.log()
  }
}
