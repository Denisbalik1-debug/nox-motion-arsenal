import { useRef, type CSSProperties } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

// ---------------------------------------------------------------------------
// GlassMetalPanel — layered glass over brushed metal.
// Mechanic lifted from the Shopify Editions glass-nav (rgba bg +
// backdrop-filter blur + blend), upgraded: the metal base is a procedural
// conic-gradient anisotropy sheen (brushed-steel look), the glass layer has
// an inner gradient + a bright top light-edge whose hot spot TILTS and slides
// with the pointer (damped, Lusion-style lambda). Touch devices get a slow
// self-rotating light pass instead of hover.
// ---------------------------------------------------------------------------

export interface GlassMetalPanelProps {
  tint?: string; // accent tint bleeding into the glass
  blur?: number; // backdrop blur px on the glass layer
  sheen?: number; // 0..1 light edge / streak intensity
  speed?: number; // auto-demo speed multiplier
}

export function GlassMetalPanel({
  tint = NOX_COLORS.red,
  blur = 14,
  sheen = 0.8,
  speed = 1,
}: GlassMetalPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();

  const anim = useRef({ a: 25, lx: 34, tilt: -14 });

  useRafLoop(
    (dt, t) => {
      const el = cardRef.current;
      if (!el) return;
      const p = pointer.current;
      const auto = touch || !p.inside;
      // Light direction: pointer drives it on hover; slow orbital drift otherwise.
      const targetA = auto ? 25 + Math.sin(t * 0.5 * speed) * 45 : (p.tx - 0.5) * 150;
      const targetLx = auto ? 50 + Math.sin(t * 0.42 * speed + 1.3) * 42 : p.tx * 100;
      const targetTilt = auto ? -14 + Math.cos(t * 0.5 * speed) * 24 : (p.tx - 0.5) * 64;
      const s = anim.current;
      s.a = damp(s.a, targetA, 6, dt);
      s.lx = damp(s.lx, targetLx, 9, dt);
      s.tilt = damp(s.tilt, targetTilt, 9, dt);
      el.style.setProperty('--gmp-a', s.a.toFixed(2));
      el.style.setProperty('--gmp-lx', `${s.lx.toFixed(2)}%`);
      el.style.setProperty('--gmp-tilt', `${s.tilt.toFixed(2)}deg`);
    },
    !reduced,
  );

  const cardVars = {
    '--gmp-a': '25',
    '--gmp-lx': '34%',
    '--gmp-tilt': '-14deg',
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(120% 100% at 50% 120%, #141013 0%, #0a0a0b 60%)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        ref={cardRef}
        style={{
          ...cardVars,
          position: 'relative',
          width: 'min(380px, 80%)',
          aspectRatio: '1.7',
          maxHeight: '82%',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.4)',
        }}
      >
        {/* Brushed metal base: conic anisotropy sheen + fine brushing lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from calc(var(--gmp-a) * 1deg + 210deg) at 50% 50%,
              #34343a, #6b6b74 9%, #2a2a2f 20%, #585860 32%, #232327 45%,
              #6b6b74 58%, #2d2d33 71%, #5c5c65 85%, #34343a)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(96deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 3px)',
            opacity: 0.9,
          }}
        />
        {/* Tint bleed from below (NOX ember under the steel) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(90% 120% at 78% 118%, ${tint}44 0%, transparent 55%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Glass layer: backdrop blur + inner gradient + edge highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 12,
            borderRadius: 11,
            overflow: 'hidden',
            backdropFilter: `blur(${blur}px) saturate(1.35)`,
            WebkitBackdropFilter: `blur(${blur}px) saturate(1.35)`,
            background: `linear-gradient(162deg,
              rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 38%,
              rgba(16,14,15,0.28) 72%, ${tint}14 100%)`,
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -18px 32px rgba(0,0,0,0.35)',
          }}
        >
          {/* Tilting light streak across the glass (follows pointer) */}
          <div
            style={{
              position: 'absolute',
              inset: '-30%',
              background: `linear-gradient(calc(102deg + var(--gmp-tilt)),
                transparent 40%,
                rgba(255,255,255,${(0.2 * sheen).toFixed(3)}) 49.5%,
                rgba(255,255,255,${(0.05 * sheen).toFixed(3)}) 53%,
                transparent 63%)`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
          {/* Top light edge with a travelling hot spot */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1.5,
              background: `linear-gradient(90deg, transparent 0%,
                rgba(255,255,255,${(0.95 * sheen).toFixed(3)}) var(--gmp-lx),
                transparent 100%)`,
              pointerEvents: 'none',
            }}
          />
          {/* NOX demo content */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '7% 8%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: NOX_COLORS.text,
              fontFamily: 'var(--mono, ui-monospace, monospace)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.34em', color: NOX_COLORS.textDim }}>
                NOX // RANK MODULE
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  color: tint,
                  border: `1px solid ${tint}66`,
                  borderRadius: 999,
                  padding: '2px 8px',
                }}
              >
                ACTIVE
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'inherit',
                  fontSize: 'clamp(22px, 4.4vw, 34px)',
                  fontWeight: 750,
                  letterSpacing: '0.04em',
                }}
              >
                FORGE-07
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.28em', color: NOX_COLORS.textDim, marginTop: 4 }}>
                CLEARANCE Δ4 · SIGNAL LOCKED
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.24em', color: NOX_COLORS.textDim }}>
                SYS.GLASS/METAL
              </span>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: NOX_COLORS.gold,
                  boxShadow: `0 0 10px ${NOX_COLORS.gold}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlassMetalPanel;
