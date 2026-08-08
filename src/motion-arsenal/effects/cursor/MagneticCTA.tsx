import { useEffect, useRef } from 'react';
import { clamp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS, PHYSICS } from '../../lib/motionPresets';
import { useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// MagneticCTA — Lusion/KRANK magnetic hover mechanic on a group of CTAs.
//
// Production refinement:
// - Frame-rate-independent damping instead of fixed-per-frame lerps.
// - Read pass before writes to avoid layout thrash across multiple buttons.
// - Touch/non-hover devices stay static as documented instead of auto-drifting.
// - Subtle 3D tilt, depth highlight and velocity-aware spring settle add weight
//   without changing the public API or turning the CTA into an effect soup.
// - Focus-visible treatment keeps the interaction keyboard-safe.
// ---------------------------------------------------------------------------

export interface MagneticCTAProps {
  attractionRadius?: number; // px pull zone around each button
  pullStrength?: number; // 0..1 — how far the button travels toward the pointer
  labelParallax?: number; // 0..1 — extra travel of the inner label (parallax)
  accent?: string;
}

interface MagState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pull: number;
}

const CTAS = [
  { label: 'ENTER FORGE', sub: '01' },
  { label: 'RUN SCAN', sub: '02' },
  { label: 'VIEW SIGNAL', sub: '03' },
];

const resetState = (state: MagState) => {
  state.x = 0;
  state.y = 0;
  state.vx = 0;
  state.vy = 0;
  state.pull = 0;
};

export function MagneticCTA({
  attractionRadius = PHYSICS.magneticRadius,
  pullStrength = 0.45,
  labelParallax = 0.4,
  accent = NOX_COLORS.red,
}: MagneticCTAProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const motionEnabled = !reduced && hoverCapable;

  const states = useRef<MagState[]>(CTAS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, pull: 0 })));

  useEffect(() => {
    if (motionEnabled) return;

    states.current.forEach(resetState);
    btnRefs.current.forEach((button) => {
      if (!button) return;
      button.style.transform = '';
      button.style.setProperty('--mcta-pull', '0');
      button.style.setProperty('--mcta-tilt-x', '0deg');
      button.style.setProperty('--mcta-tilt-y', '0deg');
    });
    labelRefs.current.forEach((label) => {
      if (label) label.style.transform = '';
    });
  }, [motionEnabled]);

  useRafLoop((rawDt) => {
    const root = rootRef.current;
    if (!root) return;

    const p = pointer.current;
    const rootRect = root.getBoundingClientRect();
    const px = p.tx * rootRect.width;
    const py = p.ty * rootRect.height;
    const radius = Math.max(attractionRadius, 1);
    const dt = clamp(rawDt, 0, 0.05);

    // Read every box before mutating any style. This keeps the loop predictable
    // when several magnetic CTAs are rendered in the same preview.
    const boxes = btnRefs.current.map((button) => button?.getBoundingClientRect() ?? null);

    for (let i = 0; i < CTAS.length; i++) {
      const el = btnRefs.current[i];
      const label = labelRefs.current[i];
      const box = boxes[i];
      const state = states.current[i];
      if (!el || !box) continue;

      // Remove last frame's translation to recover the stable home centre.
      // Scale/rotation are transform-origin centred and therefore do not move it.
      const cx = box.left - rootRect.left + box.width / 2 - state.x;
      const cy = box.top - rootRect.top + box.height / 2 - state.y;
      const dx = px - cx;
      const dy = py - cy;
      const distance = Math.hypot(dx, dy);
      const proximity = p.inside ? clamp(1 - distance / radius, 0, 1) : 0;
      const shapedPull = proximity * proximity * (3 - 2 * proximity); // smoothstep

      const pullAlpha = 1 - Math.exp(-13 * dt);
      state.pull += (shapedPull - state.pull) * pullAlpha;

      if (shapedPull > 0.0001) {
        const maxTravel = radius * 0.42;
        const targetX = clamp(dx * shapedPull * pullStrength, -maxTravel, maxTravel);
        const targetY = clamp(dy * shapedPull * pullStrength, -maxTravel, maxTravel);
        const followAlpha = 1 - Math.exp(-11 * dt);
        const nextX = state.x + (targetX - state.x) * followAlpha;
        const nextY = state.y + (targetY - state.y) * followAlpha;

        state.vx = (nextX - state.x) / Math.max(dt, 1e-4);
        state.vy = (nextY - state.y) / Math.max(dt, 1e-4);
        state.x = nextX;
        state.y = nextY;
      } else {
        // Underdamped return spring: enough overshoot to feel elastic without
        // letting a CTA wobble for seconds after the pointer has left.
        state.vx += -state.x * 118 * dt;
        state.vy += -state.y * 118 * dt;
        const decay = Math.exp(-8.2 * dt);
        state.vx *= decay;
        state.vy *= decay;
        state.x += state.vx * dt;
        state.y += state.vy * dt;

        if (Math.abs(state.x) < 0.01 && Math.abs(state.vx) < 0.02) {
          state.x = 0;
          state.vx = 0;
        }
        if (Math.abs(state.y) < 0.01 && Math.abs(state.vy) < 0.02) {
          state.y = 0;
          state.vy = 0;
        }
      }

      const scale = 1 + state.pull * 0.065;
      const tiltX = clamp((-state.y / radius) * 5.5, -4.5, 4.5);
      const tiltY = clamp((state.x / radius) * 6.5, -5.5, 5.5);

      el.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.setProperty('--mcta-pull', state.pull.toFixed(3));
      el.style.setProperty('--mcta-tilt-x', `${tiltX.toFixed(2)}deg`);
      el.style.setProperty('--mcta-tilt-y', `${tiltY.toFixed(2)}deg`);

      if (label) {
        const labelX = state.x * labelParallax;
        const labelY = state.y * labelParallax;
        const labelZ = state.pull * 10;
        label.style.transform = `translate3d(${labelX.toFixed(2)}px, ${labelY.toFixed(2)}px, ${labelZ.toFixed(2)}px)`;
      }
    }
  }, motionEnabled);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 115%, #17090b 0%, ${NOX_COLORS.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(14px, 4cqh, 30px)',
        perspective: '900px',
      }}
    >
      <style>{`
        .mcta-btn {
          --mcta-pull: 0;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          border: 1px solid rgba(240, 236, 228, 0.16);
          background:
            linear-gradient(180deg, rgba(31, 31, 35, 0.94), rgba(12, 12, 15, 0.94));
          color: ${NOX_COLORS.text};
          padding: 15px 30px;
          min-height: 50px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          letter-spacing: 0.14em;
          transform-style: preserve-3d;
          will-change: transform;
          transition: border-color .18s ease, box-shadow .42s ${EASE.krankOvershoot}, background-color .2s ease;
          border-color: color-mix(in srgb, ${accent} calc(var(--mcta-pull) * 82%), rgba(240,236,228,0.16));
          box-shadow:
            0 10px 30px rgba(0,0,0,.26),
            0 0 calc(var(--mcta-pull) * 38px) color-mix(in srgb, ${accent} 44%, transparent),
            inset 0 1px 0 rgba(255,255,255,.04);
        }
        .mcta-btn::before {
          content: '';
          position: absolute;
          inset: -35% -15%;
          z-index: -1;
          background:
            radial-gradient(circle at 50% 50%, color-mix(in srgb, ${accent} 42%, transparent), transparent 42%),
            linear-gradient(105deg, transparent 20%, rgba(255,255,255,.16) 48%, transparent 72%);
          opacity: calc(var(--mcta-pull) * .72);
          transform: translate3d(calc((var(--mcta-pull) - .5) * 6%), 0, 0);
          transition: opacity .16s ease;
          pointer-events: none;
        }
        .mcta-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          border: 1px dashed color-mix(in srgb, ${accent} 60%, transparent);
          opacity: calc(var(--mcta-pull) * .86);
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .mcta-btn:hover {
          border-color: color-mix(in srgb, ${accent} 72%, rgba(240,236,228,.18));
        }
        .mcta-btn:focus-visible {
          outline: 2px solid color-mix(in srgb, ${accent} 85%, white 15%);
          outline-offset: 4px;
          box-shadow:
            0 10px 30px rgba(0,0,0,.28),
            0 0 0 5px color-mix(in srgb, ${accent} 16%, transparent),
            0 0 34px color-mix(in srgb, ${accent} 36%, transparent);
        }
        .mcta-label {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .mcta-sub {
          font-family: var(--mono, monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, ${accent} calc(40% + var(--mcta-pull) * 60%), ${NOX_COLORS.textDim});
        }
        @media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
          .mcta-btn,
          .mcta-label {
            will-change: auto;
          }
          .mcta-btn::before,
          .mcta-btn::after {
            transition: none;
          }
        }
      `}</style>
      <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
        MAGNETIC FIELD // {reduced || !hoverCapable ? 'STATIC' : 'ACTIVE'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 3cqw, 36px)', justifyContent: 'center', padding: '0 16px' }}>
        {CTAS.map((cta, i) => (
          <button
            key={cta.label}
            type="button"
            className="mcta-btn"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
          >
            <span
              className="mcta-label"
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
            >
              {cta.label}
              <span className="mcta-sub">{cta.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: NOX_COLORS.textDim, letterSpacing: '0.08em', textAlign: 'center', padding: '0 16px' }}>
        {reduced
          ? 'reduced motion — magnet parked'
          : hoverCapable
            ? 'move across the buttons — they reach, tilt and settle'
            : 'touch device — magnet parked for stable taps'}
      </div>
    </div>
  );
}

export default MagneticCTA;
