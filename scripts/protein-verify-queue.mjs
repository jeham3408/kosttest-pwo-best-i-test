#!/usr/bin/env node
/**
 * Protein verification queue — én produkt per kjøring (cron hvert 5. min).
 *
 *   node scripts/protein-verify-queue.mjs next     → neste pending produkt (JSON)
 *   node scripts/protein-verify-queue.mjs status   → oversikt
 *   node scripts/protein-verify-queue.mjs complete --id <id> [--report path]
 *   node scripts/protein-verify-queue.mjs reject --id <id> --reason "..."
 *   node scripts/protein-verify-queue.mjs start    → marker kjøring startet (lastRunAt)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const QUEUE_PATH = path.join(ROOT, 'src/data/proteinVerificationQueue.json')
const REPORTS_DIR = path.join(ROOT, 'data/protein-verifications')

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

function nextPending(queue) {
  return queue.queue.find((item) => item.status === 'pending')
}

function cmdNext() {
  const queue = readQueue()
  const next = nextPending(queue)
  if (!next) {
    console.log(JSON.stringify({ done: true, message: 'Alle produkter er verifisert eller avvist.' }))
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
        instructions: 'Verifiser ÉN produkt. Skriv rapport til reportPath. Oppdater src/data/proteinProducts.ts. Kjør complete.',
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
  console.log(JSON.stringify({ ok: true, id, status: 'verified' }))
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
  console.log(JSON.stringify({ ok: true, id, status: 'rejected', reason }))
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
  default:
    console.error(`Ukjent kommando: ${command}`)
    process.exit(1)
}
