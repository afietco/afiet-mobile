/**
 * apps/web/public/icon.svg'den mobil uygulama görsellerini üretir:
 * icon (1024 kare), Android adaptive foreground/monochrome (1024, şeffaf),
 * splash ikonu (512, şeffaf) ve web favicon (48).
 * Kullanım: node apps/mobile/scripts/generate-assets.mjs
 * Not: Bu makinede sistem Chrome'u kullanılır (playwright-core, browser indirmez).
 */
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const mobileRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repoRoot = path.dirname(path.dirname(mobileRoot))
const svg = readFileSync(path.join(repoRoot, 'apps/web/public/icon.svg'), 'utf8')

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/opt/pw-browsers/chromium',
]
const executablePath = CHROME_CANDIDATES.find((p) => {
  try { readFileSync(p); return true } catch { return p === CHROME_CANDIDATES[0] }
})

// iOS/Android launcher tam kare ister; köşeyi platform maskeler.
const squareSvg = svg.replace('rx="116"', 'rx="0"')

// Yalnızca Afi işareti (arka plan dikdörtgeni yok) — SVG'deki ilk <g>...</g> bloğu.
const markInner = svg.slice(svg.indexOf('<g transform'), svg.lastIndexOf('</g>') + 4)
const markOnly = (scale, colorMap = {}) => {
  let m = markInner
  for (const [from, to] of Object.entries(colorMap)) m = m.replaceAll(from, to)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <g transform="translate(256 256) scale(${scale}) translate(-256 -282)">${m}</g>
  </svg>`
}

// Monochrome (Android temalı ikon): tek renk siluet — sistem kendisi boyar.
const WHITE = { '#a7f3d0': '#ffffff', '#047857': '#ffffff' }

// Splash: Afi + yazı-logo — BRAND.md wordmark referansı ("afiet" Nunito
// ExtraBold + "Sayma, dengele."). Zemin app.json'dan gelir (emerald), yazı
// beyaz/emerald-100. Fontlar data-URI ile gömülür (sayfa file:// fontu yükleyemez).
const fontData = (rel) =>
  readFileSync(path.join(repoRoot, 'node_modules/@expo-google-fonts/nunito', rel)).toString('base64')
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 720">
  <style>
    @font-face { font-family: 'NunitoXB'; src: url(data:font/ttf;base64,${fontData('800ExtraBold/Nunito_800ExtraBold.ttf')}) }
    @font-face { font-family: 'NunitoSB'; src: url(data:font/ttf;base64,${fontData('600SemiBold/Nunito_600SemiBold.ttf')}) }
  </style>
  <g transform="translate(256 236) scale(0.82) translate(-256 -282)">${markInner}</g>
  <text x="256" y="580" text-anchor="middle" font-family="NunitoXB" font-size="118" letter-spacing="-3" fill="#ffffff">afiet</text>
  <text x="256" y="650" text-anchor="middle" font-family="NunitoSB" font-size="40" fill="#d1fae5">Sayma, dengele.</text>
</svg>`

const targets = [
  { file: 'assets/images/icon.png', size: 1024, svg: squareSvg, transparent: false },
  // Adaptive foreground: güvenli bölge merkez ~%61 — işaret 0.58 ölçekte ortalanır
  { file: 'assets/images/android-icon-foreground.png', size: 1024, svg: markOnly(0.58), transparent: true },
  { file: 'assets/images/android-icon-monochrome.png', size: 1024, svg: markOnly(0.58, WHITE), transparent: true },
  { file: 'assets/images/splash-icon.png', w: 512, h: 720, svg: splashSvg, transparent: true },
  { file: 'assets/images/favicon.png', size: 48, svg, transparent: true },
]

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()
for (const t of targets) {
  const w = t.w ?? t.size
  const h = t.h ?? t.size
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(
    `<style>*{margin:0;padding:0}svg{display:block;width:${w}px;height:${h}px}</style>${t.svg}`,
  )
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(mobileRoot, t.file), omitBackground: t.transparent })
  console.log(`✓ ${t.file} (${w}×${h})`)
}
await browser.close()
