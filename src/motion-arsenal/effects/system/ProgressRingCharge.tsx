import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion, useRafLoop, clamp } from '../../lib/animationUtils';
import { NOX_COLORS, easeOutExpo } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ProgressRingCharge — Ring lädt (conic-gradient) mit abgesetztem Glow-Ring
// dahinter, Prozentzahl zählt mit outExpo hoch, Schwellen-Pulse bei 25/50/75,
// bei 100% Overshoot-Bounce (KRANK cubic-bezier(.3,0,.66,-.3)).
// ---------------------------------------------------------------------------

export interface ProgressRingChargeProps {
  target?: number; // Ziel-Prozent
  duration?: number; // Sekunden bis Ziel
  accent?: string;
  autoReplay?: boolean;
}

export function ProgressRingCharge({ target = 100, duration = 3, accent = NOX_COLORS.gold, autoReplay = true }: ProgressRingChargeProps) {
  const [runId, setRunId] = useState(0);
  const [p, setP] = useState(0);
  const [pulses, setPulses] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const reduced = usePrefersReducedMotion();
  const tRef = useRef(0);
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    tRef.current = 0;
    firedRef.current = new Set();
    setPulses([]);
    setP(reduced ? target : 0);
    setDone(reduced);
  }, [runId, reduced, target]);

  useRafLoop((dt) => {
    if (done) return;
    tRef.current += dt / Math.max(duration, 0.5);
    const eased = easeOutExpo(clamp(tRef.current, 0, 1)) * target;
    setP(eased);
    for (const th of [25, 50, 75]) {
      if (eased >= th && !firedRef.current.has(th)) {
        firedRef.current.add(th);
        setPulses((prev) => [...prev, th]);
      }
    }
    if (tRef.current >= 1) {
      setDone(true);
      if (autoReplay) setTimeout(() => setRunId((r) => r + 1), 2800);
    }
  }, !reduced && !done);

  const deg = (p / 100) * 360;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(100% 100% at 50% 110%, #14100a 0%, #0a0a0b 62%)', fontFamily: 'var(--mono, monospace)' }}>
      <style>{`
        @keyframes prc-thpulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes prc-donepop { 0% { transform: scale(1); } 45% { transform: scale(1.09); } 70% { transform: scale(0.985); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .prc-a { animation: none !important; } }
      `}</style>
      <div
        key={done ? `d-${runId}` : `r-${runId}`}
        className="prc-a"
        style={{ position: 'relative', width: 150, height: 150, animation: done && !reduced ? 'prc-donepop 0.7s cubic-bezier(.3, 0, .66, -.3) both' : undefined }}
      >
        {/* Glow-Ring dahinter (Blur-Kopie) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(${accent} ${deg}deg, transparent ${deg}deg)`, filter: 'blur(16px)', opacity: 0.55 }} />
        {/* Haupt-Ring */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(${accent} ${deg}deg, #1c1c22 ${deg}deg)`, WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))' }} />
        {/* Lauf-Kopf des Rings */}
        {!done && p > 1 && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: `0 0 12px ${accent}, 0 0 4px #fff`, transform: `rotate(${deg - 90}deg) translateX(69px)`, transformOrigin: '0 0', marginLeft: -4, marginTop: -4 }} />
        )}
        {/* Schwellen-Pulse */}
        {pulses.map((th) => (
          <div key={th} className="prc-a" style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1.5px solid ${accent}`, animation: reduced ? undefined : 'prc-thpulse 0.9s ease-out both' }} />
        ))}
        {/* Zentrum */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: NOX_COLORS.text, letterSpacing: '-0.02em' }}>
              {Math.round(p)}<span style={{ fontSize: 15, color: accent }}>%</span>
            </div>
            <div style={{ fontSize: 8.5, letterSpacing: '0.3em', color: done ? accent : '#5a5852', marginTop: 3 }}>
              {done ? 'CHARGED' : 'CHARGING'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressRingCharge;
