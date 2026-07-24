import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// SmoothSectionWipe — mehrlagiger Page-Wipe nach Active-Theory-Muster:
// 2–3 versetzte Vollflächen-Panels (dunkel → Akzent → Panelgrau) wischen mit
// gestaffeltem Easing durch den Viewport; auf halber Strecke (alle Panels
// decken) wird die Seite getauscht. Alles choreografiert, kein Default-ease.
// ---------------------------------------------------------------------------

export interface SmoothSectionWipeProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  speed?: number; // 0.5 .. 2 multiplier
  accent?: string;
  panelCount?: number; // 2 .. 3
}

const TRANSFORMS: Record<string, { from: string; to: string }> = {
  left: { from: 'translate3d(112%, 0, 0)', to: 'translate3d(-112%, 0, 0)' },
  right: { from: 'translate3d(-112%, 0, 0)', to: 'translate3d(112%, 0, 0)' },
  up: { from: 'translate3d(0, 112%, 0)', to: 'translate3d(0, -112%, 0)' },
  down: { from: 'translate3d(0, -112%, 0)', to: 'translate3d(0, 112%, 0)' },
};

function DemoPage({ variant, accent }: { variant: 0 | 1; accent: string }) {
  const isA = variant === 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: isA
          ? 'radial-gradient(120% 100% at 18% 0%, #17090b 0%, #0a0a0b 62%)'
          : 'radial-gradient(120% 100% at 82% 100%, #0b1213 0%, #0a0a0b 62%)',
        color: NOX_COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5% 6%',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.35em', color: NOX_COLORS.textDim }}>
          {isA ? 'NOX // FORGE' : 'NOX // RANK'}
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isA ? accent : NOX_COLORS.gold, boxShadow: `0 0 10px ${isA ? accent : NOX_COLORS.gold}` }} />
      </div>
      <div>
        <div style={{ fontSize: 'clamp(24px, 6vw, 56px)', fontWeight: 780, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {isA ? 'SYSTEM ONLINE' : 'SCAN COMPLETE'}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: NOX_COLORS.textDim, maxWidth: 380 }}>
          {isA ? 'Signal chain armed. Every module reporting nominal.' : 'Rank matrix rebuilt. New signal paths unlocked.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(isA ? ['FORGE', 'SIGNAL', 'GRID'] : ['RANK', 'SCAN', 'SYSTEM']).map((t) => (
          <span
            key={t}
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.2em',
              padding: '5px 10px',
              border: `1px solid ${isA ? 'rgba(201,48,48,0.4)' : 'rgba(212,162,74,0.4)'}`,
              borderRadius: 999,
              color: NOX_COLORS.textDim,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SmoothSectionWipe({
  direction = 'left',
  speed = 1,
  accent = NOX_COLORS.red,
  panelCount = 3,
}: SmoothSectionWipeProps) {
  const reduced = usePrefersReducedMotion();
  const uid = `ssw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [page, setPage] = useState<0 | 1>(reduced ? 1 : 0);
  const [cycle, setCycle] = useState(0);
  const [wiping, setWiping] = useState(false);
  const timers = useRef<number[]>([]);
  const wipingRef = useRef(false);

  const spd = Math.max(0.3, Math.min(3, speed));
  const n = Math.max(2, Math.min(3, Math.round(panelCount)));
  const dur = 1.15 / spd; // s per panel
  const step = 0.085 / spd; // stagger between panels
  const { from, to } = TRANSFORMS[direction] ?? TRANSFORMS.left;

  const trigger = useCallback(() => {
    if (wipingRef.current) return;
    if (reduced) {
      setPage((p) => (p === 0 ? 1 : 0));
      return;
    }
    wipingRef.current = true;
    setWiping(true);
    setCycle((c) => c + 1);
    const swapMs = ((n - 1) * step + dur * 0.46) * 1000;
    const doneMs = ((n - 1) * step + dur) * 1000 + 60;
    timers.current.push(window.setTimeout(() => setPage((p) => (p === 0 ? 1 : 0)), swapMs));
    timers.current.push(
      window.setTimeout(() => {
        wipingRef.current = false;
        setWiping(false);
      }, doneMs),
    );
  }, [reduced, n, step, dur]);

  // Auto-loop every ~3.5s (paused for reduced motion).
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(trigger, 3500);
    return () => window.clearInterval(id);
  }, [reduced, trigger]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const panelColors = useMemo(() => {
    const all = ['#050506', accent, '#15151a'];
    return n === 2 ? [all[0], all[1]] : all;
  }, [accent, n]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      <style>{`
        @keyframes ${uid}-sweep {
          0%   { transform: ${from}; }
          42%  { transform: translate3d(0, 0, 0); }
          58%  { transform: translate3d(0, 0, 0); }
          100% { transform: ${to}; }
        }
      `}</style>
      <DemoPage variant={page} accent={accent} />
      {wiping &&
        panelColors.map((c, i) => (
          <div
            key={`${cycle}-${i}`}
            style={{
              position: 'absolute',
              inset: '-2%',
              background: i === 1 && n === 3 ? `linear-gradient(135deg, ${c} 0%, #7a1d1d 100%)` : c,
              zIndex: 10 + i,
              transform: from,
              animation: `${uid}-sweep ${dur}s ${EASE.inOutSoft} ${i * step}s both`,
              boxShadow: '0 0 40px rgba(0,0,0,0.6)',
              willChange: 'transform',
            }}
          />
        ))}
      <button
        onClick={trigger}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 50,
          background: 'rgba(17,17,20,0.8)',
          border: `1px solid ${accent}`,
          color: NOX_COLORS.text,
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          padding: '7px 14px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        WIPE →
      </button>
    </div>
  );
}

export default SmoothSectionWipe;
