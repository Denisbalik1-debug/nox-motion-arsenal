import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// ClipPathReveal — die neue Sektion wird über einen animierten
// `clip-path: polygon(...)` mit diagonalem Notch-Schnitt (NOX-Forge-Ästhetik)
// freigelegt; eine Glow-Kantenlinie fährt synchron mit dem Schnitt durchs
// Bild, die alte Sektion dimmt/skaliert dezent zurück.
// ---------------------------------------------------------------------------

export interface ClipPathRevealProps {
  direction?: 'left' | 'right';
  speed?: number;
  accent?: string;
  notch?: number; // 4 .. 22 — depth of the diagonal notch step in %
}

function SectionPage({ variant, accent }: { variant: 0 | 1; accent: string }) {
  const isA = variant === 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: isA
          ? 'linear-gradient(145deg, #140a0b 0%, #0a0a0b 50%, #0c0c0f 100%)'
          : 'linear-gradient(215deg, #101208 0%, #0a0a0b 50%, #0f0c0c 100%)',
        color: NOX_COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5% 7%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 2, background: isA ? accent : NOX_COLORS.gold }} />
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.35em', color: NOX_COLORS.textDim }}>
          {isA ? 'SECTION // FORGE' : 'SECTION // SCAN'}
        </span>
      </div>
      <div style={{ fontSize: 'clamp(24px, 6vw, 54px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 10 }}>
        {isA ? 'CUT THE' : 'REVEAL THE'}
        <br />
        <span style={{ color: isA ? accent : NOX_COLORS.gold }}>{isA ? 'PLATEAU' : 'SIGNAL'}</span>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: NOX_COLORS.textDim, maxWidth: 340 }}>
        {isA
          ? 'Diagonal discipline. The forge only keeps what survives the cut.'
          : 'Behind every cut edge: the next system layer, already running.'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {(isA ? ['GRIT', 'RANK', 'XP'] : ['NODE', 'GRID', 'SYS']).map((t) => (
          <span
            key={t}
            style={{
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.2em',
              padding: '4px 9px',
              background: 'rgba(240,236,228,0.05)',
              border: '1px solid rgba(240,236,228,0.1)',
              color: NOX_COLORS.textDim,
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ClipPathReveal({
  direction = 'left',
  speed = 1,
  accent = NOX_COLORS.red,
  notch = 12,
}: ClipPathRevealProps) {
  const reduced = usePrefersReducedMotion();
  const uid = `cpr${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [page, setPage] = useState<0 | 1>(reduced ? 1 : 0);
  const [incoming, setIncoming] = useState<0 | 1 | null>(null);
  const [cycle, setCycle] = useState(0);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);

  const spd = Math.max(0.3, Math.min(3, speed));
  const durS = 1.25 / spd;
  const nd = Math.max(4, Math.min(22, notch));

  // Diagonal edge with a notch step; boundary base `b` sweeps across.
  const poly = useMemo(() => {
    const pts = (b: number) => {
      const raw: Array<[number, number]> = [
        [-90, -5],
        [b + 16, -5],
        [b + 6, 34],
        [b + 6 + nd, 46],
        [b + nd, 54],
        [b, 66],
        [b - 12, 105],
        [-90, 105],
      ];
      const mapped = direction === 'right' ? raw.map(([x, y]) => [100 - x, y] as [number, number]) : raw;
      return mapped.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(', ');
    };
    return { from: `polygon(${pts(-40)})`, to: `polygon(${pts(160)})` };
  }, [direction, nd]);

  const trigger = useCallback(() => {
    if (busy.current) return;
    if (reduced) {
      setPage((p) => (p === 0 ? 1 : 0));
      return;
    }
    busy.current = true;
    setCycle((c) => c + 1);
    setIncoming(page === 0 ? 1 : 0);
    timers.current.push(
      window.setTimeout(() => {
        setPage((p) => (p === 0 ? 1 : 0));
        setIncoming(null);
        busy.current = false;
      }, durS * 1000 + 100),
    );
  }, [reduced, page, durS]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(trigger, 3500);
    return () => window.clearInterval(id);
  }, [reduced, trigger]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const lineFrom = direction === 'left' ? '-28%' : '112%';
  const lineTo = direction === 'left' ? '112%' : '-28%';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      <style>{`
        @keyframes ${uid}-clip {
          from { clip-path: ${poly.from}; }
          to   { clip-path: ${poly.to}; }
        }
        @keyframes ${uid}-line {
          from { left: ${lineFrom}; opacity: 1; }
          92%  { opacity: 1; }
          to   { left: ${lineTo}; opacity: 0; }
        }
        @keyframes ${uid}-dim {
          from { transform: scale(1); filter: brightness(1); }
          to   { transform: scale(0.965); filter: brightness(0.5); }
        }
      `}</style>
      {/* Outgoing section */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: incoming !== null ? `${uid}-dim ${durS}s ${EASE.outQuint} both` : undefined,
        }}
      >
        <SectionPage variant={page} accent={accent} />
      </div>
      {/* Incoming section under the animated notch clip */}
      {incoming !== null && (
        <div
          key={`clip-${cycle}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            animation: `${uid}-clip ${durS}s ${EASE.outQuint} both`,
            willChange: 'clip-path',
          }}
        >
          <SectionPage variant={incoming} accent={accent} />
        </div>
      )}
      {/* Glow edge line following the cut */}
      {incoming !== null && (
        <div
          key={`line-${cycle}`}
          style={{
            position: 'absolute',
            top: '-12%',
            height: '124%',
            width: '18%',
            zIndex: 11,
            pointerEvents: 'none',
            transform: 'skewX(-7deg)',
            animation: `${uid}-line ${durS}s ${EASE.outQuint} both`,
            background: `linear-gradient(${direction === 'left' ? '90deg' : '270deg'}, transparent 0%, ${accent}22 62%, ${accent}66 88%, ${accent} 100%)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...(direction === 'left' ? { right: 0 } : { left: 0 }),
              width: 2,
              background: accent,
              boxShadow: `0 0 14px ${accent}, 0 0 34px ${accent}`,
            }}
          />
        </div>
      )}
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
        CUT →
      </button>
    </div>
  );
}

export default ClipPathReveal;
