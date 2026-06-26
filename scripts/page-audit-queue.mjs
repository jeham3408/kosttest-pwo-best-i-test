#!/usr/bin/env node
/**
 * Design/oversikt-audit-kø — én side per kjøring.
 *
 *   node scripts/page-audit-queue.mjs init       → initialiser kø fra alle ruter
 *   node scripts/page-audit-queue.mjs audit      → kjør automatisk sjekk på alle (oppdaterer funn)
 *   node scripts/page-audit-queue.mjs start      → lås neste side for manuell gjennomgang
 *   node scripts/page-audit-queue.mjs next       → neste side (JSON)
 *   node scripts/page-audit-queue.mjs status     → oversikt (JSON)
 *   node scripts/page-audit-queue.mjs complete --route /path [--notes "..."] [--fixed true]
 *   node scripts/page-audit-queue.mjs sync-md    → oppdater data/page-audit-progress.md
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadAllRoutes, routeLabel } from './lib/load-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const QUEUE_PATH = path.join(ROOT, 'src/data/pageAuditQueue.json')
const PROGRESS_MD = path.join(ROOT, 'data/page-audit-progress.md')
const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én side per kjøring. -->'

function readQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'))
}

function writeQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`)
}

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      args[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
    } else {
      args._.push(a)
    }
  }
  return args
}

function normalizeRoute(route) {
  if (!route) return '/'
  const r = route.startsWith('/') ? route : `/${route}`
  return r.replace(/\/+$/, '') || '/'
}

function pageStatus(page) {
  if (page.inProgress) return 'in_progress'
  if (page.completedAt) return 'completed'
  return 'pending'
}

function ensurePages(queue) {
  const routes = loadAllRoutes()
  if (!queue.pages) queue.pages = {}
  for (const { route, type, label, url } of routes) {
    if (!queue.pages[route]) {
      queue.pages[route] = {
        route,
        type,
        label,
        url,
        status: 'pending',
        autoIssues: [],
        manualNotes: null,
        fixedInPr: false,
        completedAt: null,
        inProgress: false,
        lastAutoAudit: null,
      }
    } else {
      queue.pages[route].type = type
      queue.pages[route].label = label
      queue.pages[route].url = url
    }
  }
  return queue
}

function getOrderedPages(queue) {
  const routes = loadAllRoutes().map((r) => r.route)
  return routes.map((route) => queue.pages[route]).filter(Boolean)
}

function findNextPending(queue) {
  return getOrderedPages(queue).find((p) => pageStatus(p) === 'pending' && !p.inProgress)
}

function runAutoAudit(route = null) {
  const cmd = route
    ? `node scripts/audit-pages.mjs --ensure-ssr --route "${route}" --json`
    : 'node scripts/audit-pages.mjs --ensure-ssr --json'
  const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] })
  const jsonStart = out.indexOf('{')
  if (jsonStart === -1) throw new Error('audit-pages ga ingen JSON')
  return JSON.parse(out.slice(jsonStart))
}

function cmdInit() {
  const queue = ensurePages(readQueue())
  writeQueue(queue)
  const total = Object.keys(queue.pages).length
  console.log(JSON.stringify({ ok: true, total, message: `Kø initialisert med ${total} sider.` }, null, 2))
}

function cmdAudit() {
  let queue = ensurePages(readQueue())
  const payload = runAutoAudit()
  queue.lastFullAudit = payload.auditedAt

  for (const result of payload.results) {
    const page = queue.pages[result.route]
    if (!page) continue
    page.autoIssues = result.issues
    page.lastAutoAudit = payload.auditedAt
    page.status = pageStatus(page)
  }

  writeQueue(queue)
  console.log(JSON.stringify({ ok: true, summary: payload.summary, lastFullAudit: queue.lastFullAudit }, null, 2))
}

function cmdStart() {
  let queue = ensurePages(readQueue())
  const active = getOrderedPages(queue).find((p) => p.inProgress)
  if (active) {
    const audit = runAutoAudit(active.route)
    active.autoIssues = audit.results[0]?.issues ?? []
    active.lastAutoAudit = audit.auditedAt
    writeQueue(queue)
    console.log(JSON.stringify({ ok: true, alreadyInProgress: true, page: active, audit: audit.results[0] }, null, 2))
    return
  }

  const next = findNextPending(queue)
  if (!next) {
    console.log(JSON.stringify({ ok: true, done: true, message: 'Alle sider er gjennomgått denne syklusen.' }, null, 2))
    return
  }

  next.inProgress = true
  const audit = runAutoAudit(next.route)
  next.autoIssues = audit.results[0]?.issues ?? []
  next.lastAutoAudit = audit.auditedAt
  writeQueue(queue)

  console.log(JSON.stringify({ ok: true, page: next, audit: audit.results[0] }, null, 2))
}

function cmdNext() {
  const queue = ensurePages(readQueue())
  const next = findNextPending(queue)
  console.log(JSON.stringify({ next: next ?? null, cycle: queue.cycle }, null, 2))
}

function cmdStatus() {
  const queue = ensurePages(readQueue())
  const pages = getOrderedPages(queue)
  const counts = { total: pages.length, pending: 0, in_progress: 0, completed: 0, withAutoIssues: 0 }
  for (const p of pages) {
    const s = pageStatus(p)
    counts[s] = (counts[s] ?? 0) + 1
    if (p.autoIssues?.length) counts.withAutoIssues++
  }
  const next = findNextPending(queue)
  const current = pages.find((p) => p.inProgress)
  console.log(JSON.stringify({ cycle: queue.cycle, lastFullAudit: queue.lastFullAudit, counts, current, next }, null, 2))
}

function cmdComplete(args) {
  const route = normalizeRoute(args.route)
  if (!route) {
    console.error('Mangler --route')
    process.exit(1)
  }

  let queue = ensurePages(readQueue())
  const page = queue.pages[route]
  if (!page) {
    console.error(`Ukjent rute: ${route}`)
    process.exit(1)
  }

  page.inProgress = false
  page.completedAt = new Date().toISOString()
  page.status = 'completed'
  if (args.notes) page.manualNotes = args.notes
  if (args.fixed === 'true' || args.fixed === true) page.fixedInPr = true

  const pending = getOrderedPages(queue).filter((p) => pageStatus(p) === 'pending').length
  if (pending === 0) {
    queue.cycle += 1
    for (const p of getOrderedPages(queue)) {
      p.status = 'pending'
      p.completedAt = null
      p.inProgress = false
      p.manualNotes = null
      p.fixedInPr = false
    }
  }

  writeQueue(queue)
  cmdSyncMd()
  console.log(JSON.stringify({ ok: true, route, pending, cycle: queue.cycle }, null, 2))
}

function cmdSyncMd() {
  const queue = ensurePages(readQueue())
  const pages = getOrderedPages(queue)
  const completed = pages.filter((p) => p.completedAt)
  const pending = pages.filter((p) => pageStatus(p) === 'pending')
  const inProgress = pages.filter((p) => p.inProgress)
  const withIssues = pages.filter((p) => p.autoIssues?.length)

  const issueCounts = {}
  for (const p of pages) {
    for (const issue of p.autoIssues ?? []) {
      issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1
    }
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([code, n]) => `- \`${code}\`: ${n} sider`)
    .join('\n')

  const nowBlock = `## Siste kjøring (${new Date().toISOString().slice(0, 16).replace('T', ' ')})

- Syklus: **${queue.cycle}**
- Full auto-audit: ${queue.lastFullAudit ? queue.lastFullAudit.slice(0, 16).replace('T', ' ') : '—'}
- Ferdig manuelt: **${completed.length}** / ${pages.length}
- Ventende: **${pending.length}**
- Pågår: ${inProgress.map((p) => p.route).join(', ') || '—'}
- Sider med auto-funn: **${withIssues.length}**

### Vanligste auto-funn
${topIssues || '_Ingen funn ennå — kjør `node scripts/page-audit-queue.mjs audit`._'}

### Neste i kø
${pending.slice(0, 5).map((p) => `- \`${p.route}\` — ${p.label}`).join('\n') || '_Alle sider ferdig denne syklusen._'}
`

  let md = fs.existsSync(PROGRESS_MD) ? fs.readFileSync(PROGRESS_MD, 'utf8') : `# Side-audit – design og oversikt\n\n${LOG_MARKER}\n\n`
  if (!md.includes(LOG_MARKER)) {
    md = `# Side-audit – design og oversikt\n\n${LOG_MARKER}\n\n${md}`
  }
  md = md.replace(
    new RegExp(`${LOG_MARKER}[\\s\\S]*?(?=\\n## Sykluslogg|$)`),
    `${LOG_MARKER}\n\n${nowBlock}\n`,
  )

  if (!md.includes('## Sykluslogg')) {
    md += `\n## Sykluslogg\n\n`
  }

  writeQueue(queue)
  fs.writeFileSync(PROGRESS_MD, md)
  console.error(`Oppdatert ${PROGRESS_MD}`)
}

const args = parseArgs(process.argv)
const cmd = args._[0]

switch (cmd) {
  case 'init':
    cmdInit()
    break
  case 'audit':
    cmdAudit()
    break
  case 'start':
    cmdStart()
    break
  case 'next':
    cmdNext()
    break
  case 'status':
    cmdStatus()
    break
  case 'complete':
    cmdComplete(args)
    break
  case 'sync-md':
    cmdSyncMd()
    break
  default:
    console.log(`Bruk: node scripts/page-audit-queue.mjs <init|audit|start|next|status|complete|sync-md>`)
    process.exit(cmd ? 1 : 0)
}
