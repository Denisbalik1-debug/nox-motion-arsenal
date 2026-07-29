import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forge-skilltree/SvgEnergyLinesFlow.tsx', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/svg-energy-lines-variants.json', 'utf8'));

for (const contract of [
  'forge-ember-flow',
  'plasma-signal-stream',
  'gold-command-current',
  'ghost-wire-pulse',
  'overdrive-storm',
  'animateMotion',
  'efx-path-head',
  'efx-node-charge',
  'directionMode',
  'intensityPreset',
  'particleCount',
  'showStyleSwitcher',
  'COPY REF',
]) {
  assert.ok(source.includes(contract), `SVG energy flow contract missing: ${contract}`);
}

assert.equal(manifest.effectId, 'skilltree-svg-energy-lines');
assert.equal(manifest.variants.length, 5);
assert.equal(new Set(manifest.variants.map((variant) => variant.reference)).size, 5);
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('SVG energy particle-flow contract: OK');
