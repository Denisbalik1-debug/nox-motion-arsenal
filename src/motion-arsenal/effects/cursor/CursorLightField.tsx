import { useRef } from 'react';
import { damp, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// CursorLightField — Active-Theory additive-blend mechanic in Canvas2D.
// Three damped followers with different lambdas (8 / 5 / 3) trail the pointer
// at different speeds → an organic light veil instead of a single glow dot.
// Light blobs are drawn with globalCompositeOperation = 'lighter' (the 2D
// equivalent of the bundle's blendFunc(ONE, ONE) additive pass) onto a dark
// decaying buffer; the canvas sits in multiply blend on top of a bright text
// grid, so the light literally uncovers the content underneath.
// ---------------------------------------------------------------------------

export interface CursorLightFieldProps {
  lightRadius?: number; // px radius of the main light blob
  intensity?: number; // 0.3..1.5 light strength
  trailDecay?: number; // 0.05..0.5 — higher = shorter trail
  palette?: 'nox' | 'ember' | 'mono';
}

const PALETTES: Record<string, [string, string, string]> = {
  nox: ['201, 48, 48', '212, 162, 74', '240, 236, 228'],
  ember: ['255, 90, 46', '255, 179, 71', '201, 48, 48'],
  mono: ['240, 236, 228', '138, 135, 129', '240, 236, 228'],
};

const LAMBDAS = [8, 5, 3];
const WORDS = ['FORGE', 'RANK', 'SCAN', 'SIGNAL', 'SYSTEM', 'NODE', 'VOID', 'PULSE'];

export function CursorLightField({
  lightRadius = 130,
  intensity = 1,
  trailDecay = 0.16,
  palette = 'nox',
}: CursorLightFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const followers = useRef([
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
  ]);
  const primed = useRef(false);

  const colors = PALETTES[palette] ?? PALETTES.nox;

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const p = pointer.current;
      if (!reduced && !hoverCapable) driftPointer(p, elapsed);

      if (!primed.current || reduced) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0b0b0d';
        ctx.fillRect(0, 0, size.w, size.h);
        primed.current = true;
      } else {
        // Decay pass: fade the buffer toward darkness → light leaves a trail.
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(11, 11, 13, ${Math.min(0.5, Math.max(0.05, trailDecay))})`;
        ctx.fillRect(0, 0, size.w, size.h);
      }

      // Damped followers — each lambda lags differently (Lusion damp physics).
      for (let i = 0; i < followers.current.length; i++) {
        const f = followers.current[i];
        if (reduced) {
          f.x = 0.5;
          f.y = 0.5;
        } else {
          f.x = damp(f.x, p.tx, LAMBDAS[i], dt);
          f.y = damp(f.y, p.ty, LAMBDAS[i], dt);
        }
      }

      // Additive light pass (Active Theory blendFunc(ONE, ONE) analogue).
      ctx.globalCompositeOperation = 'lighter';
      const radii = [1, 0.72, 0.5];
      const alphas = [0.5, 0.34, 0.26];
      for (let i = 0; i < followers.current.length; i++) {
        const f = followers.current[i];
        const x = f.x * size.w;
        const y = f.y * size.h;
        const r = Math.max(24, lightRadius * radii[i]);
        const a = Math.min(1, alphas[i] * intensity);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${colors[i]}, ${a})`);
        grad.addColorStop(0.45, `rgba(${colors[i]}, ${a * 0.4})`);
        grad.addColorStop(1, `rgba(${colors[i]}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hot core on the fastest follower.
      const lead = followers.current[0];
      const core = ctx.createRadialGradient(lead.x * size.w, lead.y * size.h, 0, lead.x * size.w, lead.y * size.h, 20);
      core.addColorStop(0, `rgba(255, 245, 230, ${0.55 * intensity})`);
      core.addColorStop(1, 'rgba(255, 245, 230, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(lead.x * size.w, lead.y * size.h, 20, 0, Math.PI * 2);
      ctx.fill();
    },
    !reduced,
  );

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
        isolation: 'isolate',
        touchAction: 'none',
      }}
    >
      {/* Content layer — bright, but only visible where the light passes. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, auto)',
            gap: 'clamp(10px, 3cqw, 34px)',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 'clamp(10px, 1.6cqw, 14px)',
            letterSpacing: '0.32em',
            color: NOX_COLORS.text,
          }}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} style={{ opacity: 0.9 }}>
              {WORDS[i % WORDS.length]}
            </span>
          ))}
        </div>
        <div
          style={{
            fontSize: 'clamp(26px, 6cqw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: NOX_COLORS.text,
            marginTop: 6,
          }}
        >
          LIGHT FIELD
        </div>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.text, opacity: 0.75 }}>
          ADDITIVE // ONE + ONE
        </div>
      </div>
      {/* Light buffer in multiply: dark hides, light reveals. */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply' }} />
    </div>
  );
}

export default CursorLightField;
