#!/usr/bin/env node
/**
 * Kjør én batch: faktasjekk URL + finn/legg til produktbilde.
 *
 *   node scripts/product-image-run.mjs
 *   PRODUCT_IMAGE_BATCH=3 node scripts/product-image-run.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  applyImageUpdate,
  assessProduct,
  findProductImage,
  loadAllProducts,
  ROOT,
} from './product-image-lib.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUEUE_PATH = path.join(ROOT, 'src/data/productImageQueue.json')
const REPORTS_DIR = path.join(ROOT, 'data/product-image-reports')
const LAST_RUN_PATH = path.join(ROOT, 'data/product-image-last-run.json')

function readQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return null
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'))
}

async function main() {
  const { execSync } = await import('child_process')
  if (!readQueue()) {
    execSync('node scripts/product-image-queue.mjs init', { cwd: ROOT, stdio: 'inherit' })
  }

  const startOut = execSync('node scripts/product-image-queue.mjs start', { cwd: ROOT, encoding: 'utf8' })
  const start = JSON.parse(startOut)
  if (start.done) {
    console.log(JSON.stringify({ done: true, message: start.message }))
    return
  }

  const { tested, listedOnly, protein } = loadAllProducts()
  const allProducts = [...tested, ...listedOnly, ...protein]
  const byId = new Map(allProducts.map((p) => [p.id, p]))

  const report = {
    startedAt: new Date().toISOString(),
    batchIds: start.batchIds,
    results: [],
  }

  for (const id of start.batchIds) {
    const product = byId.get(id)
    if (!product) {
      execSync(`node scripts/product-image-queue.mjs skip --id ${id} --reason "Produkt ikke funnet i datafiler"`, {
        cwd: ROOT,
        stdio: 'inherit',
      })
      report.results.push({ id, status: 'failed', reason: 'not_found' })
      continue
    }

    const assessment = await assessProduct(product)
    const entry = {
      id,
      catalog: product.catalog,
      name: product.name,
      brand: product.brand,
      url: product.url,
      pageOk: assessment.pageOk,
      imageOk: assessment.imageOk,
      needsImage: assessment.needsImage,
    }

    if (!assessment.needsImage && assessment.pageOk) {
      execSync(`node scripts/product-image-queue.mjs complete --id ${id} --result ok`, { cwd: ROOT, stdio: 'inherit' })
      entry.status = 'done'
      entry.action = 'already_ok'
      report.results.push(entry)
      continue
    }

    if (!assessment.needsImage && !assessment.pageOk) {
      entry.status = 'url_issue'
      entry.action = 'image_ok_url_broken'
      report.results.push(entry)
      execSync(`node scripts/product-image-queue.mjs skip --id ${id} --reason "Bilde OK men produkt-URL svarer ikke (${assessment.pageStatus})"`, {
        cwd: ROOT,
        stdio: 'inherit',
      })
      continue
    }

    const found = await findProductImage(product)
    entry.search = { query: found.query, source: found.source, candidates: found.candidates?.length || 0 }

    if (found.image) {
      applyImageUpdate({ catalog: product.catalog, productId: id, imageUrl: found.image })
      fs.mkdirSync(REPORTS_DIR, { recursive: true })
      fs.writeFileSync(
        path.join(REPORTS_DIR, `${id}.json`),
        `${JSON.stringify(
          {
            id,
            catalog: product.catalog,
            verifiedAt: new Date().toISOString(),
            pageOk: assessment.pageOk,
            imageAdded: found.image,
            imageSource: found.source,
            productUrl: product.url,
            sources: found.sources,
          },
          null,
          2,
        )}\n`,
      )
      execSync(`node scripts/product-image-queue.mjs complete --id ${id} --source ${found.source}`, {
        cwd: ROOT,
        stdio: 'inherit',
      })
      entry.status = 'added'
      entry.image = found.image
      entry.imageSource = found.source
    } else {
      execSync(`node scripts/product-image-queue.mjs skip --id ${id} --reason "Fant ikke gyldig bilde på nett"`, {
        cwd: ROOT,
        stdio: 'inherit',
      })
      entry.status = 'failed'
      entry.reason = 'no_image_found'
    }

    report.results.push(entry)
  }

  execSync('node scripts/product-image-queue.mjs sync-md', { cwd: ROOT, stdio: 'inherit' })
  report.finishedAt = new Date().toISOString()
  fs.mkdirSync(path.dirname(LAST_RUN_PATH), { recursive: true })
  fs.writeFileSync(LAST_RUN_PATH, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
