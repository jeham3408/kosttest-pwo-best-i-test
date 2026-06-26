#!/usr/bin/env node
/**
 * Page design/oversikt audit queue — én side per kjøring.
 *
 *   node scripts/page-audit-queue.mjs init      → bygg kø fra alle ruter
 *   node scripts/page-audit-queue.mjs start     → lås neste side + oppdater progress-MD
 *   node scripts/page-audit-queue.mjs next      → neste pending (JSON)
 *   node scripts/page-audit-queue.mjs status    → oversikt (JSON)
 *   node scripts/page-audit-queue.mjs complete --route / --notes "..."
 *   node scripts/page-audit-queue.mjs skip --route /kilder --reason "..."
 *   node scripts/page-audit-queue.mjs sync-md   → oppdater data/page-audit-progress.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { categorizeRoute, getAllRoutes, priorityForRoute } from './list-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const QUEUE_PATH = path.join(ROOT, 'data/page-audit-queue.json')
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

function formatDate(iso) {
  if (!iso) return '—'
  return iso.replace('T', ' ').slice(0, 16)
}

function statusEmoji(status) {
  if (status === 'done') return '✅'
  if (status === 'skipped') return '⏭️'
  if (status === 'in_progress') return '🔄'
  return '⏳'
}

function nextPending(queue) {
  return queue.queue
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.priority - b.priority || a.route.localeCompare(b.route))[0]
}

function runAudit(route) {
  const result = spawnSync('node', ['scripts/audit-pages.mjs', '--route', route, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.status !== 0 && !result.stdout) return null
  try {
    const parsed = JSON.parse(result.stdout)
    return parsed.results?.[0] ?? null
  } catch {
    return null
  }
}

async function cmdInit() {
  const routes = await getAllRoutes()
  const queue = {
    version: 1,
    updatedAt: new Date().toISOString(),
    queue: routes
      .map((route) => ({
        route,
        category: categorizeRoute(route),
        priority: priorityForRoute(route),
        status: 'pending',
        auditedAt: null,
        notes: null,
        issuesFound: 0,
        fixesApplied: 0,
      }))
      .sort((a, b) => a.priority - b.priority || a.route.localeCompare(b.route)),
  }
  writeQueue(queue)
  cmdSyncMd(queue)
  console.log(`Init: ${queue.queue.length} sider i kø`)
}

function cmdStart() {
  let queue = readQueue()
  const active = queue.queue.find((item) => item.status === 'in_progress')
  if (active) {
    console.log(JSON.stringify({ alreadyLocked: true, ...active }, null, 2))
    return
  }

  const next = nextPending(queue)
  if (!next) {
    console.log(JSON.stringify({ done: true, message: 'Alle sider er gjennomgått' }, null, 2))
    return
  }

  next.status = 'in_progress'
  next.auditedAt = new Date().toISOString()
  queue.updatedAt = new Date().toISOString()
  writeQueue(queue)
  cmdSyncMd(queue)

  const audit = runAudit(next.route)
  if (audit) {
    next.issuesFound = audit.issueCount
  }

  console.log(
    JSON.stringify(
      {
        route: next.route,
        category: next.category,
        priority: next.priority,
        staticAudit: audit,
        instructions: [
          '1. Kjør npm run build && npm run audit:pages -- --route ' + next.route,
          '2. Inspiser siden visuelt på https://kosttest.no' + (next.route === '/' ? '' : next.route) + '/',
          '3. Implementer 0–2 små design/oversikt-forbedringer hvis tydelig verdi',
          '4. node scripts/page-audit-queue.mjs complete --route "' + next.route + '" --notes "..."',
        ],
      },
      null,
      2,
    ),
  )
}

function cmdComplete(args) {
  const route = args.route
  if (!route) throw new Error('--route er påkrevd')
  const queue = readQueue()
  const item = queue.queue.find((q) => q.route === route)
  if (!item) throw new Error(`Ukjent rute: ${route}`)

  item.status = 'done'
  item.auditedAt = new Date().toISOString()
  item.notes = args.notes ?? null
  item.fixesApplied = Number(args.fixes ?? 0)
  queue.updatedAt = new Date().toISOString()
  writeQueue(queue)
  cmdSyncMd(queue, args.notes)
  console.log(`✅ Fullført: ${route}`)
}

function cmdSkip(args) {
  const route = args.route
  if (!route) throw new Error('--route er påkrevd')
  const queue = readQueue()
  const item = queue.queue.find((q) => q.route === route)
  if (!item) throw new Error(`Ukjent rute: ${route}`)

  item.status = 'skipped'
  item.auditedAt = new Date().toISOString()
  item.notes = args.reason ?? 'hoppet over'
  queue.updatedAt = new Date().toISOString()
  writeQueue(queue)
  cmdSyncMd(queue, `Hoppet over: ${item.notes}`)
  console.log(`⏭️ Hoppet over: ${route}`)
}

function cmdStatus() {
  const queue = readQueue()
  const counts = { pending: 0, in_progress: 0, done: 0, skipped: 0 }
  for (const item of queue.queue) counts[item.status] = (counts[item.status] ?? 0) + 1

  const current = queue.queue.find((q) => q.status === 'in_progress')
  const next = nextPending(queue)

  console.log(
    JSON.stringify(
      {
        total: queue.queue.length,
        counts,
        current,
        next: current ? null : next,
        updatedAt: queue.updatedAt,
      },
      null,
      2,
    ),
  )
}

function cmdNext() {
  const queue = readQueue()
  const current = queue.queue.find((q) => q.status === 'in_progress')
  const next = current ?? nextPending(queue)
  console.log(JSON.stringify(next ?? { done: true }, null, 2))
}

function cmdSyncMd(queue = readQueue(), logNote = null) {
  const counts = { pending: 0, in_progress: 0, done: 0, skipped: 0 }
  for (const item of queue.queue) counts[item.status] = (counts[item.status] ?? 0) + 1

  const current = queue.queue.find((q) => q.status === 'in_progress')
  const next = nextPending(queue)

  const doneList = queue.queue
    .filter((q) => q.status === 'done')
    .slice(-10)
    .reverse()

  const logSection = logNote
    ? `\n## Siste kjøring\n\n- **${formatDate(new Date().toISOString())}** — ${logNote}\n`
    : ''

  const md = `# Side-audit – design og oversikt

Oppdatert: ${formatDate(queue.updatedAt)}

## Status

| Metrikk | Antall |
|---------|--------|
| Totalt | ${queue.queue.length} |
| ⏳ Pending | ${counts.pending} |
| 🔄 Pågår | ${counts.in_progress} |
| ✅ Ferdig | ${counts.done} |
| ⏭️ Hoppet over | ${counts.skipped} |

## Nå

${current ? `- **Pågår:** \`${current.route}\` (${current.category})` : next ? `- **Neste:** \`${next.route}\` (${next.category}, prioritet ${next.priority})` : '- Alle sider er gjennomgått 🎉'}

## Siste 10 fullførte

${doneList.length ? doneList.map((q) => `- ${statusEmoji(q.status)} \`${q.route}\` — ${q.notes ?? 'ingen notat'}`).join('\n') : '_Ingen ennå_'}

## Kjøringslogg

${LOG_MARKER}
${logSection}
`

  fs.mkdirSync(path.dirname(PROGRESS_MD), { recursive: true })
  fs.writeFileSync(PROGRESS_MD, md)
}

const args = parseArgs(process.argv)
const cmd = args._[0]

try {
  if (cmd === 'init') await cmdInit()
  else if (cmd === 'start') cmdStart()
  else if (cmd === 'complete') cmdComplete(args)
  else if (cmd === 'skip') cmdSkip(args)
  else if (cmd === 'status') cmdStatus()
  else if (cmd === 'next') cmdNext()
  else if (cmd === 'sync-md') cmdSyncMd()
  else {
    console.error(`Ukjent kommando: ${cmd ?? '(mangler)'}`)
    process.exit(1)
  }
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
