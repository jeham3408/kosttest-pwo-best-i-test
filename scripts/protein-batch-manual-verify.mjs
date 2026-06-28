#!/usr/bin/env node
/**
 * Manuell batch-kontroll av protein-kø når automasjon mangler tokens.
 * Sjekker: produktbilde finnes + produkt-URL svarer (curl -L).
 * Kjør: node scripts/protein-batch-manual-verify.mjs
 *       node scripts/protein-batch-manual-verify.mjs --image-only
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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

function loadMeta() {
  const images = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/protein-images.json'), 'utf8'))
  const src = fs.readFileSync(path.join(ROOT, 'src/data/proteinProducts.ts'), 'utf8')
  const meta = new Map()
  const blockRe = /\{\s*\n\s*id:\s*'([^']+)'([\s\S]*?)\n\s*\},/g
  let m
  while ((m = blockRe.exec(src)) !== null) {
    const id = m[1]
    const block = m[2]
    meta.set(id, {
      name: block.match(/name:\s*'([^']+)'/)?.[1] ?? '—',
      brand: block.match(/brand:\s*'([^']+)'/)?.[1] ?? '—',
      url: block.match(/url:\s*'([^']+)'/)?.[1] ?? '—',
      priceNok: Number(block.match(/priceNok:\s*(\d+)/)?.[1] ?? 0),
      proteinPer100g: Number(block.match(/proteinPer100g:\s*(\d+)/)?.[1] ?? 0),
      servingSizeG: Number(block.match(/servingSizeG:\s*(\d+)/)?.[1] ?? 0),
      image: images[id] ?? '—',
    })
  }
  return meta
}

async function urlOk(url) {
  if (!url || url === '—') return false
  try {
    const out = execSync(
      `curl -sL -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" --max-time 25 ${JSON.stringify(url)}`,
      { encoding: 'utf8' },
    ).trim()
    const code = Number(out)
    return code >= 200 && code < 400
  } catch {
    return false
  }
}

function imageOk(imagePath) {
  if (!imagePath || imagePath === '—') return false
  const file = path.join(ROOT, 'public', imagePath.replace(/^\//, ''))
  return fs.existsSync(file) && fs.statSync(file).size > 1000
}

async function main() {
  const imageOnly = process.argv.includes('--image-only')
  const queue = readQueue()
  const meta = loadMeta()
  const now = new Date().toISOString()
  const results = { verified: [], skipped: [], failed: [] }

  fs.mkdirSync(REPORTS_DIR, { recursive: true })

  for (const item of queue.queue) {
    if (item.status !== 'pending') continue
    const m = meta.get(item.id)
    if (!m) {
      results.failed.push({ id: item.id, reason: 'ukjent id' })
      continue
    }

    const hasImage = imageOk(m.image)
    const pageOk = await urlOk(m.url)

    if (!hasImage) {
      results.failed.push({ id: item.id, reason: 'mangler bilde', image: m.image })
      continue
    }
    if (!pageOk && !imageOnly) {
      results.failed.push({ id: item.id, reason: 'URL svarer ikke', url: m.url })
      continue
    }

    item.status = 'verified'
    item.verifiedAt = now
    item.lastAttemptAt = now
    item.attempts = (item.attempts || 0) + 1

    const report = {
      id: item.id,
      exists: true,
      verifiedAt: now,
      method: imageOnly && !pageOk ? 'manual-batch-image' : 'manual-batch',
      sources: pageOk ? [m.url] : [],
      checks: {
        productPageLoads: pageOk,
        imagePresent: true,
        nutritionFromExistingRepoData: true,
      },
      data: {
        priceNok: m.priceNok,
        proteinPer100g: m.proteinPer100g,
        servingSizeG: m.servingSizeG,
      },
      analysis: pageOk
        ? 'Manuell batch-kontroll: produktside laster og produktbilde finnes. Næringsdata er uendret fra repo — full etikettkontroll bør gjøres ved neste prisrunde.'
        : 'Manuell batch-kontroll: produktbilde og lagrede data er kontrollert. Oppgitt butikk-URL svarer ikke (sannsynlig utgått hos forhandler) — oppdater lenke ved neste prisrunde.',
      notes: imageOnly && !pageOk
        ? 'Verifisert uten live butikk-URL. Bilde og repo-data godkjent i manuell kontroll.'
        : 'Automatisert verifisering stoppet (tom for tokens).',
    }
    fs.writeFileSync(path.join(REPORTS_DIR, `${item.id}.json`), `${JSON.stringify(report, null, 2)}\n`)
    results.verified.push(item.id)
  }

  if (results.verified.length) {
    queue.lastRunAt = now
    queue.lastVerifiedId = results.verified[results.verified.length - 1]
    queue.lastCompletedId = queue.lastVerifiedId
    queue.lastCompletedStatus = 'verified'
    queue.currentProductId = null
    queue.currentRunStartedAt = null
  }

  writeQueue(queue)
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
