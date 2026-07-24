import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion, useRafLoop, clamp } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScanCompletePulse — segmentierte Scan-Bar mit nicht-linearem Timing
// (sprintet, stockt, sprintet — wie echte Scans), Segment-LEDs zünden,
// bei 100%: radialer Puls + Checkmark-Draw (stroke-dash) + Grid-Aufleuchten.
// ---------------------------------------------------------------------------

export interface ScanCompletePulseProps {
  segments?: number;
  speed?: number;
  accent?: string;
  autoReplay?: boolean;
}

// Nicht-lineares Scan-Profil: schnell → Stau bei ~42% und ~78% → Sprint.
function scanCurve(t: number): number {
  const stall = (x: number, at: number, w: number) => Math.exp(-Math.pow((x - at) / w, 2)) * 0.85;
  let v = t;
  v -= stall(t, 0.42, 0.07) * 0.06;
  v -= stall(t, 0.78, 0.05) * 0.05;
  return clamp(v, 0, 1);
}

export function ScanCompletePulse({ segments = 14, speed = 1, accent = NOX_COLORS.red, autoReplay = true }: ScanCompletePulseProps) {
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const reduced = usePrefersReducedMotion();
  const tRef = useRef(0);

  useEffect(() => {
    tRef.current = 0;
    setProgress(reduced ? 1 : 0);
    setDone(reduced);
  }, [runId, reduced]);

  useRafLoop((dt) => {
    if (done) return;
    tRef.current += dt * 0.22 * speed;
    const p = scanCurve(Math.min(tRef.current, 1));
    setProgress(p);
    if (tRef.current >= 1) {
      setDone(true);
      if (autoReplay) setTimeout(() => setRunId((r) => r + 1), 3000);
    }
  }, !reduced && !done);

  const n = Math.max(6, Math.min(24, Math.round(segments)));
  const litCount = Math.floor(progress * n);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#0a0a0b', fontFamily: 'var(--mono, monospace)' }}>
      <style>{`
        @keyframes scp-pulse { 0% { transform: scale(0.4); opacity: 0.85; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes scp-check { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes scp-gridflash { 0% { opacity: 0.3; } 18% { opacity: 0.85; } 100% { opacity: 0.12; } }
        @media (prefers-reduced-motion: reduce) { .scp-a { animation: none !important; } }
      `}</style>
      {/* Grid-Unterlage */}
      <div
        key={done ? `flash-${runId}` : `grid-${runId}`}
        className="scp-a"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${accent}14 1px, transparent 1px), linear-gradient(90deg, ${accent}14 1px, transparent 1px)`,
          backgroundSize: '26px 26px',
          opacity: 0.12,
          animation: done && !reduced ? 'scp-gridflash 1.6s ease-out both' : undefined,
        }}
      />
      <div style={{ width: 'min(80%, 340px)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.22em', color: NOX_COLORS.textDim, marginBottom: 10 }}>
          <span>{done ? 'SCAN COMPLETE' : 'SCANNING…'}</span>
          <span style={{ color: done ? accent : NOX_COLORS.text }}>{Math.round(progress * 100)}%</span>
        </div>
        {/* Segment-Bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: n }).map((_, i) => {
            const lit = i < litCount || done;
            const isEdge = i === litCount && !done;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 16,
                  borderRadius: 2,
                  background: lit ? accent : '#1c1c22',
                  boxShadow: lit ? `0 0 8px ${accent}88` : undefined,
                  opacity: isEdge ? 0.5 + 0.5 * Math.sin(performance.now() / 90) : 1,
                  transition: 'background 0.15s ease',
                }}
              />
            );
          })}
        </div>
        {/* Statuszeile */}
        <div style={{ marginTop: 10, fontSize: 10, letterSpacing: '0.14em', color: '#5a5852', minHeight: 14 }}>
          {progress < 0.42 ? '▸ reading signal…' : progress < 0.78 ? '▸ resolving patterns…' : !done ? '▸ compiling rank…' : `▸ result sealed`}
        </div>
        {/* Complete: Puls + Check */}
        {done && (
          <div style={{ position: 'absolute', left: '50%', top: -66, transform: 'translateX(-50%)' }}>
            {!reduced && (
              <div key={`p-${runId}`} className="scp-a" style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${accent}`, animation: 'scp-pulse 1s ease-out both' }} />
            )}
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="none" stroke={`${accent}55`} strokeWidth="1.5" />
              <path
                key={`c-${runId}`}
                className="scp-a"
                d="M 13 22 L 19.5 28.5 L 31 15.5"
                fill="none"
                stroke={accent}
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={reduced ? 0 : 1}
                style={{ animation: reduced ? undefined : `scp-check 0.5s ${EASE.outExpo} 0.15s both` }}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanCompletePulse;
