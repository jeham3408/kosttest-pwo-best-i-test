import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const serverEntry = resolve(dist, 'server/entry-server.js')

const { render, getAllPrerenderRoutes, applyMetaToHtml, parseRoute, getPageMeta } = await import(
  `file://${serverEntry}`,
)

const htmlPath = resolve(dist, 'index.html')
const template = await readFile(htmlPath, 'utf8')

if (!template.includes('<!--app-html-->')) {
  throw new Error('dist/index.html mangler <!--app-html--> placeholder. Kjør vite build på nytt.')
}

const routes = getAllPrerenderRoutes()

for (const route of routes) {
  const appHtml = render(route)
  const meta = getPageMeta(parseRoute(route))
  const html = applyMetaToHtml(template.replace('<!--app-html-->', appHtml), meta)

  if (route === '/') {
    await writeFile(htmlPath, html)
    console.log('Created: /')
    continue
  }

  const dirPath = resolve(dist, route.slice(1))
  await mkdir(dirPath, { recursive: true })
  await writeFile(resolve(dirPath, 'index.html'), html)
  console.log('Created:', route + '/')
}

await rm(resolve(dist, 'server'), { recursive: true, force: true })
console.log('Done — generated', routes.length, 'HTML files')
