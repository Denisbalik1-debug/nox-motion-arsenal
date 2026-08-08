import { chromium } from 'playwright-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5195';

const shots = [
  ['system-gauge-needle-sweep', 'reports/qa-gauge-full.png', 0],
  ['system-gauge-needle-sweep', 'reports/qa-gauge-t1.png', 1200],
  ['hero-gold-outline-fill-text', 'reports/qa-gold-full.png', 0],
  ['hero-gold-outline-fill-text', 'reports/qa-gold-after.png', 1600],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

for (const [id, out, waitMs] of shots) {
  await page.goto(`${BASE}/#/effect/${id}`, { waitUntil: 'load' });
  if (waitMs > 0) await page.waitForTimeout(waitMs);
  // Scroll to the preview shell if present
  const preview = page.locator('.fx-preview-detail');
  if (await preview.count()) await preview.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: out });
  console.log('shot:', out, '| errors so far:', errors.length);
}

// Also dump console errors at end
if (errors.length) {
  console.log('CONSOLE ERRORS:');
  errors.forEach((e) => console.log(' -', e.slice(0, 200)));
} else {
  console.log('CONSOLE ERRORS: none');
}
await browser.close();
