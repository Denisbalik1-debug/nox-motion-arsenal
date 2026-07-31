/**
 * Parity-Contract für das Config-/Handoff-System.
 *
 * Prüft für echte Effekte im laufenden Arsenal, dass Controls, Preview,
 * Canonical-Config-JSON und Usage-JSX exakt dieselben Werte tragen — inklusive
 * Share-Link-Round-Trip und Preset-Persistenz.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://127.0.0.1:5195';
const OUT = process.env.CONFIG_ARTIFACTS ?? 'artifacts/effect-config';
const PRESET_STORAGE_KEY = 'nox-motion-arsenal:presets:v1';

mkdirSync(OUT, { recursive: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const equal = (actual, expected, message) => {
  if (actual !== expected) throw new Error(`${message} (actual: ${actual}, expected: ${expected})`);
};

/** Werte, die die rechte Control-Spalte gerade anzeigt. */
async function readControlValues(page) {
  return page.evaluate(() => {
    const values = {};
    for (const node of document.querySelectorAll('[data-control-value]')) {
      values[node.getAttribute('data-control-value')] = node.textContent.trim();
    }
    for (const node of document.querySelectorAll('[data-control-key]')) {
      const key = node.getAttribute('data-control-key');
      if (node.type === 'checkbox') values[key] = node.checked ? 'true' : 'false';
      else if (node.tagName === 'SELECT' || node.type !== 'range') values[key] = node.value;
    }
    return values;
  });
}

async function readConfigJson(page) {
  const text = await page.locator('[data-testid="config-json"]').textContent();
  return JSON.parse(text);
}

async function readUsageJsx(page) {
  return (await page.locator('[data-testid="usage-code"]').textContent()).trim();
}

/** Prop-Werte aus dem angezeigten JSX zurücklesen. */
function parseJsxProps(jsx) {
  const props = {};
  const body = jsx.slice(jsx.indexOf('<', jsx.indexOf('\n\n')));
  for (const match of body.matchAll(/(\w+)=\{([^}]*)\}/g)) {
    props[match[1]] = match[2];
  }
  for (const match of body.matchAll(/(\w+)="([^"]*)"/g)) {
    props[match[1]] = match[2];
  }
  // Boolean-Shorthand: `showHint` ohne Wert.
  for (const match of body.matchAll(/^\s{2}(\w+)\s*$/gm)) {
    props[match[1]] = 'true';
  }
  return props;
}

/**
 * Der Kern-Check: Controls, JSON und JSX müssen denselben Zustand beschreiben.
 */
async function assertParity(page, effectId, label) {
  const controls = await readControlValues(page);
  const config = await readConfigJson(page);
  const jsx = await readUsageJsx(page);
  const jsxProps = parseJsxProps(jsx);

  equal(config.effectId, effectId, `${label}: config effectId`);
  assert(config.build.effectVersion, `${label}: effectVersion fehlt`);
  assert(config.build.commit, `${label}: build commit fehlt`);
  assert(config.build.buildTime, `${label}: buildTime fehlt`);
  assert(config.build.lastUpdatedAt, `${label}: lastUpdatedAt fehlt`);
  assert(config.reducedMotion && config.reducedMotion.notes, `${label}: reducedMotion fehlt`);
  assert(config.responsive && config.responsive.mobileNotes, `${label}: responsive fehlt`);

  const propKeys = Object.keys(config.props);
  assert(propKeys.length > 0, `${label}: keine Props in der Config`);

  // Der Regler zeigt auf Step-Auflösung formatiert an ("9.0"), die Config den
  // Zahlwert (9) — identisch ist hier der Wert, nicht die Schreibweise.
  const sameValue = (a, b) => {
    if (a === b) return true;
    const na = Number(a);
    const nb = Number(b);
    return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
  };

  for (const key of propKeys) {
    const configValue = String(config.props[key]);
    assert(key in jsxProps, `${label}: prop "${key}" fehlt im kopierten JSX`);
    assert(
      sameValue(jsxProps[key], configValue),
      `${label}: JSX weicht bei "${key}" von der Config ab (JSX: ${jsxProps[key]}, Config: ${configValue})`,
    );
    assert(key in controls, `${label}: prop "${key}" hat kein sichtbares Control`);
    assert(
      sameValue(controls[key], configValue),
      `${label}: Control-Anzeige weicht bei "${key}" von der Config ab (Control: ${controls[key]}, Config: ${configValue})`,
    );
  }

  // Jeder Control muss auch unter seinem sprechenden Namen auftauchen.
  assert(
    Object.keys(config.controls).length === propKeys.length,
    `${label}: controls-Block ist unvollständig`,
  );
  return { controls, config, jsx };
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const failures = [];

try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(`PAGEERROR: ${error.message}`));

  // --- 1. Referenz-Effekt: Ausgangszustand ---------------------------------
  const GLASS = 'premium-glass-distortion-cards';
  await page.goto(`${BASE}/#/effect/${GLASS}`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="config-json"]').waitFor();

  const initial = await assertParity(page, GLASS, 'glass/default');
  equal(String(initial.config.props.refraction), '0.065', 'glass/default: refraction default');
  equal(initial.controls.refraction, '0.065', 'glass/default: refraction Regleranzeige');
  equal(initial.config.preset, initial.config.materialVariant, 'glass/default: preset != materialVariant');
  equal(initial.config.energy, 'charged', 'glass/default: energy');

  // --- 2. Nach Reglerbewegung bleibt alles synchron -------------------------
  const refraction = page.locator('[data-control-key="refraction"]');
  await refraction.focus();
  await refraction.press('ArrowRight');
  await page.waitForFunction(
    () => document.querySelector('[data-control-value="refraction"]').textContent.trim() === '0.070',
  );
  const stepped = await assertParity(page, GLASS, 'glass/stepped');
  equal(String(stepped.config.props.refraction), '0.07', 'glass/stepped: refraction in der Config');
  assert(
    stepped.jsx.includes('refraction={0.07}'),
    `glass/stepped: JSX zeigt nicht 0.07 — ${stepped.jsx}`,
  );

  // --- 3. Select + Checkbox wirken auf Preview, JSON und JSX ----------------
  await page.selectOption('[data-control-key="variant"]', 'obsidian-caustic-deck');
  await page.selectOption('[data-control-key="energy"]', 'overdrive');
  await page.uncheck('[data-control-key="showEnergySwitcher"]');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="config-json"]').textContent.includes('obsidian-caustic-deck'),
  );
  const switched = await assertParity(page, GLASS, 'glass/switched');
  equal(switched.config.materialVariant, 'obsidian-caustic-deck', 'glass/switched: materialVariant');
  equal(switched.config.preset, 'obsidian-caustic-deck', 'glass/switched: preset');
  equal(switched.config.energy, 'overdrive', 'glass/switched: energy');
  equal(switched.config.props.showEnergySwitcher, false, 'glass/switched: Checkbox in der Config');
  assert(switched.jsx.includes('showEnergySwitcher={false}'), 'glass/switched: Checkbox fehlt im JSX');

  // Preview liest aus demselben State.
  const previewRoot = page.locator('[data-preview-stage="detail"] .ngc-root');
  await previewRoot.waitFor();
  equal(
    await previewRoot.getAttribute('data-variant'),
    'obsidian-caustic-deck',
    'glass/switched: Preview zeigt eine andere Variante als die Config',
  );
  equal(
    await previewRoot.getAttribute('data-energy'),
    'overdrive',
    'glass/switched: Preview zeigt eine andere Energy als die Config',
  );
  await page.screenshot({ path: join(OUT, 'glass-config-parity.png'), fullPage: false });

  // --- 4. Share-Link stellt exakt denselben Zustand wieder her --------------
  const shareLink = await page.evaluate(() => {
    const encode = (value) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const config = JSON.parse(document.querySelector('[data-testid="config-json"]').textContent);
    return `#/effect/${config.effectId}?config=${encode(JSON.stringify(config.props))}`;
  });
  await page.goto(`${BASE}/${shareLink}`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="config-json"]').waitFor();
  const restored = await assertParity(page, GLASS, 'glass/share-link');
  equal(
    JSON.stringify(restored.config.props),
    JSON.stringify(switched.config.props),
    'glass/share-link: Konfiguration wurde nicht exakt wiederhergestellt',
  );
  equal(
    restored.controls.refraction,
    switched.controls.refraction,
    'glass/share-link: Regler wurde nicht wiederhergestellt',
  );
  const restoredPreview = page.locator('[data-preview-stage="detail"] .ngc-root');
  await restoredPreview.waitFor();
  equal(
    await restoredPreview.getAttribute('data-variant'),
    'obsidian-caustic-deck',
    'glass/share-link: Preview wurde nicht wiederhergestellt',
  );

  // Kaputter Link darf den Effekt nicht blockieren.
  await page.goto(`${BASE}/#/effect/${GLASS}?config=NOT_BASE64`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="config-json"]').waitFor();
  const fallback = await assertParity(page, GLASS, 'glass/broken-link');
  equal(String(fallback.config.props.refraction), '0.065', 'glass/broken-link: fällt nicht auf Defaults zurück');

  // --- 5. SAVE / LOAD PRESET ------------------------------------------------
  await page.evaluate((key) => localStorage.removeItem(key), PRESET_STORAGE_KEY);
  await page.reload({ waitUntil: 'networkidle' });
  await page.selectOption('[data-control-key="variant"]', 'signal-crystal-array');
  await page.fill('[data-testid="preset-name"]', 'handoff-test');
  await page.click('[data-testid="save-preset"]');
  const savedConfig = await readConfigJson(page);
  await page.click('[data-testid="reset-config"]');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="config-json"]').textContent.includes('prism-command-grid'),
  );
  await page.click('[data-load-preset="handoff-test"]');
  await page.waitForFunction(
    () => document.querySelector('[data-testid="config-json"]').textContent.includes('signal-crystal-array'),
  );
  const loaded = await assertParity(page, GLASS, 'glass/preset');
  equal(
    JSON.stringify(loaded.config.props),
    JSON.stringify(savedConfig.props),
    'glass/preset: geladenes Preset weicht vom gespeicherten ab',
  );

  // --- 6. Katalogweiter Parity-Check über eine Auswahl ----------------------
  const SAMPLE = [
    'premium-signal-particles',
    'premium-timeline-orchestrator',
    'premium-terminal-scan-reveal',
    'premium-case-study-gallery',
    'premium-before-after-slider',
    'premium-logo-reference-marquee',
    'premium-testimonial-slider',
    'premium-metric-proof-strip',
    'premium-bento-hover-showcase',
    'premium-image-hover-lens',
    'skilltree-astral-constellation',
    'skilltree-floating-nodes',
    'nox-spinimage',
  ];
  for (const id of SAMPLE) {
    await page.goto(`${BASE}/#/effect/${id}`, { waitUntil: 'networkidle' });
    await page.locator('[data-testid="config-json"]').waitFor();
    try {
      await assertParity(page, id, id);
    } catch (error) {
      failures.push(error.message);
    }
  }

  assert(!pageErrors.length, `Page-Errors: ${pageErrors.join(' | ')}`);
  if (failures.length) throw new Error(`Parity-Verstöße:\n- ${failures.join('\n- ')}`);

  console.log(`effect-config contract OK — ${SAMPLE.length + 1} Effekte geprüft (Controls = JSON = JSX = Preview)`);
} finally {
  await browser.close();
}
