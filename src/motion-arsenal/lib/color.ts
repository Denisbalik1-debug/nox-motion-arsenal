// ---------------------------------------------------------------------------
// Minimal RGB helpers for per-frame color interpolation (idle → energised).
// Effects lerp between a muted "idle" colour and a hot "energy" colour driven
// by pointer proximity — the reference symbols shift colour on hover, they
// don't just fade opacity.
// ---------------------------------------------------------------------------

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim());
  if (!m) return [201, 48, 48]; // NOX red fallback
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rgbStr(c: RGB): string {
  return `rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`;
}

// Derive a muted idle tone and a bright energy tone from one accent colour, so
// callers only need to supply a single palette entry.
export function toneVariants(hex: string): { idle: RGB; hot: RGB } {
  const base = hexToRgb(hex);
  return {
    idle: mixRgb(base, [46, 42, 40], 0.42), // pushed toward warm-dark
    hot: mixRgb(base, [255, 236, 205], 0.4), // pushed toward ember-white
  };
}
