import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/system/NoxWordClock.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/system/catalog.ts', 'utf8');

// --- Struktur-/Token-Checks (zusätzlich) ---
for (const token of [
  'NoxWordClock',
  'nwc-root',
  'nwc-word',
  'nwcFlip',
  'seededRandom',
  'usePrefersReducedMotion',
  'role="timer"',
  'aria-label',
  'HOURS',
  'MINUTES',
]) {
  assert.ok(source.includes(token), `nox word clock contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'system-nox-word-clock'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./NoxWordClock')"), 'catalog lazy import missing');
assert.ok(catalog.includes('productionSafe: true'), 'catalog entry must be productionSafe');
assert.ok(!source.includes('Math.random'), 'must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'must not fetch');

// --- Verhaltens-Checks ---
// 1. Kein toter Start-State: die Uhr tickt ohne inView-Gate (reine Timer-Uhr).
assert.ok(!/const \[started, setStarted\]/.test(source), 'toter started-State vorhanden');

// 2. startedRef-Assign NACH der reduced/inView-Verzweigung (Muster aller NOX-Effekte).
const firstAssign = source.indexOf('startedRef.current = true');
const reducedIf = source.indexOf('if (reduced)');
if (firstAssign > -1) {
  assert.ok(
    firstAssign > reducedIf,
    'startedRef wird VOR dem reduced/inView-Check gesetzt (Bug)',
  );
}

// 3. Reduzierte Bewegung: kein Flip — der 30-s-Timer läuft nur ohne reduced.
assert.ok(
  /if \(reduced\) return;/.test(source),
  'Reduced-Motion-Guard fehlt (Flip-Timer muss entfallen)',
);

// 4. Wort-Flip: beide Wörter (Stunde + Minute) rotieren beim Takt.
assert.ok(
  (source.match(/nwcFlip/g) || []).length >= 2,
  'Flip-Animation fehlt an Stunde oder Minute',
);

// 5. aria-label am Timer: Uhrzeit ist assistiv lesbar.
assert.ok(
  source.includes('aria-label={`Es ist ${hourWord} ${minuteWord}`}'),
  'aria-label fehlt',
);

// 6. Deterministische Wort-Jitter: det-PRNG statt Zufall.
assert.ok(source.includes('seededRandom(seed)'), 'kein deterministischer Jitter');

// 7. Cleanup: beide Intervalle werden geräumt.
assert.ok(
  (source.match(/clearInterval/g) || []).length >= 2,
  'Interval-Cleanup fehlt',
);

console.log('nox word clock contract: OK (Verhalten + Struktur)');
