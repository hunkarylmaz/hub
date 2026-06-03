const { chromium } = require('/opt/node22/lib/node_modules/playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:5174'
const DIR = path.join(__dirname, 'screenshots2')
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(1500)
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

  // ── PARTNER ──────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/partner/login`)
  await shot(page, '01-partner-login')
  await page.fill('input[type=email]', 'partner@plus.com')
  await page.fill('input[type=password]', 'partner123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/partner/dashboard')
  await shot(page, '02-partner-dashboard')

  // Is Olustur - Step 1
  await page.goto(`${BASE}/partner/is-olustur`)
  await page.waitForTimeout(600)
  await page.locator('select').nth(0).selectOption({ label: 'İstanbul' })
  await page.waitForTimeout(400)
  await page.locator('select').nth(1).selectOption({ index: 1 })
  await page.waitForTimeout(300)
  await page.locator('textarea').nth(0).fill('Bağdat Cad. No:10')
  await shot(page, '03-is-olustur-adim1')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(600)
  await page.locator('select').nth(0).selectOption({ label: 'İstanbul' })
  await page.waitForTimeout(300)
  await page.locator('select').nth(1).selectOption({ index: 2 })
  await page.waitForTimeout(300)
  await page.locator('textarea').nth(0).fill('Büyükdere Cad. 145')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(600)
  await page.locator('input').nth(0).fill('Ali Demir')
  await page.locator('input').nth(1).fill('05321234567')
  await page.locator('input').nth(2).fill('Veli Kaya')
  await page.locator('input').nth(3).fill('05331234567')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(600)
  await shot(page, '04-is-olustur-adim4-paket')
  await page.locator('input[type=datetime-local]').fill('2026-06-05T10:30')
  await page.getByRole('button', { name: 'İleri' }).click()
  await page.waitForTimeout(600)
  await shot(page, '05-is-olustur-ozet')

  // Partner Islerim
  await page.goto(`${BASE}/partner/islerim`)
  await page.waitForTimeout(1200)
  await shot(page, '06-partner-islerim')

  // Is Detay
  const jobLinks = page.locator('a[href*="/partner/is/"]')
  if (await jobLinks.count() > 0) {
    await jobLinks.first().click()
    await page.waitForTimeout(1200)
    await shot(page, '07-partner-is-detay')
    await page.goBack()
  }

  // Alt Kullanicilar
  await page.goto(`${BASE}/partner/alt-kullanicilar`)
  await page.waitForTimeout(1200)
  await shot(page, '08-partner-alt-kullanicilar')
  await page.getByRole('button', { name: /yeni alt kullanıcı/i }).click()
  await page.waitForTimeout(600)
  await shot(page, '09-partner-alt-kullanici-modal')
  await page.keyboard.press('Escape')

  // ── ALT KULLANICI ─────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/alt/login`)
  await shot(page, '10-alt-login')
  await page.fill('input[type=email]', 'disci@plus.com')
  await page.fill('input[type=password]', 'disci123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/alt/dashboard')
  await page.waitForTimeout(1500)
  await shot(page, '11-alt-dashboard')

  await page.goto(`${BASE}/alt/is-olustur`)
  await page.waitForTimeout(800)
  await shot(page, '12-alt-is-olustur-adim1')
  // Pick a paket type
  const paketBtns = page.locator('button').filter({ hasText: /Küçük|Orta|Büyük|Zarf|Koli/ })
  if (await paketBtns.count() > 0) await paketBtns.nth(1).click()
  await page.locator('textarea').first().fill('Protez örneği, kırılmaz kutuda').catch(() => {})
  await page.getByRole('button', { name: /devam|özet|İleri/i }).first().click()
  await page.waitForTimeout(600)
  await shot(page, '13-alt-is-olustur-ozet')

  await page.goto(`${BASE}/alt/islerim`)
  await page.waitForTimeout(1200)
  await shot(page, '14-alt-islerim')

  // ── TASIYICI ──────────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/tasiyici/login`)
  await shot(page, '15-tasiyici-login')
  await page.fill('input[type=email]', 'tasiyici@plus.com')
  await page.fill('input[type=password]', 'tasiyici123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/tasiyici/havuz')
  await page.waitForTimeout(1500)
  await shot(page, '16-tasiyici-havuz')
  await page.goto(`${BASE}/tasiyici/islerim`)
  await page.waitForTimeout(1200)
  await shot(page, '17-tasiyici-islerim')

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear())
  await page.goto(`${BASE}/admin/login`)
  await shot(page, '18-admin-login')
  await page.fill('input[type=email]', 'admin@plus.com')
  await page.fill('input[type=password]', 'admin123')
  await page.click('button[type=submit]')
  await page.waitForURL('**/admin/dashboard')
  await page.waitForTimeout(1500)
  await shot(page, '19-admin-dashboard')

  await page.goto(`${BASE}/admin/partnerler`)
  await page.waitForTimeout(1200)
  await shot(page, '20-admin-partnerler')
  await page.getByRole('button', { name: /yeni partner/i }).click()
  await page.waitForTimeout(500)
  await shot(page, '21-admin-partner-modal')
  await page.keyboard.press('Escape')

  await page.goto(`${BASE}/admin/tasiyicilar`)
  await page.waitForTimeout(1200)
  await shot(page, '22-admin-tasiyicilar')

  await page.goto(`${BASE}/admin/isler`)
  await page.waitForTimeout(1500)
  await shot(page, '23-admin-isler')
  const manuBtns = page.getByRole('button', { name: /manuel ata/i })
  if (await manuBtns.count() > 0) {
    await manuBtns.first().click()
    await page.waitForTimeout(600)
    await shot(page, '24-admin-manuel-ata')
  }

  await page.goto(`${BASE}/admin/fiyatlar`)
  await page.waitForTimeout(1200)
  await shot(page, '25-admin-fiyatlar')

  await page.goto(`${BASE}/admin/borclar`)
  await page.waitForTimeout(1500)
  await shot(page, '26-admin-borclar')
  const borcBtns = page.locator('button').filter({ hasText: /ABC|Dental|lojistik/i })
  if (await borcBtns.count() > 0) {
    await borcBtns.first().click()
    await page.waitForTimeout(1200)
    await shot(page, '27-admin-borclar-detay')
    const odemeBtn = page.getByRole('button', { name: /ödeme kaydet/i })
    if (await odemeBtn.count() > 0) {
      await odemeBtn.first().click()
      await page.waitForTimeout(500)
      await shot(page, '28-admin-odeme-modal')
      await page.keyboard.press('Escape')
    }
  }

  await browser.close()
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort()
  console.log(`\n✓ Tamamlandı — ${files.length} ekran görüntüsü`)
  files.forEach(f => console.log(`  ${f}`))
}
main().catch(console.error)
