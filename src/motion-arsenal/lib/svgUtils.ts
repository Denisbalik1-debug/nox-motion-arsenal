import { seededRandom } from './animationUtils';

// ---------------------------------------------------------------------------
// Organic scribble/glyph path generators — the ORYZO-class background layers
// are luminous hand-drawn strokes; these produce comparable SVG path data
// procedurally so no copyrighted assets are shipped.
// ---------------------------------------------------------------------------

/** Smooth open scribble through jittered points (Catmull-Rom → cubic Bézier). */
export function scribblePath(seed: number, w = 200, h = 200, points = 6, wildness = 0.6): string {
  const rnd = seededRandom(seed);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    pts.push([
      w * (0.1 + 0.8 * t) + (rnd() - 0.5) * w * wildness * 0.5,
      h * 0.5 + (rnd() - 0.5) * h * wildness,
    ]);
  }
  return catmullRomToPath(pts);
}

/** Closed loopy scribble (orbit-like tangles). */
export function loopScribblePath(seed: number, r = 90, loops = 3, wobble = 0.35): string {
  const rnd = seededRandom(seed);
  const pts: Array<[number, number]> = [];
  const steps = loops * 8;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 * loops;
    const rad = r * (0.55 + 0.45 * (i / steps)) * (1 + (rnd() - 0.5) * wobble);
    pts.push([100 + Math.cos(a) * rad, 100 + Math.sin(a) * rad * 0.8]);
  }
  return catmullRomToPath(pts);
}

/** Angular energy glyph (rune-like zigzag strokes). */
export function glyphPath(seed: number, size = 120): string {
  const rnd = seededRandom(seed);
  const n = 4 + Math.floor(rnd() * 4);
  let d = '';
  let x = size * rnd();
  let y = size * rnd();
  d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    x = size * rnd();
    y = size * rnd();
    d += rnd() > 0.4 ? ` L ${x.toFixed(1)} ${y.toFixed(1)}` : ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function catmullRomToPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Approximate total length for stroke-dash reveal animations. */
export function approxPathLength(d: string): number {
  if (typeof document === 'undefined') return 1000;
  const ns = 'http://www.w3.org/2000/svg';
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', d);
  try {
    return p.getTotalLength();
  } catch {
    return 1000;
  }
}
