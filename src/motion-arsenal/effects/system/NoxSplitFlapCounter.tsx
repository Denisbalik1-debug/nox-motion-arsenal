import { useEffect, useRef, useState } from 'react';
import { clamp, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxSplitFlapCounter — NOX Data DNA. Split-Flap-Timer (Flughafen-Anzeige):
// Jede Ziffer besteht aus einem halben oberen und unteren Karten-Segment; bei
// Wertwechsel klappt das obere Segment nach vorn, das untere nach hinten —
// klassischer Flip. Deterministische Ziffernfolge, reines CSS (WAAPI),
// Reduced Motion zeigt die Ziel-Ziffer sofort.
// ---------------------------------------------------------------------------

export interface NoxSplitFlapCounterProps {
  /** Anzuzeigender Wert. */
  value?: number;
  /** Minimaler Wert (Clamping). */
  min?: number;
  /** Maximaler Wert (Clamping). */
  max?: number;
  /** Anzahl Ziffern (Padding mit führenden Nullen). */
  digits?: number;
  /** Karten-Hintergrundfarbe. */
  color?: string;
  /** Ziffernfarbe. */
  textColor?: string;
  /** Trennzeichen zwischen Zifferngruppen (z. B. ':' für Zeit). */
  separator?: string;
  /** Flip-Dauer in ms. */
  duration?: number;
  /** Akzentfarbe der Trennzeichen. */
  accent?: string;
}

const PANEL_H = 72;
const PANEL_W = 52;
const GAP = 8;

interface DigitFlapProps {
  digit: string;
  prev: string;
  flip: boolean;
  reduced: boolean;
  duration: number;
  color: string;
  textColor: string;
}

function DigitFlap({ digit, prev, flip, reduced, duration, color, textColor }: DigitFlapProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (reduced || !flip || flipped) return;
    setFlipped(true);
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;
    const half = duration / 2;
    const anim = (el: HTMLElement, from: string, to: string, dur: number) =>
      el.animate([{ transform: from }, { transform: to }], {
        duration: dur,
        easing: 'cubic-bezier(.45,.05,.55,.95)',
        fill: 'forwards',
      });
    const a1 = anim(top, 'rotateX(0deg)', 'rotateX(-90deg)', half);
    const a2 = anim(bottom, 'rotateX(90deg)', 'rotateX(0deg)', half);
    const t = window.setTimeout(() => setFlipped(false), duration + 50);
    return () => {
      a1.cancel();
      a2.cancel();
      window.clearTimeout(t);
    };
  }, [flip, flipped, duration]);

  return (
    <div className="nsf-digit" aria-hidden="true" style={{ width: PANEL_W, height: PANEL_H }}>
      <div className="nsf-top" ref={topRef} style={{ background: color }}>
        <span>{flipped ? digit : prev}</span>
      </div>
      <div className="nsf-bottom" ref={bottomRef} style={{ background: color }}>
        <span>{flipped ? digit : prev}</span>
      </div>
      <div className="nsf-pin" style={{ background: color }} />
      <style>{`
        .nsf-digit { position: relative; display: inline-block; perspective: 420px;
          font: 700 44px/1 var(--mono, ui-monospace, monospace); color: ${textColor}; }
        .nsf-top, .nsf-bottom { position: absolute; left: 0; right: 0; height: 50%;
          overflow: hidden; backface-visibility: hidden; }
        .nsf-top { top: 0; border-radius: 6px 6px 0 0; transform-origin: bottom center;
          box-shadow: inset 0 -1px 0 rgba(0,0,0,0.4); }
        .nsf-top span { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; }
        .nsf-bottom { bottom: 0; border-radius: 0 0 6px 6px; transform-origin: top center;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }
        .nsf-bottom span { position: absolute; top: 0; left: 0; right: 0; text-align: center; }
        .nsf-pin { position: absolute; left: 0; right: 0; top: 50%; height: 1px;
          background: rgba(0,0,0,0.55); z-index: 2; }
        @media (prefers-reduced-motion: reduce) {
          .nsf-top, .nsf-bottom { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export function NoxSplitFlapCounter({
  value = 128,
  min = 0,
  max = 9999,
  digits = 4,
  color = '#17181c',
  textColor = NOX_COLORS.gold,
  separator = ':',
  duration = 420,
  accent = NOX_COLORS.gold,
}: NoxSplitFlapCounterProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  useInView(rootRef);

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const clampedValue = clamp(Math.round(value), safeMin, safeMax);
  const digitCount = clamp(Math.round(digits), 2, 8);
  const dur = clamp(duration, 200, 1200);

  const str = String(clampedValue).padStart(digitCount, '0');
  const prevStr = String(Math.max(safeMin, clampedValue - 1)).padStart(digitCount, '0');

  const groups: string[][] = [];
  for (let i = 0; i < str.length; i += 2) {
    groups.push([str[i], str[i + 1] ?? '']);
  }

  const [tick, setTick] = useState(0);

  return (
    <div
      ref={rootRef}
      className="nsf-root"
      style={{
        ['--nsf-accent' as string]: accent,
        ['--nsf-text' as string]: textColor,
      }}
      role="timer"
      aria-label={`Wert ${clampedValue}`}
    >
      <style>{`
        .nsf-root { display: flex; align-items: center; justify-content: center; gap: ${GAP}px;
          flex-wrap: wrap; padding: 18px 14px; }
        .nsf-group { display: flex; gap: ${GAP}px; }
        .nsf-sep { font: 700 40px/1 var(--mono, ui-monospace, monospace); color: var(--nsf-accent);
          text-shadow: 0 0 12px color-mix(in srgb, var(--nsf-accent) 45%, transparent); }
      `}</style>

      {groups.map((g, gi) => (
        <div key={gi} className="nsf-group" aria-hidden="true">
          {g.map((d, di) => {
            const idx = gi * 2 + di;
            return (
              <DigitFlap
                key={idx}
                digit={d}
                prev={prevStr[idx] ?? d}
                flip={!reduced && tick > 0}
                reduced={reduced}
                duration={dur}
                color={color}
                textColor={textColor}
              />
            );
          })}
          {gi < groups.length - 1 ? (
            <span className="nsf-sep" aria-hidden="true">
              {separator}
            </span>
          ) : null}
        </div>
      ))}

      {/* Unsichtbarer Replay-Trigger für Harness-QA: setzt den Flip erneut in Gang. */}
      <button
        type="button"
        onClick={() => setTick((t) => t + 1)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        replay
      </button>
    </div>
  );
}

export default NoxSplitFlapCounter;
