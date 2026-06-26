// IndexNow URL submission script
// Runs after build to notify search engines of updated content

const API_KEY = '31be3d16a6bf4450b524610c44164a85'
const HOST = 'kosttest.no'
const INDEXNOW_URL = 'https://api.indexnow.org/IndexNow'

const urls = [
  'https://kosttest.no/',
  'https://kosttest.no/tester/pwo/',
  'https://kosttest.no/tester/pwo/beste/',
  'https://kosttest.no/tester/pwo/sterkeste/',
  'https://kosttest.no/tester/pwo/billigste/',
  'https://kosttest.no/tester/pwo/stim-free/',
  'https://kosttest.no/tester/pwo/slik-velger-du/',
  'https://kosttest.no/blogg/',
  'https://kosttest.no/om-metoden/',
  'https://kosttest.no/sitemap.xml',
]

const body = JSON.stringify({
  host: HOST,
  key: API_KEY,
  keyLocation: `https://${HOST}/${API_KEY}.txt`,
  urlList: urls,
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
