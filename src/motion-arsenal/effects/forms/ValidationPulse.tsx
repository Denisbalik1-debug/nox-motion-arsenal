import React, { useRef, useState } from 'react';
import { usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ValidationPulse — Eingabefeld mit lebendiger Validierung: Fehler = Shake
// mit ECHTER gedämpfter Feder-Schwingung (x = A·e^(-λt)·sin(ωt), kein
// CSS-Shake) + roter Ring nach außen; Erfolg = grüner Ring-Sog nach innen +
// Checkmark-Draw; Tipp-Aktivität lässt die Signal-LED atmen.
// ---------------------------------------------------------------------------

export interface ValidationPulseProps {
  accent?: string;
  springDamping?: number; // λ der Feder
  springFreq?: number; // Hz
}

type VState = 'idle' | 'error' | 'ok';

export function ValidationPulse({ accent = NOX_COLORS.red, springDamping = 6, springFreq = 9 }: ValidationPulseProps) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<VState>('idle');
  const [ringId, setRingId] = useState(0);
  const [typing, setTyping] = useState(false);
  const reduced = usePrefersReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);
  const spring = useRef({ t: -1 }); // -1 = inaktiv
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gedämpfte Feder-Schwingung auf translateX
  useRafLoop((dt) => {
    const s = spring.current;
    if (s.t < 0) return;
    s.t += dt;
    const x = 14 * Math.exp(-springDamping * s.t) * Math.sin(springFreq * Math.PI * 2 * s.t);
    if (fieldRef.current) fieldRef.current.style.transform = `translateX(${x.toFixed(2)}px)`;
    if (s.t > 1.2) {
      s.t = -1;
      if (fieldRef.current) fieldRef.current.style.transform = 'none';
    }
  }, !reduced);

  const validate = () => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    setState(ok ? 'ok' : 'error');
    setRingId((r) => r + 1);
    if (!ok && !reduced) spring.current.t = 0;
  };

  const onType = (v: string) => {
    setValue(v);
    setState('idle');
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 600);
  };

  const borderColor = state === 'error' ? accent : state === 'ok' ? '#39ff8b' : '#2a2a31';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#0b0b0d', fontFamily: 'var(--sans, sans-serif)' }}>
      <style>{`
        @keyframes vp-ring-out { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }
        @keyframes vp-ring-in { 0% { transform: scale(1.35); opacity: 0; } 60% { opacity: 0.7; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes vp-led { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes vp-check { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .vp-a { animation: none !important; } }
      `}</style>
      <div style={{ width: 'min(80%, 320px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.24em', color: NOX_COLORS.textDim }}>OPERATOR EMAIL</label>
          <span className="vp-a" style={{ width: 7, height: 7, borderRadius: '50%', background: typing ? '#d4a24a' : state === 'ok' ? '#39ff8b' : '#3a3a40', boxShadow: typing ? '0 0 8px #d4a24a' : undefined, animation: typing && !reduced ? 'vp-led 0.7s ease-in-out infinite' : undefined }} />
        </div>
        <div ref={fieldRef} style={{ position: 'relative', willChange: 'transform' }}>
          {/* Validierungs-Ringe */}
          {state !== 'idle' && !reduced && (
            <div
              key={ringId}
              className="vp-a"
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: 12,
                border: `1.5px solid ${borderColor}`,
                animation: `${state === 'error' ? 'vp-ring-out' : 'vp-ring-in'} 0.7s ${EASE.outExpo} both`,
                pointerEvents: 'none',
              }}
            />
          )}
          <input
            value={value}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validate()}
            placeholder="you@forge.system"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#121215',
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              padding: '13px 42px 13px 14px',
              color: NOX_COLORS.text,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.25s ease',
              boxShadow: state === 'ok' ? '0 0 18px rgba(57,255,139,0.12)' : state === 'error' ? `0 0 18px ${accent}22` : 'none',
            }}
          />
          {/* Check-Draw bei Erfolg */}
          {state === 'ok' && (
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <path className="vp-a" d="M 4 10.5 L 8.5 15 L 16 5.5" fill="none" stroke="#39ff8b" strokeWidth="2.4" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={reduced ? 0 : 1} style={{ animation: reduced ? undefined : `vp-check 0.45s ${EASE.outExpo} 0.1s both` }} />
            </svg>
          )}
        </div>
        <div style={{ minHeight: 18, marginTop: 8, fontSize: 11.5, color: state === 'error' ? accent : state === 'ok' ? '#39ff8b' : 'transparent', transition: 'color 0.2s ease' }}>
          {state === 'error' ? 'Kein gültiges Signal — Format prüfen.' : state === 'ok' ? 'Signal bestätigt.' : '·'}
        </div>
        <button
          onClick={validate}
          style={{ marginTop: 4, fontFamily: 'var(--mono, monospace)', fontSize: 11, letterSpacing: '0.16em', padding: '10px 20px', border: `1px solid ${NOX_COLORS.gold}`, borderRadius: 8, color: NOX_COLORS.text, background: `${NOX_COLORS.gold}1a`, cursor: 'pointer' }}
        >
          ▸ VALIDATE
        </button>
      </div>
    </div>
  );
}

export default ValidationPulse;
