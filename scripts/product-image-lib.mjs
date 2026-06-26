#!/usr/bin/env node
/**
 * Shared helpers for product image automation.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, '..')
export const PWO_PATH = path.join(ROOT, 'src/data/pwoProducts.ts')
export const PROTEIN_PATH = path.join(ROOT, 'src/data/proteinProducts.ts')
export const GENERIC_PROTEIN_IMAGE =
  'https://www.gymgrossisten.no/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8a8c8c8c/Hi-res/p/protein_whey_generic.jpg'

const USER_AGENT =
  'Mozilla/5.0 (compatible; KosttestBot/1.0; +https://kosttest.no) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

export function writeText(filePath, content) {
  fs.writeFileSync(filePath, content)
}

function extractBlock(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker)
  if (start === -1) return ''
  const end = src.indexOf(endMarker, start + startMarker.length)
  if (end === -1) return src.slice(start)
  return src.slice(start, end)
}

function parseProductObjects(block) {
  const products = []
  const objectRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  let match
  while ((match = objectRe.exec(block)) !== null) {
    const chunk = match[0]
    if (!chunk.includes("id:")) continue
    const id = chunk.match(/id:\s*'([^']+)'/)?.[1]
    if (!id) continue
    const name = chunk.match(/name:\s*'([^']+)'/)?.[1] ?? ''
    const brand = chunk.match(/brand:\s*'([^']+)'/)?.[1] ?? ''
    const merchant = chunk.match(/merchant:\s*'([^']+)'/)?.[1] ?? ''
    const url = chunk.match(/url:\s*'([^']+)'/)?.[1] ?? ''
    const imageMatch = chunk.match(/image:\s*(?:'([^']*)'|"([^"]*)"|([\s\S]*?)(?:,|\n\s*\w+:))/m)
    let image = ''
    if (imageMatch) {
      image = (imageMatch[1] ?? imageMatch[2] ?? '').trim()
      if (!image && imageMatch[3]) {
        image = imageMatch[3]
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/,$/, '')
          .replace(/^'|'$/g, '')
      }
    }
    products.push({ id, name, brand, merchant, url, image, raw: chunk })
  }
  return products
}

export function loadAllProducts() {
  const pwoSrc = readText(PWO_PATH)
  const proteinSrc = readText(PROTEIN_PATH)

  const testedBlock = extractBlock(pwoSrc, 'export const testedProducts', 'testedProducts.forEach')
  const listedBlock = extractBlock(pwoSrc, 'export const listedProducts', 'export const sourceLinks')
  const proteinBlock = extractBlock(proteinSrc, 'const rawProducts', 'function gradeProduct')

  const tested = parseProductObjects(testedBlock).map((p) => ({ ...p, catalog: 'pwo-tested' }))
  const listed = parseProductObjects(listedBlock).map((p) => ({ ...p, catalog: 'pwo-listed' }))
  const testedIds = new Set(tested.map((p) => p.id))
  const listedOnly = listed.filter((p) => !testedIds.has(p.id)).map((p) => ({ ...p, catalog: 'pwo-listed-only' }))
  const protein = parseProductObjects(proteinBlock).map((p) => ({ ...p, catalog: 'protein' }))

  return { tested, listedOnly, protein, pwoSrc, proteinSrc }
}

export function isGenericImage(image, catalog) {
  if (!image || image.trim() === '' || image === 'IMG') return true
  if (catalog === 'protein') {
    return (
      image.includes('protein_whey_generic') ||
      image === '/images/protein/placeholder.jpg' ||
      image === 'IMG'
    )
  }
  return false
}

export async function checkImageUrl(imageUrl, timeoutMs = 12000) {
  if (!imageUrl || imageUrl.startsWith('/')) {
    if (imageUrl?.startsWith('/')) {
      const localPath = path.join(ROOT, 'public', imageUrl.replace(/^\//, ''))
      return fs.existsSync(localPath)
    }
    return false
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(imageUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-1024' },
    })
    clearTimeout(timer)
    const type = res.headers.get('content-type') || ''
    return res.ok && (type.startsWith('image/') || type.includes('octet-stream'))
  } catch {
    return false
  }
}

export async function checkProductUrl(url, timeoutMs = 15000) {
  if (!url) return { ok: false, status: 0 }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
    clearTimeout(timer)
    const html = res.ok ? await res.text() : ''
    return { ok: res.ok, status: res.status, html }
  } catch {
    return { ok: false, status: 0, html: '' }
  }
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractMetaImages(html, baseUrl) {
  const images = []
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/gi,
    /"image"\s*:\s*"(https?:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    /"image"\s*:\s*\[\s*"(https?:[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(html)) !== null) {
      try {
        const absolute = new URL(decodeHtmlEntities(m[1]), baseUrl).href
        if (!images.includes(absolute)) images.push(absolute)
      } catch {
        // skip invalid URLs
      }
    }
  }
  return images
}

function extractShopifyProductImage(html, pageUrl) {
  try {
    const handleMatch = pageUrl.match(/\/products\/([^/?#]+)/)
    if (!handleMatch) return null
    const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1])
      const image = data?.image
      if (typeof image === 'string') return image
      if (Array.isArray(image) && image[0]) return image[0]
    }
  } catch {
    // ignore
  }
  return null
}

async function searchBingImages(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&qft=+filterui:photo-photo`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return []
    const html = await res.text()
    const patterns = [
      /murl&quot;:&quot;(https?:\\\/\\\/[^&]+?)&quot;/g,
      /murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g,
      /"murl":"(https?:[^"]+)"/g,
    ]
    const results = []
    for (const re of patterns) {
      let m
      while ((m = re.exec(html)) !== null) {
        const decoded = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
        if (!results.includes(decoded)) results.push(decoded)
      }
    }
    return results.filter((u) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u)).slice(0, 8)
  } catch {
    return []
  }
}

async function searchDuckDuckGoImages(query) {
  try {
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return []
    const vqd = (await res.text()).match(/vqd=([\d-]+)/)?.[1]
    if (!vqd) return []
    const imgRes = await fetch('https://duckduckgo.com/i.js?' + new URLSearchParams({ l: 'no-no', o: 'json', q: query, vqd }), {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!imgRes.ok) return []
    const data = await imgRes.json()
    return (data.results || [])
      .map((r) => r.image)
      .filter(Boolean)
      .slice(0, 8)
  } catch {
    return []
  }
}

const BLOCKED_IMAGE_HOSTS = [
  'dreamstime.com',
  'seeklogo.com',
  'shutterstock.com',
  'alamy.com',
  'gettyimages.com',
  'wallpaperaccess.com',
  'ftcdn.net',
  'pinimg.com',
  'media-amazon.com',
]

function tokenize(...parts) {
  return [...new Set(parts.join(' ').toLowerCase().split(/[^a-z0-9æøå]+/i).filter((t) => t.length > 2))]
}

function isRelevantImage(imageUrl, { brand, name, merchant, catalog }) {
  const host = (() => {
    try {
      return new URL(imageUrl).hostname.toLowerCase()
    } catch {
      return ''
    }
  })()
  if (BLOCKED_IMAGE_HOSTS.some((blocked) => host.includes(blocked))) return { ok: false, score: 0 }

  const haystack = imageUrl.toLowerCase()
  const tokens = tokenize(brand, name, merchant)
  const productTokens = tokens.filter(
    (t) => !['nutrition', 'sports', 'labs', 'europe', 'pre', 'workout', 'stim', 'free', 'pwo'].includes(t),
  )
  const hits = productTokens.filter((t) => haystack.includes(t))
  if (hits.length >= 1) return { ok: true, score: hits.length }

  const trustedHosts = [
    'gymgrossisten.no',
    'demandware.static',
    'kost1.no',
    'getfit.no',
    'tights.no',
    'peveo.no',
    'whitelion.no',
    'shopify',
    'cdn.shopify.com',
    'bodylab',
    'myrevolution.no',
    'naturecan.no',
    'helsekost.no',
  ]
  if (trustedHosts.some((h) => haystack.includes(h))) return { ok: true, score: 2 }

  if (catalog === 'protein' && haystack.includes('protein')) return { ok: true, score: 1 }

  return { ok: false, score: 0 }
}

export async function findProductImage({ name, brand, url, catalog, merchant = '' }) {
  const sources = []
  const candidates = []

  if (url) {
    const page = await checkProductUrl(url)
    if (page.ok) {
      sources.push(url)
      for (const img of extractMetaImages(page.html, url)) candidates.push({ url: img, source: 'og:image' })
      const shopify = extractShopifyProductImage(page.html, url)
      if (shopify) candidates.push({ url: shopify, source: 'shopify-json' })
      const demandware = page.html.match(/https?:\/\/[^"'\s]+demandware\.static[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*/i)
      if (demandware) candidates.push({ url: demandware[0].replace(/\\u0026/g, '&'), source: 'demandware' })
    }
  }

  const productKind = catalog === 'protein' ? 'proteinpulver' : 'pre workout PWO'
  const query = `${brand} ${name} ${productKind}`.replace(/\s+/g, ' ').trim()
  for (const img of await searchBingImages(query)) candidates.push({ url: img, source: 'bing' })
  if (!candidates.length) {
    for (const img of await searchDuckDuckGoImages(query)) candidates.push({ url: img, source: 'duckduckgo' })
  }

  const seen = new Set()
  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue
    seen.add(candidate.url)
    const relevance = isRelevantImage(candidate.url, { brand, name, merchant, catalog })
    if (!relevance.ok) continue
    if (candidate.source === 'bing' || candidate.source === 'duckduckgo') {
      if (relevance.score < 2) continue
    }
    if (await checkImageUrl(candidate.url)) {
      return { image: candidate.url, source: candidate.source, sources, query }
    }
  }

  return { image: null, source: null, sources, query, candidates: candidates.map((c) => c.url) }
}

export function escapeForTs(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function updateTestedProductImage(pwoSrc, productId, imageUrl) {
  const idPattern = new RegExp(`(id:\\s*'${productId}'[\\s\\S]*?image:\\s*)(?:'[^']*'|\"[^\"]*\"|[\\s\\S]*?)(,\\s*\\n)`)
  if (!idPattern.test(pwoSrc)) return null
  return pwoSrc.replace(idPattern, `$1'${escapeForTs(imageUrl)}'$2`)
}

export function updateListedOnlyProductImage(pwoSrc, productId, imageUrl) {
  const listedStart = pwoSrc.indexOf('export const listedProducts')
  const listedEnd = pwoSrc.indexOf('export const sourceLinks', listedStart)
  if (listedStart === -1 || listedEnd === -1) return null

  const before = pwoSrc.slice(0, listedStart)
  const listedSection = pwoSrc.slice(listedStart, listedEnd)
  const after = pwoSrc.slice(listedEnd)

  const idIdx = listedSection.indexOf(`id: '${productId}'`)
  if (idIdx === -1) return null

  const blockStart = listedSection.lastIndexOf('{', idIdx)
  const blockEnd = listedSection.indexOf('},', idIdx)
  if (blockStart === -1 || blockEnd === -1) return null

  let block = listedSection.slice(blockStart, blockEnd + 2)
  if (/image:\s*'/.test(block)) {
    block = block.replace(/image:\s*'[^']*'/, `image: '${escapeForTs(imageUrl)}'`)
  } else {
    block = block.replace(/(url:\s*'[^']+',)\n/, `$1\n    image: '${escapeForTs(imageUrl)}',\n`)
  }

  const updatedListed = listedSection.slice(0, blockStart) + block + listedSection.slice(blockEnd + 2)
  return before + updatedListed + after
}

export function updateProteinProductImage(proteinSrc, productId, imageUrl) {
  const idPattern = new RegExp(`(id:\\s*'${productId}'[\\s\\S]*?image:\\s*)(?:IMG|'[^']*'|\"[^\"]*\")(,)`)
  if (!idPattern.test(proteinSrc)) return null
  return proteinSrc.replace(idPattern, `$1'${escapeForTs(imageUrl)}'$2`)
}

export function applyImageUpdate({ catalog, productId, imageUrl }) {
  if (catalog === 'pwo-tested') {
    const src = readText(PWO_PATH)
    const updated = updateTestedProductImage(src, productId, imageUrl)
    if (!updated) throw new Error(`Kunne ikke oppdatere tested product ${productId}`)
    writeText(PWO_PATH, updated)
    return PWO_PATH
  }
  if (catalog === 'pwo-listed-only') {
    const src = readText(PWO_PATH)
    const updated = updateListedOnlyProductImage(src, productId, imageUrl)
    if (!updated) throw new Error(`Kunne ikke oppdatere listed-only product ${productId}`)
    writeText(PWO_PATH, updated)
    return PWO_PATH
  }
  if (catalog === 'protein') {
    const src = readText(PROTEIN_PATH)
    const updated = updateProteinProductImage(src, productId, imageUrl)
    if (!updated) throw new Error(`Kunne ikke oppdatere protein product ${productId}`)
    writeText(PROTEIN_PATH, updated)
    return PROTEIN_PATH
  }
  throw new Error(`Ukjent catalog: ${catalog}`)
}

export async function assessProduct(product) {
  const generic = isGenericImage(product.image, product.catalog)
  const imageOk = !generic && (await checkImageUrl(product.image))
  const page = product.url ? await checkProductUrl(product.url) : { ok: false, status: 0 }
  const needsImage = generic || !imageOk
  return {
    ...product,
    genericImage: generic,
    imageOk,
    pageOk: page.ok,
    pageStatus: page.status,
    needsImage,
    status: needsImage ? 'needs_image' : page.ok ? 'ok' : 'url_issue',
  }
}
