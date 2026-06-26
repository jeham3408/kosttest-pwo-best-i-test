/**
 * Delt logikk for kosttilskudd-verifisering (kreatin, protein, fremtidige kategorier).
 * Brukes av scripts/kosttilskudd-verify-queue.mjs
 */

import fs from 'fs'
import path from 'path'

export const CATEGORY_CONFIGS = {
  creatine: {
    id: 'creatine',
    label: 'Kreatin',
    productsTs: 'src/data/creatineProducts.ts',
    queueJson: 'src/data/creatineVerificationQueue.json',
    statusMd: 'data/creatine-verification-status.md',
    reportsDir: 'data/creatine-verifications',
    imagesDir: 'public/images/creatine',
    listUrl: 'https://kosttest.no/tester/kreatin/',
    genericImageMarkers: ['creatine_generic', 'dw8a8c8c8c', 'protein_whey_generic'],
    imagePathPrefix: '/images/creatine/',
  },
  protein: {
    id: 'protein',
    label: 'Proteinpulver',
    productsTs: 'src/data/proteinProducts.ts',
    queueJson: 'src/data/proteinVerificationQueue.json',
    statusMd: 'data/protein-verification-status.md',
    reportsDir: 'data/protein-verifications',
    imagesDir: 'public/images/protein',
    listUrl: 'https://kosttest.no/tester/protein/',
    genericImageMarkers: ['protein_whey_generic', 'dw8a8c8c8c'],
    imagePathPrefix: '/images/protein/',
  },
}

const LOG_MARKER = '<!-- AGENT: Legg til nytt avsnitt øverst etter hver kjøring. Maks én produkt per kjøring. -->'

export function parseArgs(argv) {
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

export function createCategoryQueue(root, config) {
  const QUEUE_PATH = path.join(root, config.queueJson)
  const STATUS_MD = path.join(root, config.statusMd)
  const PRODUCTS_TS = path.join(root, config.productsTs)
  const REPORTS_DIR = path.join(root, config.reportsDir)
  const IMAGES_DIR = path.join(root, config.imagesDir)

  function readQueue() {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'))
  }

  function writeQueue(queue) {
    fs.writeFileSync(QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`)
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
    if (imagePath.startsWith(config.imagePathPrefix)) {
      return path.join(root, 'public', imagePath)
    }
    return null
  }

  function hasRealProductImage(id, imagePath) {
    if (!imagePath || imagePath === 'IMG' || imagePath === '—') return false
    if (config.genericImageMarkers.some((marker) => imagePath.includes(marker))) return false
    if (imagePath.startsWith('http')) return false
    const filePath = imageFilePath(imagePath)
    if (!filePath) return false
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 1000
  }

  function buildImageAudit(meta) {
    const withImage = []
    const withoutImage = []
    for (const [id, m] of meta) {
      const entry = { id, brand: m.brand, name: m.name, image: m.image, hasRealImage: hasRealProductImage(id, m.image) }
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

> **Regel:** Produkt med ekte bilde i \`${config.imagesDir}/\` = ferdig. Generisk placeholder = IKKE ferdig.

| productId | Merke | Navn | Ferdig | Resultat |
|-----------|-------|------|--------|----------|
${blockRows}

**FORBUDT å teste på nytt:** ${done.length ? done.map((i) => `\`${i.id}\``).join(', ') : 'ingen ennå'}

Sjekk live-liste: ${config.listUrl}`

    const missingBlock = `## 1b. 🖼️ MANGLER BILDE — IKKE FERDIG ANALYSERT

| productId | Merke | Navn | Kø-status | Bilde |
|-----------|-------|------|-----------|-------|
${missingRows}

**${audit.withoutImage.length} produkter uten ekte bilde.** Disse skal verifiseres.`

    const runState = q.currentProductId ? '🔒 in_progress (låst av start)' : '⏳ klar — kjør start'

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

**TEST KUN \`${currentId}\` i denne kjøringen.** Last ned bilde til \`${config.imagesDir}/${currentId}.jpg\` før complete.

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
    const { blocklistBlock, missingBlock, prevBlock, nowBlock, next, currentId } = buildPointerSections(q, meta)

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

    const md = `# ${config.label} verifisering — status

> **STOPP:** Les seksjon **1** (ferdig med bilde) og **1b** (mangler bilde) før du gjør noe.
> **Regel:** Ingen ekte produktbilde = ikke ferdig analysert.

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
| Live-liste | ${config.listUrl} |

## Produktkø

| # | ID | Merke | Navn | Kø | Bilde | Dato |
|---|-----|-------|------|-----|-------|------|
${rows}

${logSection}

## Instruks (automasjon)

1. Screenshot av ${config.listUrl} — produkter uten ekte bilde er ikke ferdig.
2. Les **seksjon 1** (🚫 ferdig) og **seksjon 2** (➡️ NÅ).
3. Verifiser mot ekte butikkside + last ned bilde til \`${config.imagesDir}/<id>.jpg\`.
4. Oppdater \`${config.productsTs}\` + \`${config.reportsDir}/<id>.json\`.
5. Kjør complete (feiler uten bilde) eller reject.
6. \`npm run build\` → commit → push.
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
      category: config.id,
      categoryLabel: config.label,
      listUrl: config.listUrl,
      imageAudit: audit,
      previousProduct: prev ? labelFor(prev.id, meta) : null,
      previousStatus: prev?.status ?? null,
      testNowProduct: testNowId ? labelFor(testNowId, meta) : null,
      testNowLocked: Boolean(q.currentProductId),
      doNotTestIds: blocked,
      missingImageIds: audit.withoutImage.map((i) => i.id),
      done: !next && !q.currentProductId,
      pendingCount: audit.withoutImage.length,
    }
  }

  function cmdAudit() {
    const meta = loadProductMeta()
    const audit = buildImageAudit(meta)
    const ctx = runContext()
    return {
      ok: true,
      category: config.id,
      listUrl: config.listUrl,
      withImage: audit.withImage,
      withoutImage: audit.withoutImage,
      nextWithoutImage: ctx.testNowProduct,
      doNotTestIds: ctx.doNotTestIds,
      pendingCount: ctx.pendingCount,
      statusMd: config.statusMd,
    }
  }

  function cmdStart() {
    const queue = readQueue()
    const meta = loadProductMeta()
    clearStaleLock(queue, meta)
    const next = nextPending(queue, meta)
    if (!next) {
      writeQueue(queue)
      syncMarkdown()
      return { done: true, category: config.id, message: 'Alle produkter har bilde eller er avvist.' }
    }
    const blocked = blockedIds(queue, meta)
    if (blocked.includes(next.id)) {
      throw new Error(`FEIL: ${next.id} har allerede bilde.`)
    }
    queue.lastRunAt = new Date().toISOString()
    queue.currentProductId = next.id
    queue.currentRunStartedAt = queue.lastRunAt
    next.attempts = (next.attempts || 0) + 1
    next.lastAttemptAt = queue.lastRunAt
    writeQueue(queue)
    syncMarkdown()
    const ctx = runContext()
    return {
      ok: true,
      category: config.id,
      lockedProductId: next.id,
      reason: 'mangler produktbilde',
      ...ctx,
      statusMd: config.statusMd,
      productsTs: config.productsTs,
      reportsDir: config.reportsDir,
      imagesDir: config.imagesDir,
    }
  }

  function cmdComplete(id) {
    if (!id) throw new Error('Mangler --id')
    const queue = readQueue()
    const meta = loadProductMeta()
    const m = meta.get(id)
    if (!m) throw new Error(`Ukjent id: ${id}`)
    if (!hasRealProductImage(id, m.image)) {
      throw new Error(`FEIL: ${id} mangler ekte produktbilde i ${config.imagesDir}/${id}.jpg`)
    }
    const item = queue.queue.find((e) => e.id === id)
    if (!item) throw new Error(`Ukjent id i kø: ${id}`)
    if (isRejected(item)) throw new Error(`FEIL: ${id} er avvist.`)
    if (queue.currentProductId && queue.currentProductId !== id) {
      throw new Error(`Feil produkt: låst til ${queue.currentProductId}, ikke ${id}`)
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
    return { ok: true, category: config.id, id, status: 'verified', nextTest: nextPending(readQueue(), loadProductMeta())?.id ?? null }
  }

  function cmdReject(id, reason) {
    if (!id) throw new Error('Mangler --id')
    const queue = readQueue()
    const item = queue.queue.find((e) => e.id === id)
    if (!item) throw new Error(`Ukjent id: ${id}`)
    if (isRejected(item)) throw new Error(`FEIL: ${id} er allerede avvist.`)
    if (queue.currentProductId && queue.currentProductId !== id) {
      throw new Error(`Feil produkt: låst til ${queue.currentProductId}, ikke ${id}`)
    }
    item.status = 'rejected'
    item.rejectedAt = new Date().toISOString()
    item.rejectReason = reason || 'Produktet finnes ikke eller kunne ikke verifiseres'
    queue.lastCompletedId = id
    queue.lastCompletedStatus = 'rejected'
    queue.lastRunAt = item.rejectedAt
    queue.currentProductId = null
    queue.currentRunStartedAt = null
    writeQueue(queue)
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
    fs.writeFileSync(
      path.join(REPORTS_DIR, `${id}.json`),
      `${JSON.stringify({ id, exists: false, rejectedAt: item.rejectedAt, reason: item.rejectReason }, null, 2)}\n`,
    )
    syncMarkdown()
    return { ok: true, category: config.id, id, status: 'rejected', reason: item.rejectReason }
  }

  return {
    config,
    readQueue,
    writeQueue,
    loadProductMeta,
    hasRealProductImage,
    nextPending,
    runContext,
    syncMarkdown,
    cmdAudit,
    cmdStart,
    cmdComplete,
    cmdReject,
  }
}
