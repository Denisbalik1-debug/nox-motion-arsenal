import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/scroll/PinnedProductStage.tsx', 'utf8');

for (const contract of [
  'NOX PRODUCT STAGE',
  'SCROLL TO OPERATE',
  'LIVE TELEMETRY',
  'pps-product-zone',
  'pps-fragment',
  'pps-scan',
  'aria-current',
  'onPointerMove',
  'prefers-reduced-motion',
]) {
  assert.ok(source.includes(contract), `PinnedProductStage contract missing: ${contract}`);
}

assert.ok(source.includes("SECTIONS.length"), 'Stage must derive navigation from the section model');
assert.ok(source.includes("scrollTo({"), 'Chapter navigation must control the internal timeline');
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('PinnedProductStage overdrive contract: OK');
