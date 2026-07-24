import { useRef } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ImageRevealBehindText — große Outline-Typo; dahinter ein prozedurales
// Gradient-„Bild", das per mask hinter den Buchstaben aufgedeckt wird
// (background-clip: text). Reveal folgt dem Pointer (damped, Lusion-Lambda ~8)
// oder wandert als Auto-Sweep über die Glyphen. Mask-Technik nach Shopify
// Editions (mask-image-Reveals), Pointer-Physik nach KRANK Cursor-Follow.
// ---------------------------------------------------------------------------

export interface ImageRevealBehindTextProps {
  text?: string;
  revealRadius?: number; // px radius of the reveal spotlight
  sweepSpeed?: number; // auto-sweep speed multiplier
  palette?: 'ember' | 'gold' | 'mono';
  autoSweep?: boolean; // sweep when pointer is outside
}

const PALETTES: Record<string, string> = {
  ember: `radial-gradient(55% 75% at 28% 30%, ${NOX_COLORS.redBright} 0%, transparent 62%),
          radial-gradient(48% 62% at 72% 68%, ${NOX_COLORS.gold} 0%, transparent 66%),
          conic-gradient(from 210deg at 50% 50%, ${NOX_COLORS.red}, #2a0d0e 30%, ${NOX_COLORS.gold} 55%, #3a1210 75%, ${NOX_COLORS.red})`,
  gold: `radial-gradient(60% 80% at 30% 30%, #ffd98a 0%, transparent 60%),
         radial-gradient(50% 60% at 70% 62%, ${NOX_COLORS.gold} 0%, transparent 65%),
         conic-gradient(from 180deg at 50% 50%, #8a5a1f, #1c1206 35%, ${NOX_COLORS.gold} 60%, #8a5a1f)`,
  mono: `radial-gradient(55% 75% at 30% 30%, ${NOX_COLORS.text} 0%, transparent 62%),
         radial-gradient(48% 62% at 72% 66%, #6a6862 0%, transparent 66%),
         conic-gradient(from 200deg at 50% 50%, #8a8781, #17171a 40%, ${NOX_COLORS.text} 65%, #8a8781)`,
};

export function ImageRevealBehindText({
  text = 'NOX FORGE',
  revealRadius = 150,
  sweepSpeed = 1,
  palette = 'ember',
  autoSweep = true,
}: ImageRevealBehindTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const pos = useRef({ x: 0.5, y: 0.5 });

  useRafLoop((dt, elapsed) => {
    const root = rootRef.current;
    if (!root) return;
    const p = pointer.current;
    let tx: number;
    let ty: number;
    if (p.inside) {
      tx = p.tx;
      ty = p.ty;
    } else if (autoSweep) {
      // Auto-sweep: reveal spotlight orbits over the glyphs on its own.
      const t = elapsed * 0.5 * sweepSpeed;
      tx = 0.5 + Math.sin(t) * 0.42;
      ty = 0.5 + Math.sin(t * 0.72 + 1.7) * 0.24;
    } else {
      tx = pos.current.x;
      ty = pos.current.y;
    }
    pos.current.x = damp(pos.current.x, tx, 8, dt);
    pos.current.y = damp(pos.current.y, ty, 8, dt);
    root.style.setProperty('--irb-x', pos.current.x.toFixed(4));
    root.style.setProperty('--irb-y', pos.current.y.toFixed(4));
  }, !reduced);

  const image = PALETTES[palette] ?? PALETTES.ember;
  const maskCss = `radial-gradient(circle ${Math.max(revealRadius, 20)}px at calc(var(--irb-x, 0.5) * 100%) calc(var(--irb-y, 0.5) * 100%), #000 0%, #000 55%, transparent 100%)`;

  const typoBase = {
    position: 'absolute' as const,
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    fontSize: 'clamp(38px, 13vw, 150px)',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    lineHeight: 0.95,
    textAlign: 'center' as const,
    whiteSpace: 'pre-wrap' as const,
    padding: '0 4%',
    userSelect: 'none' as const,
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 90% at 50% 110%, #140a0b 0%, ${NOX_COLORS.bg} 58%)`,
        cursor: 'crosshair',
      }}
    >
      <style>{`
        @keyframes irb-drift {
          0%   { background-position: 0% 0%, 100% 100%, 50% 50%; }
          50%  { background-position: 12% 8%, 88% 90%, 50% 50%; }
          100% { background-position: 0% 0%, 100% 100%, 50% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .irb-fill { animation: none !important; -webkit-mask-image: none !important; mask-image: none !important; }
        }
      `}</style>
      {/* Layer A — Outline-Typo (immer sichtbar, das "Skelett") */}
      <div
        aria-hidden
        style={{
          ...typoBase,
          color: 'transparent',
          WebkitTextStroke: '1.5px rgba(240, 236, 228, 0.3)',
        }}
      >
        {text}
      </div>
      {/* Layer B — prozedurales Gradient-Bild IN den Glyphen, per mask aufgedeckt */}
      <div
        className="irb-fill"
        style={{
          ...typoBase,
          color: 'transparent',
          backgroundImage: image,
          backgroundSize: '160% 160%, 160% 160%, 100% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitMaskImage: reduced ? undefined : maskCss,
          maskImage: reduced ? undefined : maskCss,
          animation: reduced ? undefined : `irb-drift ${14 / Math.max(sweepSpeed, 0.2)}s ease-in-out infinite`,
          willChange: 'mask-image',
        }}
      >
        {text}
      </div>
      {/* Spotlight-Schein hinter dem Reveal-Punkt (weiches Umgebungslicht) */}
      {!reduced && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle ${revealRadius * 1.4}px at calc(var(--irb-x, 0.5) * 100%) calc(var(--irb-y, 0.5) * 100%), rgba(201, 48, 48, 0.14) 0%, transparent 70%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '7%',
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
        SCAN TO REVEAL
      </div>
    </div>
  );
}

export default ImageRevealBehindText;
