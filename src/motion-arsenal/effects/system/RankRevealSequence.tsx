import { useMemo, useRef, useState } from 'react';
import { seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// RankRevealSequence — NOX-Forge reference DNA.
// Multi-stage rank reveal: scan grid builds up → letter scramble converges
// (seededRandom) → flash + additive glow burst → settle with staggered metric
// rows. Mechanics: KRANK filter/flash choreography + stroke of Shopify
// mask-reveal stagger, all DOM/CSS + one rAF loop for the scramble.
// ---------------------------------------------------------------------------

export interface RankRevealSequenceProps {
  rankName?: string;
  speed?: number;
  color?: string;
  accentColor?: string;
  autoReplay?: boolean;
  seed?: number;
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=';

const METRICS: Array<[string, string]> = [
  ['SIGNAL INTEGRITY', '98.2%'],
  ['FORGE OUTPUT', '+412'],
  ['SCAN DEPTH', 'L7'],
  ['SYSTEM TRUST', 'MAX'],
];

export function RankRevealSequence({
  rankName = 'OVERLORD',
  speed = 1,
  color = NOX_COLORS.red,
  accentColor = NOX_COLORS.gold,
  autoReplay = true,
  seed = 11,
}: RankRevealSequenceProps) {
  const reduced = usePrefersReducedMotion();
  const sp = Math.max(0.2, speed);
  const safeRankName = typeof rankName === 'string' && rankName ? rankName : 'FORGED';
  const letters = useMemo(() => safeRankName.toUpperCase().split(''), [safeRankName]);
  const [run, setRun] = useState(0);
  const timeRef = useRef(0);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const T = useMemo(() => {
    const gridDur = 0.85 / sp;
    const scrambleStart = 0.3 / sp;
    const lockStart = 0.9 / sp;
    const lockStep = 0.13 / sp;
    const lockEnd = lockStart + letters.length * lockStep;
    const flash = lockEnd + 0.1 / sp;
    const metrics = flash + 0.22 / sp;
    const cycle = flash + 2.3 / sp;
    return { gridDur, scrambleStart, lockStart, lockStep, lockEnd, flash, metrics, cycle };
  }, [sp, letters.length]);

  useRafLoop((dt) => {
    timeRef.current += dt;
    const t = timeRef.current;
    const tick = Math.floor(t * 22);
    for (let i = 0; i < letters.length; i++) {
      const el = letterRefs.current[i];
      if (!el) continue;
      const ch = letters[i];
      if (ch === ' ') {
        el.textContent = ' ';
        continue;
      }
      const lockAt = T.lockStart + i * T.lockStep;
      if (t < T.scrambleStart) {
        el.textContent = '·';
        el.style.color = 'rgba(240,236,228,0.14)';
        el.style.textShadow = 'none';
      } else if (t < lockAt) {
        const r = seededRandom(seed + i * 97 + tick * 131)();
        el.textContent = SCRAMBLE_CHARS[Math.floor(r * SCRAMBLE_CHARS.length)];
        el.style.color = 'rgba(240,236,228,0.42)';
        el.style.textShadow = 'none';
      } else {
        el.textContent = ch;
        const hot = Math.max(0, 1 - (t - lockAt) * 3);
        el.style.color = NOX_COLORS.text;
        el.style.textShadow = `0 0 ${(8 + hot * 26).toFixed(1)}px ${color}, 0 0 ${(2 + hot * 10).toFixed(1)}px ${color}`;
      }
    }
    if (autoReplay && t >= T.cycle) {
      timeRef.current = 0;
      setRun((r) => r + 1);
    }
  }, !reduced);

  const replay = () => {
    timeRef.current = 0;
    setRun((r) => r + 1);
  };

  const anim = (name: string, dur: number, delay: number, ease: string = EASE.outExpo) =>
    reduced ? undefined : `rrs-${name} ${dur.toFixed(2)}s ${ease} ${delay.toFixed(2)}s both`;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(110% 100% at 50% 115%, #150a0b 0%, #0a0a0b 60%)' }}>
      <style>{`
        @keyframes rrs-grid-in { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
        @keyframes rrs-scan { 0% { top: -4%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { top: 104%; opacity: 0; } }
        @keyframes rrs-flash { 0% { opacity: 0; transform: scale(0.55); } 30% { opacity: 0.95; transform: scale(1.1); } 100% { opacity: 0; transform: scale(1.45); } }
        @keyframes rrs-gridflash { 0% { opacity: 0; } 25% { opacity: 0.55; } 100% { opacity: 0; } }
        @keyframes rrs-metric { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rrs-label { from { opacity: 0; letter-spacing: 0.6em; } to { opacity: 1; letter-spacing: 0.35em; } }
        @media (prefers-reduced-motion: reduce) { .rrs-anim { animation: none !important; } }
      `}</style>
      <div key={run} style={{ position: 'absolute', inset: 0 }}>
        {/* Scan grid building up */}
        <div
          className="rrs-anim"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(240,236,228,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(240,236,228,0.055) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            animation: anim('grid-in', T.gridDur, 0),
            opacity: reduced ? 1 : undefined,
          }}
        />
        {/* Grid glow flash (colored copy, additive) */}
        {!reduced && (
          <div
            className="rrs-anim"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(${color}26 1px, transparent 1px), linear-gradient(90deg, ${color}26 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
              mixBlendMode: 'screen',
              animation: anim('gridflash', 0.6 / sp, T.flash),
              opacity: 0,
            }}
          />
        )}
        {/* Scanline sweep */}
        {!reduced && (
          <div
            className="rrs-anim"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color}cc, transparent)`,
              boxShadow: `0 0 18px ${color}`,
              animation: anim('scan', T.gridDur * 1.1, 0.05, EASE.inOutSoft),
              top: '-4%',
            }}
          />
        )}
        {/* Glow burst (additive layers) */}
        {!reduced && (
          <>
            <div
              className="rrs-anim"
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(42% 34% at 50% 44%, ${color}b0 0%, transparent 70%)`,
                mixBlendMode: 'screen',
                animation: anim('flash', 0.55 / sp, T.flash),
                opacity: 0,
              }}
            />
            <div
              className="rrs-anim"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(26% 20% at 50% 44%, rgba(255,255,255,0.9) 0%, transparent 60%)',
                mixBlendMode: 'plus-lighter',
                animation: anim('flash', 0.4 / sp, T.flash + 0.02),
                opacity: 0,
              }}
            />
          </>
        )}
        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4%' }}>
          <div
            className="rrs-anim"
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: 10,
              letterSpacing: '0.35em',
              color: accentColor,
              animation: anim('label', 0.7 / sp, T.scrambleStart),
              opacity: reduced ? 1 : 0,
            }}
          >
            RANK ASSESSMENT COMPLETE
          </div>
          <div style={{ display: 'flex', fontFamily: 'var(--mono, monospace)', fontWeight: 800, fontSize: 'clamp(26px, 8vw, 58px)', letterSpacing: '0.08em' }}>
            {letters.map((ch, i) => (
              <span
                key={i}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                style={{
                  display: 'inline-block',
                  minWidth: '0.72em',
                  textAlign: 'center',
                  color: reduced ? NOX_COLORS.text : 'rgba(240,236,228,0.14)',
                  textShadow: reduced ? `0 0 12px ${color}` : 'none',
                }}
              >
                {reduced ? (ch === ' ' ? ' ' : ch) : '·'}
              </span>
            ))}
          </div>
          <div style={{ width: 'min(64%, 340px)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {METRICS.map(([k, v], i) => (
              <div
                key={k}
                className="rrs-anim"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: NOX_COLORS.textDim,
                  borderBottom: '1px solid rgba(240,236,228,0.08)',
                  paddingBottom: 3,
                  animation: anim('metric', 0.6 / sp, T.metrics + i * (0.12 / sp)),
                  opacity: reduced ? 1 : 0,
                }}
              >
                <span>{k}</span>
                <span style={{ color: i === METRICS.length - 1 ? color : NOX_COLORS.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={replay}
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          zIndex: 5,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.15em',
          color: NOX_COLORS.textDim,
          background: 'rgba(17,17,20,0.7)',
          border: '1px solid rgba(240,236,228,0.15)',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        ⟳ REPLAY
      </button>
    </div>
  );
}

export default RankRevealSequence;
