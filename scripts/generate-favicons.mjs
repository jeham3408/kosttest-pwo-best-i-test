import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
/** Hvit bakgrunn — best for nettleser-fane. Mørk variant: brand/app-icon.png */
const source = resolve(publicDir, 'brand/icon-light.png')

const pngSizes = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-64x64.png', 64],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
]

async function resizePng(filename, size) {
  const target = resolve(publicDir, filename)
  await execFileAsync('magick', [source, '-resize', `${size}x${size}`, target])
}

async function writeIco() {
  const target = resolve(publicDir, 'favicon.ico')
  await execFileAsync('magick', [
    source,
    '-define',
    'icon:auto-resize=64,48,32,16',
    target,
  ])
}

async function writeSvgFavicon() {
  const png128 = resolve(publicDir, '.favicon-128-temp.png')
  await execFileAsync('magick', [source, '-resize', '128x128', png128])
  const base64 = (await readFile(png128)).toString('base64')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <image width="128" height="128" href="data:image/png;base64,${base64}"/>
</svg>
`
  await writeFile(resolve(publicDir, 'favicon.svg'), svg)
  await execFileAsync('rm', [png128])
}

console.log('Generating favicons from', source)

for (const [filename, size] of pngSizes) {
  await resizePng(filename, size)
  console.log('  ✓', filename)
}

await writeIco()
console.log('  ✓ favicon.ico')

await writeSvgFavicon()
console.log('  ✓ favicon.svg')

console.log('Done.')
