import { useRef, type CSSProperties } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

// ---------------------------------------------------------------------------
// BorderTraceDepth — border trace with real depth.
// Not the 0815 border scan: three coupled layers driven by ONE angle state
// (Active-Theory "one physics source drives everything" doctrine):
//   1. running light head on the edge (rotating conic gradient masked to a ring)
//   2. an OFFSET blurred glow copy of that ring floating BEHIND the card
//   3. an inner reflex spot inside the card that tracks the light head.
// Hover boosts speed + intensity (damped). Touch: sine-breathing auto boost.
// ---------------------------------------------------------------------------

export interface BorderTraceDepthProps {
  speed?: number; // base rotations multiplier
  color?: string; // trace color
  thickness?: number; // ring thickness px
  depthOffset?: number; // 0..2 how far the glow copy sits behind
}

export function BorderTraceDepth({
  speed = 1,
  color = NOX_COLORS.red,
  thickness = 2,
  depthOffset = 1,
}: BorderTraceDepthProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();

  const anim = useRef({ a: 0, boost: 0 });

  useRafLoop(
    (dt, t) => {
      const el = cardRef.current;
      if (!el) return;
      const p = pointer.current;
      const s = anim.current;
      const targetBoost = touch ? (Math.sin(t * 0.9) + 1) / 2 : p.inside ? 1 : 0;
      s.boost = damp(s.boost, targetBoost, 5, dt);
      s.a = (s.a + dt * (55 + s.boost * 190) * speed) % 360;
      // The bright head of the conic sits ~318deg into the gradient; convert
      // that to a point on the border so the inner reflex can follow it.
      const headRad = ((s.a + 318) * Math.PI) / 180;
      const lx = 50 + Math.sin(headRad) * 47;
      const ly = 50 - Math.cos(headRad) * 44;
      el.style.setProperty('--btd-a', `${s.a.toFixed(2)}deg`);
      el.style.setProperty('--btd-lx', `${lx.toFixed(2)}%`);
      el.style.setProperty('--btd-ly', `${ly.toFixed(2)}%`);
      el.style.setProperty('--btd-boost', s.boost.toFixed(3));
    },
    !reduced,
  );

  // Reduced motion: frozen trace head top-right + steady glow.
  const cardVars = {
    '--btd-a': '40deg',
    '--btd-lx': '82%',
    '--btd-ly': '12%',
    '--btd-boost': reduced ? '0.65' : '0',
  } as CSSProperties;

  const ringMask: CSSProperties = {
    padding: thickness,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
  };

  const traceGradient = `conic-gradient(from var(--btd-a),
    transparent 0deg, transparent 250deg,
    ${color} 296deg, #fff6ec 318deg, ${color} 336deg,
    transparent 352deg)`;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(110% 100% at 50% 115%, #120e0f 0%, #0a0a0b 58%)',
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
          aspectRatio: '1.62',
          maxHeight: '80%',
        }}
      >
        {/* Layer 2: offset blurred glow copy BEHIND the card (the depth) */}
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 18,
            transform: `translate(${(9 * depthOffset).toFixed(1)}px, ${(15 * depthOffset).toFixed(1)}px)`,
            background: traceGradient,
            ...ringMask,
            padding: thickness + 3,
            filter: 'blur(14px)',
            opacity: `calc(0.32 + var(--btd-boost) * 0.5)`,
          }}
        />
        {/* Card body */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: `linear-gradient(168deg, #17171b 0%, ${NOX_COLORS.bgPanel} 55%, #0d0d10 100%)`,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Layer 3: inner reflex following the light head */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(190px circle at var(--btd-lx) var(--btd-ly), ${color}55 0%, ${color}18 34%, transparent 62%)`,
              mixBlendMode: 'screen',
              opacity: `calc(0.35 + var(--btd-boost) * 0.65)`,
              pointerEvents: 'none',
            }}
          />
          {/* NOX skill panel demo content */}
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
                SKILL // SCAN PROTOCOL
              </span>
              <span style={{ fontSize: 9, letterSpacing: '0.2em', color }}>TRACE.9</span>
            </div>
            <div style={{ fontSize: 'clamp(18px, 3.6vw, 26px)', fontWeight: 740, letterSpacing: '0.03em' }}>
              EDGE RUNNER
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['SIGNAL', 0.82],
                ['FORGE', 0.56],
              ].map(([label, v]) => (
                <div key={label as string}>
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: '0.3em',
                      color: NOX_COLORS.textDim,
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{
                        width: `${(v as number) * 100}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${color}, ${NOX_COLORS.gold})`,
                        boxShadow: `0 0 8px ${color}88`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Layer 1: the crisp running light on the edge (on top) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: traceGradient,
            ...ringMask,
            opacity: `calc(0.55 + var(--btd-boost) * 0.45)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default BorderTraceDepth;
