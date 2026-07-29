import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const component = readFileSync(join(root, 'src/motion-arsenal/effects/canvas-ui/ParticleReveal.tsx'), 'utf8');
const presets = readFileSync(join(root, 'src/motion-arsenal/effects/canvas-ui/particleRevealPresets.ts'), 'utf8');
const renderer = readFileSync(join(root, 'src/motion-arsenal/effects/canvas-ui/particleRevealRenderer.ts'), 'utf8');
const catalog = readFileSync(join(root, 'src/motion-arsenal/effects/canvas-ui/catalog.ts'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'public/agent-manifests/particle-reveal-variants.json'), 'utf8'));

const variants = [
  'ghost-signal-assembly',
  'ember-forge-materialize',
  'plasma-command-interface',
  'gold-product-blueprint',
  'overdrive-particle-collapse',
];
const modes = ['cursor', 'sweep', 'pulse', 'hybrid'];

for (const id of variants) {
  if (!presets.includes(id)) throw new Error(`missing particle reveal preset: ${id}`);
  if (!component.includes(id) && !manifest.variants.some((entry) => entry.id === id)) {
    throw new Error(`particle reveal variant is not wired: ${id}`);
  }
  const ref = `motion:canvasui-particle-reveal@${id}`;
  if (!presets.includes(ref) || !manifest.variants.some((entry) => entry.reference === ref)) {
    throw new Error(`missing stable particle reveal reference: ${ref}`);
  }
}
for (const mode of modes) {
  if (!presets.includes(`'${mode}'`) || !manifest.modes.includes(mode)) throw new Error(`missing particle reveal mode: ${mode}`);
}
if (manifest.variants.length !== variants.length) throw new Error('particle reveal manifest variant count mismatch');
if (!component.includes('CLICK TO DISRUPT')) throw new Error('particle reveal click burst affordance missing');
if (!renderer.includes('globalCompositeOperation')) throw new Error('particle reveal additive glow pass missing');
if (!component.includes('showVariantSwitcher') || !component.includes('showModeSwitcher')) throw new Error('particle reveal production switcher controls missing');
if (!catalog.includes("id: 'canvasui-particle-reveal'")) throw new Error('particle reveal catalog entry missing');
if (!catalog.includes("variant=\"ember-forge-materialize\"")) throw new Error('particle reveal catalog usage is stale');
if (`${component}\n${renderer}`.includes('Math.random')) throw new Error('particle reveal must remain deterministic');
if (/fetch\s*\(|XMLHttpRequest|WebSocket/.test(`${component}\n${renderer}`)) throw new Error('particle reveal must not issue runtime network requests');

console.log('particle reveal contract: ok');
