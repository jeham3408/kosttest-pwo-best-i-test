#!/usr/bin/env node
/**
 * Statisk design/oversikt-audit av alle prerenderede sider.
 * Sjekker meta, struktur, tilgjengelighet og interne lenker.
 *
 * Kjør etter build: npm run build && node scripts/page-audit.mjs
 * Flag: --json for maskinlesbar rapport, --verbose for alle sider
 */

import { readFile, access } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

const SEVERITY = { error: 3, warn: 2, info: 1 }

async function loadRoutes() {
  const xml = await readFile(resolve(root, 'public/sitemap.xml'), 'utf8')
  return [...xml.matchAll(/<loc>https:\/\/kosttest\.no([^<]*)<\/loc>/g)].map((m) => {
    const path = m[1].replace(/\/$/, '') || '/'
    return path
  })
}

function htmlPathForRoute(route) {
  return route === '/' ? resolve(dist, 'index.html') : resolve(dist, route.slice(1), 'index.html')
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
}

function extractMeta(html, attr, name) {
  const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`, 'i')
  return html.match(re)?.[1] ?? null
}

function extractTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  return html.match(re)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null
}

function countMatches(html, re) {
  return [...html.matchAll(re)].length
}

function extractInternalLinks(html) {
  const links = []
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const path = m[1].replace(/\/$/, '') || '/'
    links.push(path)
  }
  return links
}

function auditPage(route, html, allRoutes) {
  const issues = []
  const text = stripTags(html).replace(/\s+/g, ' ').trim()
  const title = extractTag(html, 'title')
  const description = extractMeta(html, 'name', 'description')
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i)?.[1]
  const h1Count = countMatches(html, /<h1[\s>]/gi)
  const hasNav = /<nav[\s>]/i.test(html)
  const hasMain = /<main[\s>]/i.test(html)
  const imgWithoutAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/gi)].length
  const imgEmptyAlt = [...html.matchAll(/<img[^>]*\balt=""\s*/gi)].length
  const buttonsWithoutLabel = [...html.matchAll(/<button(?![^>]*aria-label)[^>]*>(\s*)<\/button>/gi)].length

  if (!title) issues.push({ severity: 'error', code: 'missing-title', message: 'Mangler <title>' })
  else if (title.length < 20) issues.push({ severity: 'warn', code: 'short-title', message: `Kort tittel (${title.length} tegn): ${title}` })
  else if (title.length > 70) issues.push({ severity: 'info', code: 'long-title', message: `Lang tittel (${title.length} tegn)` })

  if (!description) issues.push({ severity: 'error', code: 'missing-description', message: 'Mangler meta description' })
  else if (description.length < 50) issues.push({ severity: 'warn', code: 'short-description', message: `Kort beskrivelse (${description.length} tegn)` })
  else if (description.length > 160) issues.push({ severity: 'info', code: 'long-description', message: `Lang beskrivelse (${description.length} tegn)` })

  if (!canonical) issues.push({ severity: 'error', code: 'missing-canonical', message: 'Mangler canonical URL' })

  if (h1Count === 0) issues.push({ severity: 'error', code: 'missing-h1', message: 'Mangler h1' })
  else if (h1Count > 1) issues.push({ severity: 'warn', code: 'multiple-h1', message: `${h1Count} h1-elementer` })

  if (!hasNav) issues.push({ severity: 'error', code: 'missing-nav', message: 'Mangler <nav>' })
  if (!hasMain) issues.push({ severity: 'error', code: 'missing-main', message: 'Mangler <main>' })

  if (imgWithoutAlt > 0) issues.push({ severity: 'error', code: 'img-no-alt', message: `${imgWithoutAlt} bilder uten alt-attributt` })
  if (imgEmptyAlt > 0) issues.push({ severity: 'warn', code: 'img-empty-alt', message: `${imgEmptyAlt} bilder med tom alt` })

  if (text.length < 200 && !route.startsWith('/pwo/')) {
    issues.push({ severity: 'warn', code: 'thin-content', message: `Lite innhold (${text.length} tegn)` })
  }

  if (buttonsWithoutLabel > 0) {
    issues.push({ severity: 'info', code: 'button-no-label', message: `${buttonsWithoutLabel} knapper uten synlig tekst` })
  }

  const internalLinks = extractInternalLinks(html)
  const isPageRoute = (link) =>
    allRoutes.has(link) ||
    link === '/kilder' ||
    link.startsWith('/assets/') ||
    link.endsWith('.svg') ||
    link.endsWith('.css') ||
    link.endsWith('.js') ||
    link.endsWith('.png') ||
    link.endsWith('.webp')

  for (const link of internalLinks) {
    if (!isPageRoute(link)) {
      issues.push({ severity: 'warn', code: 'broken-internal-link', message: `Intern lenke til ukjent rute: ${link}` })
    }
  }

  return { route, title, description, issueCount: issues.length, issues }
}

async function main() {
  try {
    await access(resolve(dist, 'index.html'))
  } catch {
    console.error('Kjør npm run build først — dist/index.html finnes ikke.')
    process.exit(1)
  }

  const routes = await loadRoutes()
  const routeSet = new Set(routes)
  const results = []
  const titleMap = new Map()

  for (const route of routes) {
    const html = await readFile(htmlPathForRoute(route), 'utf8')
    const result = auditPage(route, html, routeSet)
    results.push(result)

    if (result.title) {
      const existing = titleMap.get(result.title) ?? []
      existing.push(route)
      titleMap.set(result.title, existing)
    }
  }

  for (const [title, dupRoutes] of titleMap) {
    if (dupRoutes.length > 1) {
      for (const route of dupRoutes) {
        const r = results.find((x) => x.route === route)
        r.issues.push({
          severity: 'warn',
          code: 'duplicate-title',
          message: `Duplikat tittel på ${dupRoutes.length} sider: ${dupRoutes.join(', ')}`,
        })
        r.issueCount = r.issues.length
      }
    }
  }

  const withIssues = results.filter((r) => r.issues.length > 0)
  const summary = {
    totalPages: routes.length,
    pagesWithIssues: withIssues.length,
    errors: withIssues.reduce((n, r) => n + r.issues.filter((i) => i.severity === 'error').length, 0),
    warnings: withIssues.reduce((n, r) => n + r.issues.filter((i) => i.severity === 'warn').length, 0),
    info: withIssues.reduce((n, r) => n + r.issues.filter((i) => i.severity === 'info').length, 0),
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ summary, pages: withIssues }, null, 2))
    process.exit(summary.errors > 0 ? 1 : 0)
  }

  console.log(`\n📋 Side-audit: ${summary.totalPages} sider`)
  console.log(`   ${summary.pagesWithIssues} med funn · ${summary.errors} feil · ${summary.warnings} advarsler · ${summary.info} info\n`)

  const sorted = [...withIssues].sort((a, b) => {
    const maxA = Math.max(...a.issues.map((i) => SEVERITY[i.severity]), 0)
    const maxB = Math.max(...b.issues.map((i) => SEVERITY[i.severity]), 0)
    return maxB - maxA || b.issueCount - a.issueCount
  })

  const showAll = process.argv.includes('--verbose')
  const toShow = showAll ? sorted : sorted.slice(0, 15)

  for (const page of toShow) {
    console.log(`${page.route}`)
    for (const issue of page.issues) {
      const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warn' ? '⚠' : '·'
      console.log(`  ${icon} [${issue.code}] ${issue.message}`)
    }
    console.log()
  }

  if (!showAll && sorted.length > 15) {
    console.log(`… og ${sorted.length - 15} sider til. Bruk --verbose for full liste.\n`)
  }

  if (summary.errors === 0 && summary.warnings === 0) {
    console.log('✓ Ingen kritiske funn.\n')
  }

  process.exit(summary.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
