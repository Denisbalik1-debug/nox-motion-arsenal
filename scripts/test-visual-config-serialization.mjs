// Fokussierter Encode-/Decode-Test für den Share-Link.
//
// Läuft im Browser gegen die gebaute App, weil `effectConfig.ts` TypeScript ist
// und `btoa`/`atob`/`TextEncoder` benutzt. Getestet wird die echte, gebündelte
// Implementierung — nicht eine Nachbildung in Node.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const BASE = process.env.ARSENAL_URL ?? process.env.ARSENAL_BASE ?? 'http://127.0.0.1:5195';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const EFFECTS = ['scroll-pinned-product-stage', 'scroll-cosmic-depth-field'];

const browser = await chromium.launch(
  process.env.CI ? { headless: true } : { executablePath: CHROME, headless: true },
);
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
page.on('pageerror', (error) => {
  throw error;
});

/**
 * Controls über die echten Browser-Interaktionen bedienen.
 * Synthetische Events auf Checkboxen sind hier NICHT verlässlich: React
 * registriert die Änderung nicht, der Test würde grün laufen, ohne dass sich
 * etwas geändert hat.
 */
async function setRange(key, value) {
  await page.evaluate(
    ({ key, value }) => {
      const el = document.querySelector(`[data-control-key="${key}"]`);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(value));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    { key, value },
  );
  await page.waitForTimeout(40);
}

function decodePayload(url) {
  const encoded = new URL(url.replace('#/', '')).searchParams.get('config')
    ?? url.split('config=')[1];
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

for (const effectId of EFFECTS) {
  await page.goto(`${BASE}/#/effect/${effectId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-control-key]');

  const controls = await page.evaluate(() =>
    [...document.querySelectorAll('[data-control-key]')].map((el) => ({
      key: el.dataset.controlKey,
      type: el.tagName === 'SELECT' ? 'select' : el.type,
    })),
  );
  assert.ok(controls.length >= 40, `${effectId}: expected a full control surface, got ${controls.length}`);

  // --- Alle Controls vom Default wegbewegen ------------------------------
  const changed = {};
  for (const control of controls) {
    if (control.type === 'range') {
      const info = await page.evaluate((key) => {
        const el = document.querySelector(`[data-control-key="${key}"]`);
        return { min: Number(el.min), max: Number(el.max), step: Number(el.step), value: Number(el.value) };
      }, control.key);
      // Einen Schritt weg vom aktuellen Wert, ohne den Bereich zu verlassen.
      // Auf die Step-Auflösung runden — genau das macht der Normalizer auch,
      // sonst vergleicht der Test Float-Rauschen (0.39999999999999997) gegen
      // den korrekt gerundeten Wert (0.4).
      const decimals = (String(info.step).split('.')[1] ?? '').length;
      const raw = info.value + info.step <= info.max ? info.value + info.step : info.value - info.step;
      const next = Number(raw.toFixed(decimals));
      await setRange(control.key, next);
      changed[control.key] = next;
    } else if (control.type === 'checkbox') {
      const current = await page.evaluate((key) => document.querySelector(`[data-control-key="${key}"]`).checked, control.key);
      await page.click(`[data-control-key="${control.key}"]`);
      await page.waitForTimeout(40);
      const now = await page.evaluate((key) => document.querySelector(`[data-control-key="${key}"]`).checked, control.key);
      assert.equal(now, !current, `${effectId}: checkbox ${control.key} did not toggle — the test would be vacuous`);
      changed[control.key] = !current;
    } else if (control.type === 'select') {
      const next = await page.evaluate((key) => {
        const el = document.querySelector(`[data-control-key="${key}"]`);
        const options = [...el.options].map((o) => o.value);
        return options.find((o) => o !== el.value) ?? el.value;
      }, control.key);
      await page.selectOption(`[data-control-key="${control.key}"]`, next);
      await page.waitForTimeout(40);
      changed[control.key] = next;
    }
  }

  await page.fill('[data-testid="share-usage"]', 'Homepage Revenue OS Section');
  await page.fill('[data-testid="share-note"]', 'Vom Operator im Dashboard gewählt');
  await page.waitForTimeout(150);

  // Share-Link über den echten Button-Pfad erzeugen (Clipboard-Stub).
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = (text) => {
      window.__copied = text;
      return Promise.resolve();
    };
  });
  await page.click('[data-testid="copy-share-link"]');
  await page.waitForTimeout(120);
  const shareUrl = await page.evaluate(() => window.__copied);
  assert.ok(shareUrl.includes(`#/effect/${effectId}?config=`), `${effectId}: share link malformed: ${shareUrl}`);

  const payload = decodePayload(shareUrl);
  assert.equal(payload.v, 2, `${effectId}: share payload must carry a config version`);
  assert.equal(payload.id, effectId, `${effectId}: share payload must carry the effect id`);
  assert.equal(payload.usage, 'Homepage Revenue OS Section', `${effectId}: usage context missing`);
  assert.equal(payload.note, 'Vom Operator im Dashboard gewählt', `${effectId}: note missing`);

  // Kein Control darf verloren gehen — alle wurden bewusst verstellt.
  for (const key of Object.keys(changed)) {
    assert.ok(key in payload.p, `${effectId}: encoder dropped changed prop ${key}`);
  }
  // Boolean false und numerische 0 müssen erhalten bleiben.
  for (const [key, value] of Object.entries(changed)) {
    assert.deepEqual(payload.p[key], value, `${effectId}: value mangled for ${key}`);
  }

  // --- Roundtrip ---------------------------------------------------------
  const before = await page.evaluate(() => ({
    controls: Object.fromEntries(
      [...document.querySelectorAll('[data-control-value]')].map((el) => [el.dataset.controlValue, el.textContent.trim()]),
    ),
    jsx: document.querySelector('[data-testid="usage-code"]').textContent,
  }));

  await page.goto(shareUrl.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-control-value]');
  await page.waitForTimeout(200);

  const after = await page.evaluate(() => ({
    controls: Object.fromEntries(
      [...document.querySelectorAll('[data-control-value]')].map((el) => [el.dataset.controlValue, el.textContent.trim()]),
    ),
    jsx: document.querySelector('[data-testid="usage-code"]').textContent,
    usage: document.querySelector('[data-testid="share-usage"]').value,
    note: document.querySelector('[data-testid="share-note"]').value,
  }));

  assert.deepEqual(after.controls, before.controls, `${effectId}: share link did not restore every control`);
  assert.equal(after.jsx, before.jsx, `${effectId}: restored JSX differs from the shared state`);
  assert.equal(after.usage, 'Homepage Revenue OS Section', `${effectId}: usage context not restored`);
  assert.equal(after.note, 'Vom Operator im Dashboard gewählt', `${effectId}: note not restored`);

  // Der Brief muss dieselben Werte tragen wie die Controls.
  await page.evaluate(() => {
    window.__copied = '';
    navigator.clipboard.writeText = (text) => {
      window.__copied = text;
      return Promise.resolve();
    };
  });
  await page.click('[data-testid="copy-brief"]');
  await page.waitForTimeout(120);
  const brief = await page.evaluate(() => window.__copied);
  assert.ok(brief.includes(`Effect ID:      ${effectId}`), `${effectId}: brief missing effect id`);
  assert.ok(brief.includes('Usage:          Homepage Revenue OS Section'), `${effectId}: brief missing usage`);
  assert.ok(brief.includes('Config version: 2'), `${effectId}: brief missing config version`);
  assert.ok(brief.includes('## Share URL'), `${effectId}: brief missing share url`);
  assert.ok(brief.includes(`#/effect/${effectId}?config=`), `${effectId}: brief share url malformed`);
  for (const [key, value] of Object.entries(changed)) {
    assert.ok(
      brief.includes(`"${key}": ${JSON.stringify(value)}`),
      `${effectId}: brief props block missing ${key}=${value}`,
    );
  }

  // --- Robustheit ---------------------------------------------------------
  await page.goto(`${BASE}/#/effect/${effectId}?config=not-valid-base64!!`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-control-value]');
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('[data-control-value]')].length,
  );
  assert.ok(broken > 0, `${effectId}: a broken config link must fall back to defaults, not break the page`);

  // Alte v1-Links (flache Prop-Map ohne Hülle) müssen weiter funktionieren.
  const legacy = Buffer.from(JSON.stringify(changed), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  await page.goto(`${BASE}/#/effect/${effectId}?config=${legacy}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-control-value]');
  await page.waitForTimeout(200);
  const legacyControls = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[data-control-value]')].map((el) => [el.dataset.controlValue, el.textContent.trim()]),
    ),
  );
  assert.deepEqual(legacyControls, before.controls, `${effectId}: legacy v1 share links stopped working`);

  console.log(`visual config serialization OK — ${effectId} (${controls.length} controls)`);
}

await browser.close();
console.log('visual config serialization contract: OK');
