import React, { useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LockUnlockScan — NOX-Forge-Gating-Karte: Locked = gedimmt, Scanline läuft,
// Rausch-Overlay. Klick → Unlock-Sequenz: Scan-Blitz, Border-Trace
// komplettiert, Content staggert auf, LED rot→gold.
// Mechanik: KRANK Filter-Chain (--pulse) + stroke-dash Border-Trace.
// ---------------------------------------------------------------------------

export interface LockUnlockScanProps {
  accent?: string;
  scanSpeed?: number;
  autoRelock?: boolean; // Demo: nach 4s wieder locken
}

export function LockUnlockScan({ accent = NOX_COLORS.gold, scanSpeed = 1, autoRelock = true }: LockUnlockScanProps) {
  const [unlocked, setUnlocked] = useState(false);
  const reduced = usePrefersReducedMotion();

  const unlock = () => {
    setUnlocked(true);
    if (autoRelock) setTimeout(() => setUnlocked(false), 4500);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(100% 100% at 50% 120%, #14100a 0%, #0a0a0b 60%)', fontFamily: 'var(--sans, sans-serif)' }}>
      <style>{`
        @keyframes lus-scanline { 0% { top: -8%; } 100% { top: 108%; } }
        @keyframes lus-flash { 0% { opacity: 0; } 12% { opacity: 0.9; } 100% { opacity: 0; } }
        @keyframes lus-trace { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes lus-item { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
        @keyframes lus-led { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @media (prefers-reduced-motion: reduce) { .lus-a { animation: none !important; transition: none !important; } }
      `}</style>
      <div
        onClick={() => !unlocked && unlock()}
        style={{
          position: 'relative',
          width: 'min(78%, 320px)',
          borderRadius: 14,
          border: '1px solid #26262d',
          background: '#121215',
          padding: '18px 20px 20px',
          cursor: unlocked ? 'default' : 'pointer',
          overflow: 'hidden',
          filter: unlocked || reduced ? 'none' : 'saturate(0.4) brightness(0.75)',
          transition: `filter 0.6s ${EASE.outQuint}`,
        }}
      >
        {/* Locked: Scanline + Noise */}
        {!unlocked && !reduced && (
          <>
            <div className="lus-a" style={{ position: 'absolute', left: 0, right: 0, height: 34, background: `linear-gradient(180deg, transparent, ${accent}26, transparent)`, animation: `lus-scanline ${2.4 / Math.max(scanSpeed, 0.2)}s linear infinite` }} />
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} aria-hidden>
              <filter id="lus-noise"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" /></filter>
              <rect width="100%" height="100%" filter="url(#lus-noise)" />
            </svg>
          </>
        )}
        {/* Unlock-Blitz */}
        {unlocked && !reduced && (
          <div className="lus-a" style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${accent}55, transparent 60%)`, animation: 'lus-flash 0.8s ease-out both', pointerEvents: 'none' }} />
        )}
        {/* Border-Trace beim Unlock */}
        {unlocked && !reduced && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <rect className="lus-a" x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="13" fill="none" stroke={accent} strokeWidth="1.5" pathLength={1} strokeDasharray={1} style={{ animation: `lus-trace 0.9s ${EASE.outExpo} both` }} />
          </svg>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.25em', color: NOX_COLORS.textDim }}>MODULE // BLACK FORGE</span>
          <span
            className="lus-a"
            style={{ width: 8, height: 8, borderRadius: '50%', background: unlocked ? accent : NOX_COLORS.red, boxShadow: `0 0 8px ${unlocked ? accent : NOX_COLORS.red}`, animation: reduced ? undefined : 'lus-led 1.6s ease-in-out infinite' }}
          />
        </div>

        {unlocked || reduced ? (
          <div key="open">
            {['30-TAGE-PROTOKOLL', 'Zugriff gewährt. Das Modul ist entsiegelt.', '▸ Protokoll starten'].map((t, i) => (
              <div key={i} className="lus-a" style={{ animation: reduced ? undefined : `lus-item 0.45s ${EASE.outExpo} ${0.35 + i * 0.12}s both`, fontSize: i === 0 ? 19 : 12.5, fontWeight: i === 0 ? 750 : 400, color: i === 0 ? NOX_COLORS.text : i === 2 ? accent : NOX_COLORS.textDim, marginBottom: 7, fontFamily: i === 2 ? 'var(--mono, monospace)' : undefined, letterSpacing: i === 2 ? '0.12em' : undefined }}>
                {t}
              </div>
            ))}
          </div>
        ) : (
          <div key="locked">
            <div style={{ fontSize: 19, fontWeight: 750, color: NOX_COLORS.text, marginBottom: 7, letterSpacing: '0.04em' }}>▮▮▮▮▮ ▮▮▮▮▮▮▮▮</div>
            <div style={{ fontSize: 12.5, color: NOX_COLORS.textDim }}>Gesperrt. Klick zum Entsiegeln.</div>
            <div style={{ marginTop: 12, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.2em', color: NOX_COLORS.red }}>⬢ LOCKED</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LockUnlockScan;
