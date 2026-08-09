import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const effects = [
  ['hero-3d-circle-text-scroll', 'CircleTextScroll3D', '3D Circle Text Scroll', 'src/motion-arsenal/effects/hero/CircleTextScroll3D.tsx', ['rotateX', 'requestAnimationFrame', 'det(', 'prefers-reduced-motion']],
  ['img2threejs-3d-rotating-scroll-images', 'RotatingScrollImages3D', '3D Rotating Scroll Images', 'src/motion-arsenal/effects/img2threejs/RotatingScrollImages3D.tsx', ['perspective', 'rotateY', 'backface-visibility', 'prefers-reduced-motion']],
  ['scroll-3d-scroll-text-parade', 'ScrollTextParade3D', '3D Scroll Text Parade', 'src/motion-arsenal/effects/scroll/ScrollTextParade3D.tsx', ['animation-timeline:view()', 'rotateX', 'will-change', 'prefers-reduced-motion']],
  ['img2threejs-anaglyph-depth-hover', 'AnaglyphDepthHover', 'Anaglyph Depth Hover', 'src/motion-arsenal/effects/img2threejs/AnaglyphDepthHover.tsx', ['mix-blend-mode:screen', 'onPointerMove', 'focus-visible', 'prefers-reduced-motion']],
  ['canvasui-ascii-portrait', 'AsciiPortrait', 'ASCII Portrait', 'src/motion-arsenal/effects/canvas-ui/AsciiPortrait.tsx', ['getImageData', 'fillText', 'det(', 'prefers-reduced-motion']],
  ['canvasui-audio-waveform-visualizer', 'AudioWaveformVisualizer', 'Audio Waveform Visualizer', 'src/motion-arsenal/effects/canvas-ui/AudioWaveformVisualizer.tsx', ['getByteFrequencyData', 'requestAnimationFrame', 'det(', 'prefers-reduced-motion']],
];
const catalogs = effects.map(([, , , source]) => readFileSync(source.replace(/\/[^/]+\.tsx$/, '/catalog.ts'), 'utf8'));
for (const [id, component, concept, sourcePath, tokens] of effects) {
  const source = readFileSync(sourcePath, 'utf8');
  const catalog = catalogs.find((entry) => entry.includes(`id: '${id}'`));
  assert.ok(catalog, `${component}: catalog entry missing`);
  for (const token of tokens) assert.ok(source.includes(token), `${component}: missing ${token}`);
  assert.ok(catalog.includes(`import('./${component}')`), `${component}: lazy import missing`);
  assert.ok(source.includes(`export default ${component}`) || source.includes(`export default function ${component}`), `${component}: default export missing`);
  assert.ok(!source.includes('Math.random('), `${component}: Math.random is forbidden`);
  assert.ok(!source.includes('fetch('), `${component}: fetch is forbidden`);
  assert.ok(!concepts.includes(`['${concept}'`), `${component}: concept remains`);
  const props = catalog.slice(catalog.indexOf(`id: '${id}'`), catalog.indexOf(`id: '${id}'`) + 2400);
  assert.ok((props.match(/key: '/g) ?? []).length >= 2, `${component}: props missing`);
}
console.log(`Batch-4-Konzeptueberfuehrung: ${effects.length} Effekte vertragskonform.`);
