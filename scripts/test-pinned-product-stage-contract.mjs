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
  'Command Core',
]) {
  assert.ok(coreSystem.includes(contract), `Product core system contract missing: ${contract}`);
}

const expectedVariants = [
  'nox-revenue-os',
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

for (const semanticCore of ['REVENUE', 'NEXUS', 'SIGNAL', 'CONVERT', 'OPS', 'NOX']) {
  assert.ok(coreSystem.includes(semanticCore), `Product core semantic missing: ${semanticCore}`);
}

assert.equal(manifest.effectId, 'scroll-pinned-product-stage');
assert.equal(manifest.component, 'PinnedProductStageCoreSystem');
assert.equal(manifest.variants.length, expectedVariants.length);
assert.ok(catalog.includes("import('./PinnedProductStageCoreSystem')"), 'Catalog must load the semantic core system');
assert.ok(source.includes('sections.length'), 'Stage must derive navigation from the selected section model');
assert.ok(source.includes('scrollTo({'), 'Chapter navigation must control the internal timeline');

// Page-Scroll-Modus: die Bühne muss auf echten Webseiten im Dokumentfluss
// pinnen können, statt das Mausrad in einem eigenen Scrollport zu fangen.
for (const contract of [
  "scrollDriver = 'internal'",
  'pageDriven',
  'pps-track',
  'pps-sticky',
  'pps-copy-overlay',
  'compactScroll',
  'visualMode',
  "chrome === 'minimal'",
  'IntersectionObserver',
]) {
  assert.ok(source.includes(contract), `Page-scroll driver contract missing: ${contract}`);
}
assert.ok(
  source.includes('.pps-page .pps-shaft { position:absolute; inset:0; }'),
  'Page mode must fill the pinned stage; without it the stage collapses to zero height',
);

// Die NOX-Variante darf keine Ergebnisaussagen tragen.
const noxSlice = source.slice(source.indexOf("'nox-revenue-os': {"), source.indexOf("'nox-global-sales-os': {"));
assert.ok(noxSlice.length > 500, 'nox-revenue-os variant block not found');
for (const forbidden of ['%', '+38', 'Umsatz', 'Conversion-Rate']) {
  assert.ok(!noxSlice.includes(forbidden), `nox-revenue-os must not claim results: ${forbidden}`);
}
// Jede Stufe braucht ein sichtbares Modulset — explode 0 hiesse: kein Objekt.
assert.ok(!/,\s0,\s0\.\d+,\s'/.test(noxSlice), 'nox-revenue-os chapters must keep modules visible (explode > 0)');
assert.ok(!source.includes('fetch(') && !coreSystem.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random') && !coreSystem.includes('Math.random'), 'Effect must stay deterministic');

console.log('PinnedProductStage semantic core registry contract: OK');
