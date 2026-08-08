import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/hero/GoldOutlineFillText.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/hero/catalog.ts', 'utf8');

for (const token of [
  'GoldOutlineFillText',
  'goft-root',
  'goft-filled',
  'goft-shimmer',
  'goftShimmer',
  'usePrefersReducedMotion',
  'useInView',
  '-webkit-text-stroke',
  'background-clip: text',
  'fillOn',
  'strokeWidth',
]) {
  assert.ok(source.includes(token), `gold outline fill text contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'hero-gold-outline-fill-text'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./GoldOutlineFillText')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'gold outline must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'gold outline must not fetch');

console.log('gold outline fill text contract: OK');
