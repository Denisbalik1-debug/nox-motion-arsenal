import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// PanelShiftTransition — Split-Flap-Gefühl: die alte Seite bricht in 3–4
// Streifen, die versetzt in alternierende Richtungen rausschieben, während
// die Streifen der neuen Seite gegenläufig reinschieben und mit
// KRANK-Overshoot-Easing (cubic-bezier(.3,0,.66,-.3)) einrasten.
// ---------------------------------------------------------------------------

export interface PanelShiftTransitionProps {
  axis?: 'horizontal' | 'vertical'; // horizontal = Bänder schieben auf X
  strips?: number; // 3 .. 4
  speed?: number;
  accent?: string;
}

function FlapPage({ variant, accent }: { variant: 0 | 1; accent: string }) {
  const isA = variant === 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: isA
          ? 'linear-gradient(150deg, #150a0c 0%, #0a0a0b 55%, #0d0d11 100%)'
          : 'linear-gradient(330deg, #0a1011 0%, #0a0a0b 55%, #110d0c 100%)',
        color: NOX_COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '4%',
      }}
    >
      <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
        {isA ? 'DEPARTURE // FORGE' : 'ARRIVAL // RANK'}
      </div>
      <div style={{ fontSize: 'clamp(26px, 7vw, 62px)', fontWeight: 820, letterSpacing: '0.02em', lineHeight: 1, marginTop: 8 }}>
        {isA ? 'NOX·SYSTEM' : 'NOX·SIGNAL'}
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 6,
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: '0.1em',
        }}
      >
        {(isA ? ['SCAN', '—', 'GATE', '07'] : ['LOCK', '—', 'GATE', '12']).map((t, i) => (
          <span
            key={i}
            style={{
              padding: '4px 8px',
              background: 'rgba(240,236,228,0.06)',
              border: '1px solid rgba(240,236,228,0.1)',
              borderRadius: 3,
              color: i === 3 ? accent : NOX_COLORS.textDim,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PanelShiftTransition({
  axis = 'horizontal',
  strips = 4,
  speed = 1,
  accent = NOX_COLORS.red,
}: PanelShiftTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const uid = `pst${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [page, setPage] = useState<0 | 1>(reduced ? 1 : 0);
  const [shifting, setShifting] = useState(false);
  const [cycle, setCycle] = useState(0);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);

  const spd = Math.max(0.3, Math.min(3, speed));
  const n = Math.max(3, Math.min(4, Math.round(strips)));
  const dur = 0.78 / spd;
  const step = 0.07 / spd;
  const inDelay = 0.12 / spd;
  const horizontal = axis !== 'vertical';

  const trigger = useCallback(() => {
    if (busy.current) return;
    if (reduced) {
      setPage((p) => (p === 0 ? 1 : 0));
      return;
    }
    busy.current = true;
    setCycle((c) => c + 1);
    setShifting(true);
    const total = ((n - 1) * step + inDelay + dur) * 1000 + 80;
    timers.current.push(
      window.setTimeout(() => {
        setPage((p) => (p === 0 ? 1 : 0));
        setShifting(false);
        busy.current = false;
      }, total),
    );
  }, [reduced, n, step, inDelay, dur]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(trigger, 3500);
    return () => window.clearInterval(id);
  }, [reduced, trigger]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Strip geometry: each strip clips one slice of a full-size page copy.
  const stripBox = (i: number): CSSProperties =>
    horizontal
      ? { position: 'absolute', left: 0, right: 0, top: `${(i * 100) / n}%`, height: `${100 / n}%`, overflow: 'hidden' }
      : { position: 'absolute', top: 0, bottom: 0, left: `${(i * 100) / n}%`, width: `${100 / n}%`, overflow: 'hidden' };
  const stripInner = (i: number): CSSProperties =>
    horizontal
      ? { position: 'absolute', left: 0, width: '100%', height: `${n * 100}%`, top: `${-i * 100}%` }
      : { position: 'absolute', top: 0, height: '100%', width: `${n * 100}%`, left: `${-i * 100}%` };

  const renderStrips = (variant: 0 | 1, kind: 'out' | 'in') =>
    Array.from({ length: n }, (_, i) => {
      const parity = i % 2 === 0 ? 'a' : 'b';
      const delay = kind === 'out' ? i * step : i * step + inDelay;
      const ease = kind === 'out' ? EASE.sharpIn : EASE.krankOvershoot;
      return (
        <div key={`${kind}-${i}`} style={stripBox(i)}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: `${uid}-${kind}-${parity} ${dur}s ${ease} ${delay}s both`,
              willChange: 'transform',
            }}
          >
            <div style={stripInner(i)}>
              <FlapPage variant={variant} accent={accent} />
            </div>
            {/* Seam highlight so the split reads as physical flaps */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: `inset 0 0 0 0.5px rgba(240,236,228,0.07)`,
                background:
                  kind === 'in'
                    ? `linear-gradient(${horizontal ? '180deg' : '90deg'}, rgba(0,0,0,0.22), transparent 30%, transparent 70%, rgba(0,0,0,0.22))`
                    : undefined,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      );
    });

  const ax = horizontal ? 'translate3d(112%, 0, 0)' : 'translate3d(0, 112%, 0)';
  const axNeg = horizontal ? 'translate3d(-112%, 0, 0)' : 'translate3d(0, -112%, 0)';
  const zero = 'translate3d(0, 0, 0)';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050506' }}>
      <style>{`
        @keyframes ${uid}-out-a { from { transform: ${zero}; } to { transform: ${ax}; } }
        @keyframes ${uid}-out-b { from { transform: ${zero}; } to { transform: ${axNeg}; } }
        @keyframes ${uid}-in-a  { from { transform: ${axNeg}; } to { transform: ${zero}; } }
        @keyframes ${uid}-in-b  { from { transform: ${ax}; } to { transform: ${zero}; } }
      `}</style>
      {!shifting && <FlapPage variant={page} accent={accent} />}
      {shifting && (
        <div key={cycle} style={{ position: 'absolute', inset: 0 }}>
          {/* Incoming strips beneath... */}
          {renderStrips(page === 0 ? 1 : 0, 'in')}
          {/* ...outgoing strips above, sliding away */}
          {renderStrips(page, 'out')}
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
        SHIFT →
      </button>
    </div>
  );
}

export default PanelShiftTransition;

// keep ReactNode import referenced for potential slot API without lint noise
export type PanelShiftSlot = ReactNode;
