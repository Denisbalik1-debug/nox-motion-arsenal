import { useEffect, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { hexToRgb, mixRgb } from '../../lib/color';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';

// ---------------------------------------------------------------------------
// ParticleReveal — canvas-ui "Particle Reveal" mechanic (canvasui.dev/
// components/particle-reveal): the surface sits as fine, diffuse particles
// by default and resolves into crisp, readable UI wherever the cursor
// passes. canvas-ui samples the live rendered DOM into particles; here the
// source is NOX wordmark text sampled once into a uv-space point cloud
// (fraction-of-box coordinates, so it stays correct across preview sizes),
// then each particle's scatter offset is damped toward zero the closer the
// cursor sits to its resting position.
// ---------------------------------------------------------------------------

export interface ParticleRevealProps {
  text?: string;
  resolveRadius?: number;
  scatter?: number;
  density?: number;
  particleSize?: number;
  color?: string;
  cloudScale?: number;
}

interface Particle {
  u: number;
  v: number;
  seed: number;
}

function sampleTextParticles(text: string, maxCount: number): Particle[] {
  const TW = 720;
  const TH = 220;
  const c = document.createElement('canvas');
  c.width = TW;
  c.height = TH;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, TW, TH);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 96px "Arial Black", Arial, sans-serif';
  ctx.fillText(text, TW / 2, TH / 2);
  const data = ctx.getImageData(0, 0, TW, TH).data;

  const candidates: Array<{ u: number; v: number }> = [];
  const step = 2;
  for (let y = 0; y < TH; y += step) {
    for (let x = 0; x < TW; x += step) {
      const a = data[(y * TW + x) * 4 + 3];
      if (a > 120) candidates.push({ u: x / TW, v: y / TH });
    }
  }
  const rnd = seededRandom(42);
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, Math.min(maxCount, candidates.length));

  return picked.map((p, i) => ({
    u: p.u,
    v: p.v,
    seed: seededRandom(i + 1)(),
  }));
}

export function ParticleReveal({
  text = 'NOX SIGNAL',
  resolveRadius = 0.24,
  scatter = 11,
  density = 2600,
  particleSize = 1.15,
  color = '#d6a24a',
  cloudScale = 0.92,
}: ParticleRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: 0.5, y: 0.5, active: 0 });

  useEffect(() => {
    particles.current = sampleTextParticles(text, Math.round(density));
  }, [text, density]);

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : dampedPtr.current.x, 10, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : dampedPtr.current.y, 10, dt);
    dampedPtr.current.active = damp(dampedPtr.current.active, p.inside || !hoverCapable ? 1 : 0, 6, dt);
  }, !reduced);

  useCanvas2D(
    canvasRef,
    (ctx, size) => {
      ctx.clearRect(0, 0, size.w, size.h);
      const aspect = size.w / Math.max(size.h, 1);
      const px = dampedPtr.current.x;
      const py = dampedPtr.current.y;
      const active = dampedPtr.current.active;
      const t = performance.now() / 1000;
      const baseColor = hexToRgb(color);
      const resolvedColor = mixRgb(baseColor, [255, 250, 242], 0.66);

      for (const pt of particles.current) {
        const u = 0.5 + (pt.u - 0.5) * cloudScale;
        const v = 0.5 + (pt.v - 0.5) * cloudScale;
        const dx = (u - px) * aspect;
        const dy = v - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const resolve = reduced ? 1 : active * Math.max(0, 1 - dist / resolveRadius);
        const diffusion = 1 - resolve;

        const angle = pt.seed * Math.PI * 2 + t * (0.4 + pt.seed);
        const jitterR = diffusion * scatter;
        const jx = Math.cos(angle) * jitterR;
        const jy = Math.sin(angle * 1.3) * jitterR;

        const x = u * size.w + jx;
        const y = v * size.h + jy;
        const alpha = 0.34 + resolve * 0.62;
        const r = particleSize * (0.72 + resolve * 0.48);
        const particleColor = mixRgb(baseColor, resolvedColor, resolve);

        ctx.fillStyle = `rgba(${particleColor[0] | 0},${particleColor[1] | 0},${particleColor[2] | 0},${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    !reduced,
  );

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
        PARTICLE FIELD // {reduced ? 'FROZEN' : hoverCapable ? 'TRACK' : 'DRIFT'}
      </div>
    </div>
  );
}

export default ParticleReveal;
