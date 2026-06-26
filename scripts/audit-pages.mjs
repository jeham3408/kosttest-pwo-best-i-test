#!/usr/bin/env node
/**
 * Static design/oversikt-audit of prerendered HTML pages.
 *
 *   npm run build && node scripts/audit-pages.mjs
 *   node scripts/audit-pages.mjs --route /pwo/peveo-maxed
 *   node scripts/audit-pages.mjs --json
 *   node scripts/audit-pages.mjs --fail-on-warn
 */

import { readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categorizeRoute, getAllRoutes } from './list-routes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const SITE = 'https://kosttest.no'

const SEVERITY = { error: 3, warn: 2, info: 1 }

function extract(html, re) {
  const m = html.match(re)
  return m ? m[1].trim() : null
}

function extractAll(html, re) {
  return [...html.matchAll(re)].map((m) => m[1]?.trim() ?? m[0])
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mainContentText(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  return stripTags(main?.[1] ?? html)
}

function htmlPathForRoute(route) {
  if (route === '/') return join(DIST, 'index.html')
  return join(DIST, route.slice(1), 'index.html')
}

function expectedCanonical(route) {
  return route === '/' ? `${SITE}/` : `${SITE}${route}/`
}

export function auditHtml(route, html) {
  const issues = []
  const add = (id, severity, message) => issues.push({ id, severity, message })

  const title = extract(html, /<title>([^<]*)<\/title>/i)
  const description = extract(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
  const canonical = extract(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i)
  const ogTitle = extract(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i)
  const ogImage = extract(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i)
  const lang = extract(html, /<html[^>]*\slang="([^"]*)"/i)
  const viewport = /<meta\s+name="viewport"/i.test(html)
  const h1s = extractAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(stripTags)
  const imgs = [...html.matchAll(/<img\b([^>]*)>/gi)]
  const jsonLd = /type="application\/ld\+json"/i.test(html)
  const nav = /aria-label="Hovednavigasjon"/i.test(html)
  const main = /<main\b/i.test(html)
  const textLen = mainContentText(html).length

  if (!title) add('missing-title', 'error', 'Mangler <title>')
  else {
    if (title.length < 30) add('title-short', 'warn', `Tittel er kort (${title.length} tegn): «${title}»`)
    if (title.length > 70) add('title-long', 'warn', `Tittel er lang (${title.length} tegn): «${title}»`)
  }

  if (!description) add('missing-description', 'error', 'Mangler meta description')
  else {
    if (description.length < 100) add('description-short', 'warn', `Meta description er kort (${description.length} tegn)`)
    if (description.length > 170) add('description-long', 'warn', `Meta description er lang (${description.length} tegn)`)
  }

  if (!canonical) add('missing-canonical', 'error', 'Mangler canonical URL')
  else if (canonical !== expectedCanonical(route)) {
    add('canonical-mismatch', 'warn', `Canonical «${canonical}» matcher ikke forventet «${expectedCanonical(route)}»`)
  }

  if (!ogTitle) add('missing-og-title', 'warn', 'Mangler og:title')
  else if (title && ogTitle !== title) add('og-title-mismatch', 'info', 'og:title avviker fra <title>')

  if (!ogImage) add('missing-og-image', 'warn', 'Mangler og:image')

  if (!lang) add('missing-lang', 'error', 'Mangler lang-attributt på <html>')
  else if (lang !== 'nb') add('lang-unexpected', 'warn', `Uventet språkkode: ${lang}`)

  if (!viewport) add('missing-viewport', 'error', 'Mangler viewport meta')

  if (h1s.length === 0) add('missing-h1', 'error', 'Mangler h1')
  else if (h1s.length > 1) add('multiple-h1', 'warn', `${h1s.length} h1-elementer på siden`)

  for (const [, attrs] of imgs) {
    const altMatch = attrs.match(/\balt="([^"]*)"/i)
    const srcMatch = attrs.match(/\bsrc="([^"]*)"/i)
    const src = srcMatch?.[1] ?? '?'
    if (!altMatch) add('img-missing-alt', 'error', `Bilde uten alt: ${src}`)
    else if (!altMatch[1].trim()) add('img-empty-alt', 'warn', `Bilde med tom alt: ${src}`)
  }

  if (!jsonLd) add('missing-jsonld', 'warn', 'Mangler JSON-LD')
  if (!nav) add('missing-nav', 'warn', 'Mangler hovednavigasjon (aria-label)')
  if (!main) add('missing-main', 'error', 'Mangler <main>')

  const category = categorizeRoute(route)
  const minText = category === 'pwo-product' || category === 'protein-product' ? 200 : category === 'blog-post' ? 300 : 80
  if (textLen < minText) add('thin-content', 'warn', `Lite innhold i main (${textLen} tegn, forventet ≥${minText})`)

  const hashOnlyLinks = [...html.matchAll(/<a\b[^>]*href="#"/gi)].length
  if (hashOnlyLinks > 3) add('hash-links', 'info', `${hashOnlyLinks} lenker peker til # (sjekk SPA-navigasjon)`)

  const score = issues.reduce((sum, i) => sum + SEVERITY[i.severity], 0)

  return {
    route,
    category,
    title,
    issueCount: issues.length,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warnCount: issues.filter((i) => i.severity === 'warn').length,
    score,
    issues,
  }
}

export async function auditRoute(route) {
  const path = htmlPathForRoute(route)
  const html = await readFile(path, 'utf8')
  return auditHtml(route, html)
}

export async function auditAllRoutes(routes) {
  const results = []
  for (const route of routes) {
    try {
      results.push(await auditRoute(route))
    } catch (err) {
      results.push({
        route,
        category: categorizeRoute(route),
        issueCount: 1,
        errorCount: 1,
        warnCount: 0,
        score: 99,
        issues: [{ id: 'missing-html', severity: 'error', message: `Fant ikke HTML: ${err.message}` }],
      })
    }
  }
  return results
}

function summarize(results) {
  const errors = results.filter((r) => r.errorCount > 0)
  const warns = results.filter((r) => r.warnCount > 0 && r.errorCount === 0)
  const clean = results.filter((r) => r.issueCount === 0)

  const duplicateTitles = new Map()
  for (const r of results) {
    if (!r.title) continue
    const list = duplicateTitles.get(r.title) ?? []
    list.push(r.route)
    duplicateTitles.set(r.title, list)
  }

  const dupes = [...duplicateTitles.entries()].filter(([, routes]) => routes.length > 1)

  return { total: results.length, errors: errors.length, warns: warns.length, clean: clean.length, duplicateTitles: dupes }
}

const args = process.argv.slice(2)

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await stat(join(DIST, 'index.html'))
  } catch {
    console.error('dist/ mangler. Kjør npm run build først.')
    process.exit(1)
  }

  const routeArg = args.includes('--route') ? args[args.indexOf('--route') + 1] : null
  const routes = routeArg ? [routeArg] : await getAllRoutes()
  const results = await auditAllRoutes(routes)

  const dupes = summarize(results).duplicateTitles
  for (const [title, dupeRoutes] of dupes) {
    for (const r of results) {
      if (dupeRoutes.includes(r.route)) {
        r.issues.push({ id: 'duplicate-title', severity: 'warn', message: `Duplikat tittel med ${dupeRoutes.filter((d) => d !== r.route).join(', ')}` })
        r.warnCount = (r.warnCount ?? 0) + 1
        r.issueCount = (r.issueCount ?? 0) + 1
      }
    }
  }

  const summary = summarize(results)

  if (args.includes('--json')) {
    console.log(JSON.stringify({ summary, results }, null, 2))
  } else {
    console.log(`\nDesign/oversikt-audit: ${summary.total} sider`)
    console.log(`  ✅ ${summary.clean} uten funn`)
    console.log(`  ⚠️  ${summary.warns} med advarsler`)
    console.log(`  ❌ ${summary.errors} med feil`)
    if (dupes.length) console.log(`  🔁 ${dupes.length} duplikate titler`)

    const flagged = results
      .filter((r) => r.issueCount > 0)
      .sort((a, b) => b.score - a.score || a.route.localeCompare(b.route))

    for (const r of flagged) {
      console.log(`\n${r.route} [${r.category}]`)
      for (const issue of r.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warn' ? '⚠️' : 'ℹ️'
        console.log(`  ${icon} ${issue.message}`)
      }
    }
  }

  const failOnWarn = args.includes('--fail-on-warn')
  const hasErrors = results.some((r) => r.errorCount > 0)
  const hasWarns = results.some((r) => r.warnCount > 0)

  if (hasErrors || (failOnWarn && hasWarns)) process.exit(1)
}
