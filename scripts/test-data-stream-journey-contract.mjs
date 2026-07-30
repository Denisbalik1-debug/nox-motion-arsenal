import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/premium/NoxDataStreamJourney.tsx', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/data-stream-journey-variants.json', 'utf8'));

for (const contract of [
  'revenue-river',
  'agent-swarm-routing',
  'conversion-helix',
  'signal-storm',
  'quantum-tunnel',
  'DataStreamEnergy',
  'trailLength',
  'branchIntensity',
  'showVariantSwitcher',
  'showEnergySwitcher',
  'MOVE TO DISTURB // TAP TO DETONATE',
  'COPY CONFIG',
]) {
  assert.ok(source.includes(contract), `Data stream contract missing: ${contract}`);
}

assert.equal(manifest.effectId, 'premium-data-stream-journey');
assert.equal(manifest.variants.length, 5);
assert.equal(new Set(manifest.variants.map((variant) => variant.reference)).size, 5);
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('data stream journey contract: OK');
