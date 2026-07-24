import { useState } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// AnswerLockIn — 5er-Skala Antwort-Karten mit mechanischem Lock-Gefühl.
// Mechanik-Kombination:
//  1. KRANK-Overshoot cubic-bezier(.3,0,.66,-.3) auf dem Lock-Settle
//     (scale-Dip → Snap → Overshoot → Settle, wie die 500ms-Card-Transforms)
//  2. SVG Border-Trace via pathLength/stroke-dashoffset (KRANK wheel-dash)
//  3. LED-Zündung + Dim-Choreografie der Nicht-Gewählten
//  4. Energie-Linie (fließende Dash-Animation) Auswahl → Weiter-Button
// NPC-Test-DNA von NOX Forge, veredelt.
// ---------------------------------------------------------------------------

export interface AnswerLockInProps {
  accentColor?: string;
  lockDuration?: number; // seconds for the lock-in settle
  dimOpacity?: number; // opacity of non-selected cards
  showEnergyLine?: boolean;
}

const SCALE = [
  { n: '01', label: 'SCHWACH' },
  { n: '02', label: 'GERING' },
  { n: '03', label: 'NEUTRAL' },
  { n: '04', label: 'STARK' },
  { n: '05', label: 'MAXIMAL' },
] as const;

export function AnswerLockIn({
  accentColor = NOX_COLORS.red,
  lockDuration = 0.55,
  dimOpacity = 0.32,
  showEnergyLine = true,
}: AnswerLockInProps) {
  const reduced = usePrefersReducedMotion();
  const [sel, setSel] = useState<number | null>(null);
  // Incremented on every pick so lock/trace animations restart cleanly.
  const [lockKey, setLockKey] = useState(0);

  const pick = (i: number) => {
    setSel(i);
    setLockKey((k) => k + 1);
  };

  const cx = sel === null ? 50 : ((sel + 0.5) / SCALE.length) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 0%, #131015 0%, ${NOX_COLORS.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 28px)',
        fontFamily: 'system-ui, sans-serif',
        color: NOX_COLORS.text,
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes ali-lock {
          0%   { transform: scale(1); }
          28%  { transform: scale(0.92); }
          62%  { transform: scale(1.045); }
          100% { transform: scale(1); }
        }
        @keyframes ali-trace {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ali-led {
          0%   { opacity: 0.2; transform: scale(0.5); }
          55%  { opacity: 1; transform: scale(1.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ali-flow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -1; }
        }
        @keyframes ali-draw {
          from { stroke-dashoffset: 1; opacity: 0; }
          30%  { opacity: 1; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes ali-cta {
          0%, 100% { box-shadow: 0 0 0 0 ${accentColor}55; }
          50%      { box-shadow: 0 0 18px 2px ${accentColor}55; }
        }
      `}</style>

      <div
        style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 'clamp(9px, 1.4vw, 11px)',
          letterSpacing: '0.3em',
          color: NOX_COLORS.textDim,
          marginBottom: 6,
        }}
      >
        NPC-TEST · FRAGE 03
      </div>
      <div style={{ fontSize: 'clamp(14px, 2.6vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 'clamp(10px, 2.5vh, 22px)' }}>
        Wie stark pulst dein SYSTEM-SIGNAL?
      </div>

      {/* Answer cards */}
      <div style={{ display: 'flex', gap: 'clamp(6px, 1.2vw, 12px)' }}>
        {SCALE.map((s, i) => {
          const isSel = sel === i;
          const dimmed = sel !== null && !isSel;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                padding: 'clamp(8px, 1.8vh, 16px) 4px',
                background: isSel ? `linear-gradient(180deg, ${accentColor}1f, transparent)` : NOX_COLORS.bgPanel,
                border: '1px solid #26262b',
                borderRadius: 10,
                color: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                opacity: dimmed ? dimOpacity : 1,
                filter: dimmed ? 'saturate(0.2)' : 'none',
                transform: dimmed ? 'scale(0.96)' : 'scale(1)',
                transition: reduced
                  ? 'none'
                  : `opacity 0.45s ${EASE.outExpo}, filter 0.45s ${EASE.outExpo}, transform 0.45s ${EASE.outExpo}, background 0.3s`,
                animation: isSel && !reduced ? `ali-lock ${lockDuration}s ${EASE.krankOvershoot}` : undefined,
              }}
            >
              {/* Border trace — runs around the card once on lock */}
              {isSel && (
                <svg
                  key={lockKey}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <rect
                    x="1"
                    y="1"
                    width="98"
                    height="98"
                    rx="9"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={reduced ? 0 : 1}
                    style={{
                      animation: reduced ? undefined : `ali-trace 0.6s ${EASE.outExpo} forwards`,
                      filter: `drop-shadow(0 0 5px ${accentColor}aa)`,
                    }}
                  />
                </svg>
              )}
              {/* LED */}
              <span
                key={isSel ? `led-${lockKey}` : 'led-off'}
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isSel ? accentColor : '#2e2e33',
                  boxShadow: isSel ? `0 0 8px 2px ${accentColor}99` : 'none',
                  animation: isSel && !reduced ? `ali-led 0.5s ${EASE.outBack} forwards` : undefined,
                }}
              />
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(13px, 2.4vw, 20px)', fontWeight: 700, color: isSel ? accentColor : NOX_COLORS.text }}>
                {s.n}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(6px, 1vw, 9px)', letterSpacing: '0.14em', color: NOX_COLORS.textDim, marginTop: 4 }}>
                {s.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Energy line: selection → CTA */}
      <div style={{ position: 'relative', height: 'clamp(22px, 5vh, 40px)' }}>
        {sel !== null && showEnergyLine && (
          <svg
            key={`line-${lockKey}`}
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          >
            {/* Base draw-in */}
            <path
              d={`M ${cx} 1 C ${cx} 22, 50 16, 50 39`}
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={reduced ? 0 : 1}
              opacity={0.5}
              style={{ animation: reduced ? undefined : `ali-draw 0.55s ${EASE.outExpo} 0.15s both` }}
            />
            {/* Flowing energy dashes on top */}
            {!reduced && (
              <path
                d={`M ${cx} 1 C ${cx} 22, 50 16, 50 39`}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="0.07 0.18"
                style={{
                  animation: `ali-flow 1.1s linear 0.4s infinite`,
                  filter: `drop-shadow(0 0 4px ${accentColor})`,
                }}
              />
            )}
          </svg>
        )}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setSel(null)}
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            letterSpacing: '0.22em',
            padding: '10px 26px',
            borderRadius: 999,
            border: `1px solid ${sel !== null ? accentColor : '#2c2c31'}`,
            background: sel !== null ? `${accentColor}1a` : 'transparent',
            color: sel !== null ? NOX_COLORS.text : NOX_COLORS.textDim,
            cursor: sel !== null ? 'pointer' : 'default',
            transition: reduced ? 'none' : `border-color 0.3s, background 0.3s, color 0.3s`,
            animation: sel !== null && !reduced ? 'ali-cta 1.6s ease-in-out 0.5s infinite' : undefined,
          }}
        >
          WEITER →
        </button>
      </div>
    </div>
  );
}

export default AnswerLockIn;
