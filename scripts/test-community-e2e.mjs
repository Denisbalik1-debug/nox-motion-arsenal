import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://127.0.0.1:5195';
const OUT = process.env.COMMUNITY_ARTIFACTS ?? 'artifacts/community-improvements';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${BASE}/#/effect/forms-validation-pulse`, { waitUntil: 'networkidle' });
  await page.getByText('COMMUNITY IMPROVEMENT').waitFor();
  await page.screenshot({ path: join(OUT, '01-effect-copy-prompt.png'), fullPage: true });

  await page.getByRole('button', { name: 'VERBESSERUNG EINREICHEN' }).click();
  await page.getByTestId('community-submit-page').waitFor();
  await page.screenshot({ path: join(OUT, '02-manual-submission.png'), fullPage: true });
  await page.getByRole('button', { name: /PACKAGE LOKAL VALIDIEREN/ }).click();
  await page.getByTestId('validation-summary').waitFor();
  assert((await page.getByTestId('validation-summary').textContent()).includes('VALIDATED PACKAGE'));
  await page.screenshot({ path: join(OUT, '03-validated-package-diff-preview.png'), fullPage: true });

  await page.goto(`${BASE}/#/effect/forms-validation-pulse`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '60-MINUTEN-TOKEN ERZEUGEN' }).click();
  await page.locator('.token-clock').waitFor();
  await page.screenshot({ path: join(OUT, '04-token-flow.png'), fullPage: true });
  await page.getByRole('button', { name: 'PROMPT MIT SUBMISSION-ZUGANG KOPIEREN' }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  const token = prompt.match(/nox_sub_[A-Za-z0-9_-]+/)?.[0];
  assert(token, 'submission token missing from explicitly copied access prompt');

  const submissionId = await page.evaluate(async ({ token }) => {
    const catalog = await import('/src/motion-arsenal/data/effectsCatalog.ts');
    const manifests = await import('/src/motion-arsenal/community/manifests/buildManifest.ts');
    const entry = catalog.EFFECTS_CATALOG.find((candidate) => candidate.meta.id === 'forms-validation-pulse');
    const manifest = manifests.buildEffectManifest(entry);
    const pkg = {
      schemaVersion: '1.0',
      submissionId: `e2e-${crypto.randomUUID()}`,
      target: { effectId: manifest.id, baseVersion: manifest.version, manifestHash: manifest.manifestHash },
      author: { anonymous: true },
      proposal: {
        title: 'E2E safe preview fixture',
        summary: 'Validates the local admin and isolated preview UI.',
        motivation: 'Browser verification.',
        visualChanges: [],
        behavioralChanges: [],
        knownLimitations: [],
      },
      files: [],
      dependencies: { add: {}, remove: [] },
      controls: [],
      verification: {
        commands: ['npm run typecheck'],
        manualChecks: ['Desktop', 'Mobile'],
        expectedViewports: ['1440x900', '390x844'],
        reducedMotionChecked: true,
        performanceNotes: 'No source change.',
      },
      provenance: { generator: 'playwright-e2e', generatedAt: new Date().toISOString(), termsAccepted: true },
    };
    const response = await fetch('/api/community/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': pkg.submissionId,
      },
      body: JSON.stringify(pkg),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(body));
    return body.submissionId;
  }, { token });
  assert(submissionId);

  await page.goto(`${BASE}/#/admin/submissions`, { waitUntil: 'networkidle' });
  await page.locator('.admin-queue button').filter({ hasText: 'E2E safe preview fixture' }).first().click();
  await page.screenshot({ path: join(OUT, '05-admin-review.png'), fullPage: true });
  await page.getByRole('button', { name: 'STATIC REVIEW AUSFÜHREN' }).click();
  await page.getByText(/Deterministischer Review gespeichert/).waitFor();
  await page.getByRole('button', { name: 'STATIC PREVIEW ARTEFAKT BAUEN' }).click();
  const frame = page.getByTestId('isolated-preview-frame');
  await frame.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1_000);
  assert.equal(await frame.getAttribute('sandbox'), 'allow-scripts');
  assert(!(await frame.getAttribute('sandbox')).includes('allow-same-origin'));
  await page.screenshot({ path: join(OUT, '06-isolated-preview.png'), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${BASE}/#/community/submit/forms-validation-pulse`, { waitUntil: 'networkidle' });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `community mobile overflow: ${overflow}px`);
  await mobile.screenshot({ path: join(OUT, '07-mobile-390.png'), fullPage: true });
  await mobile.close();

  assert.equal(errors.length, 0, errors.join(' | '));
  console.log(`community e2e: manual, token, admin, isolated iframe, mobile screenshots OK`);
  await context.close();
} finally {
  await browser.close();
}
