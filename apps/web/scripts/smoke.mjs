/**
 * Uçtan uca smoke testi — build edilmiş uygulamayı (dist/) vite preview ile açar,
 * temiz profille onboarding → besin ekleme (Türkçe İ/ı araması) → su → tema
 * akışını gerçek Chrome'da yürütür. IndexedDB adı ve fh:* anahtarları assert edilir.
 *
 * Kullanım: npm run build && node scripts/smoke.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const appRoot = fileURLToPath(new URL('..', import.meta.url))
const PORT = 4199
const CHROME =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if (!existsSync(join(appRoot, 'dist/index.html'))) {
  console.error('dist/ yok — önce `npm run build` çalıştır.')
  process.exit(1)
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: appRoot,
  stdio: 'ignore',
})

const ok = (cond, msg) => {
  if (!cond) throw new Error(`ASSERT: ${msg}`)
  console.log(`  ✓ ${msg}`)
}

let browser
try {
  // Preview'ın ayağa kalkmasını bekle
  for (let i = 0; ; i++) {
    try {
      await fetch(`http://localhost:${PORT}/`)
      break
    } catch {
      if (i > 50) throw new Error('vite preview açılmadı')
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(`http://localhost:${PORT}/`)

  // --- Onboarding (temiz profil → akış zorunlu) ---
  await page.getByRole('button', { name: 'Başlayalım' }).click()
  await page.getByPlaceholder('İsmin').fill('Smoke')
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByText('😀', { exact: true }).click()
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByRole('button', { name: 'Kadın' }).click()
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByText('yaşındasın').waitFor()
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByRole('button', { name: 'Artır' }).click() // boy: fallback+1
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByRole('button', { name: 'Masa başı' }).click()
  await page.getByRole('button', { name: 'Devam', exact: true }).click()
  await page.getByRole('button', { name: 'Şimdilik geç' }).click()
  await page.getByRole('button', { name: 'Uygulamaya Geç 🎉' }).click()
  await page.getByText('Besin Rehberi').waitFor()
  console.log('  ✓ onboarding tamamlandı → Bugün ekranı')

  // --- Kalıcılık: fh:activeProfileId + IndexedDB adı ---
  const profileId = await page.evaluate(() => localStorage.getItem('fh:activeProfileId'))
  ok(profileId, `fh:activeProfileId kaydedildi (${profileId})`)
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))
  ok(dbs.includes('family-health'), `IndexedDB adı korunuyor (${dbs.join(', ')})`)

  // --- Besin ekleme: Türkçe I→ı araması (turkishLower yolu) ---
  await page.getByRole('button', { name: 'Besin ekle', exact: true }).click()
  await page.getByPlaceholder('Ne yedin? (örn. mercimek çorbası)').fill('ISPANAK')
  await page.getByRole('button', { name: /Ispanak yemeği/ }).click()
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await page.getByRole('button', { name: 'Devam ✨' }).click() // ilk kayıt kutlaması
  ok(true, 'büyük harf "ISPANAK" araması eşleşti, öğün kaydedildi')

  // --- Su sayacı ---
  await page.getByRole('button', { name: 'Bir bardak ekle' }).click()
  await page.getByText(/1\/\d+ bardak/).waitFor()
  ok(true, 'su +1 bardak')

  // --- Tema geçişi ---
  await page.getByRole('link', { name: 'Profil' }).first().click()
  await page.getByRole('button', { name: 'Koyu' }).click()
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  ok(isDark, 'koyu tema <html class="dark"> uygulandı')
  const theme = await page.evaluate(() => localStorage.getItem('fh:theme'))
  ok(theme === 'dark', 'fh:theme kaydedildi')

  ok(errors.length === 0, `sayfa hatası yok${errors.length ? `: ${errors[0]}` : ''}`)
  console.log('\nSMOKE PASS')
} catch (e) {
  console.error('\nSMOKE FAIL:', e.message ?? e)
  process.exitCode = 1
} finally {
  await browser?.close()
  preview.kill()
}
