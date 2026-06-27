#!/usr/bin/env node
/**
 * Henter produktbilder for kreatin til public/products/.
 * Kjør: node scripts/fetch-creatine-images.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public/products')
const MAP_FILE = path.join(ROOT, 'data/creatine-images.json')
const GG = 'https://www.gymgrossisten.no'
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept-Language': 'nb-NO,nb;q=0.9',
}
const IMG_SIZE = '?sw=400&sh=400&sm=fit&sfrm=png'

const PRODUCTS = {
  'esn-ultrapure-creatine': {
    type: 'direct',
    url: 'https://www.esn.com/cdn/shop/files/UltrapureCreatine_500g_Unflavored_dunkel.jpg?v=1766394701&width=800',
  },
  'optimum-gold-creatine': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dwe93e5603/media/GG-Produktbilder/Optimum/Rebranding/6947-003-100_ON_Creatine-Gold-Std,-317-g,-Unflavorednov23.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'bodylab-creatine': {
    type: 'direct',
    url: 'https://bodylab.b-cdn.net/media/catalog/product/c/r/creatine-monohydrate-500g.png',
    fallback: 'https://www.tights.no/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/r/creatine-monohydrate-500g.png',
  },
  'myprotein-creatine': {
    type: 'direct',
    url: 'https://static.thcdn.com/productimg/original/10530050-1295180485365027.jpg',
  },
  'star-creatine': {
    type: 'gg',
    q: 'creatine monohydrate star nutrition 500',
    brand: 'Star Nutrition',
    must: ['creatine', 'monohydrate'],
    exclude: ['mix', 'gummies'],
  },
  'scitec-creatine': {
    type: 'gg',
    q: '100% creatine monohydrate scitec',
    brand: 'Scitec Nutrition',
    must: ['creatine', 'monohydrate'],
  },
  'dymatize-creatine': {
    type: 'gg',
    q: 'creatine monohydrate dymatize',
    brand: 'Dymatize',
    must: ['creatine', 'monohydrate'],
    exclude: ['gainer'],
  },
  'proteinfabrikken-creatine': {
    type: 'gg',
    q: 'creatine monohydrate proteinfabrikken',
    brand: 'Proteinfabrikken',
    must: ['creatine'],
  },
  'muscletech-cell-tech': {
    type: 'direct',
    url: 'https://cdn.shopify.com/s/files/1/1214/7132/files/CellTech_2700g_FruitPunch.jpg?v=1753903525&width=800',
  },
  'bodylab-creatine-tabs': {
    type: 'direct',
    url: 'https://bodylab.b-cdn.net/media/15/c7/20/1760700778/BL-BM0471-creatine-tabs-main.png?width=800',
  },
}

function decode(s) {
  return s.replace(/&amp;/g, '&')
}

function normalizeImg(url) {
  if (!url) return null
  let img = decode(url)
  if (img.includes('logo.svg') || img.includes('logo.png')) return null
  if (!img.includes('sw=') && img.includes('gymgrossisten.no/dw/image')) {
    img = img.split('?')[0] + IMG_SIZE
  }
  return img
}

async function ggTiles(q, brand) {
  let url = `${GG}/on/demandware.store/Sites-Gymgrossisten-Site/no_NO/Search-ShowAjax?q=${encodeURIComponent(q)}`
  if (brand) {
    url += `&prefn1=brand&prefv1=${encodeURIComponent(brand)}&prefn2=hsng-product-onlineFlag-gg&prefv2=true`
  }
  const html = await (await fetch(url, { headers: UA })).text()
  return html.split('class="product-tile"').slice(1).map((block) => ({
    name: block.match(/product-tile-name">([^<]+)/)?.[1]?.replace(/&amp;/g, '&') ?? '',
    brand: block.match(/product-tile-brand"[^>]*>([^<]+)/)?.[1]?.replace(/&amp;/g, '&') ?? '',
    image: normalizeImg(block.match(/data-src="([^"]+)"/)?.[1]),
  }))
}

function pickTile(tiles, { must, exclude = [] }) {
  const norm = (s) => s.toLowerCase()
  return tiles.find((t) => {
    const name = norm(t.name)
    if (!must.every((m) => name.includes(norm(m)))) return false
    if (exclude.some((x) => name.includes(norm(x)))) return false
    return Boolean(t.image)
  })
}

async function resolveImage(id, spec) {
  if (spec.type === 'direct') {
    const head = await fetch(spec.url, { method: 'HEAD', headers: UA })
    if (head.ok) return { image: spec.url, label: 'direct' }
    if (spec.fallback) return { image: spec.fallback, label: 'fallback' }
    return { image: null, label: 'direct failed' }
  }
  const tiles = await ggTiles(spec.q, spec.brand)
  const hit = pickTile(tiles, spec) ?? pickTile(await ggTiles(spec.q), spec)
  if (hit) return { image: hit.image, label: `${hit.brand} | ${hit.name}` }
  return { image: null, label: 'not found' }
}

function extFromUrl(url) {
  if (url.includes('.png')) return 'png'
  if (url.includes('.webp')) return 'webp'
  return 'jpg'
}

async function download(id, image) {
  const res = await fetch(image, { headers: UA })
  if (!res.ok) return false
  const buf = Buffer.from(await res.arrayBuffer())
  const file = `${id}.${extFromUrl(image)}`
  fs.writeFileSync(path.join(OUT_DIR, file), buf)
  return `/products/${file}`
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const map = {}
  const missing = []

  // Behold eksisterende filer hvis de matcher id
  for (const id of Object.keys(PRODUCTS)) {
    const existing = fs.readdirSync(OUT_DIR).find((f) => f.startsWith(`${id}.`))
    if (existing) {
      map[id] = `/products/${existing}`
      console.log('KEEP', id, map[id])
    }
  }

  for (const [id, spec] of Object.entries(PRODUCTS)) {
    if (map[id]) continue
    const { image, label } = await resolveImage(id, spec)
    if (!image) {
      if (!spec.optional) missing.push(id)
      console.error('MISSING', id)
      continue
    }
    const local = await download(id, image)
    if (!local) {
      if (!spec.optional) missing.push(id)
      console.error('FAIL DL', id, label)
      continue
    }
    map[id] = local
    console.log('OK', id, label, local)
    await new Promise((r) => setTimeout(r, 150))
  }

  // bodylab-creatine: bruk tights-bilde hvis vi ikke har eget
  if (!map['bodylab-creatine']) {
    const tights = 'https://www.tights.no/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/r/creatine-monohydrate-500g.png'
    const local = await download('bodylab-creatine', tights)
    if (local) map['bodylab-creatine'] = local
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n')
  console.log(`\nSaved ${Object.keys(map).length}/${Object.keys(PRODUCTS).length} images`)
  if (missing.length) console.error('Required missing:', missing.join(', '))
}

main()
