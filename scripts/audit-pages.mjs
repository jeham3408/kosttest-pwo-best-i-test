import { getAllSiteRoutes } from './list-routes.mjs'

const SITE = process.env.AUDIT_SITE_URL ?? 'https://kosttest.no'
const CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY ?? 8)
const TIMEOUT_MS = Number(process.env.AUDIT_TIMEOUT_MS ?? 15000)

const checks = {
  missingTitle: (html) => !/<title>[^<]{3,}<\/title>/i.test(html),
  shortTitle: (html) => {
    const m = html.match(/<title>([^<]*)<\/title>/i)
    return m ? m[1].trim().length < 20 : true
  },
  longTitle: (html) => {
    const m = html.match(/<title>([^<]*)<\/title>/i)
    return m ? m[1].trim().length > 70 : false
  },
  missingDescription: (html) => !/<meta\s+name="description"\s+content="[^"]{10,}"/i.test(html),
  shortDescription: (html) => {
    const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
    return m ? m[1].trim().length < 50 : true
  },
  longDescription: (html) => {
    const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)
    return m ? m[1].trim().length > 170 : false
  },
  missingCanonical: (html) => !/<link\s+rel="canonical"\s+href="https:\/\/kosttest\.no/i.test(html),
  missingH1: (html) => (html.match(/<h1[\s>]/gi) ?? []).length === 0,
  multipleH1: (html) => (html.match(/<h1[\s>]/gi) ?? []).length > 1,
  missingMain: (html) => !/<main[\s>]/i.test(html),
  missingNav: (html) => !/aria-label="Hovednavigasjon"/i.test(html),
  missingBackNav: (html, type) => {
    if (!['produkt', 'blogg-post', 'guide', 'metode', 'kilder'].includes(type)) return false
    return !/(Tilbake|←)/i.test(html)
  },
  thinContent: (html, type) => {
    if (type === 'produkt' || type === 'blogg-post') return false
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
    return text.replace(/\s+/g, ' ').trim().length < 400
  },
}

async function fetchPage(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KosttestDesignAudit/1.0' },
      redirect: 'follow',
    })
    const html = await res.text()
    return { status: res.status, html, finalUrl: res.url }
  } finally {
    clearTimeout(timer)
  }
}

async function auditRoute(item) {
  const url = item.route === '/' ? `${SITE}/` : `${SITE}${item.route}/`
  const issues = []

  try {
    const { status, html, finalUrl } = await fetchPage(url)
    if (status !== 200) issues.push(`HTTP ${status}`)
    if (!finalUrl.startsWith(SITE)) issues.push(`Omdirigert utenfor domenet: ${finalUrl}`)

    for (const [name, fn] of Object.entries(checks)) {
      if (fn(html, item.type)) issues.push(name)
    }
  } catch (error) {
    issues.push(`fetch-feil: ${error instanceof Error ? error.message : String(error)}`)
  }

  return { ...item, url, issues }
}

async function runPool(items, worker, limit) {
  const results = []
  let index = 0

  async function next() {
    while (index < items.length) {
      const current = index++
      results[current] = await worker(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()))
  return results
}

const routes = await getAllSiteRoutes()
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7)
const batchSize = Number(process.argv.find((arg) => arg.startsWith('--batch='))?.slice(8) ?? 0)
const batchOffset = Number(process.argv.find((arg) => arg.startsWith('--offset='))?.slice(9) ?? 0)

let selected = only ? routes.filter((r) => r.type === only || r.route.includes(only)) : routes
if (batchSize > 0) {
  selected = selected.slice(batchOffset, batchOffset + batchSize)
  console.error(`Batch-modus: sider ${batchOffset + 1}–${batchOffset + selected.length} av ${routes.length}`)
}

console.error(`Auditerer ${selected.length} sider på ${SITE} ...`)
const results = await runPool(selected, auditRoute, CONCURRENCY)
const failed = results.filter((r) => r.issues.length > 0)
const summary = {
  site: SITE,
  auditedAt: new Date().toISOString(),
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  batchOffset,
  batchSize: batchSize || null,
  siteTotal: routes.length,
  issueCounts: failed.reduce((acc, row) => {
    for (const issue of row.issues) acc[issue] = (acc[issue] ?? 0) + 1
    return acc
  }, {}),
  pages: results,
  failures: failed.map(({ route, type, label, url, issues }) => ({ route, type, label, url, issues })),
}

const json = process.argv.includes('--json')
if (json) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`\nResultat: ${summary.passed}/${summary.total} OK, ${summary.failed} med funn\n`)
  if (failed.length) {
    for (const row of failed) {
      console.log(`${row.route}/ [${row.type}]`)
      for (const issue of row.issues) console.log(`  - ${issue}`)
    }
    console.log('\nIssue-telling:')
    for (const [issue, count] of Object.entries(summary.issueCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${issue}: ${count}`)
    }
  }
}

process.exitCode = failed.length > 0 ? 1 : 0
