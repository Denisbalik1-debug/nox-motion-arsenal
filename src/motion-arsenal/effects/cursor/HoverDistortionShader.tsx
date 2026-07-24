import { useRef } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { GLSL_NOISE, useShaderQuad } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// HoverDistortionShader — KRANK distortion-field mechanic on a shader quad.
// The KRANK bundle warps UVs through a curl-noise field (uv += curl.xy *
// strength, noisePos = vec3(uv*2, time*0.5)). Here the curl vector is built
// numerically from fbm differences (curl of a scalar potential ψ:
// (∂ψ/∂y, -∂ψ/∂x)) and applied to a procedural grid/stripe pattern, gated by
// a smooth falloff around the (damped, λ=10) pointer.
// ---------------------------------------------------------------------------

export interface HoverDistortionShaderProps {
  strength?: number; // 0..0.4 — UV displacement amount
  radius?: number; // 0.1..0.9 — falloff radius around the pointer (uv units)
  patternScale?: number; // 4..30 — grid/stripe frequency
  pattern?: 'grid' | 'stripes';
}

const FRAGMENT = `${GLSL_NOISE}
uniform float u_strength;
uniform float u_radius;
uniform float u_scale;
uniform float u_pattern;

// Scalar potential — same sampling vocabulary as KRANK: noisePos = vec3(uv*2, time*0.5).
float psi(vec2 p) {
  return fbm(p * 2.0 + vec2(u_time * 0.5, -u_time * 0.35));
}

// Numeric curl of the potential: divergence-free 2D flow from fbm differences.
vec2 curlField(vec2 p) {
  float e = 0.02;
  float dPdy = psi(p + vec2(0.0, e)) - psi(p - vec2(0.0, e));
  float dPdx = psi(p + vec2(e, 0.0)) - psi(p - vec2(e, 0.0));
  return vec2(dPdy, -dPdx) / (2.0 * e);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(u_pointer.x * aspect, u_pointer.y);

  float d = distance(p, m);
  float fall = smoothstep(u_radius, u_radius * 0.1, d);

  // KRANK mechanic: uv += curl.xy * strength (scoped to the pointer zone).
  vec2 curl = curlField(p);
  vec2 duv = uv + curl * u_strength * fall;

  // Procedural pattern: grid lines vs. diagonal stripes.
  vec2 g = duv * u_scale;
  g.x *= aspect;
  vec2 cell = abs(fract(g) - 0.5);
  float gridLine = smoothstep(0.44, 0.5, max(cell.x, cell.y));
  float stripes = smoothstep(0.35, 0.65, 0.5 + 0.5 * sin((g.x + g.y) * 3.14159));
  float pat = mix(gridLine, stripes, u_pattern);

  // NOX palette: dim bone lines on near-black, ember heat inside the field.
  vec3 bg = vec3(0.039, 0.039, 0.043);
  vec3 lineCol = mix(vec3(0.29, 0.28, 0.27), vec3(0.86, 0.24, 0.2), fall);
  vec3 col = bg + lineCol * pat * (0.5 + 0.5 * fall);

  // Heat shimmer + soft core glow where the field is strongest.
  float shimmer = fbm(duv * 6.0 + u_time * 0.4);
  col += vec3(0.79, 0.19, 0.12) * fall * shimmer * 0.35;
  col += vec3(0.83, 0.64, 0.29) * smoothstep(u_radius * 0.35, 0.0, d) * 0.22;

  // Vignette.
  col *= 1.0 - 0.45 * smoothstep(0.45, 1.1, distance(uv, vec2(0.5)));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function HoverDistortionShader({
  strength = 0.18,
  radius = 0.42,
  patternScale = 12,
  pattern = 'grid',
}: HoverDistortionShaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: 0.5, y: 0.5 });

  // One physics source: damped pointer (λ=10) feeds the shader uniform.
  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : 0.5, 10, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : 0.5, 10, dt);
  }, !reduced);

  useShaderQuad(canvasRef, {
    fragment: FRAGMENT,
    running: !reduced,
    frozenTime: 5,
    pointerRef: dampedPtr,
    uniforms: {
      u_strength: strength,
      u_radius: radius,
      u_scale: patternScale,
      u_pattern: pattern === 'stripes' ? 1 : 0,
    },
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
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      >
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>
          CURL FIELD // {reduced ? 'FROZEN' : 'LIVE'}
        </div>
        <div style={{ fontSize: 'clamp(24px, 5.5cqw, 52px)', fontWeight: 800, letterSpacing: '-0.02em', color: NOX_COLORS.text }}>
          DISTORTION
        </div>
      </div>
    </div>
  );
}

export default HoverDistortionShader;
