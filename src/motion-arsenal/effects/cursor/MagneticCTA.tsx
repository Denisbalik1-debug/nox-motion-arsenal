import { useRef } from 'react';
import { clamp, lerp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS, PHYSICS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// MagneticCTA — Lusion/KRANK magnetic hover mechanic on a group of CTAs.
// Source mechanic (KRANK hoisted.js `Cursor` class): attraction radius
// ~100–110px, pullStrength = 1 - d/radius (non-linear, stronger close to the
// element), lerp follow with alpha ~0.15. NOX twist: the button shell and the
// inner label move with DIFFERENT strengths (inner parallax), and on release
// the button settles back via an underdamped spring → elastic overshoot
// (the same feel as KRANK's cubic-bezier(.3,0,.66,-.3) transforms).
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

  const states = useRef<MagState[]>(CTAS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, pull: 0 })));

  useRafLoop((dt, elapsed) => {
    const root = rootRef.current;
    if (!root) return;
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    const rect = root.getBoundingClientRect();
    const px = p.tx * rect.width;
    const py = p.ty * rect.height;

    for (let i = 0; i < CTAS.length; i++) {
      const el = btnRefs.current[i];
      const label = labelRefs.current[i];
      const s = states.current[i];
      if (!el) continue;
      const b = el.getBoundingClientRect();
      const cx = b.left - rect.left + b.width / 2 - s.x; // remove current offset → true home center
      const cy = b.top - rect.top + b.height / 2 - s.y;
      const dx = px - cx;
      const dy = py - cy;
      const d = Math.hypot(dx, dy);
      const pull = p.inside ? clamp(1 - d / Math.max(attractionRadius, 1), 0, 1) : 0;
      s.pull = lerp(s.pull, pull, 0.12);

      if (pull > 0) {
        // KRANK magnetic follow: lerp toward pointer offset, stronger up close.
        const tx = dx * pull * pullStrength;
        const ty = dy * pull * pullStrength;
        const nx = lerp(s.x, tx, PHYSICS.magneticPull);
        const ny = lerp(s.y, ty, PHYSICS.magneticPull);
        s.vx = (nx - s.x) / Math.max(dt, 1e-4);
        s.vy = (ny - s.y) / Math.max(dt, 1e-4);
        s.x = nx;
        s.y = ny;
      } else {
        // Settle: underdamped spring back to home → elastic overshoot.
        s.vx += -s.x * 110 * dt;
        s.vy += -s.y * 110 * dt;
        const decay = Math.exp(-7.5 * dt);
        s.vx *= decay;
        s.vy *= decay;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }

      const scale = 1 + s.pull * 0.05;
      el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      el.style.setProperty('--mcta-pull', s.pull.toFixed(3));
      if (label) {
        // Inner parallax: the label travels further than its shell.
        label.style.transform = `translate3d(${(s.x * labelParallax).toFixed(2)}px, ${(s.y * labelParallax).toFixed(2)}px, 0)`;
      }
    }
  }, !reduced);

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
        touchAction: 'none',
      }}
    >
      <style>{`
        .mcta-btn {
          position: relative;
          border: 1px solid rgba(240, 236, 228, 0.16);
          background: linear-gradient(180deg, rgba(24, 24, 27, 0.9), rgba(14, 14, 16, 0.9));
          color: ${NOX_COLORS.text};
          padding: 15px 30px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          letter-spacing: 0.14em;
          will-change: transform;
          transition: border-color .18s ease, box-shadow .5s ${EASE.krankOvershoot};
          border-color: color-mix(in srgb, ${accent} calc(var(--mcta-pull, 0) * 85%), rgba(240,236,228,0.16));
          box-shadow: 0 0 calc(var(--mcta-pull, 0) * 34px) color-mix(in srgb, ${accent} 42%, transparent);
        }
        .mcta-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          border: 1px dashed color-mix(in srgb, ${accent} 60%, transparent);
          opacity: var(--mcta-pull, 0);
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .mcta-label {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          will-change: transform;
        }
        .mcta-sub {
          font-family: var(--mono, monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, ${accent} calc(40% + var(--mcta-pull, 0) * 60%), ${NOX_COLORS.textDim});
        }
      `}</style>
      <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
        MAGNETIC FIELD // {reduced ? 'STATIC' : 'ACTIVE'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 3cqw, 36px)', justifyContent: 'center', padding: '0 16px' }}>
        {CTAS.map((c, i) => (
          <button
            key={c.label}
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
              {c.label}
              <span className="mcta-sub">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: NOX_COLORS.textDim, letterSpacing: '0.08em' }}>
        {reduced ? 'reduced motion — magnet parked' : 'move across the buttons — they reach for you'}
      </div>
    </div>
  );
}

export default MagneticCTA;
