import { useRef } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// SpotlightReveal — KRANK gobo-light mechanic translated to DOM: the bundle
// projects a light texture through a matrix and multiplies mask.a * opacity;
// here a radial-gradient MASK cuts a pointer-shaped hole into a darkness
// overlay. Two light bodies: a tight spotlight (λ=12) and a lazy outer halo
// (λ=4, additive screen blend) that drags behind with damped offset. A hidden
// "signal" detail is masked even tighter — it only exists inside the light.
// ---------------------------------------------------------------------------

export interface SpotlightRevealProps {
  size?: number; // px — spotlight radius
  haloSize?: number; // px — trailing halo radius
  darkness?: number; // 0.7..1 — how dark the covered content is
  haloColor?: string;
}

const setMask = (el: HTMLElement, value: string) => {
  el.style.setProperty('-webkit-mask-image', value);
  el.style.setProperty('mask-image', value);
};

export function SpotlightReveal({
  size = 150,
  haloSize = 230,
  darkness = 0.96,
  haloColor = NOX_COLORS.gold,
}: SpotlightRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const signalRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const spot = useRef({ x: 0.5, y: 0.5 });
  const halo = useRef({ x: 0.5, y: 0.5 });

  useRafLoop((dt, elapsed) => {
    const root = rootRef.current;
    const dark = darkRef.current;
    if (!root || !dark) return;
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);

    // Tight spotlight vs. lazy halo — two lambdas, one pointer.
    spot.current.x = damp(spot.current.x, p.tx, 12, dt);
    spot.current.y = damp(spot.current.y, p.ty, 12, dt);
    halo.current.x = damp(halo.current.x, p.tx, 4, dt);
    halo.current.y = damp(halo.current.y, p.ty, 4, dt);

    const r = root.getBoundingClientRect();
    const sx = spot.current.x * r.width;
    const sy = spot.current.y * r.height;
    const hx = halo.current.x * r.width;
    const hy = halo.current.y * r.height;

    // Hole in the darkness (gobo mask): transparent core → dark edge.
    setMask(
      dark,
      `radial-gradient(circle ${size}px at ${sx.toFixed(1)}px ${sy.toFixed(1)}px, transparent 0%, rgba(0,0,0,0.4) ${Math.round(size * 0.55)}px, black 100%)`,
    );

    const haloEl = haloRef.current;
    if (haloEl) {
      haloEl.style.transform = `translate3d(${(hx - haloSize).toFixed(1)}px, ${(hy - haloSize).toFixed(1)}px, 0)`;
    }
    const signal = signalRef.current;
    if (signal) {
      // Signal detail only lives inside the inner half of the beam.
      setMask(
        signal,
        `radial-gradient(circle ${Math.round(size * 0.55)}px at ${sx.toFixed(1)}px ${sy.toFixed(1)}px, black 0%, transparent 100%)`,
      );
    }
  }, !reduced);

  // Reduced motion: beam parked mid-frame, everything static.
  const staticMask = `radial-gradient(circle ${size}px at 50% 50%, transparent 0%, rgba(0,0,0,0.4) ${Math.round(size * 0.55)}px, black 100%)`;
  const staticSignalMask = `radial-gradient(circle ${Math.round(size * 0.55)}px at 50% 50%, black 0%, transparent 100%)`;

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, isolation: 'isolate', touchAction: 'none' }}
    >
      {/* Content under the darkness */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 8%', pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>
          SECTOR SWEEP // 7F
        </div>
        <div style={{ fontSize: 'clamp(28px, 6.5cqw, 58px)', fontWeight: 820, letterSpacing: '-0.025em', color: NOX_COLORS.text, textAlign: 'center', lineHeight: 1.05 }}>
          ONLY THE LIGHT
          <br />
          KNOWS THE SYSTEM
        </div>
        <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.24em', color: NOX_COLORS.textDim }}>
          <span>FORGE 034</span>
          <span>RANK 012</span>
          <span>SCAN 097</span>
        </div>
      </div>

      {/* Hidden signal — exists only inside the beam core */}
      <div
        ref={signalRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          WebkitMaskImage: reduced ? staticSignalMask : 'radial-gradient(circle 0px at -100px -100px, black 0%, transparent 100%)',
          maskImage: reduced ? staticSignalMask : 'radial-gradient(circle 0px at -100px -100px, black 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '68%',
            top: '24%',
            transform: 'translate(-50%, -50%) rotate(-4deg)',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 11,
            letterSpacing: '0.3em',
            color: NOX_COLORS.glowGreen,
            textShadow: `0 0 14px ${NOX_COLORS.glowGreen}`,
            whiteSpace: 'nowrap',
          }}
        >
          ◆ SIGNAL // NODE 7 ACTIVE
        </div>
        <div
          style={{
            position: 'absolute',
            left: '22%',
            top: '76%',
            transform: 'translate(-50%, -50%) rotate(3deg)',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 10,
            letterSpacing: '0.3em',
            color: NOX_COLORS.redBright,
            textShadow: `0 0 12px ${NOX_COLORS.redBright}`,
            whiteSpace: 'nowrap',
          }}
        >
          ▲ BREACH TRACE 0x1616
        </div>
      </div>

      {/* Darkness overlay with the gobo hole */}
      <div
        ref={darkRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(4, 4, 6, ${Math.min(1, Math.max(0.7, darkness))})`,
          pointerEvents: 'none',
          WebkitMaskImage: staticMask,
          maskImage: staticMask,
        }}
      />

      {/* Lazy outer halo — additive warmth trailing the beam */}
      <div
        ref={haloRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: haloSize * 2,
          height: haloSize * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${haloColor}2e 0%, ${haloColor}14 40%, transparent 70%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          transform: reduced ? 'translate3d(-50%, -50%, 0)' : undefined,
          ...(reduced ? { left: '50%', top: '50%' } : null),
          willChange: 'transform',
        }}
      />
    </div>
  );
}

export default SpotlightReveal;
