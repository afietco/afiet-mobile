/**
 * public/icon.svg'den PWA ikon PNG'lerini üretir.
 * Kullanım: node scripts/generate-icons.mjs
 * Not: Bu makinede sistem Chrome'u kullanılır (playwright-core, browser indirmez).
 */
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svg = readFileSync(path.join(root, 'public/icon.svg'), 'utf8')

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/opt/pw-browsers/chromium',
]
const executablePath = CHROME_CANDIDATES.find((p) => {
  try { readFileSync(p); return true } catch { return p === CHROME_CANDIDATES[0] }
})

// iOS ve maskable tam kare ister (şeffaf köşe yok); rx'i sıfırlayarak üret.
const squareSvg = svg.replace('rx="112"', 'rx="0"')

const targets = [
  { file: 'public/pwa-192.png', size: 192, svg, transparent: true },
  { file: 'public/pwa-512.png', size: 512, svg, transparent: true },
  { file: 'public/pwa-512-maskable.png', size: 512, svg: squareSvg, transparent: false },
  { file: 'public/apple-touch-icon.png', size: 180, svg: squareSvg, transparent: false },
]

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(
    `<style>*{margin:0;padding:0}svg{display:block;width:${t.size}px;height:${t.size}px}</style>${t.svg}`,
  )
  await page.screenshot({ path: path.join(root, t.file), omitBackground: t.transparent })
  console.log(`✓ ${t.file} (${t.size}×${t.size})`)
}
await browser.close()
