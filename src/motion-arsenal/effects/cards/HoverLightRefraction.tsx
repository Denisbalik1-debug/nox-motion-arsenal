import { useRef, type CSSProperties } from 'react';
import { clamp, damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

// ---------------------------------------------------------------------------
// HoverLightRefraction — pointer-dependent light refraction on glass.
// The specular highlight travels AGAINST the pointer (like light through a
// curved pane), and a chromatic fringe appears whose strength is proportional
// to pointer VELOCITY — the Active-Theory idea of feeding damped velocity
// state into the render, not just position. Two offset gradient copies
// (red / cyan, screen-blended) fake the dispersion. Touch devices run a
// slow fake-pointer orbit so the effect demos itself.
// ---------------------------------------------------------------------------

export interface HoverLightRefractionProps {
  refraction?: number; // 0..1 how far the highlight counter-travels
  chroma?: number; // 0..2 chromatic fringe strength
  highlightSize?: number; // px radius of the specular spot
  tint?: string;
}

export function HoverLightRefraction({
  refraction = 0.7,
  chroma = 1,
  highlightSize = 240,
  tint = NOX_COLORS.red,
}: HoverLightRefractionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();

  const anim = useRef({ hx: 38, hy: 30, ox: 0, oy: 0, mag: 0, px: 0.5, py: 0.5, vx: 0, vy: 0 });

  useRafLoop(
    (dt, t) => {
      const el = cardRef.current;
      if (!el) return;
      const p = pointer.current;
      const s = anim.current;
      // Fake orbital pointer when no hover is available / pointer outside.
      let fx: number;
      let fy: number;
      if (touch || !p.inside) {
        fx = 0.5 + Math.cos(t * 0.7) * 0.36;
        fy = 0.5 + Math.sin(t * 0.95) * 0.3;
      } else {
        fx = p.tx;
        fy = p.ty;
      }
      // Raw velocity → damped (this is what drives the chroma, AT-style).
      const rvx = (fx - s.px) / Math.max(dt, 1e-4);
      const rvy = (fy - s.py) / Math.max(dt, 1e-4);
      s.px = fx;
      s.py = fy;
      s.vx = damp(s.vx, rvx, 8, dt);
      s.vy = damp(s.vy, rvy, 8, dt);
      // Specular highlight counter-travels the pointer.
      s.hx = damp(s.hx, 50 - (fx - 0.5) * 100 * refraction, 12, dt);
      s.hy = damp(s.hy, 50 - (fy - 0.5) * 100 * refraction, 12, dt);
      // Chromatic offset ∝ velocity, clamped so fast flicks don't explode.
      s.ox = clamp(s.vx * 26 * chroma, -18, 18);
      s.oy = clamp(s.vy * 26 * chroma, -18, 18);
      const targetMag = clamp(Math.hypot(s.vx, s.vy) * 0.9 * chroma, 0, 1);
      s.mag = damp(s.mag, targetMag, 6, dt);
      el.style.setProperty('--hlr-hx', `${s.hx.toFixed(2)}%`);
      el.style.setProperty('--hlr-hy', `${s.hy.toFixed(2)}%`);
      el.style.setProperty('--hlr-ox', `${s.ox.toFixed(2)}px`);
      el.style.setProperty('--hlr-oy', `${s.oy.toFixed(2)}px`);
      el.style.setProperty('--hlr-mag', s.mag.toFixed(3));
    },
    !reduced,
  );

  const cardVars = {
    '--hlr-hx': '36%',
    '--hlr-hy': '28%',
    '--hlr-ox': '0px',
    '--hlr-oy': '0px',
    '--hlr-mag': '0',
  } as CSSProperties;

  const specular = (color: string) =>
    `radial-gradient(${highlightSize}px circle at var(--hlr-hx) var(--hlr-hy), ${color} 0%, transparent 62%)`;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(120% 100% at 50% 118%, #131013 0%, #0a0a0b 60%)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        ref={cardRef}
        style={{
          ...cardVars,
          position: 'relative',
          width: 'min(360px, 78%)',
          aspectRatio: '1.6',
          maxHeight: '80%',
          borderRadius: 16,
          overflow: 'hidden',
          background: `linear-gradient(160deg, #1a191d 0%, ${NOX_COLORS.bgPanel} 50%, #0d0d10 100%)`,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.55)',
        }}
      >
        {/* Tint depth inside the pane */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(120% 130% at 85% 115%, ${tint}30 0%, transparent 55%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* Chromatic dispersion copies — red and cyan, offset by ±velocity */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(var(--hlr-ox), var(--hlr-oy))',
            background: specular('rgba(255,70,60,0.5)'),
            mixBlendMode: 'screen',
            opacity: 'var(--hlr-mag)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(calc(var(--hlr-ox) * -1), calc(var(--hlr-oy) * -1))',
            background: specular('rgba(70,215,255,0.5)'),
            mixBlendMode: 'screen',
            opacity: 'var(--hlr-mag)',
            pointerEvents: 'none',
          }}
        />
        {/* Main specular highlight (counter-moving) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(${highlightSize}px circle at var(--hlr-hx) var(--hlr-hy),
              rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.07) 42%, transparent 68%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Chromatic border fringe: red / cyan 1px frames shifted apart */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            border: '1px solid rgba(255,70,60,0.7)',
            transform: 'translate(calc(var(--hlr-ox) * 0.4), calc(var(--hlr-oy) * 0.4))',
            opacity: 'calc(var(--hlr-mag) * 0.8)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            border: '1px solid rgba(70,215,255,0.7)',
            transform: 'translate(calc(var(--hlr-ox) * -0.4), calc(var(--hlr-oy) * -0.4))',
            opacity: 'calc(var(--hlr-mag) * 0.8)',
            pointerEvents: 'none',
          }}
        />
        {/* NOX data module demo content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '7% 8%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            color: NOX_COLORS.text,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.34em', color: NOX_COLORS.textDim }}>
              DATA // SIGNAL FEED
            </span>
            <span style={{ fontSize: 9, letterSpacing: '0.2em', color: tint }}>REFRACT</span>
          </div>
          <div style={{ display: 'flex', gap: '9%', alignItems: 'baseline' }}>
            {[
              ['847', 'NODES'],
              ['12.4', 'FLUX'],
              ['Δ9', 'RANK'],
            ].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 'clamp(18px, 3.8vw, 28px)', fontWeight: 750 }}>{n}</div>
                <div style={{ fontSize: 8, letterSpacing: '0.3em', color: NOX_COLORS.textDim }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.26em', color: NOX_COLORS.textDim }}>
            LIGHT PATH INVERTED · DISPERSION ∝ VELOCITY
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoverLightRefraction;
