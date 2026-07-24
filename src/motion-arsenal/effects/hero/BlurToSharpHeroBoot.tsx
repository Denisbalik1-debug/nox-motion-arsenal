import { useRef, type CSSProperties } from 'react';
import { usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { easeOutExpo, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// BlurToSharpHeroBoot — der Hero bootet aus Unschärfe + Überbelichtung in
// Schärfe. Mechanik nach KRANKs Filter-Chain-Pattern: JS animiert EINE
// CSS-Custom-Property (--bsb-p, wie KRANKs --pulse), die eine ganze
// filter-Kette treibt: `saturate(calc(.4 + var(--pulse)*1.6))
// brightness(calc(.6 + var(--pulse)*.6))` — hier ergänzt um blur + kurzem
// Scanline-Blitz, der synchron zum Boot-Fortschritt durchläuft.
// ---------------------------------------------------------------------------

export interface BlurToSharpHeroBootProps {
  speed?: number; // boot speed multiplier
  maxBlur?: number; // px starting blur
  overexposure?: number; // 0..2 — starting brightness blowout
  accent?: string; // scanline / accent color
  loop?: boolean; // re-boot periodically
}

export function BlurToSharpHeroBoot({
  speed = 1,
  maxBlur = 22,
  overexposure = 1,
  accent = NOX_COLORS.redBright,
  loop = true,
}: BlurToSharpHeroBootProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ t: 0 });

  const bootDur = 2.2 / Math.max(speed, 0.2);
  const holdDur = 2.8;

  useRafLoop((dt) => {
    const root = rootRef.current;
    if (!root) return;
    state.current.t += dt;
    const total = bootDur + holdDur;
    const local = loop ? state.current.t % total : Math.min(state.current.t, total);
    const p = Math.min(local / bootDur, 1);
    const eased = easeOutExpo(p);
    // Eine Physik-Quelle → CSS-Var → ganze Filter-Kette (KRANK --pulse Muster).
    root.style.setProperty('--bsb-p', eased.toFixed(4));
    // Scanline-Blitz: Position läuft mit dem Boot, Intensität peakt mittig.
    const flash = Math.sin(Math.PI * Math.min(p * 1.15, 1));
    root.style.setProperty('--bsb-scan', (eased * 130 - 15).toFixed(2));
    root.style.setProperty('--bsb-flash', flash.toFixed(4));
  }, !reduced);

  const boot = 'var(--bsb-p, 1)';

  return (
    <div
      ref={rootRef}
      style={
        {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: NOX_COLORS.bg,
          '--bsb-p': reduced ? 1 : 0,
          '--bsb-flash': 0,
          '--bsb-scan': -15,
        } as CSSProperties
      }
    >
      {/* Hero-Inhalt, choreografiert durch die Filter-Kette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vh, 18px)',
          background: `radial-gradient(110% 85% at 50% 108%, #1a0c0d 0%, ${NOX_COLORS.bg} 62%)`,
          filter: reduced
            ? 'none'
            : `blur(calc((1 - ${boot}) * ${maxBlur}px)) brightness(calc(1 + (1 - ${boot}) * ${(1.6 * overexposure).toFixed(2)})) saturate(calc(0.35 + ${boot} * 0.65)) contrast(calc(0.85 + ${boot} * 0.15))`,
          transform: reduced ? 'none' : `scale(calc(1.06 - ${boot} * 0.06))`,
          willChange: 'filter, transform',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 10,
            letterSpacing: '0.45em',
            color: accent,
          }}
        >
          SYSTEM BOOT // 04:16
        </div>
        <div
          style={{
            fontSize: 'clamp(34px, 8.5vw, 96px)',
            fontWeight: 830,
            letterSpacing: '-0.02em',
            color: NOX_COLORS.text,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          NOX ONLINE
        </div>
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 30px)',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 10,
            letterSpacing: '0.18em',
            color: NOX_COLORS.textDim,
          }}
        >
          <span>FORGE ▸ READY</span>
          <span>RANK ▸ SYNC</span>
          <span>SCAN ▸ LIVE</span>
        </div>
      </div>
      {/* Scanline-Blitz — dünne Lichtkante, läuft während des Boots einmal durch */}
      {!reduced && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(var(--bsb-scan, -15) * 1%)',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 22px 5px ${accent}55`,
            opacity: 'calc(var(--bsb-flash, 0) * 0.95)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Überbelichtungs-Schleier, blendet mit dem Boot aus */}
      {!reduced && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(80% 60% at 50% 42%, rgba(255, 240, 224, ${Math.min(0.5 * overexposure, 0.85)}) 0%, transparent 70%)`,
            opacity: `calc((1 - ${boot}) * 1)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export default BlurToSharpHeroBoot;
