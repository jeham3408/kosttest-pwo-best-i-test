#!/usr/bin/env node
/**
 * Produkt-bilde kø — systematisk faktasjekk av bilder for PWO og protein.
 *
 *   node scripts/product-image-queue.mjs init       → bygg kø fra produktfiler
 *   node scripts/product-image-queue.mjs audit      → bilde-audit (JSON)
 *   node scripts/product-image-queue.mjs status     → oversikt
 *   node scripts/product-image-queue.mjs run        → behandle batch (PRODUCT_IMAGE_BATCH=5)
 *   node scripts/product-image-queue.mjs retry --id <id>
 *   node scripts/product-image-queue.mjs sync-md    → oppdater data/product-image-status.md
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const QUEUE_PATH = path.join(ROOT, 'src/data/productImageQueue.json')
const STATUS_MD = path.join(ROOT, 'data/product-image-status.md')
const LAST_RUN_PATH = path.join(ROOT, 'data/product-image-last-run.json')
const REPORTS_DIR = path.join(ROOT, 'data/product-image-reports')
const PWO_TS = path.join(ROOT, 'src/data/pwoProducts.ts')
const PROTEIN_TS = path.join(ROOT, 'src/data/proteinProducts.ts')
const PROTEIN_IMAGES = path.join(ROOT, 'public/images/protein')
const BATCH_SIZE = Number(process.env.PRODUCT_IMAGE_BATCH || 5)
const USER_AGENT =
  'Mozilla/5.0 (compatible; KosttestProductImageBot/1.0; +https://kosttest.no)'

const GENERIC_MARKERS = [
  'protein_whey_generic',
  'dw8a8c8c8c',
  'placeholder',
  'logo',
  '/cat-meme',
  'favicon',
]

const BLOCKED_URL_PATTERNS = [
  /logo/i,
  /banner/i,
  /icon/i,
  /avatar/i,
  /cat-meme/i,
  /sprite/i,
  /badge/i,
]

function readQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return null
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

async function fetchUrl(url, { method = 'GET', timeout = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,image/*,*/*;q=0.8' },
    })
    if (method === 'HEAD') {
      return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: '' }
    }
    const body = await res.text()
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body }
  } finally {
    clearTimeout(timer)
  }
}

function imageMatchesProduct(imageUrl, product) {
  const slug = slugify(`${product.brand} ${product.name}`)
  const urlSlug = slugify(imageUrl)
  const tokens = slug.split('-').filter((t) => t.length > 3)
  const hits = tokens.filter((t) => urlSlug.includes(t))
  if (hits.length >= 1) return true
  const idSlug = slugify(product.id.replace(/-/g, ' '))
  const idTokens = idSlug.split('-').filter((t) => t.length > 3)
  return idTokens.some((t) => urlSlug.includes(t))
}

async function isValidProductImage(imageUrl, product) {
  if (!(await isValidImageUrl(imageUrl))) return false
  if (product && !imageMatchesProduct(imageUrl, product)) return false
  return true
}

async function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (BLOCKED_URL_PATTERNS.some((re) => re.test(url))) return false
  if (GENERIC_MARKERS.some((m) => url.includes(m))) return false
  try {
    const res = await fetchUrl(url, { method: 'HEAD' })
    if (res.status < 200 || res.status >= 400) return false
    const type = res.headers['content-type'] || ''
    if (!type.startsWith('image/')) return false
    const len = Number(res.headers['content-length'] || 0)
    if (len > 0 && len < 800) return false
    return true
  } catch {
    return false
  }
}

function extractImageFromHtml(html, pageUrl) {
  const candidates = []
  const og = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
  if (og) candidates.push(og[1])
  const og2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i)
  if (og2) candidates.push(og2[1])
  const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (tw) candidates.push(tw[1])

  const demandware = [...html.matchAll(/(https?:\/\/[^"'\s]+demandware\.static[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi)].map(
    (m) => m[1],
  )
  candidates.push(...demandware)

  const shopify = [
    ...html.matchAll(/"(https?:\/\/cdn\.shopify\.com\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)"/gi),
  ].map((m) => m[1])
  candidates.push(...shopify)

  const productImg = [...html.matchAll(/<img[^>]+(?:class|id)=["'][^"']*product[^"']*["'][^>]+src=["']([^"']+)["']/gi)].map(
    (m) => m[1],
  )
  candidates.push(...productImg)

  for (const raw of candidates) {
    try {
      const abs = new URL(raw.replace(/&amp;/g, '&'), pageUrl).href
      if (BLOCKED_URL_PATTERNS.some((re) => re.test(abs))) continue
      if (abs.includes('logo.svg') || abs.includes('/logo.')) continue
      return abs
    } catch {
      /* skip */
    }
  }
  return null
}

async function extractImageFromProductPage(url) {
  try {
    const res = await fetchUrl(url)
    if (!res.body) return null
    return extractImageFromHtml(res.body, url)
  } catch {
    return null
  }
}

async function isPageOk(url) {
  try {
    const res = await fetchUrl(url, { method: 'HEAD' })
    return res.status >= 200 && res.status < 400
  } catch {
    return false
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function searchGymgrossisten(product) {
  const q = encodeURIComponent(`${product.brand} ${product.name}`.slice(0, 80))
  const searchUrl = `https://www.gymgrossisten.no/search?q=${q}`
  try {
    const res = await fetchUrl(searchUrl)
    const pageLinks = [
      ...res.body.matchAll(/href="(\/[^"]+\.html)"/g),
    ].map((m) => new URL(m[1], 'https://www.gymgrossisten.no').href)

    const demandwareImages = [
      ...res.body.matchAll(
        /(https?:\/\/www\.gymgrossisten\.no\/dw\/image[^"'\s]+demandware\.static[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi,
      ),
    ].map((m) => m[1].replace(/&amp;/g, '&').split(' ')[0])

    for (const image of demandwareImages) {
      if (await isValidProductImage(image, product)) {
        const link = pageLinks.find((l) => imageMatchesProduct(l, product)) || pageLinks[0]
        return { url: link, image, source: 'gymgrossisten-search' }
      }
    }

    const nameSlug = slugify(product.name.split(' ').slice(0, 3).join(' '))
    const brandSlug = slugify(product.brand)
    for (const link of pageLinks) {
      const linkSlug = slugify(link)
      if (linkSlug.includes(brandSlug) || linkSlug.includes(nameSlug)) {
        const img = await extractImageFromProductPage(link)
        if (img && (await isValidProductImage(img, product))) {
          return { url: link, image: img, source: 'gymgrossisten-search' }
        }
      }
    }
  } catch {
    /* skip */
  }
  return null
}

async function searchBing(product, site) {
  const q = encodeURIComponent(`site:${site} ${product.brand} ${product.name}`)
  const url = `https://www.bing.com/search?q=${q}`
  try {
    const res = await fetchUrl(url)
    const pageLinks = [...res.body.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/gi)]
      .map((m) => m[1])
      .filter((u) => u.includes(site))
    for (const link of pageLinks.slice(0, 5)) {
      const img = await extractImageFromProductPage(link)
      if (img && (await isValidProductImage(img, product))) {
        return { url: link, image: img, source: `bing:${site}` }
      }
    }
  } catch {
    /* skip */
  }
  return null
}

async function searchDuckDuckGo(product) {
  const q = encodeURIComponent(`${product.brand} ${product.name} pre workout product`)
  const url = `https://duckduckgo.com/?q=${q}&iax=images&ia=images`
  try {
    const res = await fetchUrl(url)
    const imgs = [...res.body.matchAll(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)].map((m) => m[1])
    for (const img of imgs.slice(0, 10)) {
      if (BLOCKED_URL_PATTERNS.some((re) => re.test(img))) continue
      if (await isValidImageUrl(img)) return { image: img, source: 'duckduckgo' }
    }
  } catch {
    /* skip */
  }
  return null
}

async function findProductImage(product) {
  const steps = []

  if (product.image && product.image !== 'IMG' && !product.image.startsWith('/images/')) {
    const ok = await isValidImageUrl(product.image)
    steps.push({ step: 'existing-url', ok, image: product.image })
    if (ok) return { image: product.image, source: 'existing', steps }
  }

  if (product.url) {
    const img = await extractImageFromProductPage(product.url)
    steps.push({ step: 'product-page', url: product.url, found: Boolean(img) })
    if (img && (await isValidProductImage(img, product))) {
      steps.push({ step: 'product-page-image', ok: true, image: img })
      return { image: img, url: product.url, source: 'product-page', steps }
    }
  }

  const merchant = (product.merchant || '').toLowerCase()
  if (merchant.includes('gymgrossisten') || product.url?.includes('gymgrossisten')) {
    const gg = await searchGymgrossisten(product)
    if (gg) {
      steps.push({ step: 'gymgrossisten-search', ok: true, ...gg })
      return { ...gg, steps }
    }
    const bing = await searchBing(product, 'gymgrossisten.no')
    if (bing) {
      steps.push({ step: 'bing-gymgrossisten', ok: true, ...bing })
      return { ...bing, steps }
    }
  }

  if (merchant.includes('myprotein') || product.url?.includes('myprotein')) {
    const bing = await searchBing(product, 'myprotein.com')
    if (bing) {
      steps.push({ step: 'bing-myprotein', ok: true, ...bing })
      return { ...bing, steps }
    }
  }

  const ddg = await searchDuckDuckGo(product)
  if (ddg) {
    steps.push({ step: 'duckduckgo', ok: true, ...ddg })
    return { ...ddg, steps }
  }

  return { image: null, source: null, steps }
}

function extractObjectBlocks(section) {
  const blocks = []
  const idRe = /\{\s*\n\s*id:\s*'([^']+)'/g
  let match
  while ((match = idRe.exec(section)) !== null) {
    const start = match.index
    const id = match[1]
    let depth = 0
    let end = start
    for (let i = start; i < section.length; i++) {
      if (section[i] === '{') depth++
      else if (section[i] === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    const block = section.slice(start, end)
    blocks.push({ id, block })
  }
  return blocks
}

function parseFieldsFromBlock(block) {
  const name = block.match(/name:\s*'([^']+)'/)?.[1] ?? ''
  const brand = block.match(/brand:\s*'([^']+)'/)?.[1] ?? ''
  const merchant = block.match(/merchant:\s*'([^']+)'/)?.[1] ?? ''
  const url = block.match(/url:\s*'([^']+)'/)?.[1] ?? ''
  const single = block.match(/image:\s*'([^']+)'/)?.[1]
  const multi = block.match(/image:\s*\n\s*'([^']+)'/)?.[1]
  const image = single || multi || ''
  return { name, brand, merchant, url, image }
}

function parsePwoTestedProducts() {
  const src = fs.readFileSync(PWO_TS, 'utf8')
  const section = src.split('export const testedProducts')[1]?.split('export const listedProducts')[0] || ''
  return extractObjectBlocks(section).map(({ id, block }) => ({
    id,
    type: 'pwo-tested',
    ...parseFieldsFromBlock(block),
  }))
}

function parsePwoListedOnly() {
  const src = fs.readFileSync(PWO_TS, 'utf8')
  const testedIds = new Set(parsePwoTestedProducts().map((p) => p.id))
  const section = src.split('export const listedProducts')[1]?.split('export const sourceLinks')[0] || ''
  return extractObjectBlocks(section)
    .filter(({ id }) => !testedIds.has(id))
    .map(({ id, block }) => ({
      id,
      type: 'pwo-listed',
      ...parseFieldsFromBlock(block),
    }))
}

function parseProteinProducts() {
  const src = fs.readFileSync(PROTEIN_TS, 'utf8')
  const section = src.split('const rawProducts')[1]?.split('export const testedProteinProducts')[0] || src
  return extractObjectBlocks(section)
    .filter(({ block }) => block.includes('name:'))
    .map(({ id, block }) => {
      const fields = parseFieldsFromBlock(block)
      const image =
        block.match(/image:\s*(?:'([^']+)'|IMG)/)?.[1] ?? (block.includes('image: IMG') ? 'IMG' : fields.image)
      return { id, type: 'protein', ...fields, image }
    })
}

function loadAllProducts() {
  return [...parsePwoTestedProducts(), ...parsePwoListedOnly(), ...parseProteinProducts()]
}

function hasValidImage(product) {
  if (product.type === 'protein') {
    if (!product.image || product.image === 'IMG') return false
    if (GENERIC_MARKERS.some((m) => product.image.includes(m))) return false
    if (product.image.startsWith('http')) return false
    if (product.image.startsWith('/images/protein/')) {
      const file = path.join(ROOT, 'public', product.image)
      return fs.existsSync(file) && fs.statSync(file).size > 1000
    }
    return false
  }
  return Boolean(product.image)
}

async function hasWorkingImage(product) {
  if (product.type === 'protein') return hasValidImage(product)
  if (!product.image) return false
  return isValidImageUrl(product.image)
}

function replaceProductBlock(filePath, sectionStart, sectionEnd, id, mutator) {
  let src = fs.readFileSync(filePath, 'utf8')
  const startMarker = sectionStart
  const endMarker = sectionEnd
  const startIdx = src.indexOf(startMarker)
  const endIdx = src.indexOf(endMarker, startIdx)
  if (startIdx === -1 || endIdx === -1) throw new Error(`Fant ikke seksjon ${sectionStart}`)
  const before = src.slice(0, startIdx + startMarker.length)
  const section = src.slice(startIdx + startMarker.length, endIdx)
  const after = src.slice(endIdx)
  const blocks = extractObjectBlocks(section)
  const target = blocks.find((b) => b.id === id)
  if (!target) throw new Error(`Fant ikke produkt ${id}`)
  const updated = mutator(target.block)
  const newSection = section.replace(target.block, updated)
  fs.writeFileSync(filePath, before + newSection + after)
}

function updateTestedProductImage(id, imageUrl, newUrl) {
  replaceProductBlock(PWO_TS, 'export const testedProducts', 'export const listedProducts', id, (block) => {
    let next = block.replace(/image:\s*(?:'[^']*'|\n\s*'[^']*')/, `image:\n      '${imageUrl.replace(/'/g, "\\'")}'`)
    if (newUrl) {
      next = next.replace(/url:\s*'[^']*'/, `url: '${newUrl.replace(/'/g, "\\'")}'`)
    }
    return next
  })
}

function updateListedOnlyProductImage(id, imageUrl, newUrl) {
  replaceProductBlock(PWO_TS, 'export const listedProducts', 'export const sourceLinks', id, (block) => {
    let next = block
    if (block.includes('image:')) {
      next = next.replace(/image:\s*'[^']*'/, `image: '${imageUrl.replace(/'/g, "\\'")}'`)
    } else {
      next = next.replace(/(url:\s*'[^']*',)/, `$1\n    image: '${imageUrl.replace(/'/g, "\\'")}',`)
    }
    if (newUrl) {
      next = next.replace(/url:\s*'[^']*'/, `url: '${newUrl.replace(/'/g, "\\'")}'`)
    }
    return next
  })
}

async function downloadBinary(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
    })
    if (!res.ok) throw new Error(`Download failed ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return buf
  } finally {
    clearTimeout(timer)
  }
}

async function downloadProteinImage(id, imageUrl) {
  const dir = PROTEIN_IMAGES
  fs.mkdirSync(dir, { recursive: true })
  const dest = path.join(dir, `${id}.jpg`)
  const buf = await downloadBinary(imageUrl)
  if (buf.length < 1000) throw new Error('Image too small')
  fs.writeFileSync(dest, buf)
  return `/images/protein/${id}.jpg`
}

function updateProteinProductImage(id, imagePath) {
  replaceProductBlock(PROTEIN_TS, 'const rawProducts', 'export const testedProteinProducts', id, (block) =>
    block.replace(/image:\s*(?:'[^']*'|IMG)/, `image: '${imagePath}'`),
  )
}

async function applyImageUpdate(product, result) {
  const { image, url } = result
  if (product.type === 'pwo-tested') {
    updateTestedProductImage(product.id, image, url && url !== product.url ? url : undefined)
  } else if (product.type === 'pwo-listed') {
    updateListedOnlyProductImage(product.id, image, url && url !== product.url ? url : undefined)
  } else if (product.type === 'protein') {
    const localPath = await downloadProteinImage(product.id, image)
    updateProteinProductImage(product.id, localPath)
    return localPath
  }
  return image
}

function initQueue() {
  const products = loadAllProducts()
  const existing = readQueue()
  const existingMap = new Map((existing?.queue || []).map((q) => [q.id, q]))
  const queue = {
    version: 1,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    queue: products.map((p) => {
      const prev = existingMap.get(p.id)
      const hasImage = p.type === 'protein' ? hasValidImage(p) : Boolean(p.image)
      const status =
        prev?.status === 'done'
          ? 'done'
          : prev?.status === 'failed'
            ? 'failed'
            : hasImage
              ? 'done'
              : 'pending'
      return {
        id: p.id,
        type: p.type,
        status,
        attempts: prev?.attempts || 0,
        image: prev?.image || (hasImage ? p.image : undefined),
        source: prev?.source || (hasImage ? 'existing-data' : undefined),
        lastAttemptAt: prev?.lastAttemptAt,
        completedAt: prev?.completedAt || (hasImage ? new Date().toISOString() : undefined),
        error: prev?.error,
      }
    }),
  }
  writeQueue(queue)
  return queue
}

async function buildAudit() {
  const products = loadAllProducts()
  const withImage = []
  const withoutImage = []
  const brokenImage = []

  for (const p of products) {
    const entry = { ...p }
    if (p.type === 'protein') {
      entry.hasImage = hasValidImage(p)
    } else if (p.image) {
      entry.hasImage = await isValidImageUrl(p.image)
      if (!entry.hasImage) brokenImage.push(entry)
    } else {
      entry.hasImage = false
    }
    if (entry.hasImage) withImage.push(entry)
    else withoutImage.push(entry)
  }

  return { withImage, withoutImage, brokenImage, total: products.length }
}

function getProductMeta(id) {
  return loadAllProducts().find((p) => p.id === id)
}

async function processProduct(queueItem) {
  const product = getProductMeta(queueItem.id)
  if (!product) throw new Error(`Unknown product ${queueItem.id}`)

  if (product.type === 'protein' && hasValidImage(product)) {
    return { skipped: true, reason: 'already-has-local-image' }
  }
  if (product.type !== 'protein' && product.image && (await isValidImageUrl(product.image))) {
    return { skipped: true, reason: 'image-url-valid' }
  }

  const result = await findProductImage(product)
  if (!result.image) {
    throw new Error('Fant ikke bilde på nett')
  }

  const applied = await applyImageUpdate(product, result)
  const report = {
    id: product.id,
    type: product.type,
    name: product.name,
    brand: product.brand,
    processedAt: new Date().toISOString(),
    source: result.source,
    image: applied,
    url: result.url || product.url,
    steps: result.steps,
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(REPORTS_DIR, `${product.id}.json`), `${JSON.stringify(report, null, 2)}\n`)
  return report
}

async function runBatch() {
  let queue = readQueue()
  if (!queue) queue = initQueue()

  const results = []
  const pending = queue.queue.filter((q) => q.status === 'pending')
  const batch = pending.slice(0, BATCH_SIZE)

  for (const item of batch) {
    item.attempts = (item.attempts || 0) + 1
    item.lastAttemptAt = new Date().toISOString()
    try {
      const report = await processProduct(item)
      if (report.skipped) {
        item.status = 'done'
        item.completedAt = new Date().toISOString()
        item.note = report.reason
      } else {
        item.status = 'done'
        item.completedAt = new Date().toISOString()
        item.image = report.image
        item.source = report.source
      }
      results.push({ id: item.id, status: 'done', report })
    } catch (err) {
      item.status = 'failed'
      item.error = err.message
      results.push({ id: item.id, status: 'failed', error: err.message })
    }
  }

  queue.updatedAt = new Date().toISOString()
  queue.lastRunAt = new Date().toISOString()
  writeQueue(queue)

  const summary = {
    runAt: queue.lastRunAt,
    batchSize: BATCH_SIZE,
    processed: batch.length,
    done: results.filter((r) => r.status === 'done').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  }
  fs.mkdirSync(path.dirname(LAST_RUN_PATH), { recursive: true })
  fs.writeFileSync(LAST_RUN_PATH, `${JSON.stringify(summary, null, 2)}\n`)
  return summary
}

function syncMarkdown() {
  const audit = buildAuditSync()
  const queue = readQueue() || initQueue()
  const counts = { done: 0, pending: 0, failed: 0 }
  for (const item of queue.queue) counts[item.status] = (counts[item.status] || 0) + 1

  const rows = queue.queue
    .map((item, i) => {
      const p = getProductMeta(item.id)
      const status =
        item.status === 'done' ? '✅' : item.status === 'failed' ? '❌' : '⏳'
      return `| ${i + 1} | \`${item.id}\` | ${p?.type || '—'} | ${p?.brand || '—'} | ${p?.name || '—'} | ${status} | ${item.source || '—'} |`
    })
    .join('\n')

  const md = `# Produkt-bilde status

> Systematisk faktasjekk: produkter uten gyldig bilde får bilde hentet fra butikkside eller søk.

## Oppsummering

| Felt | Verdi |
|------|-------|
| Totalt | ${audit.total} |
| Med bilde | ${audit.withImage.length} |
| Uten / ødelagt bilde | ${audit.withoutImage.length} |
| Kø ferdig | ${counts.done || 0} |
| Kø feilet | ${counts.failed || 0} |
| Kø venter | ${counts.pending || 0} |
| Siste kjøring | ${queue.lastRunAt || '—'} |
| Batch-størrelse | ${BATCH_SIZE} |

## Produktkø

| # | ID | Type | Merke | Navn | Status | Kilde |
|---|-----|------|-------|------|--------|-------|
${rows}

## Kommandoer

\`\`\`bash
npm run product:image:init
npm run product:image:audit
npm run product:image:status
npm run product:image:run
npm run product:image:sync-md
\`\`\`
`
  fs.mkdirSync(path.dirname(STATUS_MD), { recursive: true })
  fs.writeFileSync(STATUS_MD, md)
}

function buildAuditSync() {
  const products = loadAllProducts()
  const withImage = []
  const withoutImage = []
  for (const p of products) {
    if (p.type === 'protein') {
      if (hasValidImage(p)) withImage.push(p)
      else withoutImage.push(p)
    } else if (p.image) {
      withImage.push(p)
    } else {
      withoutImage.push(p)
    }
  }
  return { withImage, withoutImage, total: products.length }
}

async function main() {
  const args = parseArgs(process.argv)
  const cmd = args._[0] || 'status'

  if (cmd === 'init') {
    const q = initQueue()
    console.log(JSON.stringify({ ok: true, total: q.queue.length }, null, 2))
    return
  }

  if (cmd === 'audit') {
    const audit = await buildAudit()
    console.log(JSON.stringify(audit, null, 2))
    return
  }

  if (cmd === 'status') {
    const queue = readQueue() || initQueue()
    const audit = await buildAudit()
    console.log(
      JSON.stringify(
        {
          queue: {
            total: queue.queue.length,
            done: queue.queue.filter((q) => q.status === 'done').length,
            failed: queue.queue.filter((q) => q.status === 'failed').length,
            pending: queue.queue.filter((q) => q.status === 'pending').length,
            lastRunAt: queue.lastRunAt,
          },
          audit: {
            total: audit.total,
            withImage: audit.withImage.length,
            withoutImage: audit.withoutImage.length,
            brokenImage: audit.brokenImage.length,
          },
        },
        null,
        2,
      ),
    )
    return
  }

  if (cmd === 'run') {
    const summary = await runBatch()
    syncMarkdown()
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  if (cmd === 'retry') {
    const id = args.id
    if (!id) {
      console.error('Bruk: retry --id <id>')
      process.exit(1)
    }
    const queue = readQueue() || initQueue()
    const item = queue.queue.find((q) => q.id === id)
    if (!item) {
      console.error(`Fant ikke ${id}`)
      process.exit(1)
    }
    item.status = 'pending'
    item.error = undefined
    writeQueue(queue)
    console.log(JSON.stringify({ ok: true, id }, null, 2))
    return
  }

  if (cmd === 'sync-md') {
    syncMarkdown()
    console.log(JSON.stringify({ ok: true, path: 'data/product-image-status.md' }, null, 2))
    return
  }

  console.error(`Ukjent kommando: ${cmd}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
