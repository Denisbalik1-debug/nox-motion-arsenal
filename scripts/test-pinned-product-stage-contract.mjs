import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageVariants.tsx', 'utf8');
const coreSystem = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStageCoreSystem.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/scroll/catalog.ts', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/pinned-product-stage-variants.json', 'utf8'));

for (const contract of [
  'NOX PRODUCT STAGE',
  'SCROLL TO OPERATE',
  'LIVE TELEMETRY',
  'pps-product-zone',
  'pps-reference',
  'COPY REF',
  'aria-current',
  'onPointerMove',
  'prefers-reduced-motion',
  'PRODUCT_STAGE_VARIANTS',
]) {
  assert.ok(source.includes(contract), `PinnedProductStage base contract missing: ${contract}`);
}

for (const contract of [
  'PinnedProductStageCoreSystem',
  'pcsys-switcher',
  'data-product-variant',
  'aria-pressed',
  'Revenue Reactor Core',
  'Agent Nexus Core',
  'Signal Growth Nucleus',
  'Conversion Prism',
  'Automation Kernel',
]) {
  assert.ok(coreSystem.includes(contract), `Product core system contract missing: ${contract}`);
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
  assert.ok(coreSystem.includes(`data-product-variant='${id}'`), `Product core missing distinct artifact styling: ${id}`);
  assert.ok(manifest.variants.some((variant) => variant.id === id && variant.reference === reference && variant.coreArtifact), `Manifest missing semantic core: ${id}`);
}

for (const semanticCore of ['REVENUE', 'NEXUS', 'SIGNAL', 'CONVERT', 'OPS']) {
  assert.ok(coreSystem.includes(semanticCore), `Product core semantic missing: ${semanticCore}`);
}

assert.equal(manifest.effectId, 'scroll-pinned-product-stage');
assert.equal(manifest.component, 'PinnedProductStageCoreSystem');
assert.equal(manifest.variants.length, expectedVariants.length);
assert.ok(catalog.includes("import('./PinnedProductStageCoreSystem')"), 'Catalog must load the semantic core system');
assert.ok(source.includes('sections.length'), 'Stage must derive navigation from the selected section model');
assert.ok(source.includes('scrollTo({'), 'Chapter navigation must control the internal timeline');
assert.ok(!source.includes('fetch(') && !coreSystem.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random') && !coreSystem.includes('Math.random'), 'Effect must stay deterministic');

console.log('PinnedProductStage semantic core registry contract: OK');
