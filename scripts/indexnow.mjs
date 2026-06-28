// IndexNow URL submission script
// Runs after build to notify search engines of updated content

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const API_KEY = '31be3d16a6bf4450b524610c44164a85'
const HOST = 'kosttest.no'
const INDEXNOW_URL = 'https://api.indexnow.org/IndexNow'

const sitemapPath = resolve(root, 'public/sitemap.xml')
const sitemap = await readFile(sitemapPath, 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

if (urls.length === 0) {
  console.log('IndexNow: no URLs found in sitemap — skipped')
  process.exit(0)
}

const body = JSON.stringify({
  host: HOST,
  key: API_KEY,
  keyLocation: `https://${HOST}/${API_KEY}.txt`,
  urlList: urls.slice(0, 10000),
})

try {
  const response = await fetch(INDEXNOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
  })
  if (response.ok) {
    console.log(`IndexNow: ${urls.length} URLs submitted (${response.status})`)
  } else {
    console.log(`IndexNow: ${response.status} ${response.statusText}`)
  }
} catch (err) {
  console.log('IndexNow: submission failed (network issue) -', err.message)
}
