import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/system/GaugeNeedleSweep.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/system/catalog.ts', 'utf8');

for (const token of [
  'GaugeNeedleSweep',
  'gnds-root',
  'gnds-scale',
  'gnds-needle-wrap',
  'seededRandom',
  'usePrefersReducedMotion',
  'useInView',
  'useRafLoop',
  'gndsSweep',
  'overshoot',
  'START_DEG',
  'pathLength',
  'aria-label',
]) {
  assert.ok(source.includes(token), `gauge needle sweep contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'system-gauge-needle-sweep'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./GaugeNeedleSweep')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'gauge must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'gauge must not fetch');

console.log('gauge needle sweep contract: OK');
