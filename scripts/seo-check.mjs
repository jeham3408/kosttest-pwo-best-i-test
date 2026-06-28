#!/usr/bin/env node
/**
 * SEO smoke checks on prerendered HTML.
 * Run: npm run seo:check (after build)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
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
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkHtml(p, files)
    else if (name.endsWith('.html')) files.push(p)
  }
  return files
}

const pages = walkHtml(dist)
assert(pages.length > 20, `dist/ has prerendered pages (${pages.length})`)

const titles = new Map()
const keyRoutes = [
  '/index.html',
  '/tester/pwo/index.html',
  '/tester/protein/index.html',
  '/tester/kreatin/index.html',
  '/om-kosttest/index.html',
  '/om-metoden/index.html',
  '/404/index.html',
]

for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  const rel = file.replace(dist, '') || '/index.html'

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
  const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)
  const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)

  assert(titleMatch, `${rel}: has <title>`)
  assert(descMatch && descMatch[1].length >= 50, `${rel}: meta description (>=50 tegn)`)
  assert(canonicalMatch && canonicalMatch[1].startsWith('https://kosttest.no'), `${rel}: canonical URL`)
  assert(ogTitleMatch, `${rel}: og:title`)

  if (titleMatch) {
    const t = titleMatch[1]
    if (!titles.has(t)) titles.set(t, [])
    titles.get(t).push(rel)
  }

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length
  assert(h1Count === 1, `${rel}: exactly one H1 (${h1Count})`)

  if (rel.includes('/tester/') && rel.includes('/sammenlign/')) {
    assert(/noindex/i.test(html), `${rel}: compare page noindex`)
  }
}

for (const [title, paths] of titles) {
  if (paths.length > 1 && !title.includes('| Kosttest.no')) {
    assert(false, `Duplicate title "${title}" on ${paths.join(', ')}`)
  }
}

for (const route of keyRoutes) {
  assert(existsSync(join(dist, route.replace(/^\//, ''))), `Key route built: ${route}`)
}

assert(existsSync(join(process.cwd(), 'public/robots.txt')), 'public/robots.txt exists')
const robots = readFileSync(join(process.cwd(), 'public/robots.txt'), 'utf8')
assert(/Sitemap:\s*https:\/\/kosttest\.no\/sitemap\.xml/.test(robots), 'robots.txt references sitemap')

const sitemapPath = join(dist, 'sitemap.xml')
assert(existsSync(sitemapPath), 'dist/sitemap.xml exists after build')
const sitemap = readFileSync(sitemapPath, 'utf8')
assert(sitemap.includes('<urlset'), 'sitemap.xml is valid urlset')
assert(sitemap.includes('/tester/pwo/'), 'sitemap includes PWO')
assert(sitemap.includes('/pwo/'), 'sitemap includes product URLs')

console.log(`\nseo-check: ${ok} passed, ${fail} failed`)
if (fail) process.exit(1)
