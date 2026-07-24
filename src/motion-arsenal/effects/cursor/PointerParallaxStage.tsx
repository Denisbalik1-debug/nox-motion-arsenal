import { useMemo, useRef, type CSSProperties } from 'react';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath, loopScribblePath } from '../../lib/svgUtils';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// PointerParallaxStage — Lusion layering principle: ONE physics source (a
// damped pointer, λ=10 — the 8–15 damping band found in the KRANK bundle)
// drives every layer at once. Five depth-staggered layers (background glow,
// symbol field, system card, typography, fore grain) translate by depth and
// the whole stage tilts in 3D (perspective + rotateX/Y) from the same value.
// ---------------------------------------------------------------------------

export interface PointerParallaxStageProps {
  depth?: number; // px — max parallax travel of the deepest layer
  tilt?: number; // deg — max 3D rotation of the stage
  damping?: number; // λ for the damped pointer follow
  accent?: string;
}

export function PointerParallaxStage({
  depth = 30,
  tilt = 6,
  damping = 10,
  accent = NOX_COLORS.red,
}: PointerParallaxStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const pos = useRef({ x: 0, y: 0 });

  const symbols = useMemo(() => {
    const rnd = seededRandom(41);
    return Array.from({ length: 7 }, (_, i) => ({
      d: i % 2 === 0 ? glyphPath(97 + i * 13, 100) : loopScribblePath(53 + i * 7, 42 + rnd() * 26, 2, 0.35),
      x: 6 + rnd() * 84,
      y: 8 + rnd() * 76,
      s: 0.5 + rnd() * 0.9,
      o: 0.25 + rnd() * 0.4,
    }));
  }, []);

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    // Single physics source: damped, centered -1..1 coordinates.
    pos.current.x = damp(pos.current.x, p.inside ? (p.tx - 0.5) * 2 : 0, damping, dt);
    pos.current.y = damp(pos.current.y, p.inside ? (p.ty - 0.5) * 2 : 0, damping, dt);
    const { x, y } = pos.current;

    const stage = stageRef.current;
    if (stage) {
      stage.style.transform = `perspective(900px) rotateX(${(-y * tilt).toFixed(3)}deg) rotateY(${(x * tilt).toFixed(3)}deg)`;
    }
    rootRef.current?.querySelectorAll<HTMLElement>('[data-pps-depth]').forEach((el) => {
      const d = Number(el.dataset.ppsDepth) * depth;
      el.style.transform = `translate3d(${(-x * d).toFixed(2)}px, ${(-y * d).toFixed(2)}px, 0)`;
    });
  }, !reduced);

  const layerBase: CSSProperties = { position: 'absolute', inset: '-8%', willChange: 'transform' };

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, touchAction: 'none' }}
    >
      <div ref={stageRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {/* L1 — background glow */}
        <div
          data-pps-depth="0.2"
          style={{
            ...layerBase,
            background: `radial-gradient(42% 52% at 30% 68%, ${accent}26 0%, transparent 70%), radial-gradient(36% 46% at 74% 26%, ${NOX_COLORS.gold}1f 0%, transparent 70%)`,
          }}
        />
        {/* L2 — symbol field */}
        <div data-pps-depth="0.45" style={layerBase}>
          {symbols.map((s, i) => (
            <svg
              key={i}
              viewBox="0 0 200 200"
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${7 + s.s * 9}%`,
                aspectRatio: '1',
                opacity: s.o,
                overflow: 'visible',
              }}
            >
              <path d={s.d} fill="none" stroke={i % 3 === 0 ? accent : NOX_COLORS.textDim} strokeWidth={1.6} strokeLinecap="round" />
            </svg>
          ))}
        </div>
        {/* L3 — system card */}
        <div data-pps-depth="0.7" style={{ ...layerBase, display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 'min(58%, 340px)',
              borderRadius: 12,
              border: '1px solid rgba(240,236,228,0.14)',
              background: 'linear-gradient(165deg, rgba(26,26,30,0.92), rgba(13,13,15,0.92))',
              boxShadow: '0 26px 60px rgba(0,0,0,0.55)',
              padding: '16px 18px',
              transform: 'translateY(12%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.3em', color: NOX_COLORS.textDim }}>
              <span>SYSTEM // RANK</span>
              <span style={{ color: accent }}>LIVE</span>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 7 }}>
              {[0.82, 0.56, 0.68].map((w, i) => (
                <div key={i} style={{ height: 5, borderRadius: 3, background: 'rgba(240,236,228,0.09)' }}>
                  <div style={{ height: '100%', width: `${w * 100}%`, borderRadius: 3, background: `linear-gradient(90deg, ${accent}, ${NOX_COLORS.gold})`, transition: `width .5s ${EASE.krankOvershoot}` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* L4 — typography */}
        <div data-pps-depth="1" style={{ ...layerBase, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', transform: 'translateY(-46%)' }}>
            <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>DEPTH STACK</div>
            <div style={{ fontSize: 'clamp(30px, 7cqw, 62px)', fontWeight: 830, letterSpacing: '-0.03em', color: NOX_COLORS.text, lineHeight: 1 }}>
              PARALLAX<span style={{ color: accent }}>.</span>
            </div>
          </div>
        </div>
        {/* L5 — fore grain */}
        <div
          data-pps-depth="1.35"
          style={{
            ...layerBase,
            backgroundImage: `radial-gradient(rgba(240,236,228,0.16) 0.6px, transparent 0.7px)`,
            backgroundSize: '22px 22px',
            opacity: 0.5,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.3em', color: NOX_COLORS.textDim, pointerEvents: 'none' }}>
        {reduced ? 'REDUCED MOTION — STAGE PARKED' : 'ONE PHYSICS SOURCE // FIVE LAYERS'}
      </div>
    </div>
  );
}

export default PointerParallaxStage;
