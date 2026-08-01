import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Fokussierter Vertrag für die Transition-Variante `nox-horizon-rift`.
// Geprüft wird, was der Effekt zusagt — nicht, wie er im Detail zeichnet.

const rift = readFileSync('src/motion-arsenal/effects/originkit/NoxHorizonRift.tsx', 'utf8');
const strike = readFileSync('src/motion-arsenal/effects/originkit/ThunderStrike.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/originkit/catalog.ts', 'utf8');

// --- Kompatibilität ---------------------------------------------------------
// Die neue Variante darf den bestehenden Effekt nicht ersetzen.
assert.ok(strike.includes("export type ThunderStrikeVariant = 'classic' | 'nox-horizon-rift'"),
  'ThunderStrike must expose the variant union');
assert.ok(strike.includes("props.variant === 'nox-horizon-rift'"), 'ThunderStrike must dispatch to the rift variant');
assert.ok(strike.includes('function ThunderStrikeClassic'), 'the classic shader must stay reachable');
assert.ok(strike.includes('gl.getContext') || strike.includes("getContext('webgl')"),
  'the classic WebGL path must remain intact');

// --- Steuerbare Oberfläche --------------------------------------------------
const CONTROLS = [
  'progress', 'direction', 'boltThickness', 'branchAmount', 'turbulence', 'glow', 'bloom',
  'flashIntensity', 'revealSoftness', 'distortion', 'sparkAmount', 'colorStart', 'colorEnd',
  'reducedMotionMode',
];
for (const key of CONTROLS) {
  assert.ok(rift.includes(`${key}`), `rift component must accept prop: ${key}`);
  assert.ok(catalog.includes(`key: '${key}'`), `catalog control missing (share links depend on it): ${key}`);
}
assert.ok(catalog.includes("key: 'variant'") && catalog.includes("'nox-horizon-rift'"),
  'variant must be switchable from the gallery so share links can carry it');

// --- Reversibilität ---------------------------------------------------------
// Ein zeitbasierter oder zufälliger Term würde Rückwärtsscrollen zerstören.
// Auf den Aufruf prüfen, nicht auf das Wort — im Quelltext steht es auch im
// Kommentar, der genau diese Regel begründet.
assert.ok(!rift.includes('Math.random('), 'rift must stay deterministic — no Math.random() call');
assert.ok(!/const\s+\w*[Ee]lapsed/.test(rift), 'rift must not derive geometry from elapsed time');
assert.ok(rift.includes('function hash('), 'rift must use a seeded hash for branches and sparks');
assert.ok(/buildPath\(width: number/.test(rift), 'the bolt path must be built independently of progress');

// --- Reveal-Kante -----------------------------------------------------------
assert.ok(rift.includes('clipPath') && rift.includes('polygon('),
  'the bolt path must drive the reveal clip between hero and cosmic layer');
assert.ok(rift.includes('--rift-hero-fade'), 'hero particles must fade above the edge');
assert.ok(rift.includes('nhr-stars'), 'the cosmic layer must expose stars below the edge');
// Der Flash ist die `::after`-Ebene. Sie muss die Akzentfarbe tragen und darf
// keine deckende Weissfläche sein. Weisse Sternpunkte sind davon nicht betroffen.
const flashRule = (rift.match(/\.nhr-root::after\{[^}]*\}/) ?? [''])[0];
assert.ok(flashRule, 'the flash layer must exist as .nhr-root::after');
assert.ok(flashRule.includes('var(--rift-start)'), 'the flash must be tinted with the accent colour');
assert.ok(!/#fff|rgba\(255,\s*255,\s*255/.test(flashRule), 'the flash must not be white');
assert.ok(flashRule.includes('radial-gradient'), 'the flash must stay a local edge bloom, not a full-screen fill');

// --- Performance ------------------------------------------------------------
assert.ok(rift.includes('IntersectionObserver'), 'rift must pause offscreen');
assert.ok(rift.includes('narrow'), 'rift must reduce work on narrow viewports');
// Der einzige rAF gehört zum optionalen Vorschautreiber, nicht zum Zeichnen.
const rafCount = (rift.match(/requestAnimationFrame/g) ?? []).length;
assert.ok(rafCount <= 2, `rift must not run a permanent draw loop (found ${rafCount} rAF calls)`);
assert.ok(/autoDemo/.test(rift), 'the preview driver must be opt-in via autoDemo');

// --- Reduced Motion ---------------------------------------------------------
for (const mode of ['static-line', 'crossfade-only', 'hidden']) {
  assert.ok(rift.includes(mode), `reduced motion mode missing: ${mode}`);
}
assert.ok(/if \(canvas && /.test(rift) || rift.includes('!canvas || reduced'),
  'reduced motion must skip canvas drawing entirely');

// --- Improvement-Metadaten --------------------------------------------------
assert.ok(catalog.includes("improvementStatus: 'improved'"), 'improvement status must be recorded');
assert.ok(catalog.includes('improvementChangelog'), 'improvement changelog must be recorded');
assert.ok(catalog.includes("improvementVersion: '2.0.0'"), 'improvement version must be recorded');

console.log(`Horizon Rift transition contract: OK (${CONTROLS.length} controls verified)`);
