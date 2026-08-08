import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GoldOutlineFillText — NOX Hero DNA.
// Headline startet als schlanke Gold-Kontur (nur Stroke, transparenter Kern)
// und füllt sich mit einem Gold-Gradienten (background-clip: text) — wie eine
// Gravur, die nachgeschmiedet wird. Trigger: scroll / hover / click / none.
// Optionaler Shimmer-Sweep über die fertige Fläche. CSS-only, kein Canvas.
// ---------------------------------------------------------------------------

export interface GoldOutlineFillTextProps {
  text?: string;
  /** Konturbreite in px. */
  strokeWidth?: number;
  /** Füll-Trigger: 'scroll' (in-view) | 'hover' | 'click' | 'none'. */
  fillOn?: 'scroll' | 'hover' | 'click' | 'none';
  /** Shimmer-Sweep über die gefüllte Fläche. */
  shimmer?: boolean;
  speed?: number;
  color?: string;
  accentColor?: string;
  fontSize?: string;
  fontWeight?: number;
  letterSpacing?: string;
  align?: 'left' | 'center' | 'right';
  /** Gerenderter HTML-Tag. */
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
  seed?: number;
}

export function GoldOutlineFillText({
  text = 'FORGED IN GOLD',
  strokeWidth = 1.2,
  fillOn = 'scroll',
  shimmer = false,
  speed = 1,
  color = NOX_COLORS.gold,
  accentColor = '#f7e8a4',
  fontSize = 'clamp(2rem, 6vw, 4.5rem)',
  fontWeight = 800,
  letterSpacing = '0.04em',
  align = 'center',
  as = 'h2',
  seed = 3,
}: GoldOutlineFillTextProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, '80px');
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);

  const sp = Math.max(0.2, Math.min(3, speed));
  const safeText = typeof text === 'string' && text ? text : 'FORGED';
  const safeAlign = ['left', 'center', 'right'].includes(align) ? align : 'center';

  // Scroll-Trigger: einmalig füllen, sobald im Viewport.
  const scrollFilled = fillOn === 'scroll' && inView;
  const hoverFilled = fillOn === 'hover' && hovered;
  const clickFilled = fillOn === 'click' && clicked;
  const filled = reduced || fillOn === 'none' || scrollFilled || hoverFilled || clickFilled;

  // Hover-Tracking (auch Touch-Tap als Fallback).
  const onMouseEnter = () => setHovered(true);
  const onMouseLeave = () => setHovered(false);
  const onTap = () => {
    setTouched(true);
    if (fillOn === 'click') setClicked((c) => !c);
  };

  // Seed deterministisch in CSS-Var (wird aktuell nur für künftige Varianten genutzt).
  const seedVar = (seed % 97 + 3).toString();

  const Tag = as;

  return (
    <div
      ref={rootRef}
      className={`goft-root goft-align-${safeAlign}`}
      style={{
        ['--goft-color' as string]: color,
        ['--goft-accent' as string]: accentColor,
        ['--goft-stroke' as string]: `${strokeWidth}px`,
        ['--goft-fs' as string]: fontSize,
        ['--goft-fw' as string]: fontWeight,
        ['--goft-ls' as string]: letterSpacing,
        ['--goft-speed' as string]: sp,
        ['--goft-seed' as string]: seedVar,
      }}
    >
      <style>{`
        .goft-root { display: flex; width: 100%; }
        .goft-align-left { justify-content: flex-start; }
        .goft-align-center { justify-content: center; }
        .goft-align-right { justify-content: flex-end; }
        .goft-text {
          font-size: var(--goft-fs); font-weight: var(--goft-fw);
          letter-spacing: var(--goft-ls); line-height: 1.08;
          margin: 0; padding: 0; text-align: ${safeAlign};
          -webkit-text-stroke: var(--goft-stroke) var(--goft-color);
          color: transparent;
          background-image: linear-gradient(105deg,
            color-mix(in srgb, var(--goft-color) 70%, #000 30%),
            var(--goft-color) 40%, var(--goft-accent) 50%,
            var(--goft-color) 60%, color-mix(in srgb, var(--goft-color) 70%, #000 30%));
          background-size: 200% 100%;
          background-position: 100% 0; /* leer = nur Kontur */
          background-clip: text; -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: background-position 0.05s linear;
          user-select: none;
        }
        .goft-text.goft-filled {
          background-position: 0 0;
          transition: background-position 1.2s cubic-bezier(.22,1,.36,1);
        }
        .goft-text.goft-shimmer {
          background-size: 300% 100%;
          animation: goftShimmer calc(2.6s / var(--goft-speed)) linear infinite;
        }
        @keyframes goftShimmer {
          from { background-position: 200% 0; }
          to { background-position: -100% 0; }
        }
        .goft-hint { font: 600 10px/1 var(--mono, ui-monospace, monospace);
          color: rgba(240,236,228,0.35); letter-spacing: 0.24em; text-transform: uppercase;
          margin-top: 10px; }
        @media (hover: none) and (pointer: coarse) {
          .goft-root { touch-action: manipulation; }
        }
      `}</style>

      <Tag
        className={`goft-text${filled ? ' goft-filled' : ''}${shimmer && filled ? ' goft-shimmer' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onTap}
      >
        {safeText}
      </Tag>
    </div>
  );
}

export default GoldOutlineFillText;
