#!/usr/bin/env node
/**
 * List all prerendered routes from dist/ or public/sitemap.xml.
 *
 *   node scripts/list-routes.mjs           → one route per line
 *   node scripts/list-routes.mjs --json    → JSON array
 *   node scripts/list-routes.mjs --count   → total count
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const SITEMAP = resolve(ROOT, 'public/sitemap.xml')
const SITE = 'https://kosttest.no'

async function findHtmlRoutes(dir, base = '') {
  const routes = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    const full = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'assets' || entry.name === 'server') continue
      routes.push(...(await findHtmlRoutes(full, rel)))
      continue
    }

    if (entry.name === 'index.html') {
      routes.push(base ? `/${base}` : '/')
    }
  }

  return routes
}

async function routesFromSitemap() {
  const xml = await readFile(SITEMAP, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(SITE, '').replace(/\/$/, '') || '/')
    .sort((a, b) => a.localeCompare(b, 'nb'))
}

async function routesFromDist() {
  try {
    await stat(join(DIST, 'index.html'))
    const routes = await findHtmlRoutes(DIST)
    return routes.sort((a, b) => a.localeCompare(b, 'nb'))
  } catch {
    return null
  }
}

export function categorizeRoute(route) {
  if (route === '/') return 'home'
  if (route === '/blogg') return 'blog'
  if (route.startsWith('/blogg/')) return 'blog-post'
  if (route.startsWith('/pwo/')) return 'pwo-product'
  if (route.startsWith('/protein/')) return 'protein-product'
  if (route.includes('slik-velger-du')) return 'guide'
  if (route.includes('/metode') || route === '/om-metoden') return 'metode'
  if (route.startsWith('/tester/protein')) return 'protein-lb'
  if (route.startsWith('/tester/pwo') || route === '/tester') return 'pwo-lb'
  return 'static'
}

export function priorityForRoute(route) {
  if (route === '/') return 1
  if (route === '/tester/pwo' || route === '/tester/pwo/beste') return 2
  if (route === '/tester/protein' || route === '/tester/protein/beste') return 3
  if (route.includes('slik-velger-du')) return 4
  if (route === '/om-metoden' || route === '/tester/protein/metode') return 5
  if (route === '/blogg') return 6
  if (route.startsWith('/tester/')) return 7
  if (route.startsWith('/pwo/')) return 8
  if (route.startsWith('/protein/')) return 9
  if (route.startsWith('/blogg/')) return 10
  return 11
}

export async function getAllRoutes() {
  const fromDist = await routesFromDist()
  if (fromDist?.length) return fromDist
  return routesFromSitemap()
}

const args = process.argv.slice(2)

if (import.meta.url === `file://${process.argv[1]}`) {
  const routes = await getAllRoutes()

  if (args.includes('--count')) {
    console.log(routes.length)
  } else if (args.includes('--json')) {
    console.log(JSON.stringify(routes, null, 2))
  } else {
    for (const route of routes) console.log(route)
  }
}
