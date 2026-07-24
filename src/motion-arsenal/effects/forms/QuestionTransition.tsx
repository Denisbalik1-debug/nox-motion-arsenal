import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// QuestionTransition — Frage-Wechsel über eine Scan-Linie.
// Choreografie (3 Phasen):
//  1. collapse: alte Frage kollabiert in eine 1px-Scan-Linie (scaleY→0.02 +
//     Blur, sharpIn) — Shopify-Editions Mask/Collapse-Reveal-DNA.
//  2. sweep: die glühende Linie wischt zur Seite (Richtung = vor/zurück).
//  3. expand: Linie → Expansion (scaleY 0.02→1, outExpo) + Content-Stagger
//     (Nav-Entrance-Cascade-Muster: delay-Steps pro Kind).
// ---------------------------------------------------------------------------

export interface QuestionTransitionProps {
  duration?: number; // total transition seconds
  blurAmount?: number; // px blur during collapse
  accentColor?: string;
  direction?: 'forward' | 'back'; // default direction for answer clicks / auto
  autoCycle?: boolean; // preview self-demonstrates
}

const QUESTIONS = [
  { q: 'Welches SYSTEM treibt dich an?', a: ['FORGE', 'SIGNAL', 'RANK', 'SCAN'] },
  { q: 'Wie oft prüfst du deinen RANK?', a: ['TÄGLICH', 'WÖCHENTLICH', 'BEI SIGNAL', 'NIE'] },
  { q: 'Was startet dein nächster SCAN?', a: ['PROFIL', 'MISSION', 'FORGE-RUN', 'SYSTEM-CHECK'] },
] as const;

type Phase = 'idle' | 'collapse' | 'sweep' | 'expand';

export function QuestionTransition({
  duration = 0.95,
  blurAmount = 10,
  accentColor = NOX_COLORS.red,
  direction = 'forward',
  autoCycle = true,
}: QuestionTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dir, setDir] = useState<1 | -1>(1);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const wrap = (i: number) => ((i % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length;

  const go = (d: 1 | -1) => {
    if (reduced) {
      setIdx((i) => wrap(i + d));
      return;
    }
    if (phaseRef.current !== 'idle') return;
    setDir(d);
    setPhase('collapse');
    const D = duration * 1000;
    const t = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
    t(() => setPhase('sweep'), D * 0.36);
    t(() => {
      setIdx((i) => wrap(i + d));
      setPhase('expand');
    }, D * 0.36 + D * 0.24);
    t(() => setPhase('idle'), D * 0.36 + D * 0.24 + D * 0.55);
  };

  // Self-demonstrating preview loop.
  useEffect(() => {
    if (!autoCycle || reduced) return;
    const id = setTimeout(() => go(direction === 'back' ? -1 : 1), 2800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, autoCycle, reduced, direction, duration]);

  const D = duration;
  const q = QUESTIONS[idx];

  // Content wrapper style per phase (collapse/sweep hold the collapsed frame,
  // expand runs the rebuild keyframe).
  const wrapperStyle: CSSProperties =
    phase === 'collapse' || phase === 'sweep'
      ? { animation: `qtr-collapse ${D * 0.36}s ${EASE.sharpIn} forwards` }
      : phase === 'expand'
        ? { animation: `qtr-expand ${D * 0.5}s ${EASE.outExpo} forwards` }
        : {};

  const lineStyle: CSSProperties =
    phase === 'collapse'
      ? { animation: `qtr-line-in ${D * 0.36}s ${EASE.outQuint} forwards` }
      : phase === 'sweep'
        ? { animation: `qtr-line-sweep ${D * 0.24}s ${EASE.inOutSoft} forwards` }
        : phase === 'expand'
          ? { animation: `qtr-line-out ${D * 0.4}s ${EASE.outExpo} forwards` }
          : { opacity: 0 };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(110% 90% at 50% 10%, #121014 0%, ${NOX_COLORS.bg} 65%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 30px)',
        fontFamily: 'system-ui, sans-serif',
        color: NOX_COLORS.text,
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes qtr-collapse {
          from { transform: scaleY(1); filter: blur(0); opacity: 1; }
          to   { transform: scaleY(0.02); filter: blur(${blurAmount}px); opacity: 0.85; }
        }
        @keyframes qtr-expand {
          0%   { transform: scaleY(0.02); filter: blur(${blurAmount * 0.6}px); opacity: 0.9; }
          100% { transform: scaleY(1); filter: blur(0); opacity: 1; }
        }
        @keyframes qtr-line-in {
          from { opacity: 0; transform: translateX(0) scaleX(0.35); }
          to   { opacity: 1; transform: translateX(0) scaleX(1); }
        }
        @keyframes qtr-line-sweep {
          0%   { opacity: 1; transform: translateX(0) scaleX(1); }
          55%  { opacity: 1; transform: translateX(calc(var(--qtr-dir) * 26%)) scaleX(0.75); }
          100% { opacity: 1; transform: translateX(0) scaleX(1.05); }
        }
        @keyframes qtr-line-out {
          from { opacity: 1; transform: scaleX(1.05); }
          to   { opacity: 0; transform: scaleX(1.3); }
        }
        @keyframes qtr-child {
          from { opacity: 0; transform: translateX(calc(var(--qtr-dir) * 28px)) translateY(6px); }
          to   { opacity: 1; transform: translateX(0) translateY(0); }
        }
      `}</style>

      <div style={{ position: 'relative', flex: '0 1 auto', ['--qtr-dir' as string]: String(dir) } as CSSProperties}>
        {/* Scan line */}
        <div
          style={{
            position: 'absolute',
            left: '4%',
            right: '4%',
            top: '50%',
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 12px 1px ${accentColor}aa, 0 0 30px 4px ${accentColor}44`,
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0,
            ...lineStyle,
          }}
        />
        {/* Question content */}
        <div style={{ transformOrigin: '50% 50%', willChange: 'transform, filter', ...wrapperStyle }}>
          <div
            key={`h-${idx}`}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              letterSpacing: '0.3em',
              color: NOX_COLORS.textDim,
              marginBottom: 6,
              ...(phase === 'expand' && !reduced ? { animation: `qtr-child ${D * 0.4}s ${EASE.outExpo} 0.02s both` } : {}),
            }}
          >
            NPC-TEST · FRAGE {String(idx + 1).padStart(2, '0')}/{String(QUESTIONS.length).padStart(2, '0')}
          </div>
          <div
            key={`q-${idx}`}
            style={{
              fontSize: 'clamp(15px, 2.8vw, 24px)',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              marginBottom: 'clamp(10px, 2.4vh, 20px)',
              ...(phase === 'expand' && !reduced ? { animation: `qtr-child ${D * 0.45}s ${EASE.outExpo} 0.08s both` } : {}),
            }}
          >
            {q.q}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1vw, 10px)' }}>
            {q.a.map((ans, i) => (
              <button
                key={`${idx}-${i}`}
                onClick={() => go(1)}
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 'clamp(8px, 1.3vw, 11px)',
                  letterSpacing: '0.16em',
                  textAlign: 'left',
                  padding: 'clamp(7px, 1.5vh, 12px) 12px',
                  background: NOX_COLORS.bgPanel,
                  border: '1px solid #26262b',
                  borderRadius: 8,
                  color: NOX_COLORS.text,
                  cursor: 'pointer',
                  ...(phase === 'expand' && !reduced
                    ? { animation: `qtr-child ${D * 0.45}s ${EASE.outExpo} ${0.14 + i * 0.06}s both` }
                    : {}),
                }}
              >
                <span style={{ color: accentColor, marginRight: 8 }}>▸</span>
                {ans}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'clamp(10px, 2.5vh, 22px)' }}>
        {(
          [
            ['◀ ZURÜCK', -1],
            ['WEITER ▶', 1],
          ] as const
        ).map(([label, d]) => (
          <button
            key={label}
            onClick={() => go(d)}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 'clamp(8px, 1.3vw, 11px)',
              letterSpacing: '0.2em',
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid #2c2c31',
              background: 'transparent',
              color: NOX_COLORS.textDim,
              cursor: 'pointer',
              transition: 'border-color 0.18s, color 0.18s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.color = NOX_COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2c2c31';
              e.currentTarget.style.color = NOX_COLORS.textDim;
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuestionTransition;
