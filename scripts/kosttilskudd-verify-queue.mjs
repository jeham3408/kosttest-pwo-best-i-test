#!/usr/bin/env node
/**
 * Kosttilskudd verifisering — roterer mellom kategorier (kreatin → protein → …).
 * Én produkt per kjøring (cron hver time).
 *
 *   node scripts/kosttilskudd-verify-queue.mjs audit
 *   node scripts/kosttilskudd-verify-queue.mjs start
 *   node scripts/kosttilskudd-verify-queue.mjs status
 *   node scripts/kosttilskudd-verify-queue.mjs complete --id <id> --category <creatine|protein>
 *   node scripts/kosttilskudd-verify-queue.mjs reject --id <id> --category <creatine|protein> --reason "..."
 *   node scripts/kosttilskudd-verify-queue.mjs sync-md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CATEGORY_CONFIGS, createCategoryQueue, parseArgs } from './lib/category-verify-queue.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const MASTER_PATH = path.join(ROOT, 'src/data/kosttilskuddMasterQueue.json')
const MASTER_STATUS_MD = path.join(ROOT, 'data/kosttilskudd-verification-status.md')

function readMaster() {
  return JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'))
}

function writeMaster(master) {
  fs.writeFileSync(MASTER_PATH, `${JSON.stringify(master, null, 2)}\n`)
}

function getCategoryQueue(categoryId) {
  const config = CATEGORY_CONFIGS[categoryId]
  if (!config) throw new Error(`Ukjent kategori: ${categoryId}`)
  return createCategoryQueue(ROOT, config)
}

function enabledCategories(master) {
  return master.categories.filter((c) => c.enabled).map((c) => c.id)
}

function pickNextCategory(master) {
  const enabled = enabledCategories(master)
  if (!enabled.length) return null

  const audits = enabled.map((id) => {
    const q = getCategoryQueue(id)
    const ctx = q.runContext()
    return { id, label: CATEGORY_CONFIGS[id].label, pendingCount: ctx.pendingCount, done: ctx.done }
  })

  const withPending = audits.filter((a) => !a.done && a.pendingCount > 0)
  if (!withPending.length) return null

  const lastIdx = master.lastCategory ? enabled.indexOf(master.lastCategory) : -1
  const rotated = [...enabled.slice(lastIdx + 1), ...enabled.slice(0, lastIdx + 1)]
  for (const catId of rotated) {
    const match = withPending.find((a) => a.id === catId)
    if (match) return match
  }
  return withPending[0]
}

function syncMasterMarkdown() {
  const master = readMaster()
  const enabled = enabledCategories(master)
  const rows = enabled.map((id) => {
    const q = getCategoryQueue(id)
    const ctx = q.runContext()
    const cfg = CATEGORY_CONFIGS[id]
    return `| ${cfg.label} | \`${id}\` | ${ctx.imageAudit.withImage.length} / ${ctx.imageAudit.total} | ${ctx.pendingCount} | \`${ctx.testNowProduct?.id ?? '—'}\` | [status](${cfg.statusMd}) |`
  }).join('\n')

  const nextCat = pickNextCategory(master)
  const currentCat = master.currentCategory
  const currentId = master.currentProductId

  const nowBlock = currentCat && currentId
    ? `## ➡️ NÅ — TEST KUN DETTE

| Felt | Verdi |
|------|-------|
| kategori | **${CATEGORY_CONFIGS[currentCat]?.label ?? currentCat}** (\`${currentCat}\`) |
| productId | \`${currentId}\` |
| statusfil | \`${CATEGORY_CONFIGS[currentCat]?.statusMd}\` |
| produktfil | \`${CATEGORY_CONFIGS[currentCat]?.productsTs}\` |
| bildemappe | \`${CATEGORY_CONFIGS[currentCat]?.imagesDir}/\` |

Les kategori-spesifikk statusfil for detaljer. **Én produkt per kjøring.**`
    : nextCat
      ? `## ➡️ NÅ — NESTE KATEGORI

Kjør \`node scripts/kosttilskudd-verify-queue.mjs start\` for å låse neste produkt i **${nextCat.label}** (\`${nextCat.id}\`).`
      : `## ➡️ NÅ

Alle kategorier er ferdig verifisert (har bilde) eller avvist.`

  const md = `# Kosttilskudd verifisering — master status

> Roterer mellom kategorier: kreatin → protein → (fremtidige).
> **Regel:** Produkt uten ekte bilde = ikke ferdig analysert.

${nowBlock}

## Kategorioversikt

| Kategori | ID | Ferdig (bilde) | Mangler | Neste | Statusfil |
|----------|-----|----------------|---------|-------|-----------|
${rows}

## Oppsummering

| Felt | Verdi |
|------|-------|
| Siste kategori | \`${master.lastCategory ?? '—'}\` |
| Aktiv kategori | \`${master.currentCategory ?? '—'}\` |
| Aktivt produkt | \`${master.currentProductId ?? '—'}\` |
| Siste kjøring | ${master.lastRunAt ?? '—'} |
| Cron | \`0 * * * *\` (hver time) |

## Instruks

1. \`node scripts/kosttilskudd-verify-queue.mjs audit\` — oversikt alle kategorier.
2. \`node scripts/kosttilskudd-verify-queue.mjs start\` — lås neste produkt (roterer kategori).
3. Les kategori-spesifikk statusfil (se tabell over).
4. Verifiser mot butikk + last ned produktbilde.
5. \`complete --id <id> --category <id>\` eller \`reject\`.
6. \`sync-md\` → build → commit → push.
`

  fs.writeFileSync(MASTER_STATUS_MD, md)
}

function cmdAudit() {
  const master = readMaster()
  const results = enabledCategories(master).map((id) => getCategoryQueue(id).cmdAudit())
  const nextCat = pickNextCategory(master)
  console.log(
    JSON.stringify(
      {
        ok: true,
        masterStatusMd: 'data/kosttilskudd-verification-status.md',
        nextCategory: nextCat,
        categories: results,
        message: nextCat
          ? `Neste kategori: ${nextCat.label} (${nextCat.id}) med ${nextCat.pendingCount} uten bilde.`
          : 'Alle kategorier ferdig.',
      },
      null,
      2,
    ),
  )
}

function cmdStatus() {
  const master = readMaster()
  const categories = enabledCategories(master).map((id) => ({
  ...getCategoryQueue(id).runContext(),
  statusMd: CATEGORY_CONFIGS[id].statusMd,
}))
  console.log(
    JSON.stringify(
      {
        ...master,
        categories,
        nextCategory: pickNextCategory(master),
        masterStatusMd: 'data/kosttilskudd-verification-status.md',
      },
      null,
      2,
    ),
  )
}

function cmdStart() {
  const master = readMaster()

  if (master.currentProductId && master.currentCategory) {
    const existing = getCategoryQueue(master.currentCategory)
    const ctx = existing.runContext()
    if (!ctx.done && ctx.testNowProduct) {
      syncMasterMarkdown()
      console.log(
        JSON.stringify({
          ok: true,
          resumed: true,
          category: master.currentCategory,
          lockedProductId: master.currentProductId,
          message: `Fortsetter låst oppgave: ${master.currentProductId} (${master.currentCategory})`,
          statusMd: CATEGORY_CONFIGS[master.currentCategory].statusMd,
          masterStatusMd: 'data/kosttilskudd-verification-status.md',
        }, null, 2),
      )
      return
    }
  }

  const nextCat = pickNextCategory(master)
  if (!nextCat) {
    syncMasterMarkdown()
    console.log(JSON.stringify({ done: true, message: 'Alle kategorier ferdig verifisert.' }))
    return
  }

  const q = getCategoryQueue(nextCat.id)
  const result = q.cmdStart()

  master.lastRunAt = new Date().toISOString()
  master.lastCategory = nextCat.id
  master.currentCategory = nextCat.id
  master.currentProductId = result.lockedProductId
  master.currentRunStartedAt = master.lastRunAt
  writeMaster(master)
  syncMasterMarkdown()

  console.log(
    JSON.stringify({
      ...result,
      masterStatusMd: 'data/kosttilskudd-verification-status.md',
      message: `Låst: ${result.lockedProductId} i ${nextCat.label}. Les ${CATEGORY_CONFIGS[nextCat.id].statusMd}.`,
    }, null, 2),
  )
}

function cmdComplete(args) {
  const category = args.category || readMaster().currentCategory
  if (!category) {
    console.error('Mangler --category')
    process.exit(1)
  }
  const q = getCategoryQueue(category)
  const result = q.cmdComplete(args.id)
  const master = readMaster()
  master.lastCategory = category
  master.currentCategory = null
  master.currentProductId = null
  master.currentRunStartedAt = null
  master.lastRunAt = new Date().toISOString()
  writeMaster(master)
  syncMasterMarkdown()
  console.log(JSON.stringify({ ...result, masterStatusMd: 'data/kosttilskudd-verification-status.md' }))
}

function cmdReject(args) {
  const category = args.category || readMaster().currentCategory
  if (!category) {
    console.error('Mangler --category')
    process.exit(1)
  }
  const q = getCategoryQueue(category)
  const result = q.cmdReject(args.id, args.reason)
  const master = readMaster()
  master.lastCategory = category
  master.currentCategory = null
  master.currentProductId = null
  master.currentRunStartedAt = null
  master.lastRunAt = new Date().toISOString()
  writeMaster(master)
  syncMasterMarkdown()
  console.log(JSON.stringify({ ...result, masterStatusMd: 'data/kosttilskudd-verification-status.md' }))
}

const args = parseArgs(process.argv)
const command = args._[0] || 'status'

try {
  switch (command) {
    case 'audit':
      cmdAudit()
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
      enabledCategories(readMaster()).forEach((id) => getCategoryQueue(id).syncMarkdown())
      syncMasterMarkdown()
      console.log(JSON.stringify({ ok: true, path: 'data/kosttilskudd-verification-status.md' }))
      break
    default:
      console.error(`Ukjent kommando: ${command}`)
      process.exit(1)
  }
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
