import { useRef } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { useShaderQuad } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';

// ---------------------------------------------------------------------------
// GlassLens — canvas-ui "Glass" mechanic (canvasui.dev/components/glass): a
// cursor-following lens that magnifies + refracts the surface beneath it,
// like a crystal ball zooming in on whatever it passes over. canvas-ui reads
// the live DOM into the lens via html-in-canvas; that API is Chrome/Edge-140
// flag-gated only, so the NOX variant instead warps a procedural dashboard
// pattern drawn straight in the fragment shader (radial zoom + chromatic
// aberration falls off from lens edge to center — same "glass ball" read).
// ---------------------------------------------------------------------------

export interface GlassLensProps {
  lensRadius?: number; // 0.1..0.4 — lens size in uv units
  zoom?: number; // 1..4 — magnification at lens center
  chroma?: number; // 0..0.02 — chromatic aberration strength
}

const FRAGMENT = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_lensRadius;
uniform float u_zoom;
uniform float u_chroma;

float grid(vec2 uv, float cell) {
  vec2 g = abs(fract(uv * cell) - 0.5);
  return 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
}

vec3 dashboard(vec2 p) {
  vec3 col = vec3(0.035, 0.035, 0.04);
  vec2 cellCount = vec2(6.0, 4.0);
  vec2 cellUv = fract(p * cellCount);
  vec2 cellId = floor(p * cellCount);
  float card = step(0.06, cellUv.x) * step(cellUv.x, 0.94) * step(0.1, cellUv.y) * step(cellUv.y, 0.9);
  float seed = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 warm = mix(vec3(0.79, 0.19, 0.12), vec3(0.83, 0.64, 0.29), step(0.5, seed));
  col = mix(col, warm * 0.4, card * (0.35 + 0.15 * seed));
  float bar = step(0.7, cellUv.y) * step(cellUv.y, 0.78) * step(0.16, cellUv.x) * step(cellUv.x, 0.16 + 0.5 * fract(seed * 7.0));
  col += vec3(0.94, 0.9, 0.83) * bar * card * 0.5;
  col += grid(p, 30.0) * 0.04;
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 d = (uv - u_pointer) * vec2(aspect, 1.0);
  float dist = length(d);
  float r = u_lensRadius;

  vec3 col;
  if (dist < r) {
    float t = smoothstep(0.0, 1.0, dist / r);
    float zoomAmt = mix(1.0 / u_zoom, 1.0, t);
    vec2 warped = u_pointer + (d * zoomAmt) / vec2(aspect, 1.0);
    float ca = u_chroma * (1.0 - t);
    float rC = dashboard(warped + vec2(ca, 0.0)).r;
    float gC = dashboard(warped).g;
    float bC = dashboard(warped - vec2(ca, 0.0)).b;
    col = vec3(rC, gC, bC);
    float rim = smoothstep(r * 0.82, r, dist);
    col += vec3(0.95, 0.82, 0.6) * rim * 0.55;
    col += vec3(1.0) * pow(1.0 - t, 6.0) * 0.12;
  } else {
    col = dashboard(uv);
    float edge = smoothstep(r, r + 0.012, dist) * (1.0 - smoothstep(r, r + 0.03, dist));
    col += vec3(0.86, 0.24, 0.2) * edge * 0.5;
  }

  col *= 1.0 - 0.4 * smoothstep(0.4, 1.1, distance(uv, vec2(0.5)));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function GlassLens({ lensRadius = 0.16, zoom = 2.2, chroma = 0.006 }: GlassLensProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: 0.5, y: 0.5 });

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : 0.5, 12, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : 0.5, 12, dt);
  }, !reduced);

  useShaderQuad(canvasRef, {
    fragment: FRAGMENT,
    running: !reduced,
    frozenTime: 3,
    pointerRef: dampedPtr,
    uniforms: { u_lensRadius: lensRadius, u_zoom: zoom, u_chroma: chroma },
  });

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, touchAction: 'none' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.4em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
        }}
      >
        GLASS LENS // {reduced ? 'FROZEN' : hoverCapable ? 'TRACK' : 'DRIFT'}
      </div>
    </div>
  );
}

export default GlassLens;
