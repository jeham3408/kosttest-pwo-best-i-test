#!/usr/bin/env node
/**
 * Protein verification queue — én produkt per kjøring (cron hvert 5. min).
 *
 *   node scripts/protein-verify-queue.mjs start    → lås neste produkt + oppdater status-MD
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
  const re = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?brand:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'/g
  let m
  while ((m = re.exec(src)) !== null) {
    meta.set(m[1], { name: m[2], brand: m[3], url: m[4] })
  }
  return meta
}

function labelFor(id, meta) {
  const m = meta.get(id)
  if (!m) return { id, brand: '—', name: '—', url: '—' }
  return { id, ...m }
}

function statusEmoji(status) {
  if (status === 'verified') return '✅ verified'
  if (status === 'rejected') return '❌ rejected'
  return '⏳ pending'
}

function formatDate(iso) {
  if (!iso) return '—'
  return iso.replace('T', ' ').slice(0, 16)
}

function nextPending(queue) {
  return queue.queue.find((item) => item.status === 'pending')
}

function isFinished(item) {
  return item.status === 'verified' || item.status === 'rejected'
}

function completedItems(queue) {
  return queue.queue
    .filter((item) => isFinished(item))
    .sort((a, b) => Date.parse(b.verifiedAt || b.rejectedAt || 0) - Date.parse(a.verifiedAt || a.rejectedAt || 0))
}

function blockedIds(queue) {
  return completedItems(queue).map((item) => item.id)
}

function clearStaleLock(queue) {
  if (!queue.currentProductId) return false
  const current = queue.queue.find((e) => e.id === queue.currentProductId)
  if (current && isFinished(current)) {
    queue.currentProductId = null
    queue.currentRunStartedAt = null
    return true
  }
  return false
}

function lastCompletedItem(queue) {
  let best = null
  let bestTs = 0
  for (const item of queue.queue) {
    const ts = item.verifiedAt || item.rejectedAt
    if (!ts) continue
    const n = Date.parse(ts)
    if (n >= bestTs) {
      bestTs = n
      best = item
    }
  }
  return best
}

function buildPointerSections(q, meta) {
  const prev = lastCompletedItem(q)
  const next = nextPending(q)
  const currentId = q.currentProductId || next?.id
  const currentItem = currentId ? q.queue.find((e) => e.id === currentId) : null
  const currentMeta = currentId ? labelFor(currentId, meta) : null
  const prevMeta = prev ? labelFor(prev.id, meta) : null
  const done = completedItems(q)

  const blockRows = done.length
    ? done
        .map((item) => {
          const m = labelFor(item.id, meta)
          const when = formatDate(item.verifiedAt || item.rejectedAt)
          const result = item.status === 'verified' ? '✅ verified' : '❌ rejected'
          return `| \`${item.id}\` | ${m.brand} | ${m.name} | ${when} | ${result} |`
        })
        .join('\n')
    : '| — | — | Ingen ferdig ennå | — | — |'

  const blocklistBlock = `## 1. 🚫 FERDIG TESTET — ALDRI TEST DISSE IGJEN

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
${blockRows}

**FORBUDT å teste på nytt:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ennå'}

Rapport ligger i \`data/protein-verifications/<id>.json\`. Hvis du tester en av disse ID-ene på nytt, er kjøringen FEIL.`

  const runState = q.currentProductId ? '🔒 in_progress (låst av start)' : '⏳ klar — kjør `node scripts/protein-verify-queue.mjs start`'

  const nowBlock = currentId && currentMeta
    ? `## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| productId | \`${currentId}\` |
| merke | ${currentMeta.brand} |
| navn | ${currentMeta.name} |
| url i repo (sjekk/fiks) | ${currentMeta.url} |
| kø-status | ${currentItem ? statusEmoji(currentItem.status) : '—'} |
| kjøring | ${runState} |
| startet | ${q.currentRunStartedAt ? formatDate(q.currentRunStartedAt) : '—'} |

**TEST KUN \`${currentId}\` i denne kjøringen.**

**IKKE test:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ferdige ennå'}`
    : `## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

Alle produkter er verifisert eller avvist. Ingen oppgave igjen.`

  const prevBlock = prev
    ? `## 3. ⬅️ Sist ferdig (referanse — ikke test igjen)

| Felt | Verdi |
|------|-------|
| productId | \`${prev.id}\` |
| merke | ${prevMeta.brand} |
| navn | ${prevMeta.name} |
| resultat | ${prev.status === 'verified' ? '✅ verified' : '❌ rejected'} |
| ferdig | ${formatDate(prev.verifiedAt || prev.rejectedAt)} |

Sist ferdig var \`${prev.id}\`. Neste er \`${next?.id ?? '—'}\`.`
    : `## 3. ⬅️ Sist ferdig (referanse)

Ingen produkter ferdig testet ennå.`

  return { blocklistBlock, prevBlock, nowBlock, prev, next, currentId, done }
}

function syncMarkdown() {
  const q = readQueue()
  const meta = loadProductMeta()
  const counts = { pending: 0, verified: 0, rejected: 0 }
  for (const item of q.queue) counts[item.status] = (counts[item.status] || 0) + 1
  const { blocklistBlock, prevBlock, nowBlock, next, currentId, done } = buildPointerSections(q, meta)

  const rows = q.queue
    .map((item, i) => {
      const m = meta.get(item.id) || { name: '—', brand: '—' }
      const verified = formatDate(item.verifiedAt || item.rejectedAt).slice(0, 10)
      const marker = item.id === currentId && q.currentProductId ? ' **← NÅ**' : item.id === q.lastCompletedId ? ' ← forrige' : ''
      return `| ${i + 1} | ${item.id}${marker} | ${m.brand} | ${m.name} | ${statusEmoji(item.status)} | ${verified} |`
    })
    .join('\n')

  let existingMd = fs.existsSync(STATUS_MD) ? fs.readFileSync(STATUS_MD, 'utf8') : ''
  let logSection = ''
  const logIdx = existingMd.indexOf('## Kjøringslogg')
  if (logIdx !== -1) {
    const instrIdx = existingMd.indexOf('## Instruks', logIdx)
    logSection = instrIdx !== -1 ? existingMd.slice(logIdx, instrIdx).trimEnd() : existingMd.slice(logIdx).trimEnd()
  } else {
    logSection = `## Kjøringslogg\n\n${LOG_MARKER}\n`
  }

  const md = `# Protein verifisering — status

> **STOPP:** Les seksjon **1** (ferdig testet) og **2** (nå) før du gjør noe. Test **aldri** produkter i seksjon 1.

${blocklistBlock}

${nowBlock}

${prevBlock}

## Oppsummering

| Felt | Verdi |
|------|-------|
| Verifisert | ${counts.verified || 0} / ${q.queue.length} |
| Avvist | ${counts.rejected || 0} |
| Gjenstår | ${counts.pending || 0} |
| Neste i kø | \`${next?.id ?? '—'}\` |
| Siste kjøring | ${q.lastRunAt ? formatDate(q.lastRunAt) : '—'} |
| Cron | \`*/5 * * * *\` (hvert 5. min) |

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
${rows}

${logSection}

## Instruks (automasjon)

1. Les **seksjon 1** (🚫 ferdig testet) — disse ID-ene er **forbudt**.
2. Les **seksjon 2** (➡️ NÅ) — dette er det **eneste** produktet du skal teste.
3. \`node scripts/protein-verify-queue.mjs start\` → låser produktet under **NÅ**.
4. Verifiser **kun** productId fra seksjon 2 mot ekte butikkside.
5. Oppdater \`src/data/proteinProducts.ts\` + \`data/protein-verifications/<id>.json\`.
6. \`node scripts/protein-verify-queue.mjs complete --id <id>\` eller \`reject\`.
7. \`node scripts/protein-verify-queue.mjs sync-md\` → oppdater seksjon 1 og 2.
8. Legg til oppføring i **Kjøringslogg**.
9. \`npm run build\` → commit → push.
`

  fs.writeFileSync(STATUS_MD, md)
  return { verified: counts.verified, pending: counts.pending, currentId, previousId: q.lastCompletedId }
}

function runContext() {
  const q = readQueue()
  const meta = loadProductMeta()
  const prev = lastCompletedItem(q)
  const next = nextPending(q)
  const testNowId = q.currentProductId || next?.id
  const blocked = blockedIds(q)
  return {
    previousProduct: prev ? labelFor(prev.id, meta) : null,
    previousStatus: prev?.status ?? null,
    testNowProduct: testNowId ? labelFor(testNowId, meta) : null,
    testNowLocked: Boolean(q.currentProductId),
    doNotTestIds: blocked,
    done: !next && !q.currentProductId,
  }
}

function cmdNext() {
  const queue = readQueue()
  const ctx = runContext()
  if (ctx.done) {
    console.log(JSON.stringify({ done: true, message: 'Alle produkter er verifisert eller avvist.', statusMd: 'data/protein-verification-status.md' }))
    return
  }
  const productId = queue.currentProductId || nextPending(queue).id
  const reportPath = path.join(REPORTS_DIR, `${productId}.json`)
  console.log(
    JSON.stringify(
      {
        done: false,
        ...ctx,
        productId,
        reportPath,
        statusMd: 'data/protein-verification-status.md',
        instructions: `Test KUN ${productId}. Forrige ferdig: ${ctx.previousProduct?.id ?? 'ingen'}. Les data/protein-verification-status.md.`,
      },
      null,
      2,
    ),
  )
}

function cmdStatus() {
  const q = readQueue()
  const ctx = runContext()
  const counts = q.queue.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {},
  )
  console.log(
    JSON.stringify(
      {
        intervalMinutes: q.intervalMinutes,
        lastRunAt: q.lastRunAt,
        lastCompletedId: q.lastCompletedId,
        lastCompletedStatus: q.lastCompletedStatus,
        currentProductId: q.currentProductId,
        ...ctx,
        counts,
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
  clearStaleLock(queue)
  const next = nextPending(queue)
  if (!next) {
    writeQueue(queue)
    syncMarkdown()
    console.log(JSON.stringify({ done: true, message: 'Ingen pending produkter.' }))
    return
  }
  if (isFinished(next)) {
    console.error(`FEIL: Neste produkt ${next.id} er allerede ferdig (${next.status}). Kjør sync-md og sjekk køen.`)
    process.exit(1)
  }
  const blocked = blockedIds(queue)
  if (blocked.includes(next.id)) {
    console.error(`FEIL: ${next.id} står i ferdig-testet-listen. Skal ikke startes på nytt.`)
    process.exit(1)
  }
  queue.lastRunAt = new Date().toISOString()
  queue.currentProductId = next.id
  queue.currentRunStartedAt = queue.lastRunAt
  next.attempts = (next.attempts || 0) + 1
  next.lastAttemptAt = queue.lastRunAt
  writeQueue(queue)
  const sync = syncMarkdown()
  const ctx = runContext()
  console.log(
    JSON.stringify(
      {
        ok: true,
        lockedProductId: next.id,
        previousProduct: ctx.previousProduct,
        testNowProduct: ctx.testNowProduct,
        doNotTestIds: ctx.doNotTestIds,
        message: `Låst oppgave: test KUN ${next.id}. Forrige ferdig: ${ctx.previousProduct?.id ?? 'ingen'}. IKKE test: ${ctx.doNotTestIds.join(', ') || 'ingen'}.`,
        statusMd: 'data/protein-verification-status.md',
        sync,
      },
      null,
      2,
    ),
  )
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
  if (isFinished(item)) {
    console.error(`FEIL: ${id} er allerede ${item.status} (${formatDate(item.verifiedAt || item.rejectedAt)}). Skal ikke testes på nytt.`)
    process.exit(1)
  }
  if (queue.currentProductId && queue.currentProductId !== id) {
    console.error(`Feil produkt: kjøringen er låst til ${queue.currentProductId}, ikke ${id}`)
    process.exit(1)
  }
  item.status = 'verified'
  item.verifiedAt = new Date().toISOString()
  queue.lastVerifiedId = id
  queue.lastCompletedId = id
  queue.lastCompletedStatus = 'verified'
  queue.lastRunAt = item.verifiedAt
  queue.currentProductId = null
  queue.currentRunStartedAt = null
  writeQueue(queue)
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: 'verified', nextTest: nextPending(readQueue())?.id ?? null, statusMd: 'data/protein-verification-status.md' }))
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
  if (isFinished(item)) {
    console.error(`FEIL: ${id} er allerede ${item.status} (${formatDate(item.verifiedAt || item.rejectedAt)}). Skal ikke testes på nytt.`)
    process.exit(1)
  }
  if (queue.currentProductId && queue.currentProductId !== id) {
    console.error(`Feil produkt: kjøringen er låst til ${queue.currentProductId}, ikke ${id}`)
    process.exit(1)
  }
  item.status = 'rejected'
  item.rejectedAt = new Date().toISOString()
  item.rejectReason = reason
  queue.lastCompletedId = id
  queue.lastCompletedStatus = 'rejected'
  queue.lastRunAt = item.rejectedAt
  queue.currentProductId = null
  queue.currentRunStartedAt = null
  writeQueue(queue)
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(REPORTS_DIR, `${id}.json`),
    `${JSON.stringify({ id, exists: false, rejectedAt: item.rejectedAt, reason }, null, 2)}\n`,
  )
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: 'rejected', reason, nextTest: nextPending(readQueue())?.id ?? null, statusMd: 'data/protein-verification-status.md' }))
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
    console.log(JSON.stringify({ ok: true, ...syncMarkdown(), path: 'data/protein-verification-status.md' }))
    break
  default:
    console.error(`Ukjent kommando: ${command}`)
    process.exit(1)
}
