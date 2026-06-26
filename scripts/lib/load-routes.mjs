#!/usr/bin/env node
/**
 * Laster alle prerender-ruter fra kildefiler (uten TypeScript-build).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, '../..')

const STATIC_ROUTES = [
  '/',
  '/tester/pwo',
  '/tester/pwo/beste',
  '/tester/pwo/sterkeste',
  '/tester/pwo/billigste',
  '/tester/pwo/stim-free',
  '/tester/pwo/nybegynner',
  '/tester/protein',
  '/tester/protein/beste',
  '/tester/protein/billigste',
  '/tester/protein/vegan',
  '/tester/protein/kasein',
  '/tester/protein/slik-velger-du',
  '/tester/protein/metode',
  '/blogg',
  '/om-metoden',
  '/kilder',
  '/tester/pwo/slik-velger-du',
]

function parseIdsFromTs(filePath, idPattern = /id:\s*'([^']+)'/g) {
  const src = fs.readFileSync(filePath, 'utf8')
  const ids = []
  let m
  while ((m = idPattern.exec(src)) !== null) {
    ids.push(m[1])
  }
  return ids
}

function parseBlogSlugs(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const slugs = []
  const re = /slug:\s*'([^']+)'/g
  let m
  while ((m = re.exec(src)) !== null) {
    slugs.push(m[1])
  }
  return slugs
}

function parseTestedProductIds(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const start = src.indexOf('export const testedProducts')
  if (start === -1) return []
  const slice = src.slice(start)
  const end = slice.indexOf('\nexport const listedProducts')
  const block = end === -1 ? slice : slice.slice(0, end)
  const ids = []
  const re = /^\s+id:\s*'([^']+)'/gm
  let m
  while ((m = re.exec(block)) !== null) {
    ids.push(m[1])
  }
  return ids
}

export function classifyRoute(route) {
  if (route === '/') return 'home'
  if (route === '/kilder') return 'sources'
  if (route === '/blogg') return 'blog-index'
  if (route.startsWith('/blogg/')) return 'blog-post'
  if (route.startsWith('/pwo/')) return 'pwo-product'
  if (route.startsWith('/protein/')) return 'protein-product'
  if (route.startsWith('/tester/protein')) return 'protein-hub'
  if (route.startsWith('/tester/pwo')) return 'pwo-hub'
  if (route === '/om-metoden') return 'method'
  return 'other'
}

export function routeLabel(route) {
  const type = classifyRoute(route)
  const id = route.split('/').filter(Boolean).pop() ?? 'forside'
  const labels = {
    home: 'Forside',
    sources: 'Kilder',
    'blog-index': 'Blogg',
    'blog-post': `Blogg: ${id}`,
    'pwo-product': `PWO: ${id}`,
    'protein-product': `Protein: ${id}`,
    'protein-hub': `Protein-hub: ${route}`,
    'pwo-hub': `PWO-hub: ${route}`,
    method: 'Metode',
    other: route,
  }
  return labels[type] ?? route
}

export function loadAllRoutes() {
  const pwoIds = parseTestedProductIds(path.join(ROOT, 'src/data/pwoProducts.ts'))
  const proteinIds = parseIdsFromTs(path.join(ROOT, 'src/data/proteinProducts.ts'))
  const blogSlugs = parseBlogSlugs(path.join(ROOT, 'src/data/blog.ts'))

  const routes = [...STATIC_ROUTES]
  for (const id of pwoIds) routes.push(`/pwo/${id}`)
  for (const id of proteinIds) routes.push(`/protein/${id}`)
  for (const slug of blogSlugs) routes.push(`/blogg/${slug}`)

  return routes.map((route) => ({
    route,
    type: classifyRoute(route),
    label: routeLabel(route),
    url: route === '/' ? 'https://kosttest.no/' : `https://kosttest.no${route}/`,
  }))
}
