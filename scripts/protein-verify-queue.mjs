#!/usr/bin/env node
/**
 * Protein verification queue — én produkt per kjøring (cron hvert 5. min).
 *
 * FERDIG = har ekte produktbilde i public/images/protein/ (ikke generisk placeholder).
 * Mangler bilde = ikke ferdig analysert — skal testes neste.
 *
 *   node scripts/protein-verify-queue.mjs audit    → bilde-sjekk (kjør FØRST hver kjøring)
 *   node scripts/protein-verify-queue.mjs start    → lås neste produkt uten bilde
 *   node scripts/protein-verify-queue.mjs next     → neste uten bilde (JSON)
 *   node scripts/protein-verify-queue.mjs status     → oversikt (JSON)
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
const IMAGES_DIR = path.join(ROOT, 'public/images/protein')
const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->'
const LIST_URL = 'https://kosttest.no/tester/protein/'
const GENERIC_IMAGE_MARKERS = ['protein_whey_generic', 'dw8a8c8c8c']

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
  const blockRe = /\{\s*\n\s*id:\s*'([^']+)'([\s\S]*?)\n\s*\},/g
  let m
  while ((m = blockRe.exec(src)) !== null) {
    const id = m[1]
    const block = m[2]
    const name = block.match(/name:\s*'([^']+)'/)?.[1] ?? '—'
    const brand = block.match(/brand:\s*'([^']+)'/)?.[1] ?? '—'
    const url = block.match(/url:\s*'([^']+)'/)?.[1] ?? '—'
    const image = block.match(/image:\s*(?:'([^']+)'|IMG)/)?.[1] ?? (block.includes('image: IMG') ? 'IMG' : '—')
    meta.set(id, { name, brand, url, image })
  }
  return meta
}

function imageFilePath(imagePath) {
  if (!imagePath || imagePath === 'IMG' || imagePath === '—') return null
  if (imagePath.startsWith('/images/protein/')) {
    return path.join(ROOT, 'public', imagePath)
  }
  return null
}

function hasRealProductImage(id, imagePath) {
  if (!imagePath || imagePath === 'IMG' || imagePath === '—') return false
  if (GENERIC_IMAGE_MARKERS.some((marker) => imagePath.includes(marker))) return false
  if (imagePath.startsWith('http')) return false
  const filePath = imageFilePath(imagePath)
  if (!filePath) return false
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 1000
}

function buildImageAudit(meta) {
  const withImage = []
  const withoutImage = []
  for (const [id, m] of meta) {
    const entry = {
      id,
      brand: m.brand,
      name: m.name,
      image: m.image,
      hasRealImage: hasRealProductImage(id, m.image),
    }
    if (entry.hasRealImage) withImage.push(entry)
    else withoutImage.push(entry)
  }
  return { withImage, withoutImage, total: meta.size }
}

function labelFor(id, meta) {
  const m = meta.get(id)
  if (!m) return { id, brand: '—', name: '—', url: '—', image: '—', hasRealImage: false }
  return { id, ...m, hasRealImage: hasRealProductImage(id, m.image) }
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

function isRejected(item) {
  return item.status === 'rejected'
}

function isFinished(item, meta) {
  if (isRejected(item)) return true
  const m = meta.get(item.id)
  return hasRealProductImage(item.id, m?.image)
}

function nextPending(queue, meta) {
  return queue.queue.find((item) => !isRejected(item) && !isFinished(item, meta))
}

function completedItems(queue, meta) {
  return queue.queue.filter((item) => isFinished(item, meta))
}

function blockedIds(queue, meta) {
  return completedItems(queue, meta).map((item) => item.id)
}

function clearStaleLock(queue, meta) {
  if (!queue.currentProductId) return false
  const current = queue.queue.find((e) => e.id === queue.currentProductId)
  if (current && isFinished(current, meta)) {
    queue.currentProductId = null
    queue.currentRunStartedAt = null
    return true
  }
  return false
}

function lastCompletedItem(queue, meta) {
  let best = null
  let bestTs = 0
  for (const item of queue.queue) {
    if (!isFinished(item, meta) || isRejected(item)) continue
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
  const audit = buildImageAudit(meta)
  const prev = lastCompletedItem(q, meta)
  const next = nextPending(q, meta)
  const currentId = q.currentProductId || next?.id
  const currentItem = currentId ? q.queue.find((e) => e.id === currentId) : null
  const currentMeta = currentId ? labelFor(currentId, meta) : null
  const prevMeta = prev ? labelFor(prev.id, meta) : null
  const done = completedItems(q, meta)

  const blockRows = done.length
    ? done
        .map((item) => {
          const m = labelFor(item.id, meta)
          const when = formatDate(item.verifiedAt || item.rejectedAt)
          const result = item.status === 'rejected' ? '❌ rejected' : '✅ ferdig (har bilde)'
          return `| \`${item.id}\` | ${m.brand} | ${m.name} | ${when} | ${result} |`
        })
        .join('\n')
    : '| — | — | Ingen ferdig ennå | — | — |'

  const missingRows = audit.withoutImage.length
    ? audit.withoutImage
        .map((item) => {
          const queueItem = q.queue.find((e) => e.id === item.id)
          const qStatus = queueItem ? statusEmoji(queueItem.status) : '—'
          const marker = item.id === currentId ? ' **← NESTE**' : ''
          return `| \`${item.id}\`${marker} | ${item.brand} | ${item.name} | ${qStatus} | 🖼️ mangler |`
        })
        .join('\n')
    : '| — | — | Alle har bilde | — | — |'

  const blocklistBlock = `## 1. 🚫 FERDIG ANALYSERT — HAR BILDE (ALDRI TEST IGJEN)

> **Regel:** Produkt med ekte bilde i \`public/images/protein/\` = ferdig. Generisk placeholder = IKKE ferdig.

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
${blockRows}

**FORBUDT å teste på nytt:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ennå'}

Sjekk live-liste: ${LIST_URL}`

  const missingBlock = `## 1b. 🖼️ MANGLER BILDE — IKKE FERDIG ANALYSERT

| productId | Merke | Navn | Kø-status | Bilde |
|-----------|-------|------|-----------|-------|
${missingRows}

**${audit.withoutImage.length} produkter uten ekte bilde.** Disse skal verifiseres — ta screenshot av listen og sammenlign.`

  const runState = q.currentProductId ? '🔒 in_progress (låst av start)' : '⏳ klar — kjør `node scripts/protein-verify-queue.mjs start`'

  const nowBlock = currentId && currentMeta
    ? `## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| productId | \`${currentId}\` |
| merke | ${currentMeta.brand} |
| navn | ${currentMeta.name} |
| url i repo (sjekk/fiks) | ${currentMeta.url} |
| har bilde | ${currentMeta.hasRealImage ? '✅ ja (FEIL — skal ikke testes)' : '🖼️ nei — må hentes'} |
| kø-status | ${currentItem ? statusEmoji(currentItem.status) : '—'} |
| kjøring | ${runState} |
| startet | ${q.currentRunStartedAt ? formatDate(q.currentRunStartedAt) : '—'} |

**TEST KUN \`${currentId}\` i denne kjøringen.** Husk: last ned produktbilde til \`public/images/protein/${currentId}.jpg\` før \`complete\`.

**IKKE test:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ferdige ennå'}`
    : `## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

Alle produkter har bilde eller er avvist. Ingen oppgave igjen.`

  const prevBlock = prev
    ? `## 3. ⬅️ Sist ferdig (referanse — ikke test igjen)

| Felt | Verdi |
|------|-------|
| productId | \`${prev.id}\` |
| merke | ${prevMeta.brand} |
| navn | ${prevMeta.name} |
| resultat | ${prev.status === 'rejected' ? '❌ rejected' : '✅ ferdig (har bilde)'} |
| ferdig | ${formatDate(prev.verifiedAt || prev.rejectedAt)} |

Sist ferdig var \`${prev.id}\`. Neste uten bilde: \`${next?.id ?? '—'}\`.`
    : `## 3. ⬅️ Sist ferdig (referanse)

Ingen produkter ferdig med bilde ennå.`

  return { blocklistBlock, missingBlock, prevBlock, nowBlock, prev, next, currentId, done, audit }
}

function syncMarkdown() {
  const q = readQueue()
  const meta = loadProductMeta()
  const counts = { pending: 0, verified: 0, rejected: 0, withImage: 0, withoutImage: 0 }
  const audit = buildImageAudit(meta)
  counts.withImage = audit.withImage.length
  counts.withoutImage = audit.withoutImage.length
  for (const item of q.queue) counts[item.status] = (counts[item.status] || 0) + 1
  const { blocklistBlock, missingBlock, prevBlock, nowBlock, next, currentId, done } = buildPointerSections(q, meta)

  const rows = q.queue
    .map((item, i) => {
      const m = meta.get(item.id) || { name: '—', brand: '—', image: '—' }
      const verified = formatDate(item.verifiedAt || item.rejectedAt).slice(0, 10)
      const img = hasRealProductImage(item.id, m.image) ? '🖼️ ✅' : '🖼️ ❌'
      const marker = item.id === currentId && q.currentProductId ? ' **← NÅ**' : item.id === q.lastCompletedId ? ' ← forrige' : ''
      return `| ${i + 1} | ${item.id}${marker} | ${m.brand} | ${m.name} | ${statusEmoji(item.status)} | ${img} | ${verified} |`
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

> **STOPP:** Les seksjon **1** (ferdig med bilde) og **1b** (mangler bilde) før du gjør noe.
> **Regel:** Ingen ekte produktbilde = ikke ferdig analysert — selv om køen sier «verified».

${blocklistBlock}

${missingBlock}

${nowBlock}

${prevBlock}

## Oppsummering

| Felt | Verdi |
|------|-------|
| Ferdig (har bilde) | ${counts.withImage} / ${audit.total} |
| Mangler bilde | ${counts.withoutImage} |
| Avvist | ${counts.rejected || 0} |
| Neste uten bilde | \`${next?.id ?? '—'}\` |
| Siste kjøring | ${q.lastRunAt ? formatDate(q.lastRunAt) : '—'} |
| Live-liste | ${LIST_URL} |
| Cron | \`*/5 * * * *\` (hvert 5. min) |

## Produktkø

| # | ID | Merke | Navn | Kø | Bilde | Dato |
|---|-----|-------|------|-----|-------|------|
${rows}

${logSection}

## Instruks (automasjon)

1. **Screenshot:** Ta bilde av ${LIST_URL} — produkter uten ekte bilde er ikke ferdig.
2. \`node scripts/protein-verify-queue.mjs audit\` → bekreft hvem som mangler bilde.
3. Les **seksjon 1** (🚫 ferdig med bilde) — disse ID-ene er **forbudt**.
4. Les **seksjon 2** (➡️ NÅ) — dette er det **eneste** produktet du skal teste.
5. \`node scripts/protein-verify-queue.mjs start\` → låser neste produkt **uten bilde**.
6. Verifiser mot ekte butikkside + **last ned produktbilde** til \`public/images/protein/<id>.jpg\`.
7. Oppdater \`src/data/proteinProducts.ts\` + \`data/protein-verifications/<id>.json\`.
8. \`node scripts/protein-verify-queue.mjs complete --id <id>\` (feiler uten bilde) eller \`reject\`.
9. \`node scripts/protein-verify-queue.mjs sync-md\` → oppdater seksjon 1 og 2.
10. Legg til oppføring i **Kjøringslogg**.
11. \`npm run build\` → commit → push.
`

  fs.writeFileSync(STATUS_MD, md)
  return { withImage: counts.withImage, withoutImage: counts.withoutImage, currentId, previousId: q.lastCompletedId }
}

function runContext() {
  const q = readQueue()
  const meta = loadProductMeta()
  const audit = buildImageAudit(meta)
  const prev = lastCompletedItem(q, meta)
  const next = nextPending(q, meta)
  const testNowId = q.currentProductId || next?.id
  const blocked = blockedIds(q, meta)
  return {
    listUrl: LIST_URL,
    imageAudit: audit,
    previousProduct: prev ? labelFor(prev.id, meta) : null,
    previousStatus: prev?.status ?? null,
    testNowProduct: testNowId ? labelFor(testNowId, meta) : null,
    testNowLocked: Boolean(q.currentProductId),
    doNotTestIds: blocked,
    missingImageIds: audit.withoutImage.map((i) => i.id),
    done: !next && !q.currentProductId,
  }
}

function cmdAudit() {
  const meta = loadProductMeta()
  const audit = buildImageAudit(meta)
  const ctx = runContext()
  console.log(
    JSON.stringify(
      {
        ok: true,
        listUrl: LIST_URL,
        rule: 'Produkt uten ekte bilde i public/images/protein/ = ikke ferdig analysert',
        withImage: audit.withImage,
        withoutImage: audit.withoutImage,
        nextWithoutImage: ctx.testNowProduct,
        doNotTestIds: ctx.doNotTestIds,
        message: `${audit.withImage.length} har bilde, ${audit.withoutImage.length} mangler. Neste: ${ctx.testNowProduct?.id ?? 'ingen'}. Ta screenshot av ${LIST_URL} og sammenlign.`,
        statusMd: 'data/protein-verification-status.md',
      },
      null,
      2,
    ),
  )
}

function cmdNext() {
  const queue = readQueue()
  const ctx = runContext()
  if (ctx.done) {
    console.log(JSON.stringify({ done: true, message: 'Alle produkter har bilde eller er avvist.', statusMd: 'data/protein-verification-status.md' }))
    return
  }
  const productId = queue.currentProductId || nextPending(queue, loadProductMeta()).id
  const reportPath = path.join(REPORTS_DIR, `${productId}.json`)
  console.log(
    JSON.stringify(
      {
        done: false,
        ...ctx,
        productId,
        reportPath,
        statusMd: 'data/protein-verification-status.md',
        instructions: `Test KUN ${productId} (mangler bilde). Forrige ferdig: ${ctx.previousProduct?.id ?? 'ingen'}. Ta screenshot av ${LIST_URL}. Les data/protein-verification-status.md.`,
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
  const meta = loadProductMeta()
  clearStaleLock(queue, meta)
  const next = nextPending(queue, meta)
  if (!next) {
    writeQueue(queue)
    syncMarkdown()
    console.log(JSON.stringify({ done: true, message: 'Alle produkter har bilde eller er avvist.' }))
    return
  }
  const blocked = blockedIds(queue, meta)
  if (blocked.includes(next.id)) {
    console.error(`FEIL: ${next.id} har allerede bilde. Skal ikke startes på nytt.`)
    process.exit(1)
  }
  if (isRejected(next)) {
    console.error(`FEIL: ${next.id} er avvist.`)
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
        reason: 'mangler produktbilde',
        listUrl: LIST_URL,
        previousProduct: ctx.previousProduct,
        testNowProduct: ctx.testNowProduct,
        doNotTestIds: ctx.doNotTestIds,
        missingImageIds: ctx.missingImageIds,
        message: `Låst oppgave: test KUN ${next.id} (mangler bilde). Ferdig med bilde: ${ctx.doNotTestIds.join(', ') || 'ingen'}. Ta screenshot av ${LIST_URL}.`,
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
  const meta = loadProductMeta()
  const m = meta.get(id)
  if (!m) {
    console.error(`Ukjent id: ${id}`)
    process.exit(1)
  }
  if (!hasRealProductImage(id, m.image)) {
    console.error(
      `FEIL: ${id} mangler ekte produktbilde. Last ned bilde til public/images/protein/${id}.jpg og oppdater image i proteinProducts.ts før complete.`,
    )
    process.exit(1)
  }
  const item = queue.queue.find((e) => e.id === id)
  if (!item) {
    console.error(`Ukjent id i kø: ${id}`)
    process.exit(1)
  }
  if (isRejected(item)) {
    console.error(`FEIL: ${id} er avvist.`)
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
  console.log(JSON.stringify({ ok: true, id, status: 'verified', nextTest: nextPending(readQueue(), loadProductMeta())?.id ?? null, statusMd: 'data/protein-verification-status.md' }))
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
  if (isRejected(item)) {
    console.error(`FEIL: ${id} er allerede avvist.`)
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
  console.log(JSON.stringify({ ok: true, id, status: 'rejected', reason, nextTest: nextPending(readQueue(), loadProductMeta())?.id ?? null, statusMd: 'data/protein-verification-status.md' }))
}

const args = parseArgs(process.argv)
const command = args._[0] || 'status'

switch (command) {
  case 'audit':
    cmdAudit()
    break
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
