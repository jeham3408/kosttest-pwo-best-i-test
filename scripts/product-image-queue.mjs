#!/usr/bin/env node
/**
 * Product image queue — systematisk bilde- og URL-sjekk.
 *
 *   node scripts/product-image-queue.mjs init      → bygg kø fra produktfiler
 *   node scripts/product-image-queue.mjs start     → lås neste batch
 *   node scripts/product-image-queue.mjs status    → oversikt (JSON)
 *   node scripts/product-image-queue.mjs complete --id <id> [--source og:image]
 *   node scripts/product-image-queue.mjs skip --id <id> --reason "..."
 *   node scripts/product-image-queue.mjs sync-md   → oppdater data/product-image-status.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { assessProduct, isGenericImage, loadAllProducts, ROOT } from './product-image-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUEUE_PATH = path.join(ROOT, 'src/data/productImageQueue.json')
const STATUS_MD = path.join(ROOT, 'data/product-image-status.md')
const REPORTS_DIR = path.join(ROOT, 'data/product-image-reports')
const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. -->'
const BATCH_SIZE = Number(process.env.PRODUCT_IMAGE_BATCH || 5)

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
  if (status === 'done') return '✅ bilde OK'
  if (status === 'added') return '🖼️ bilde lagt til'
  if (status === 'failed') return '❌ feilet'
  if (status === 'in_progress') return '🔒 pågår'
  return '⏳ venter'
}

function loadProductMeta() {
  const { tested, listedOnly, protein } = loadAllProducts()
  const meta = new Map()
  for (const p of [...tested, ...listedOnly, ...protein]) {
    meta.set(p.id, { name: p.name, brand: p.brand, url: p.url, catalog: p.catalog })
  }
  return meta
}

function labelFor(id, meta) {
  const m = meta.get(id)
  if (!m) return { id, brand: '—', name: '—', url: '—', catalog: '—' }
  return { id, ...m }
}

function isFinished(item) {
  return item.status === 'done' || item.status === 'added' || item.status === 'failed'
}

function nextPending(queue) {
  return queue.queue.filter((item) => item.status === 'pending')
}

function completedItems(queue) {
  return queue.queue
    .filter((item) => isFinished(item))
    .sort((a, b) => Date.parse(b.completedAt || 0) - Date.parse(a.completedAt || 0))
}

function buildPointerSections(q, meta) {
  const done = completedItems(q)
  const pending = nextPending(q)
  const currentBatch = q.currentBatchIds || []
  const batchMeta = currentBatch.map((id) => labelFor(id, meta))

  const blockRows = done.length
    ? done
        .slice(0, 30)
        .map((item) => {
          const m = labelFor(item.id, meta)
          return `| \`${item.id}\` | ${m.brand} | ${m.name} | ${formatDate(item.completedAt)} | ${statusEmoji(item.status)} |`
        })
        .join('\n')
    : '| — | — | Ingen ferdig ennå | — | — |'

  const blocklistBlock = `## 1. ✅ FERDIG — IKKE KJØR DISSE IGJEN

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
${blockRows}

**Ferdig behandlet:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ennå'}`

  const nowBlock =
    batchMeta.length > 0
      ? `## 2. ➡️ NÅ — BEHANDLE KUN DISSE (${batchMeta.length} stk)

| productId | Merke | Navn | Katalog | URL |
|-----------|-------|------|---------|-----|
${batchMeta.map((m) => `| \`${m.id}\` | ${m.brand} | ${m.name} | ${m.catalog} | ${m.url} |`).join('\n')}

**Behandle kun produktene over i denne kjøringen.**`
      : pending.length
        ? `## 2. ➡️ NÅ — BEHANDLE NESTE BATCH

Kjør \`node scripts/product-image-queue.mjs start\` eller \`node scripts/product-image-run.mjs\` for å låse neste ${BATCH_SIZE} produkter.

Neste i kø: \`${pending.slice(0, BATCH_SIZE).map((p) => p.id).join('`, `')}\``
        : `## 2. ➡️ NÅ

Alle produkter er behandlet. Kjør \`init\` på nytt hvis nye produkter er lagt til.`

  const prev = done[0]
  const prevBlock = prev
    ? `## 3. ⬅️ Sist ferdig

| Felt | Verdi |
|------|-------|
| productId | \`${prev.id}\` |
| resultat | ${statusEmoji(prev.status)} |
| ferdig | ${formatDate(prev.completedAt)} |`
    : `## 3. ⬅️ Sist ferdig

Ingen produkter ferdig ennå.`

  return { blocklistBlock, nowBlock, prevBlock, done, pending, currentBatch }
}

function syncMarkdown() {
  const q = readQueue()
  const meta = loadProductMeta()
  const counts = q.queue.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
  const { blocklistBlock, nowBlock, prevBlock, pending } = buildPointerSections(q, meta)

  const rows = q.queue
    .map((item, i) => {
      const m = meta.get(item.id) || { name: '—', brand: '—', catalog: '—' }
      const marker = q.currentBatchIds?.includes(item.id) ? ' **← NÅ**' : ''
      return `| ${i + 1} | ${item.id}${marker} | ${m.brand} | ${m.name} | ${m.catalog} | ${statusEmoji(item.status)} | ${formatDate(item.completedAt).slice(0, 10)} |`
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

  const md = `# Produktbilde — status

> Les seksjon **1** (ferdig) og **2** (nå) før du gjør noe.

${blocklistBlock}

${nowBlock}

${prevBlock}

## Oppsummering

| Felt | Verdi |
|------|-------|
| Totalt | ${q.queue.length} |
| Venter | ${counts.pending || 0} |
| Bilde OK | ${counts.done || 0} |
| Bilde lagt til | ${counts.added || 0} |
| Feilet | ${counts.failed || 0} |
| Batch-størrelse | ${BATCH_SIZE} |
| Siste kjøring | ${q.lastRunAt ? formatDate(q.lastRunAt) : '—'} |
| Cron | \`0 * * * *\` (hver time) |

## Produktkø

| # | ID | Merke | Navn | Katalog | Status | Ferdig |
|---|-----|-------|------|---------|--------|--------|
${rows}

${logSection}

## Instruks (automasjon)

1. Les **seksjon 1** og **2** i denne filen.
2. \`node scripts/product-image-run.mjs\` — behandler batch automatisk (anbefalt).
3. Alternativt manuelt: \`start\` → finn bilde → oppdater TS → \`complete\` / \`skip\`.
4. \`node scripts/product-image-queue.mjs sync-md\` etter endringer.
5. \`npm run lint && npm run build\` → commit → push → PR.
`

  fs.mkdirSync(path.dirname(STATUS_MD), { recursive: true })
  fs.writeFileSync(STATUS_MD, md)
  return { pending: counts.pending || 0, done: (counts.done || 0) + (counts.added || 0) + (counts.failed || 0) }
}

async function cmdInit() {
  const { tested, listedOnly, protein } = loadAllProducts()
  const all = [...tested, ...listedOnly, ...protein]
  const existing = fs.existsSync(QUEUE_PATH) ? readQueue() : null
  const finished = new Map(
    (existing?.queue || [])
      .filter((item) => isFinished(item))
      .map((item) => [item.id, item]),
  )

  const queue = {
    version: 1,
    batchSize: BATCH_SIZE,
    lastRunAt: existing?.lastRunAt ?? null,
    currentBatchIds: [],
    currentRunStartedAt: null,
    queue: [],
  }

  for (const product of all) {
    const prev = finished.get(product.id)
    if (prev) {
      queue.queue.push({ ...prev })
      continue
    }
    const needsImage = isGenericImage(product.image, product.catalog)
    queue.queue.push({
      id: product.id,
      catalog: product.catalog,
      status: 'pending',
      needsImage,
      imageOk: !needsImage && Boolean(product.image),
      pageOk: null,
      currentImage: product.image || null,
      completedAt: null,
      note: needsImage ? 'mangler eller generisk bilde' : 'bilde finnes — verifiser URL og bilde-URL ved kjøring',
    })
  }

  queue.queue.sort((a, b) => {
    if (isFinished(a) !== isFinished(b)) return Number(isFinished(a)) - Number(isFinished(b))
    return Number(b.needsImage) - Number(a.needsImage) || a.id.localeCompare(b.id)
  })

  writeQueue(queue)
  syncMarkdown()
  const pending = queue.queue.filter((i) => i.status === 'pending').length
  console.log(JSON.stringify({ ok: true, total: queue.queue.length, pending, statusMd: 'data/product-image-status.md' }, null, 2))
}

function cmdStart() {
  const queue = readQueue()
  const pending = nextPending(queue)
  if (!pending.length) {
    syncMarkdown()
    console.log(JSON.stringify({ done: true, message: 'Ingen pending produkter.' }))
    return
  }
  const batch = pending.slice(0, BATCH_SIZE)
  queue.lastRunAt = new Date().toISOString()
  queue.currentBatchIds = batch.map((b) => b.id)
  queue.currentRunStartedAt = queue.lastRunAt
  for (const item of batch) {
    item.status = 'in_progress'
    item.attempts = (item.attempts || 0) + 1
    item.lastAttemptAt = queue.lastRunAt
  }
  writeQueue(queue)
  syncMarkdown()
  console.log(
    JSON.stringify(
      {
        ok: true,
        batchIds: queue.currentBatchIds,
        message: `Låst batch: ${queue.currentBatchIds.join(', ')}`,
        statusMd: 'data/product-image-status.md',
      },
      null,
      2,
    ),
  )
}

function cmdComplete(args) {
  const id = args.id
  const result = args.result || 'added'
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
  item.status = result === 'ok' ? 'done' : 'added'
  item.completedAt = new Date().toISOString()
  item.imageSource = args.source || null
  if (!queue.currentBatchIds?.includes(id) && item.status !== 'done') {
    console.warn(`Advarsel: ${id} var ikke i aktiv batch`)
  }
  queue.currentBatchIds = (queue.currentBatchIds || []).filter((x) => x !== id)
  if (!queue.currentBatchIds.length) {
    queue.currentRunStartedAt = null
  }
  writeQueue(queue)
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: item.status }))
}

function cmdSkip(args) {
  const id = args.id
  const reason = args.reason || 'Kunne ikke finne bilde'
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
  item.status = 'failed'
  item.completedAt = new Date().toISOString()
  item.failReason = reason
  queue.currentBatchIds = (queue.currentBatchIds || []).filter((x) => x !== id)
  if (!queue.currentBatchIds.length) queue.currentRunStartedAt = null
  writeQueue(queue)
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(REPORTS_DIR, `${id}.json`), `${JSON.stringify({ id, failedAt: item.completedAt, reason }, null, 2)}\n`)
  syncMarkdown()
  console.log(JSON.stringify({ ok: true, id, status: 'failed', reason }))
}

function cmdStatus() {
  const q = readQueue()
  const counts = q.queue.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
  console.log(
    JSON.stringify(
      {
        total: q.queue.length,
        counts,
        currentBatchIds: q.currentBatchIds,
        lastRunAt: q.lastRunAt,
        statusMd: 'data/product-image-status.md',
      },
      null,
      2,
    ),
  )
}

const args = parseArgs(process.argv)
const command = args._[0] || 'status'

switch (command) {
  case 'init':
    await cmdInit()
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
  case 'skip':
    cmdSkip(args)
    break
  case 'sync-md':
    console.log(JSON.stringify({ ok: true, ...syncMarkdown(), path: 'data/product-image-status.md' }))
    break
  default:
    console.error(`Ukjent kommando: ${command}`)
    process.exit(1)
}
