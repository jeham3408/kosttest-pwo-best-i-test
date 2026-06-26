#!/usr/bin/env node
/**
 * List alle sider som skal audites.
 *
 *   node scripts/list-routes.mjs          → tekstliste
 *   node scripts/list-routes.mjs --json   → JSON
 */

import { loadAllRoutes } from './lib/load-routes.mjs'

const json = process.argv.includes('--json')
const routes = loadAllRoutes()

if (json) {
  console.log(JSON.stringify({ total: routes.length, routes }, null, 2))
} else {
  console.log(`${routes.length} sider:\n`)
  for (const r of routes) {
    console.log(`${r.route.padEnd(42)} ${r.type.padEnd(16)} ${r.label}`)
  }
}
