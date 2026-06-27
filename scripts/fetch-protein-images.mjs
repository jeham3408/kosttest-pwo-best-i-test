#!/usr/bin/env node
/**
 * Henter produktbilder for proteinpulver til public/products/.
 * Kjør: node scripts/fetch-protein-images.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public/products')
const MAP_FILE = path.join(ROOT, 'data/protein-images.json')
const GG = 'https://www.gymgrossisten.no'
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept-Language': 'nb-NO,nb;q=0.9',
}
const IMG_SIZE = '?sw=400&sh=400&sm=fit&sfrm=png'

/** Verifiserte kilder — oppdateres ved verifisering av nye produkter. */
const PRODUCTS = {
  'dymatize-iso100': {
    type: 'gg',
    q: 'iso-100 dymatize',
    brand: 'Dymatize',
    must: ['iso-100'],
    exclude: ['gainer'],
  },
  'optimum-gold-standard': {
    type: 'direct',
    url: 'https://www.optimumnutrition.com/cdn/shop/files/on-1111968_Image_01.png?v=1756452646&width=800',
  },
  'bodylab-whey-100': {
    type: 'direct',
    url: 'https://bodylab.b-cdn.net/media/8a/e6/2d/1756457419/BL-BM0008-whey100-main.png?width=800',
  },
  'star-whey-100': {
    type: 'gg',
    q: 'whey-100 star nutrition 1 kg',
    brand: 'Star Nutrition',
    must: ['whey-100'],
    exclude: ['mix', 'match', '4 kg', 'bonus'],
  },
  'myprotein-impact-whey': {
    type: 'direct',
    url: 'https://static.thcdn.com/productimg/original/17712277-1795347408134393.png',
  },
  'scitec-100-whey-professional': {
    type: 'gg',
    q: 'whey protein professional scitec',
    brand: 'Scitec Nutrition',
    must: ['whey', 'professional'],
  },
  'applied-critical-whey': {
    type: 'direct',
    url: 'https://cdn.shopify.com/s/files/1/0454/0871/4919/files/Critical_Whey_Professional_2kg_-_Chocolate_Milkshake_Gifts_1.webp?v=1781767210&width=800',
  },
  'mutant-iso-surge': {
    type: 'gg',
    q: 'iso surge mutant',
    brand: 'Mutant',
    must: ['iso surge'],
  },
  'rule1-r1-protein': {
    type: 'direct',
    url: 'https://www.ruleoneproteins.com/cdn/shop/files/r1pwi_1.5lb_milk-chocolate-front.png?v=1777910205&width=800',
  },
  'muscletech-nitrotech': {
    type: 'direct',
    url: 'https://cdn.shopify.com/s/files/1/1214/7132/files/MuscleTech-NitroTech-Whey-Gold-2000x2000-01a_new.jpg?v=1753903525&width=800',
  },
  'ghost-whey': {
    type: 'direct',
    url: 'https://cdn.shopify.com/s/files/1/2060/6331/files/WheyCerealMilk_27054e9f-840f-49e0-acc9-29340a5b6d60.webp?v=1782160177&width=800',
  },
  'esn-designer-whey': {
    type: 'direct',
    url: 'https://www.esn.com/cdn/shop/files/DesignerWhey_908g_AlmondCoconutFlavor_dunkel-cMtVjARn.jpg?v=1766394700&width=800',
  },
  'biotech-iso-whey-zero': {
    type: 'direct',
    url: 'https://cdn.shopify.com/s/files/1/1914/3079/files/IWZ_white_chocolate_600x600_d5e098b5-70f0-487c-ad97-838b30971733.png?v=1764934984&width=800',
  },
  'weider-premium-whey': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw8d103ce2/media/GG-Produktbilder/Weider/9919-057812-Clear-Isolate-500-g-Blue-Raspberry.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'proteinfabrikken-whey': {
    type: 'gg',
    q: '100% whey proteinfabrikken',
    brand: 'Proteinfabrikken',
    must: ['100%', 'whey'],
  },
  'smartsupps-whey': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dw3731fff2/media/GG-Produktbilder/SmartSupps/901905-02_SmartSupps-Whey-Protein_1kg_Chocolate.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'bsn-syntha6-isolate': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dwac3b364f/Hi-res/s/y/syntha6_choco_milkshake_1.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'olimp-pure-whey': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dwc1bea86c/images/hi-res/82092461/82092461+1.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'esn-isoclear': {
    type: 'direct',
    url: 'https://www.esn.com/cdn/shop/files/4_1.jpg?v=1743754456&width=800',
  },
  'optimum-gold-standard-casein': {
    type: 'direct',
    url: 'https://www.gymgrossisten.no/dw/image/v2/BDJH_PRD/on/demandware.static/-/Sites-hsng-master-catalog/default/dwe93e5603/media/GG-Produktbilder/Optimum/Rebranding/6947-003-100_ON_Casein-Gold-Std,-908-g,-Creamy-Vanillanov23.jpg?sw=400&sh=400&sm=fit&sfrm=png',
  },
  'myprotein-soy-isolate': {
    type: 'direct',
    url: 'https://static.thcdn.com/productimg/original/10529701-1295180485365027.jpg',
  },
  'myprotein-vegan-blend': {
    type: 'direct',
    url: 'https://static.thcdn.com/productimg/original/11776868-3235180485987971.jpg',
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
  if (spec.type === 'direct') return { image: spec.url, label: 'direct' }
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const map = {}
  const missing = []

  for (const [id, spec] of Object.entries(PRODUCTS)) {
    const { image, label } = await resolveImage(id, spec)
    if (!image) {
      if (!spec.optional) missing.push(id)
      console.error('MISSING', id)
      continue
    }
    const head = await fetch(image, { method: 'HEAD', headers: UA })
    if (!head.ok) {
      if (!spec.optional) missing.push(id)
      console.error('FAIL HEAD', id, head.status, label)
      continue
    }
    const res = await fetch(image, { headers: UA })
    const buf = Buffer.from(await res.arrayBuffer())
    const file = `${id}.${extFromUrl(image)}`
    fs.writeFileSync(path.join(OUT_DIR, file), buf)
    map[id] = `/products/${file}`
    console.log('OK', id, label, map[id])
    await new Promise((r) => setTimeout(r, 150))
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n')
  console.log(`\nSaved ${Object.keys(map).length}/${Object.keys(PRODUCTS).length} images`)
  if (missing.length) console.error('Required missing:', missing.join(', '))
}

main()
