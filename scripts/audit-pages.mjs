#!/usr/bin/env node
/**
 * Automatisk design/oversikt/SEO-audit per side.
 *
 *   node scripts/audit-pages.mjs              → alle sider (krever SSR-build)
 *   node scripts/audit-pages.mjs --route /    → én side
 *   node scripts/audit-pages.mjs --json       → JSON-output
 *   node scripts/audit-pages.mjs --ensure-ssr → bygg SSR først
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadAllRoutes } from './lib/load-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SSR_DIR = path.join(ROOT, 'dist/server-audit')
const SSR_ENTRY = path.join(SSR_DIR, 'entry-server.js')

const TITLE_MIN = 30
const TITLE_MAX = 65
const DESC_MIN = 70
const DESC_MAX = 160

function parseArgs(argv) {
  const args = { _: [], route: null, json: false, ensureSsr: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') args.json = true
    else if (a === '--ensure-ssr') args.ensureSsr = true
    else if (a === '--route') args.route = argv[++i]
    else args._.push(a)
  }
  return args
}

function ensureSsrBuild() {
  if (fs.existsSync(SSR_ENTRY)) return
  console.error('Bygger SSR for audit …')
  execSync('npx vite build --ssr src/entry-server.tsx --outDir dist/server-audit', {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countMatches(html, re) {
  const m = html.match(re)
  return m ? m.length : 0
}

function findIssues({ route, html, meta, type }) {
  const issues = []
  const text = stripHtml(html)

  if (meta.title.length < TITLE_MIN) {
    issues.push({ code: 'meta-title-short', severity: 'warning', message: `Tittel for kort (${meta.title.length} tegn): «${meta.title}»` })
  }
  if (meta.title.length > TITLE_MAX) {
    issues.push({ code: 'meta-title-long', severity: 'warning', message: `Tittel for lang (${meta.title.length} tegn)` })
  }
  if (meta.description.length < DESC_MIN) {
    issues.push({ code: 'meta-desc-short', severity: 'warning', message: `Meta-beskrivelse for kort (${meta.description.length} tegn)` })
  }
  if (meta.description.length > DESC_MAX) {
    issues.push({ code: 'meta-desc-long', severity: 'warning', message: `Meta-beskrivelse for lang (${meta.description.length} tegn)` })
  }

  const h1Count = countMatches(html, /<h1[\s>]/gi)
  if (h1Count === 0) {
    issues.push({ code: 'missing-h1', severity: 'error', message: 'Mangler h1 — svekker oversikt og SEO' })
  } else if (h1Count > 1) {
    issues.push({ code: 'multiple-h1', severity: 'warning', message: `${h1Count} h1-elementer — bør være én` })
  }

  if (text.length < 120 && !['pwo-product', 'protein-product'].includes(type)) {
    issues.push({ code: 'thin-content', severity: 'warning', message: `Lite synlig tekst (${text.length} tegn etter stripping)` })
  }

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
  const imgsNoAlt = imgs.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag))
  if (imgsNoAlt.length) {
    issues.push({ code: 'img-no-alt', severity: 'error', message: `${imgsNoAlt.length} bilde(r) uten alt-tekst` })
  }

  const emptyLinks = countMatches(html, /<a\b[^>]*href\s*=\s*["']#["'][^>]*>/gi)
  if (emptyLinks) {
    issues.push({ code: 'empty-link', severity: 'warning', message: `${emptyLinks} lenke(r) med href="#"` })
  }

  if (type === 'pwo-product' || type === 'protein-product') {
    if (!/relatert|andre produkt|tilbake til|se hele/i.test(text)) {
      issues.push({ code: 'weak-internal-nav', severity: 'info', message: 'Produktside mangler tydelig intern navigasjon (relaterte/tilbake)' })
    }
    if (!/kjøp|butikk|pris/i.test(text)) {
      issues.push({ code: 'missing-purchase-context', severity: 'info', message: 'Produktside mangler tydelig kjøpskontekst' })
    }
  }

  if (type === 'blog-post' && text.length < 400) {
    issues.push({ code: 'blog-thin', severity: 'warning', message: 'Bloggpost virker tynn — sjekk innhold og layout' })
  }

  if ((type === 'pwo-hub' || type === 'protein-hub') && !/<table\b/i.test(html)) {
    issues.push({ code: 'missing-table', severity: 'warning', message: 'Rangeringsside uten tabell — sjekk oversikt' })
  }

  if (type === 'home' && !/tester\/pwo|tester\/protein/i.test(html)) {
    issues.push({ code: 'home-nav-weak', severity: 'warning', message: 'Forside mangler tydelige lenker til hovedtester' })
  }

  return issues
}

async function auditRoute(route, api) {
  const { render, parseRoute, getPageMeta } = api
  const state = parseRoute(route)
  const meta = getPageMeta(state)
  const html = render(route)
  const type = loadAllRoutes().find((r) => r.route === route)?.type ?? 'other'
  const issues = findIssues({ route, html, meta, type })

  return {
    route,
    type,
    url: route === '/' ? 'https://kosttest.no/' : `https://kosttest.no${route}/`,
    meta: { title: meta.title, description: meta.description, titleLen: meta.title.length, descLen: meta.description.length },
    issueCount: issues.length,
    issues,
    ok: issues.filter((i) => i.severity === 'error').length === 0,
  }
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.ensureSsr || !fs.existsSync(SSR_ENTRY)) ensureSsrBuild()

  const api = await import(`file://${SSR_ENTRY}`)
  const allRoutes = loadAllRoutes().map((r) => r.route)
  const targets = args.route ? [args.route] : allRoutes

  const results = []
  for (const route of targets) {
    results.push(await auditRoute(route, api))
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.ok && r.issueCount === 0).length,
    warnings: results.filter((r) => r.ok && r.issueCount > 0).length,
    errors: results.filter((r) => !r.ok).length,
    issueTotal: results.reduce((n, r) => n + r.issueCount, 0),
  }

  const payload = { summary, results, auditedAt: new Date().toISOString() }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2))
  } else {
    console.log(`Audit: ${summary.total} sider — ${summary.ok} uten funn, ${summary.warnings} med advarsler, ${summary.errors} med feil\n`)
    for (const r of results) {
      const flag = r.issueCount === 0 ? '✓' : r.ok ? '⚠' : '✗'
      console.log(`${flag} ${r.route}`)
      for (const issue of r.issues) {
        console.log(`    [${issue.severity}] ${issue.message}`)
      }
    }
  }

  return payload
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
