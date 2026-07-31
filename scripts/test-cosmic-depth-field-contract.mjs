// Fokussierter Contract-Test für `scroll-cosmic-depth-field`.
//
// Prüft die Zusagen des Effekts an der Quelle: vollständige Control-Fläche,
// scroll-gekoppelte (nicht zeitgetriebene) Bewegung, gedeckelte Vordergrund-
// punkte, echtes Mobile- und Reduced-Motion-Budget.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/backgrounds/NoxCosmicDepthField.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/backgrounds/catalog.ts', 'utf8');
const overrides = readFileSync('src/motion-arsenal/data/effectsCatalog.ts', 'utf8');

// --- Katalog ---------------------------------------------------------------
assert.ok(catalog.includes("id: 'scroll-cosmic-depth-field'"), 'effect is not registered');
assert.ok(catalog.includes("import('./NoxCosmicDepthField')"), 'catalog must lazy-load the component');
assert.ok(catalog.includes("name: 'NoxCosmicDepthField'"), 'component name mismatch');

const block = catalog.slice(
  catalog.indexOf("id: 'scroll-cosmic-depth-field'"),
  catalog.indexOf("Component: lazy(() => import('./NoxCosmicDepthField'))"),
);
const propsBlock = block.slice(block.indexOf('props: ['), block.indexOf('productionSafe'));

const REQUIRED_CONTROLS = [
  // Density
  'starCount', 'dustCount', 'foregroundStarRatio', 'mediumStarRatio', 'backgroundStarRatio',
  // Size
  'minStarSize', 'maxStarSize', 'foregroundMaxSize', 'dustSize',
  // Depth
  'depthLayers', 'perspectiveDepth', 'nearPlane', 'farPlane', 'depthDistribution', 'atmosphericPerspective',
  // Scroll
  'scrollSpeed', 'scrollParallax', 'scrollSmoothing', 'verticalDrift', 'horizontalDrift', 'velocityInfluence',
  // Glow / bloom
  'bloom', 'glowRadius', 'glowIntensity', 'coreBrightness', 'haloOpacity',
  // Blur / bokeh
  'depthBlur', 'backgroundBlur', 'foregroundBlur', 'bokehStrength', 'focusDepth',
  // Trails
  'trailLength', 'trailOpacity', 'motionBlur', 'smear',
  // Visual
  'starOpacity', 'dustOpacity', 'twinkle', 'colorTemperature', 'vignette', 'nebulaOpacity',
  // Mobile
  'mobileStarCount', 'mobileScrollSpeed', 'mobileBloom', 'mobileDpr',
];

for (const key of REQUIRED_CONTROLS) {
  assert.ok(propsBlock.includes(`key: '${key}'`), `dashboard control missing: ${key}`);
  assert.ok(source.includes(`${key} =`), `component does not accept prop: ${key}`);
}

for (const group of ['Density', 'Size', 'Depth', 'Scroll', 'Glow / Bloom', 'Blur / Bokeh', 'Trails', 'Visual', 'Mobile']) {
  assert.ok(propsBlock.includes(`group: '${group}'`), `control group missing: ${group}`);
}

// --- Zielästhetik: ruhig, nicht Screensaver --------------------------------
const defaultOf = (key) => {
  const match = propsBlock.match(new RegExp(`key: '${key}'[^}]*?default: ([-\\d.]+)`));
  assert.ok(match, `no default found for ${key}`);
  return Number(match[1]);
};

assert.ok(defaultOf('foregroundStarRatio') <= 0.04, 'foreground ratio default must stay <= 0.04');
assert.ok(defaultOf('foregroundMaxSize') <= 1.8, 'foreground max size default must stay <= 1.8');
assert.ok(defaultOf('maxStarSize') <= 1.2, 'max star size default must stay small');
assert.ok(defaultOf('minStarSize') <= 0.3, 'min star size default must stay small');
assert.ok(defaultOf('scrollSpeed') <= 0.1, 'scroll speed default must stay very low');
assert.ok(defaultOf('scrollParallax') <= 0.2, 'scroll parallax default must stay subtle');
assert.ok(defaultOf('scrollSmoothing') >= 0.7, 'scroll smoothing default must stay high');
assert.ok(defaultOf('bloom') <= 0.3, 'bloom default must stay subtle');
assert.ok(defaultOf('glowIntensity') <= 0.25, 'glow intensity default must stay subtle');
assert.ok(defaultOf('trailLength') <= 0.1, 'trail length default must stay short');
assert.ok(defaultOf('twinkle') <= 0.1, 'twinkle default must stay subtle');
assert.ok(defaultOf('mobileStarCount') < defaultOf('starCount'), 'mobile must reduce the star count');

// --- Bewegung hängt am Scroll, nicht an der Zeit ---------------------------
assert.ok(source.includes('getBoundingClientRect'), 'scroll position must come from the element rect');
assert.ok(source.includes('smoothScroll.current'), 'scroll value must be damped, not read raw');
assert.ok(source.includes('velocity.current'), 'velocityInfluence needs an actual velocity term');
assert.ok(
  /parallaxPx\s*=\s*reduced/.test(source),
  'parallax must be gated on reduced motion',
);
assert.ok(!source.includes('setInterval') && !source.includes('setTimeout'), 'no timer-driven animation');
assert.ok(!/Math\.random\(/.test(source), 'field must be deterministic (seeded)');

// Shared v2 configs from older dashboards use these four aliases.
const configSource = readFileSync('src/motion-arsenal/lib/effectConfig.ts', 'utf8');
for (const alias of ['foregroundRatio', 'mediumRatio', 'backgroundRatio', 'mobileDPR']) {
  assert.ok(configSource.includes(`${alias}:`), `config alias missing: ${alias}`);
}
for (const canonical of ['foregroundStarRatio', 'mediumStarRatio', 'backgroundStarRatio', 'mobileDpr']) {
  assert.ok(configSource.includes(`'${canonical}'`), `canonical alias target missing: ${canonical}`);
}

// --- Performance-Zusagen ---------------------------------------------------
assert.ok(source.includes('makeSprite'), 'stars must use pre-rendered sprites');
assert.ok(
  !/createRadialGradient[\s\S]{0,400}for \(let index = 0/.test(source),
  'no per-star gradient inside the draw loop',
);
assert.ok(source.includes('useInView'), 'loop must pause off screen');
assert.ok(source.includes('mobileDpr'), 'mobile DPR budget must be applied');
assert.ok(source.includes('!reduced && inView'), 'reduced motion must render a single static frame');

// --- Reduced motion --------------------------------------------------------
assert.ok(/twinkle > 0 && !reduced/.test(source), 'twinkle must be off under reduced motion');
assert.ok(/trailLength > [\d.]+ && !reduced/.test(source), 'trails must be off under reduced motion');

// --- Improvement-Metadaten -------------------------------------------------
const override = overrides.slice(
  overrides.indexOf("'scroll-cosmic-depth-field': {"),
  overrides.indexOf("'scroll-pinned-product-stage': {"),
);
assert.ok(override.includes("improvementVersion: '1.0.0'"), 'new component must start at 1.0.0');
assert.ok(override.includes("improvementStatus: 'improved'"), 'improvement status missing');
assert.ok(override.includes('lastImprovedBy'), 'lastImprovedBy missing');
assert.ok(override.includes('improvementChangelog'), 'changelog missing');

// Der bestehende Drift-Effekt bleibt unangetastet — kein stiller Ersatz.
assert.ok(catalog.includes("id: 'bg-nox-starfield-drift'"), 'the existing drift starfield must stay registered');

console.log(`cosmic depth field contract: OK (${REQUIRED_CONTROLS.length} controls verified)`);
