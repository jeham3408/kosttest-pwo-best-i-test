#!/usr/bin/env node
/**
 * Protein verification queue — én produkt per kjøring (cron hvert 5. min).
 *
 *   node scripts/protein-verify-queue.mjs start    → marker kjøring + neste produkt
 *   node scripts/protein-verify-queue.mjs next     → neste pending (JSON)
 *   node scripts/protein-verify-queue.mjs status   → oversikt (JSON)
 *   node scripts/protein-verify-queue.mjs complete --id <id>
 *   node scripts/protein-verify-queue.mjs reject --id <id> --reason "..."
 *   node scripts/protein-verify-queue.mjs sync-md  → oppdater data/protein-verification-status.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const QUEUE_PATH = path.join(ROOT, 'src/data/proteinVerificationQueue.json')
const STATUS_MD = path.join(ROOT, 'data/protein-verification-status.md')
const PRODUCTS_TS = path.join(ROOT, 'src/data/proteinProducts.ts')
const REPORTS_DIR = path.join(ROOT, 'data/protein-verifications')
const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->'

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

function loadProductMeta() {
  const src = fs.readFileSync(PRODUCTS_TS, 'utf8')
  const meta = new Map()
  const re = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?brand:\s*'([^']+)'/g
  let m
  while ((m = re.exec(src)) !== null) {
    meta.set(m[1], { name: m[2], brand: m[3] })
  }
  return meta
}

function statusEmoji(status) {
  if (status === 'verified') return '✅ verified'
  if (status === 'rejected') return '❌ rejected'
  return '⏳ pending'
}

function formatDate(iso) {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

function nextPending(queue) {
  return queue.queue.find((item) => item.status === 'pending')
}

function syncMarkdown() {
  const q = readQueue()
  const meta = loadProductMeta()
  const counts = { pending: 0, verified: 0, rejected: 0 }
  for (const item of q.queue) counts[item.status] = (counts[item.status] || 0) + 1
  const next = nextPending(q)

  const rows = q.queue
    .map((item, i) => {
      const m = meta.get(item.id) || { name: '—', brand: '—' }
      const verified = formatDate(item.verifiedAt || item.rejectedAt)
      return `| ${i + 1} | ${item.id} | ${m.brand} | ${m.name} | ${statusEmoji(item.status)} | ${verified} |`
    })
    .join('\n')

  let existingMd = fs.existsSync(STATUS_MD) ? fs.readFileSync(STATUS_MD, 'utf8') : ''
  let logSection = ''
  const logIdx = existingMd.indexOf('## Kjøringslogg')
  if (logIdx !== -1) {
    logSection = existingMd.slice(logIdx)
  } else {
    logSection = `## Kjøringslogg\n\n${LOG_MARKER}\n`
  }

  let currentTask = ''
  const taskIdx = existingMd.indexOf('## Aktuell oppgave')
  if (taskIdx !== -1) {
    const taskEnd = existingMd.indexOf('## Produktkø', taskIdx)
    if (taskEnd !== -1) currentTask = existingMd.slice(taskIdx, taskEnd).trim()
  }
  if (!currentTask) {
    currentTask = `## Aktuell oppgave

| Felt | Verdi |
|------|-------|
| productId | — |
| status | \`idle\` |
| startet | — |
| kilde-URL | — |
| produkt finnes | — |
| score (etter build) | — |
| notat | — |`
  }

  const md = `# Protein verifisering — status

> **Automasjon:** Les denne filen **før** hver kjøring. Oppdater **Aktuell oppgave** ved start og **Kjøringslogg** ved slutt. Kjør \`node scripts/protein-verify-queue.mjs sync-md\` før commit for å oppdatere tabellen under.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Verifisert | ${counts.verified || 0} / ${q.queue.length} |
| Avvist | ${counts.rejected || 0} |
| Gjenstår | ${counts.pending || 0} |
| Neste i kø | \`${next?.id ?? '—'}\` |
| Siste kjøring | ${q.lastRunAt ? q.lastRunAt.replace('T', ' ').slice(0, 16) : '—'} |
| Cron | \`*/5 * * * *\` (hvert 5. min) |

${currentTask}

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
${rows}

${logSection.includes('## Instruks') ? logSection.split('## Instruks')[0].trimEnd() : logSection.trimEnd()}

## Instruks (automasjon)

1. Les denne filen.
2. \`node scripts/protein-verify-queue.mjs start\` → sett **Aktuell oppgave** til \`in_progress\`.
3. Verifiser **ett** produkt mot ekte butikkside — aldri finn på data.
4. Oppdater \`src/data/proteinProducts.ts\` + \`data/protein-verifications/<id>.json\`.
5. \`node scripts/protein-verify-queue.mjs complete --id <id>\` eller \`reject\`.
6. \`node scripts/protein-verify-queue.mjs sync-md\` → oppdater tabeller.
7. Legg til oppføring i **Kjøringslogg**. Nullstill **Aktuell oppgave** til \`idle\`.
8. \`npm run build\` → commit → push.
`

  fs.writeFileSync(STATUS_MD, md)
  console.log(JSON.stringify({ ok: true, path: 'data/protein-verification-status.md', verified: counts.verified, pending: counts.pending }))
}

function cmdNext() {
  const queue = readQueue()
  const next = nextPending(queue)
  if (!next) {
    console.log(JSON.stringify({ done: true, message: 'Alle produkter er verifisert eller avvist.', statusMd: 'data/protein-verification-status.md' }))
    return
  }
  const reportPath = path.join(REPORTS_DIR, `${next.id}.json`)
  console.log(
    JSON.stringify(
      {
        done: false,
        productId: next.id,
        attempts: next.attempts,
        reportPath,
        statusMd: 'data/protein-verification-status.md',
        instructions: 'Les data/protein-verification-status.md. Verifiser ÉN produkt. Oppdater MD + proteinProducts.ts. Kjør complete og sync-md.',
      },
      null,
      2,
    ),
  )
}

function cmdStatus() {
  const q = readQueue()
  const counts = q.queue.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {},
  )
  const next = nextPending(q)
  console.log(
    JSON.stringify(
      {
        intervalMinutes: q.intervalMinutes,
        lastRunAt: q.lastRunAt,
        lastVerifiedId: q.lastVerifiedId,
        counts,
        nextId: next?.id ?? null,
        total: q.queue.length,
        statusMd: 'data/protein-verification-status.md',
      },
      null,
      2,
    ),
  )
}

function cmdStart() {
  const queue = readQueue()
  queue.lastRunAt = new Date().toISOString()
  const next = nextPending(queue)
  if (next) {
    next.attempts = (next.attempts || 0) + 1
    next.lastAttemptAt = queue.lastRunAt
  }
  writeQueue(queue)
  syncMarkdown()
  cmdNext()
}

function cmdComplete(args) {
  const id = args.id
  if (!id) {
    console.error('Mangler --id')
    process.exit(1)
  }
  const queue = readQueue()
  const item = queue.queue.find((e) => e.id === id)
  if (!item) {
    console.error(`Ukjent id: ${id}`)
    process.exit(1)
  }
  item.status = 'verified'
  item.verifiedAt = new Date().toISOString()
  queue.lastVerifiedId = id
  queue.lastRunAt = item.verifiedAt
  writeQueue(queue)
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: 'verified', statusMd: 'data/protein-verification-status.md' }))
}

function cmdReject(args) {
  const id = args.id
  const reason = args.reason || 'Produktet finnes ikke eller kunne ikke verifiseres'
  if (!id) {
    console.error('Mangler --id')
    process.exit(1)
  }
  const queue = readQueue()
  const item = queue.queue.find((e) => e.id === id)
  if (!item) {
    console.error(`Ukjent id: ${id}`)
    process.exit(1)
  }
  item.status = 'rejected'
  item.rejectedAt = new Date().toISOString()
  item.rejectReason = reason
  queue.lastRunAt = item.rejectedAt
  writeQueue(queue)
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(REPORTS_DIR, `${id}.json`),
    `${JSON.stringify({ id, exists: false, rejectedAt: item.rejectedAt, reason }, null, 2)}\n`,
  )
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: 'rejected', reason, statusMd: 'data/protein-verification-status.md' }))
}

const args = parseArgs(process.argv)
const command = args._[0] || 'status'

switch (command) {
  case 'next':
    cmdNext()
    break
  case 'start':
    cmdStart()
    break
  case 'status':
    cmdStatus()
    break
  case 'complete':
    cmdComplete(args)
    break
  case 'reject':
    cmdReject(args)
    break
  case 'sync-md':
    syncMarkdown()
    break
  default:
    console.error(`Ukjent kommando: ${command}`)
    process.exit(1)
}
