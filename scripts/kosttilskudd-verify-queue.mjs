#!/usr/bin/env node
/**
 * Kosttilskudd verification queue — én produkt per kjøring, roterer mellom kategorier.
 *
 *   node scripts/kosttilskudd-verify-queue.mjs start [--category creatine]
 *   node scripts/kosttilskudd-verify-queue.mjs next
 *   node scripts/kosttilskudd-verify-queue.mjs status
 *   node scripts/kosttilskudd-verify-queue.mjs complete --id <id> [--category creatine]
 *   node scripts/kosttilskudd-verify-queue.mjs reject --id <id> --reason "..." [--category creatine]
 *   node scripts/kosttilskudd-verify-queue.mjs sync-md [--category creatine]
 *   node scripts/kosttilskudd-verify-queue.mjs sync-master
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  KOSTTILSKUDD_CATEGORIES,
  KOSTTILSKUDD_ROTATION,
  MASTER_QUEUE_PATH,
  MASTER_STATUS_MD,
} from './kosttilskudd-categories.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->'

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

function resolveCategory(categoryId) {
  const cat = KOSTTILSKUDD_CATEGORIES[categoryId]
  if (!cat) throw new Error(`Ukjent kategori: ${categoryId}. Tilgjengelig: ${Object.keys(KOSTTILSKUDD_CATEGORIES).join(', ')}`)
  return {
    ...cat,
    queueAbs: path.join(ROOT, cat.queuePath),
    productsAbs: path.join(ROOT, cat.productsPath),
    statusAbs: path.join(ROOT, cat.statusMd),
    reportsAbs: path.join(ROOT, cat.reportsDir),
  }
}

function readQueue(cat) {
  return JSON.parse(fs.readFileSync(cat.queueAbs, 'utf8'))
}

function writeQueue(cat, queue) {
  fs.writeFileSync(cat.queueAbs, `${JSON.stringify(queue, null, 2)}\n`)
}

function readMasterQueue() {
  const p = path.join(ROOT, MASTER_QUEUE_PATH)
  if (!fs.existsSync(p)) {
    return { version: 1, rotation: KOSTTILSKUDD_ROTATION, currentCategoryIndex: 0, lastRunAt: null }
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function writeMasterQueue(q) {
  fs.writeFileSync(path.join(ROOT, MASTER_QUEUE_PATH), `${JSON.stringify(q, null, 2)}\n`)
}

function loadProductMeta(cat) {
  const src = fs.readFileSync(cat.productsAbs, 'utf8')
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

function pickActiveCategory(explicitCategory) {
  if (explicitCategory) return resolveCategory(explicitCategory)

  const master = readMasterQueue()
  const rotation = master.rotation || KOSTTILSKUDD_ROTATION

  for (let offset = 0; offset < rotation.length; offset++) {
    const idx = (master.currentCategoryIndex + offset) % rotation.length
    const catId = rotation[idx]
    const cat = resolveCategory(catId)
    const q = readQueue(cat)
    if (nextPending(q) || q.currentProductId) {
      return { cat, catId, master, rotation, idx }
    }
  }

  const catId = rotation[master.currentCategoryIndex % rotation.length]
  return { cat: resolveCategory(catId), catId, master, rotation, idx: master.currentCategoryIndex % rotation.length }
}

function buildPointerSections(q, meta, cat) {
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

Rapport ligger i \`${cat.reportsDir}/<id>.json\`.`

  const runState = q.currentProductId ? '🔒 in_progress (låst av start)' : '⏳ klar — kjør `node scripts/kosttilskudd-verify-queue.mjs start`'

  const nowBlock = currentId && currentMeta
    ? `## 2. ➡️ NÅ — TEST KUN DETTE (ÉTT PRODUKT)

| Felt | Verdi |
|------|-------|
| kategori | **${cat.label}** (\`${cat.id}\`) |
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

Alle produkter i ${cat.label} er verifisert eller avvist.`

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

Ingen produkter ferdig testet ennå i ${cat.label}.`

  return { blocklistBlock, prevBlock, nowBlock, prev, next, currentId, done }
}

function syncMarkdown(cat) {
  const q = readQueue(cat)
  const meta = loadProductMeta(cat)
  const counts = { pending: 0, verified: 0, rejected: 0 }
  for (const item of q.queue) counts[item.status] = (counts[item.status] || 0) + 1
  const { blocklistBlock, prevBlock, nowBlock, next, currentId, done } = buildPointerSections(q, meta, cat)

  const rows = q.queue
    .map((item, i) => {
      const m = meta.get(item.id) || { name: '—', brand: '—' }
      const verified = formatDate(item.verifiedAt || item.rejectedAt).slice(0, 10)
      const marker = item.id === currentId && q.currentProductId ? ' **← NÅ**' : item.id === q.lastCompletedId ? ' ← forrige' : ''
      return `| ${i + 1} | ${item.id}${marker} | ${m.brand} | ${m.name} | ${statusEmoji(item.status)} | ${verified} |`
    })
    .join('\n')

  let existingMd = fs.existsSync(cat.statusAbs) ? fs.readFileSync(cat.statusAbs, 'utf8') : ''
  let logSection = ''
  const logIdx = existingMd.indexOf('## Kjøringslogg')
  if (logIdx !== -1) {
    const instrIdx = existingMd.indexOf('## Instruks', logIdx)
    logSection = instrIdx !== -1 ? existingMd.slice(logIdx, instrIdx).trimEnd() : existingMd.slice(logIdx).trimEnd()
  } else {
    logSection = `## Kjøringslogg\n\n${LOG_MARKER}\n`
  }

  const md = `# ${cat.label} — verifiseringsstatus

> **STOPP:** Les seksjon **1** (ferdig testet) og **2** (nå) før du gjør noe. Test **aldri** produkter i seksjon 1.

${blocklistBlock}

${nowBlock}

${prevBlock}

## Oppsummering

| Felt | Verdi |
|------|-------|
| Kategori | ${cat.label} |
| Verifisert | ${counts.verified || 0} / ${q.queue.length} |
| Avvist | ${counts.rejected || 0} |
| Gjenstår | ${counts.pending || 0} |
| Neste i kø | \`${next?.id ?? '—'}\` |
| Siste kjøring | ${q.lastRunAt ? formatDate(q.lastRunAt) : '—'} |

## Produktkø

| # | ID | Merke | Navn | Status | Verifisert |
|---|-----|-------|------|--------|------------|
${rows}

${logSection}

## Instruks (automasjon)

1. Les **seksjon 1** (🚫 ferdig testet) — disse ID-ene er **forbudt**.
2. Les **seksjon 2** (➡️ NÅ) — dette er det **eneste** produktet du skal teste.
3. \`node scripts/kosttilskudd-verify-queue.mjs start --category ${cat.id}\` → låser produktet under **NÅ**.
4. Verifiser **kun** productId fra seksjon 2 mot ekte butikkside.
5. Oppdater \`${cat.productsPath}\` + \`${cat.reportsDir}/<id>.json\`.
6. \`node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category ${cat.id}\` eller \`reject\`.
7. \`node scripts/kosttilskudd-verify-queue.mjs sync-md --category ${cat.id}\`.
8. Legg til oppføring i **Kjøringslogg**.
9. \`npm run build\` → commit → push.
`

  fs.writeFileSync(cat.statusAbs, md)
  return { verified: counts.verified, pending: counts.pending, currentId, previousId: q.lastCompletedId, category: cat.id }
}

function syncMasterMarkdown() {
  const master = readMasterQueue()
  const rotation = master.rotation || KOSTTILSKUDD_ROTATION
  const sections = rotation.map((catId) => {
    const cat = resolveCategory(catId)
    const q = readQueue(cat)
    const counts = q.queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})
    const next = nextPending(q)
    return `### ${cat.label} (\`${catId}\`)

| Verifisert | Gjenstår | Neste | Status-MD |
|------------|----------|-------|-----------|
| ${counts.verified || 0}/${q.queue.length} | ${counts.pending || 0} | \`${next?.id ?? 'ferdig'}\` | [\`${cat.statusMd}\`](${cat.statusMd}) |`
  })

  const md = `# Kosttilskudd faktasjekk — master status

> Les kategori-spesifikk status-MD for detaljer. Én produkt per automasjonskjøring.

## Aktiv rotasjon

${sections.join('\n\n')}

## Kommandoer

\`\`\`bash
node scripts/kosttilskudd-verify-queue.mjs start          # auto-velg kategori med pending
node scripts/kosttilskudd-verify-queue.mjs start --category creatine
node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category creatine
node scripts/kosttilskudd-verify-queue.mjs sync-master
\`\`\`

Siste master-kjøring: ${master.lastRunAt ? formatDate(master.lastRunAt) : '—'}
`

  fs.writeFileSync(path.join(ROOT, MASTER_STATUS_MD), md)
}

function runContext(cat) {
  const q = readQueue(cat)
  const meta = loadProductMeta(cat)
  const prev = lastCompletedItem(q)
  const next = nextPending(q)
  const testNowId = q.currentProductId || next?.id
  const blocked = blockedIds(q)
  return {
    category: cat.id,
    categoryLabel: cat.label,
    previousProduct: prev ? labelFor(prev.id, meta) : null,
    previousStatus: prev?.status ?? null,
    testNowProduct: testNowId ? labelFor(testNowId, meta) : null,
    testNowLocked: Boolean(q.currentProductId),
    doNotTestIds: blocked,
    done: !next && !q.currentProductId,
    statusMd: cat.statusMd,
  }
}

function cmdStart(args) {
  const picked = pickActiveCategory(args.category)
  const cat = picked.cat || picked
  const catId = picked.catId || args.category

  const queue = readQueue(cat)
  clearStaleLock(queue)
  const next = nextPending(queue)
  if (!next) {
    writeQueue(cat, queue)
    syncMarkdown(cat)
    syncMasterMarkdown()
    console.log(JSON.stringify({ done: true, category: catId, message: `Ingen pending produkter i ${cat.label}.` }))
    return
  }
  if (isFinished(next)) {
    console.error(`FEIL: Neste produkt ${next.id} er allerede ferdig (${next.status}).`)
    process.exit(1)
  }
  const blocked = blockedIds(queue)
  if (blocked.includes(next.id)) {
    console.error(`FEIL: ${next.id} står i ferdig-testet-listen.`)
    process.exit(1)
  }
  const now = new Date().toISOString()
  queue.lastRunAt = now
  queue.currentProductId = next.id
  queue.currentRunStartedAt = now
  next.attempts = (next.attempts || 0) + 1
  next.lastAttemptAt = now
  writeQueue(cat, queue)

  const master = readMasterQueue()
  master.lastRunAt = now
  master.lastCategory = catId
  if (picked.rotation && picked.idx != null) {
    master.currentCategoryIndex = (picked.idx + 1) % picked.rotation.length
  }
  writeMasterQueue(master)

  const sync = syncMarkdown(cat)
  syncMasterMarkdown()
  const ctx = runContext(cat)
  console.log(
    JSON.stringify(
      {
        ok: true,
        lockedProductId: next.id,
        category: catId,
        ...ctx,
        message: `Låst: test KUN ${next.id} (${cat.label}). IKKE test: ${ctx.doNotTestIds.join(', ') || 'ingen'}.`,
        sync,
      },
      null,
      2,
    ),
  )
}

function cmdNext(args) {
  const picked = pickActiveCategory(args.category)
  const cat = picked.cat || picked
  const queue = readQueue(cat)
  const ctx = runContext(cat)
  if (ctx.done) {
    console.log(JSON.stringify({ done: true, category: cat.id, message: 'Alle produkter er verifisert eller avvist.', statusMd: cat.statusMd }))
    return
  }
  const productId = queue.currentProductId || nextPending(queue).id
  console.log(JSON.stringify({ done: false, ...ctx, productId, reportPath: `${cat.reportsDir}/${productId}.json` }, null, 2))
}

function cmdStatus(args) {
  const results = {}
  for (const catId of Object.keys(KOSTTILSKUDD_CATEGORIES)) {
    const cat = resolveCategory(catId)
    const q = readQueue(cat)
    const ctx = runContext(cat)
    const counts = q.queue.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {})
    results[catId] = { ...ctx, counts, total: q.queue.length }
  }
  console.log(JSON.stringify({ categories: results, masterStatusMd: MASTER_STATUS_MD }, null, 2))
}

function cmdComplete(args) {
  const catId = args.category
  if (!catId) {
    console.error('Mangler --category (f.eks. --category creatine)')
    process.exit(1)
  }
  const cat = resolveCategory(catId)
  const id = args.id
  if (!id) {
    console.error('Mangler --id')
    process.exit(1)
  }
  const queue = readQueue(cat)
  const item = queue.queue.find((e) => e.id === id)
  if (!item) {
    console.error(`Ukjent id: ${id}`)
    process.exit(1)
  }
  if (isFinished(item)) {
    console.error(`FEIL: ${id} er allerede ${item.status}.`)
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
  writeQueue(cat, queue)
  syncMarkdown(cat)
  syncMasterMarkdown()
  console.log(JSON.stringify({ ok: true, id, category: catId, status: 'verified', nextTest: nextPending(readQueue(cat))?.id ?? null }))
}

function cmdReject(args) {
  const catId = args.category
  if (!catId) {
    console.error('Mangler --category')
    process.exit(1)
  }
  const cat = resolveCategory(catId)
  const id = args.id
  const reason = args.reason || 'Produktet finnes ikke eller kunne ikke verifiseres'
  if (!id) {
    console.error('Mangler --id')
    process.exit(1)
  }
  const queue = readQueue(cat)
  const item = queue.queue.find((e) => e.id === id)
  if (!item) {
    console.error(`Ukjent id: ${id}`)
    process.exit(1)
  }
  if (isFinished(item)) {
    console.error(`FEIL: ${id} er allerede ${item.status}.`)
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
  writeQueue(cat, queue)
  fs.mkdirSync(cat.reportsAbs, { recursive: true })
  fs.writeFileSync(
    path.join(cat.reportsAbs, `${id}.json`),
    `${JSON.stringify({ id, exists: false, rejectedAt: item.rejectedAt, reason, category: catId }, null, 2)}\n`,
  )
  syncMarkdown(cat)
  syncMasterMarkdown()
  console.log(JSON.stringify({ ok: true, id, category: catId, status: 'rejected', reason }))
}

const args = parseArgs(process.argv)
const command = args._[0] || 'status'

switch (command) {
  case 'next':
    cmdNext(args)
    break
  case 'start':
    cmdStart(args)
    break
  case 'status':
    cmdStatus(args)
    break
  case 'complete':
    cmdComplete(args)
    break
  case 'reject':
    cmdReject(args)
    break
  case 'sync-md':
    if (!args.category) {
      console.error('Mangler --category')
      process.exit(1)
    }
    console.log(JSON.stringify({ ok: true, ...syncMarkdown(resolveCategory(args.category)) }))
    break
  case 'sync-master':
    syncMasterMarkdown()
    console.log(JSON.stringify({ ok: true, path: MASTER_STATUS_MD }))
    break
  default:
    console.error(`Ukjent kommando: ${command}`)
    process.exit(1)
}
