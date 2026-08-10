import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/system/NoxSplitFlapCounter.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/system/catalog.ts', 'utf8');

// --- Struktur-/Token-Checks (zusätzlich) ---
for (const token of [
  'NoxSplitFlapCounter',
  'nsf-root',
  'nsf-top',
  'nsf-bottom',
  'usePrefersReducedMotion',
  'role="timer"',
  'aria-label',
  'el.animate(',
  'clamp(',
]) {
  assert.ok(source.includes(token), `nox split flap contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'system-nox-split-flap-counter'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./NoxSplitFlapCounter')"), 'catalog lazy import missing');
assert.ok(catalog.includes('productionSafe: true'), 'catalog entry must be productionSafe');
assert.ok(!source.includes('Math.random'), 'must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'must not fetch');

// --- Verhaltens-Checks ---
// 1. Clamping: value/min/max/digits/duration alle gedeckelt.
assert.ok(source.includes('clamp(Math.round(value), safeMin, safeMax)'), 'value-Clamping fehlt');
assert.ok(source.includes('clamp(Math.round(digits), 2, 8)'), 'digits-Clamping fehlt');
assert.ok(source.includes('clamp(duration, 200, 1200)'), 'duration-Clamping fehlt');

// 2. min===max: kein NaN — span-Guard.
assert.ok(
  source.includes('Math.max(safeMin, clampedValue - 1)'),
  'min===max Guard fehlt (NaN bei prev)',
);

// 3. Reduced Motion: Flip-Timer startet nur ohne reduced; Media-Query als zweite Absicherung.
assert.ok(
  /if \(reduced \|\| !flip \|\| flipped\) return;/.test(source),
  'Reduced-Motion-Guard fehlt (Flip darf nicht starten)',
);
assert.ok(
  source.includes('@media (prefers-reduced-motion: reduce)'),
  'CSS-Reduced-Motion-Absicherung fehlt',
);

// 4. WAAPI-Flip: beide Hälften animieren (obere + untere Karte).
assert.ok(source.includes('anim(top,'), 'WAAPI-Flip fehlt an oberer Karte');
assert.ok(source.includes('anim(bottom,'), 'WAAPI-Flip fehlt an unterer Karte');
assert.ok(source.includes('el.animate('), 'WAAPI-Flip-Helfer fehlt');

// 5. Cleanup: Animationen + Timer werden geräumt.
assert.ok(
  source.includes('a1.cancel()') && source.includes('a2.cancel()'),
  'WAAPI-Cleanup fehlt',
);

// 6. a11y: Timer ist assistiv lesbar, Deko-Segmente aria-hidden.
assert.ok(source.includes('aria-label={`Wert ${clampedValue}`}'), 'aria-label fehlt');
assert.ok(
  (source.match(/aria-hidden="true"/g) || []).length >= 2,
  'Deko-Elemente nicht aria-hidden',
);

console.log('nox split flap counter contract: OK (Verhalten + Struktur)');
