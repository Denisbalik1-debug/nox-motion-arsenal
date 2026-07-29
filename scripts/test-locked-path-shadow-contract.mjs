import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forge-skilltree/LockedPathShadow.tsx', 'utf8');

for (const contract of [
  'NOX SHADOW PROTOCOL',
  'SCAN SHADOW',
  'lps-locked-node',
  'prefers-reduced-motion',
  'aria-live="polite"',
  'onPointerMove',
]) {
  assert.ok(source.includes(contract), `LockedPathShadow contract missing: ${contract}`);
}

assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('LockedPathShadow overdrive contract: OK');
