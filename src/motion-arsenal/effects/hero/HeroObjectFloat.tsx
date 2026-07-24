import { useMemo, useRef } from 'react';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS, PHYSICS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';

// ---------------------------------------------------------------------------
// HeroObjectFloat — schwebendes CSS-3D-Emblem (prozedural, kein Asset).
// Float-Bewegung nach der Shopify-Butterfly-Wave-Mechanik
// (Butterflies-CFpdR9tM.js:307-390): wave = sin(t*a+p1)*A1 +
// sin(t*2.1+p2)*0.2 + sin(t*0.37+p3)*0.3 — drei überlagerte Sinuswellen,
// nie periodisch wirkend. Pointer-Tilt via usePointer + damp (Lusion-Lambda
// ~10, KRANK Cursor-Follow), weicher Kontaktschatten koppelt invers an die
// Flughöhe.
// ---------------------------------------------------------------------------

export interface HeroObjectFloatProps {
  amplitude?: number; // px float travel
  speed?: number;
  tilt?: number; // 0..2 — pointer tilt strength
  accent?: string;
  seed?: number;
}

export function HeroObjectFloat({
  amplitude = 14,
  speed = 1,
  tilt = 1,
  accent = NOX_COLORS.red,
  seed = 9,
}: HeroObjectFloatProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();

  const { emblem, phases } = useMemo(() => {
    const rnd = seededRandom(seed);
    return {
      emblem: glyphPath(seed * 13 + 3, 120),
      phases: { p1: rnd() * Math.PI * 2, p2: rnd() * Math.PI * 2, p3: rnd() * Math.PI * 2 },
    };
  }, [seed]);

  const tiltState = useRef({ rx: 0, ry: 0 });

  useRafLoop((dt, elapsed) => {
    const card = cardRef.current;
    const shadow = shadowRef.current;
    const glare = glareRef.current;
    if (!card || !shadow) return;

    const t = elapsed * speed;
    // Butterfly-Wave: 3 überlagerte Sinuswellen (Frequenzen 1.0 / 2.1 / 0.37).
    const wave =
      Math.sin(t * 1.0 + phases.p1) * 1.0 +
      Math.sin(t * 2.1 + phases.p2) * 0.2 +
      Math.sin(t * 0.37 + phases.p3) * 0.3;
    const sway =
      Math.sin(t * 0.8 + phases.p2) * 1.0 +
      Math.sin(t * 2.3 + phases.p3) * 0.15 +
      Math.sin(t * 0.31 + phases.p1) * 0.35;
    const y = (wave / 1.5) * amplitude;
    const rz = (sway / 1.5) * 2.2;

    // Pointer-Tilt (damped) — außerhalb: sanftes Idle-Schwanken.
    const p = pointer.current;
    const targetRx = p.inside ? (0.5 - p.ty) * 22 * tilt : Math.sin(t * 0.5 + phases.p3) * 4 * tilt;
    const targetRy = p.inside ? (p.tx - 0.5) * 26 * tilt : Math.sin(t * 0.42 + phases.p1) * 5 * tilt;
    tiltState.current.rx = damp(tiltState.current.rx, targetRx, PHYSICS.cursorFollow, dt);
    tiltState.current.ry = damp(tiltState.current.ry, targetRy, PHYSICS.cursorFollow, dt);

    card.style.transform = `translate3d(0, ${(-y).toFixed(2)}px, 0) rotateX(${tiltState.current.rx.toFixed(2)}deg) rotateY(${tiltState.current.ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;

    // Kontaktschatten: höher schweben → kleiner + weicher + transparenter.
    const lift = (wave / 1.5 + 1) / 2; // 0..1
    shadow.style.transform = `translateX(-50%) scaleX(${(1 - lift * 0.28).toFixed(3)})`;
    shadow.style.opacity = (0.55 - lift * 0.3).toFixed(3);
    shadow.style.filter = `blur(${(10 + lift * 10).toFixed(1)}px)`;

    if (glare) {
      // Glare wandert gegenläufig zum Tilt (Licht bleibt "oben links").
      glare.style.transform = `translate(${(-tiltState.current.ry * 1.6).toFixed(1)}px, ${(tiltState.current.rx * 1.6).toFixed(1)}px)`;
    }
  }, !reduced);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(115% 90% at 50% 112%, #150b0c 0%, ${NOX_COLORS.bg} 58%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 3D-Bühne */}
      <div style={{ perspective: 900, position: 'relative', width: 'min(46%, 210px)' }}>
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            aspectRatio: '3 / 4',
            borderRadius: 16,
            transformStyle: 'preserve-3d',
            background: `linear-gradient(155deg, #1c1a1e 0%, #121014 55%, #17090b 100%)`,
            border: '1px solid rgba(240, 236, 228, 0.12)',
            boxShadow: `inset 0 1px 0 rgba(240,236,228,0.08), 0 0 40px ${accent}22`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6%',
            willChange: 'transform',
          }}
        >
          {/* Emblem-Glyph (prozedural aus svgUtils), leicht vor der Karte */}
          <svg
            viewBox="0 0 120 120"
            style={{ width: '52%', overflow: 'visible', transform: 'translateZ(34px)' }}
          >
            <path
              d={emblem}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 8px ${accent}aa)` }}
            />
            <path d={emblem} fill="none" stroke="rgba(240,236,228,0.35)" strokeWidth={1} strokeLinecap="round" />
          </svg>
          <div style={{ textAlign: 'center', transform: 'translateZ(22px)' }}>
            <div
              style={{
                fontSize: 'clamp(16px, 3.4vw, 30px)',
                fontWeight: 850,
                letterSpacing: '0.06em',
                color: NOX_COLORS.text,
                lineHeight: 1,
              }}
            >
              NOX
            </div>
            <div
              style={{
                fontFamily: 'var(--mono, monospace)',
                fontSize: 8,
                letterSpacing: '0.4em',
                color: NOX_COLORS.textDim,
                marginTop: 6,
              }}
            >
              FORGE // 001
            </div>
          </div>
          {/* Glare-Layer */}
          <div
            ref={glareRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(240,236,228,0.14) 0%, transparent 42%)',
              pointerEvents: 'none',
            }}
          />
        </div>
        {/* Kontaktschatten */}
        <div
          ref={shadowRef}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '-14%',
            width: '78%',
            height: 14,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.85)',
            transform: 'translateX(-50%)',
            filter: 'blur(14px)',
            opacity: reduced ? 0.45 : 0.5,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'var(--mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.35em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
        }}
      >
        ARTIFACT // HOVER TO TILT
      </div>
    </div>
  );
}

export default HeroObjectFloat;
