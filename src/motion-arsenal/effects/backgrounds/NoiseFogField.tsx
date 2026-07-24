import React, { useRef } from 'react';
import { useShaderQuad, GLSL_NOISE } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, usePointer } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// NoiseFogField — NOX Adapted (KRANK-Klasse: fbm-Atmosphäre als Shader-Pass).
// Fullscreen-Quad-Fragment-Shader (Active-Theory-Pattern): mehrschichtiger
// fbm-Nebel mit Ember-Tint, langsamer Advektion und Pointer-Wärmeblase.
// Ersetzt den 1MB-Engine-Ansatz durch einen einzigen schlanken Pass.
// ---------------------------------------------------------------------------

export interface NoiseFogFieldProps {
  intensity?: number;
  speed?: number;
  emberAmount?: number; // 0..1 Anteil des roten Glut-Tints
  scale?: number;
}

const FRAG = `${GLSL_NOISE}
uniform float u_intensity;
uniform float u_speed;
uniform float u_ember;
uniform float u_scale;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * u_scale;
  float t = u_time * 0.05 * u_speed;

  // Doppel-fbm: Feld wird von einem zweiten fbm verschoben (Domain Warp) —
  // dieselbe Rezeptur wie die Distortion-Pässe der Referenzen.
  vec2 warp = vec2(fbm(p + vec2(t, -t * 0.7)), fbm(p + vec2(-t * 0.6, t)));
  float fog = fbm(p * 1.6 + warp * 1.8 + vec2(0.0, -t * 1.2));
  fog = smoothstep(0.28, 0.95, fog);

  // Pointer-Wärmeblase
  vec2 ptr = u_pointer * vec2(u_resolution.x / u_resolution.y, 1.0) * u_scale;
  float heat = exp(-length(p - ptr) * 2.2) * 0.5;

  // Tiefe: unten dichter + glühender
  float depth = smoothstep(1.0, 0.0, uv.y);

  vec3 base = vec3(0.039, 0.039, 0.043);
  vec3 fogCol = mix(vec3(0.10, 0.10, 0.12), vec3(0.16, 0.13, 0.12), depth);
  vec3 ember = vec3(0.79, 0.19, 0.19) * u_ember;
  vec3 gold = vec3(0.83, 0.64, 0.29) * u_ember;

  vec3 col = base;
  col += fogCol * fog * u_intensity;
  col += ember * fog * depth * 0.55;
  col += gold * heat * (0.4 + fog);
  // Glut-Kerne in den dichtesten Nebelfalten
  float cores = smoothstep(0.82, 1.0, fog) * depth;
  col += vec3(1.0, 0.42, 0.2) * cores * 0.35 * u_ember;

  // Grain (Blue-Noise-Ersatz) gegen Banding — KRANK nutzt getBlueNoise
  col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function NoiseFogField({ intensity = 0.9, speed = 1, emberAmount = 0.8, scale = 2.2 }: NoiseFogFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const ptrProxy = useRef({ x: 0.5, y: 0.5 });

  // usePointer liefert tx/ty — auf das Format des Shader-Runners mappen.
  ptrProxy.current.x = pointer.current.tx;
  ptrProxy.current.y = pointer.current.ty;

  useShaderQuad(canvasRef, {
    fragment: FRAG,
    running: !reduced,
    frozenTime: 6,
    pointerRef: ptrProxy,
    uniforms: {
      u_intensity: intensity,
      u_speed: speed,
      u_ember: emberAmount,
      u_scale: scale,
    },
  });

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>ATMOSPHERE PASS</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>NOISE FOG FIELD</div>
        </div>
      </div>
    </div>
  );
}

export default NoiseFogField;
