import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageVariants.tsx', 'utf8');
const cores = readFileSync('src/motion-arsenal/effects/scroll/ProductStageCore.tsx', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/pinned-product-stage-variants.json', 'utf8'));

for (const contract of [
  'NOX PRODUCT STAGE',
  'SCROLL TO OPERATE',
  'LIVE TELEMETRY',
  'pps-product-zone',
  'pps-variant-switcher',
  'pps-reference',
  'COPY REF',
  'aria-current',
  'aria-pressed',
  'onPointerMove',
  'prefers-reduced-motion',
  'PRODUCT_STAGE_VARIANTS',
  'ProductStageCore',
  'data-product-variant',
]) {
  assert.ok(source.includes(contract), `PinnedProductStage variant contract missing: ${contract}`);
}

const expectedVariants = [
  'nox-global-sales-os',
  'project-x-command-center',
  'ai-growth-engine',
  'conversion-website-system',
  'automation-ops-system',
];

for (const id of expectedVariants) {
  const reference = `motion:scroll-pinned-product-stage@${id}`;
  assert.ok(source.includes(reference), `Component missing stable agent reference: ${reference}`);
  assert.ok(cores.includes(`pcore--${id}`), `Product core missing distinct artifact styling: ${id}`);
  assert.ok(manifest.variants.some((variant) => variant.id === id && variant.reference === reference), `Manifest missing variant: ${id}`);
}

for (const semanticCore of ['REVENUE', 'NEXUS', 'SIGNAL', 'CONVERT', 'OPS']) {
  assert.ok(cores.includes(semanticCore), `Product core semantic missing: ${semanticCore}`);
}

assert.equal(manifest.effectId, 'scroll-pinned-product-stage');
assert.equal(manifest.variants.length, expectedVariants.length);
assert.ok(source.includes('sections.length'), 'Stage must derive navigation from the selected section model');
assert.ok(source.includes('scrollTo({'), 'Chapter and variant navigation must control the internal timeline');
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('PinnedProductStage product-core registry contract: OK');
