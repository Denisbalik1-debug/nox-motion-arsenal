/**
 * Preview audit harness — walks every effect detail route in a REAL Chrome
 * (the in-app browser pane starves rAF, which makes every effect look frozen).
 *
 *   node scripts/audit-previews.mjs [--viewport 1440x900] [--out reports/audit.json]
 */
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://localhost:5195';

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : def;
};
const [vw, vh] = arg('viewport', '1440x900').split('x').map(Number);
const OUT = arg('out', 'reports/audit-' + vw + 'x' + vh + '.json');
const ONLY_IDS = arg('ids', '').split(',').map((id) => id.trim()).filter(Boolean);

function effectIds() {
  const root = 'src/motion-arsenal/effects';
  const ids = [];
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    let src;
    try { src = readFileSync(join(root, dir.name, 'catalog.ts'), 'utf8'); } catch { continue; }
    for (const m of src.matchAll(/id:\s*'([a-z0-9-]+)'/g)) ids.push(m[1]);
  }
  return ids;
}

const HARNESS = () => {
  window.__sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Fingerprint of everything that can visibly change: canvas pixels, computed
  // transforms/opacity/filters, SVG geometry + dash offsets, and text.
  window.__snap = (root) => {
    const parts = [];
    root.querySelectorAll('canvas').forEach((c, i) => {
      try {
        const t = document.createElement('canvas');
        t.width = 32; t.height = 32;
        const ctx = t.getContext('2d');
        ctx.drawImage(c, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let h = 0;
        for (let k = 0; k < d.length; k += 4) {
          h = (h * 31 + d[k] * 3 + d[k + 1] * 5 + d[k + 2] * 7 + d[k + 3]) >>> 0;
        }
        parts.push('c' + i + ':' + h);
      } catch { parts.push('c' + i + ':ERR'); }
    });
    let dom = '';
    for (const el of [...root.querySelectorAll('*')].slice(0, 200)) {
      const cs = getComputedStyle(el);
      dom += cs.transform + '|' + cs.opacity + '|' + cs.backgroundPosition + '|' +
             cs.filter + '|' + cs.clipPath + '|' + cs.strokeDashoffset + ';';
      const tag = el.tagName.toLowerCase();
      if (tag === 'circle' || tag === 'path' || tag === 'rect' || tag === 'line' || tag === 'g') {
        dom += (el.getAttribute('cx') || '') + (el.getAttribute('cy') || '') +
               (el.getAttribute('d') || '').slice(0, 60) + (el.getAttribute('transform') || '') +
               (el.getAttribute('points') || '').slice(0, 40) + ';';
      }
    }
    let dh = 0;
    for (let i = 0; i < dom.length; i++) dh = (dh * 31 + dom.charCodeAt(i)) >>> 0;
    parts.push('dom:' + dh, 'txt:' + (root.innerText || '').slice(0, 120));
    return parts.join('#');
  };

  // Fraction of the preview box covered by the union bbox of visible content,
  // ignoring the full-bleed wrapper divs that EffectPreview itself renders.
  window.__fill = (prev) => {
    const pr = prev.getBoundingClientRect();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
    for (const el of prev.querySelectorAll('*')) {
      if (el.dataset && el.dataset.previewShell !== undefined) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
      n++;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    if (!n) return { fill: 0, kids: 0, box: [Math.round(pr.width), Math.round(pr.height)] };
    const w = Math.min(x1, pr.right) - Math.max(x0, pr.left);
    const h = Math.min(y1, pr.bottom) - Math.max(y0, pr.top);
    const overflow = +(((x1 - x0) * (y1 - y0)) / (pr.width * pr.height)).toFixed(2);
    return {
      fill: +((Math.max(w, 0) * Math.max(h, 0)) / (pr.width * pr.height)).toFixed(3),
      kids: n, overflow, box: [Math.round(pr.width), Math.round(pr.height)],
    };
  };

  window.__canvasInfo = (prev) => {
    const dpr = window.devicePixelRatio || 1;
    return [...prev.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect();
      return {
        cssW: Math.round(r.width), cssH: Math.round(r.height),
        bufW: c.width, bufH: c.height,
        dprOk: Math.abs(c.width - Math.round(r.width * dpr)) <= 2 ||
               Math.abs(c.width - Math.round(r.width)) <= 2,
      };
    });
  };
};

const run = async () => {
  const allIds = effectIds();
  const ids = ONLY_IDS.length ? allIds.filter((id) => ONLY_IDS.includes(id)) : allIds;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

  await page.addInitScript(HARNESS);
  await page.goto(BASE + '/#/effect/' + ids[0], { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const results = [];
  for (const id of ids) {
    const before = consoleErrors.length;
    await page.evaluate((i) => { location.hash = '/effect/' + i; }, id);
    await page.waitForTimeout(700);
    const gateButton = page.locator('.run-gate button');
    if (await gateButton.count()) {
      await gateButton.click();
      await page.waitForTimeout(700);
    }

    const r = await page.evaluate(async () => {
      const prev = document.querySelector('.fx-preview-detail');
      if (!prev) return { err: 'NO_PREVIEW' };
      const gate = !!prev.querySelector('.run-gate');
      const crashed = (prev.innerText || '').includes('CRASHED');
      const f = window.__fill(prev);
      const canvases = window.__canvasInfo(prev);
      const s1 = window.__snap(prev);
      await window.__sleep(500);
      const s2 = window.__snap(prev);
      const controls = document.querySelectorAll('.prop-row input, .prop-row select').length;

      // Drive the first available control and see whether the preview reacts.
      let controlReacts = null;
      const control = document.querySelector('input[type="range"][data-control-key]:not([data-control-key="width"]):not([data-control-key="height"])') ||
        document.querySelector('select[data-control-key]:not([data-control-key="width"]):not([data-control-key="height"])') ||
        document.querySelector('input[type="checkbox"][data-control-key]:not([data-control-key="width"]):not([data-control-key="height"])') ||
        document.querySelector('input[type="color"][data-control-key]:not([data-control-key="width"]):not([data-control-key="height"])') ||
        document.querySelector('[data-control-key]');
      if (control) {
        const pre = window.__snap(prev);
        if (control instanceof HTMLSelectElement) {
          const next = [...control.options].find((option) => option.value !== control.value);
          if (next) control.value = next.value;
        } else if (control.type === 'checkbox') {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').set;
          setter.call(control, !control.checked);
        } else {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          if (control.type === 'range') {
            const min = Number(control.min || 0), max = Number(control.max || 100), cur = Number(control.value);
            setter.call(control, String(Math.abs(cur - max) > Math.abs(cur - min) ? max : min));
          } else if (control.type === 'color') {
            setter.call(control, control.value.toLowerCase() === '#00ff00' ? '#ff0000' : '#00ff00');
          } else {
            setter.call(control, control.value + ' TEST');
          }
        }
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
        await window.__sleep(500);
        controlReacts = window.__snap(prev) !== pre;
      }
      return { gate, crashed, ...f, canvases, live: s1 !== s2, controls, controlReacts };
    });

    results.push({ id, ...r, errors: consoleErrors.slice(before) });
    process.stdout.write('.');
  }

  // Remount / back-navigation / resize resilience on a live canvas effect.
  const resilience = [];
  for (const id of ['bg-orbital-light-trails', 'premium-signal-particles', 'canvasui-particle-reveal']) {
    if (!ids.includes(id)) continue;
    await page.evaluate((i) => { location.hash = '/effect/' + i; }, id);
    await page.waitForTimeout(700);
    const probe = () => page.evaluate(async () => {
      const p = document.querySelector('.fx-preview-detail');
      if (!p) return null;
      const a = window.__snap(p); await window.__sleep(500);
      return window.__snap(p) !== a;
    });
    const initial = await probe();
    await page.evaluate(() => { location.hash = '/'; });
    await page.waitForTimeout(500);
    await page.evaluate((i) => { location.hash = '/effect/' + i; }, id);
    await page.waitForTimeout(700);
    const afterNav = await probe();
    await page.setViewportSize({ width: Math.round(vw * 0.7), height: Math.round(vh * 0.8) });
    await page.waitForTimeout(700);
    const afterResize = await probe();
    await page.setViewportSize({ width: vw, height: vh });
    await page.waitForTimeout(500);
    resilience.push({ id, initial, afterNav, afterResize });
  }

  await browser.close();

  const report = {
    viewport: vw + 'x' + vh,
    requestedIds: ONLY_IDS,
    total: results.length,
    empty: results.filter((r) => r.kids === 0 && !r.gate).map((r) => r.id),
    crashed: results.filter((r) => r.crashed).map((r) => r.id),
    lowFill: results.filter((r) => !r.gate && r.kids > 0 && r.fill < 0.35).map((r) => ({ id: r.id, fill: r.fill })),
    notLive: results.filter((r) => !r.gate && !r.crashed && !r.live).map((r) => r.id),
    deadControls: results.filter((r) => r.controlReacts === false).map((r) => r.id),
    dprMismatch: results.filter((r) => r.canvases?.some((c) => !c.dprOk)).map((r) => ({ id: r.id, canvases: r.canvases })),
    withErrors: results.filter((r) => r.errors?.length).map((r) => ({ id: r.id, errors: r.errors })),
    resilience,
    results,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('\n' + JSON.stringify({ ...report, results: '<' + results.length + ' entries>' }, null, 2).slice(0, 4000));
  console.log('\nfull report ->', OUT);
  if (report.empty.length || report.crashed.length || report.withErrors.length) {
    process.exitCode = 1;
  }
};

run().catch((e) => { console.error(e); process.exit(1); });
