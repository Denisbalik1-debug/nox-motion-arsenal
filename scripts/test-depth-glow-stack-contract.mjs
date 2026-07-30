import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/backgrounds/DepthGlowLayerStack.tsx', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/depth-glow-stack-variants.json', 'utf8'));

for (const contract of [
  'ember-vault',
  'violet-nebula',
  'command-aurora',
  'gold-cathedral',
  'void-plasma',
  'dgs2-perspective-grid',
  'dgs2-caustic',
  'dgs2-shape--beam',
  'beamCount',
  'showVariantSwitcher',
  'showEnergySwitcher',
  'MOVE TO BEND DEPTH // TAP TO IGNITE',
  'COPY CONFIG',
]) {
  assert.ok(source.includes(contract), `Depth glow contract missing: ${contract}`);
}

assert.equal(manifest.effectId, 'bg-depth-glow-stack');
assert.equal(manifest.variants.length, 5);
assert.equal(new Set(manifest.variants.map((variant) => variant.reference)).size, 5);
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('depth glow stack contract: OK');
