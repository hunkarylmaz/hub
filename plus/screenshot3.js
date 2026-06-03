const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:5176'
const DIR = path.join(__dirname, 'screenshots3')
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true })
  console.log(`✓ ${name}.png`)
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/login`)
  await page.fill('input[type=email]', 'admin@plus.com')
  await page.fill('input[type=password]', 'admin123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/admin/dashboard')
  await page.waitForTimeout(1500)
  await shot(page, '01-admin-dashboard')

  // Fiyatlar - adres_dagitim tab (default)
  await page.goto(`${BASE}/admin/fiyatlar`)
  await page.waitForTimeout(1200)
  await shot(page, '02-admin-fiyatlar-dagitim')

  // Fiyatlar - adres_toplama tab
  await page.getByRole('button', { name: /Adres Toplama/i }).click()
  await page.waitForTimeout(400)
  await shot(page, '03-admin-fiyatlar-toplama')

  // Fiyatlar - otogar
  await page.getByRole('button', { name: /Otogar/i }).click()
  await page.waitForTimeout(400)
  await shot(page, '04-admin-fiyatlar-otogar')

  // Fiyat ekleme modal
  await page.getByRole('button', { name: /Fiyat Ekle/i }).click()
  await page.waitForTimeout(500)
  await shot(page, '05-admin-fiyat-modal')
  await page.keyboard.press('Escape')

  // Ayarlar (KDV)
  await page.goto(`${BASE}/admin/ayarlar`)
  await page.waitForTimeout(1200)
  await shot(page, '06-admin-ayarlar')

  // Admin Yönetimi
  await page.goto(`${BASE}/admin/adminler`)
  await page.waitForTimeout(1200)
  await shot(page, '07-admin-adminler')
  await page.getByRole('button', { name: /Yeni Admin/i }).click()
  await page.waitForTimeout(500)
  await shot(page, '08-admin-yeni-admin-modal')
  await page.keyboard.press('Escape')

  // ── PARTNER ──────────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/partner/login`)
  await page.fill('input[type=email]', 'partner@plus.com')
  await page.fill('input[type=password]', 'partner123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/partner/dashboard')
  await page.waitForTimeout(1500)
  await shot(page, '09-partner-dashboard')

  // Is Olustur - step 3 (Paket & Zaman - now with is_turu)
  await page.goto(`${BASE}/partner/is-olustur`)
  await page.waitForTimeout(600)
  await page.locator('select').nth(0).selectOption({ label: 'İstanbul' })
  await page.waitForTimeout(300)
  await page.locator('select').nth(1).selectOption({ index: 1 })
  await page.waitForTimeout(300)
  await page.locator('textarea').nth(0).fill('Bağdat Cad. No:10')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(500)
  await page.locator('select').nth(0).selectOption({ label: 'İstanbul' })
  await page.waitForTimeout(300)
  await page.locator('select').nth(1).selectOption({ index: 2 })
  await page.waitForTimeout(300)
  await page.locator('textarea').nth(0).fill('Büyükdere Cad. 145')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(500)
  await page.locator('input').nth(0).fill('Ali Demir')
  await page.locator('input').nth(1).fill('05321234567')
  await page.locator('input').nth(2).fill('Veli Kaya')
  await page.locator('input').nth(3).fill('05331234567')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(600)
  await shot(page, '10-partner-is-olustur-tur-secimi')

  // Partner Is Detay (with QR image)
  await page.goto(`${BASE}/partner/islerim`)
  await page.waitForTimeout(1200)
  const jobLinks = page.locator('a[href*="/partner/is/"]')
  if (await jobLinks.count() > 0) {
    await jobLinks.first().click()
    await page.waitForTimeout(1500)
    await shot(page, '11-partner-is-detay-qr')
    await page.goBack()
  }

  // ── TASIYICI ──────────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/tasiyici/login`)
  await page.fill('input[type=email]', 'tasiyici@plus.com')
  await page.fill('input[type=password]', 'tasiyici123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/tasiyici/havuz')
  await page.waitForTimeout(1500)
  await shot(page, '12-tasiyici-havuz')

  // QR Tara page
  await page.goto(`${BASE}/tasiyici/qr-tara`)
  await page.waitForTimeout(1200)
  await shot(page, '13-tasiyici-qr-tara')

  // Type a QR code to search
  const qrInput = page.locator('input[type=text]').first()
  if (await qrInput.count() > 0) {
    // Get a real QR code from the pool
    await page.evaluate(() => localStorage.clear())
    // We need to get a job from the havuz first
  }

  // Tasiyici Islerim
  await page.goto(`${BASE}/tasiyici/islerim`)
  await page.waitForTimeout(1200)
  await shot(page, '14-tasiyici-islerim')

  // ── ALT KULLANICI ─────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/alt/login`)
  await page.fill('input[type=email]', 'disci@plus.com')
  await page.fill('input[type=password]', 'disci123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/alt/dashboard')
  await page.waitForTimeout(1500)
  await shot(page, '15-alt-dashboard')

  await page.goto(`${BASE}/alt/is-olustur`)
  await page.waitForTimeout(800)
  await shot(page, '16-alt-is-olustur')

  await browser.close()
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort()
  console.log(`\n✓ Tamamlandı — ${files.length} ekran görüntüsü`)
  files.forEach(f => console.log(`  ${f}`))
}
main().catch(console.error)
