/**
 * Headless smoke for the proximity-energy mechanic + glyph registry.
 * The dev-preview tab is visibility:hidden → requestAnimationFrame is frozen,
 * so the live per-frame energy loop can't be observed there. This verifies the
 * pure mechanic (the part that actually matters) plus the registry wiring.
 *
 *   npx tsx scripts/smoke_glyph_upgrade.tsx
 */
import { proximityEnergy, stepEnergy } from '../src/motion-arsenal/lib/proximityField';
import { toneVariants, mixRgb, hexToRgb } from '../src/motion-arsenal/lib/color';
import { resolveGlyphs, NOX_RUNES, makeProceduralScribbles, makeProceduralGlyphs } from '../src/motion-arsenal/lib/glyphRegistry';

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : ' — ' + detail}`);
  if (!ok) failures++;
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

// --- proximity falloff ---
check('energy = 1 at the pointer', near(proximityEnergy(0, 200), 1));
check('energy = 0 at the radius', near(proximityEnergy(200, 200), 0));
check('energy = 0 beyond the radius', proximityEnergy(400, 200) === 0);
const mid = proximityEnergy(100, 200);
check('energy is between 0 and 1 mid-range', mid > 0 && mid < 1, `${mid.toFixed(3)}`);
check('closer → more energy', proximityEnergy(60, 200) > proximityEnergy(140, 200));
check('radius 0 → no energy (guard)', proximityEnergy(10, 0) === 0);

// --- asymmetric attack/decay ---
let e = 0;
for (let i = 0; i < 5; i++) e = stepEnergy(e, 1, 1 / 60, 14, 2); // attack toward 1
const attacked = e;
let d = attacked;
for (let i = 0; i < 5; i++) d = stepEnergy(d, 0, 1 / 60, 14, 2); // decay toward 0
check('attack raises energy quickly', attacked > 0.1, `${attacked.toFixed(3)}`);
check('decay is slower than attack (afterglow)', attacked - d < attacked, `att=${attacked.toFixed(3)} afterDecay=${d.toFixed(3)}`);
check('decay keeps residual glow after 5 frames', d > 0, `${d.toFixed(4)}`);

// --- colour tones ---
const t = toneVariants('#C93030');
const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
check('hot tone brighter than idle tone', lum(t.hot) > lum(t.idle), `idle=${lum(t.idle).toFixed(0)} hot=${lum(t.hot).toFixed(0)}`);
const at0 = mixRgb(t.idle, t.hot, 0);
const at1 = mixRgb(t.idle, t.hot, 1);
check('mix(0) = idle, mix(1) = hot', near(at0[0], t.idle[0]) && near(at1[0], t.hot[0]));
check('hexToRgb parses NOX red', hexToRgb('#C93030').join(',') === '201,48,48');

// --- glyph registry ---
check('NOX rune set has ≥ 8 glyphs', NOX_RUNES.glyphs.length >= 8, `${NOX_RUNES.glyphs.length}`);
check('every rune has a non-empty path + id', NOX_RUNES.glyphs.every((g) => g.path.trim().length > 4 && g.id.trim().length > 0));
check("resolveGlyphs('nox-runes') → the rune set", resolveGlyphs('nox-runes', 1, 10) === NOX_RUNES.glyphs);
check("resolveGlyphs('procedural-scribbles') → N generated", resolveGlyphs('procedural-scribbles', 7, 9).length === 9);
check("resolveGlyphs('procedural-glyphs') default → N generated", resolveGlyphs('procedural-glyphs', 7, 6).length === 6);
const custom = [{ id: 'x', path: 'M0 0 L10 10' }];
check('explicit symbols array passes through', resolveGlyphs(custom, 1, 10) === custom);
check('empty array falls back to generator', resolveGlyphs([], 3, 5).length === 5);
check('procedural scribbles are deterministic (seeded)', makeProceduralScribbles(3, 4)[0].path === makeProceduralScribbles(3, 4)[0].path);
check('procedural glyphs deterministic (seeded)', makeProceduralGlyphs(9, 4)[1].path === makeProceduralGlyphs(9, 4)[1].path);

console.log(failures === 0 ? '\nALLE CHECKS GRÜN' : `\n${failures} CHECK(S) ROT`);
process.exit(failures === 0 ? 0 : 1);
