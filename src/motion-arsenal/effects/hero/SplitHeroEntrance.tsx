import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SplitHeroEntrance — der Hero ist in 2–3 vertikale Panels geteilt, die aus
// entgegengesetzten Richtungen einfahren und andocken. Easing ist das
// KRANK-Overshoot-Bezier `cubic-bezier(.3, 0, .66, -.3)` (index.css, auf
// 500ms-Transforms) — der Unterschwinger gibt den elastischen Dock-Moment.
// Nach dem Andocken läuft ein Licht-Sweep die Panel-Kanten entlang.
// ---------------------------------------------------------------------------

export interface SplitHeroEntranceProps {
  panels?: number; // 2..3
  speed?: number;
  accent?: string;
  sweep?: boolean; // edge light sweep after docking
  loop?: boolean;
}

const PANEL_CONTENT = [
  { kicker: 'NOX // 01', word: 'BUILD', note: 'FORGE READY' },
  { kicker: 'NOX // 02', word: 'THE', note: 'RANK SYNC' },
  { kicker: 'NOX // 03', word: 'SYSTEM', note: 'SCAN LIVE' },
];

export function SplitHeroEntrance({
  panels = 3,
  speed = 1,
  accent = NOX_COLORS.red,
  sweep = true,
  loop = true,
}: SplitHeroEntranceProps) {
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const s = Math.max(speed, 0.2);
  const count = Math.max(2, Math.min(3, Math.round(panels)));

  const enterDur = 0.9 / s;
  const stagger = 0.12 / s;
  const cycleMs = (enterDur + count * stagger + 1.4 / s) * 1000 + 2600;

  useEffect(() => {
    if (reduced || !loop) return;
    const id = setInterval(() => setCycle((c) => c + 1), cycleMs);
    return () => clearInterval(id);
  }, [reduced, loop, cycleMs]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
      }}
    >
      <style>{`
        @keyframes she-in-down {
          from { transform: translateY(-108%); }
          to   { transform: translateY(0); }
        }
        @keyframes she-in-up {
          from { transform: translateY(108%); }
          to   { transform: translateY(0); }
        }
        @keyframes she-sweep {
          0%   { transform: translateY(-120%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(320%); opacity: 0; }
        }
        @keyframes she-content {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .she-anim { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
      <div key={cycle} style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        {Array.from({ length: count }, (_, i) => {
          const fromTop = i % 2 === 0;
          const content = PANEL_CONTENT[i % PANEL_CONTENT.length];
          const delay = i * stagger;
          const docked = enterDur + delay;
          return (
            <div
              key={i}
              className="she-anim"
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 1.6vh, 14px)',
                background: `linear-gradient(${fromTop ? 180 : 0}deg, #131114 0%, #0c0b0d 100%)`,
                borderLeft: i > 0 ? '1px solid rgba(240, 236, 228, 0.07)' : undefined,
                transform: reduced ? 'none' : `translateY(${fromTop ? -108 : 108}%)`,
                // KRANK-Overshoot: Panel schwingt beim Andocken kurz durch.
                animation: reduced
                  ? undefined
                  : `${fromTop ? 'she-in-down' : 'she-in-up'} ${enterDur}s ${EASE.krankOvershoot} ${delay}s both`,
                willChange: 'transform',
              }}
            >
              <div
                className="she-anim"
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 9,
                  letterSpacing: '0.35em',
                  color: accent,
                  opacity: reduced ? 1 : 0,
                  animation: reduced ? undefined : `she-content ${0.5 / s}s ${EASE.outExpo} ${docked * 0.85}s both`,
                }}
              >
                {content.kicker}
              </div>
              <div
                style={{
                  fontSize: 'clamp(22px, 5.2vw, 64px)',
                  fontWeight: 820,
                  letterSpacing: '-0.02em',
                  color: NOX_COLORS.text,
                  lineHeight: 1,
                }}
              >
                {content.word}
              </div>
              <div
                className="she-anim"
                style={{
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 8,
                  letterSpacing: '0.25em',
                  color: NOX_COLORS.textDim,
                  opacity: reduced ? 1 : 0,
                  animation: reduced ? undefined : `she-content ${0.5 / s}s ${EASE.outExpo} ${docked * 0.85 + 0.08}s both`,
                }}
              >
                {content.note}
              </div>
              {/* Licht-Sweep entlang der Panel-Kante nach dem Andocken */}
              {sweep && !reduced && i > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: -1,
                    top: 0,
                    width: 2,
                    height: '38%',
                    background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
                    boxShadow: `0 0 14px 2px ${accent}66`,
                    opacity: 0,
                    animation: `she-sweep ${1.3 / s}s ${EASE.inOutSoft} ${docked + 0.1}s both`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SplitHeroEntrance;
