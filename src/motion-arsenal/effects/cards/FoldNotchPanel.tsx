import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// FoldNotchPanel — Panel mit Notch-Ecke (clip-path) klappt aus der Oberkante
// auf: rotateX mit transform-origin oben, Schatten-Verlauf synchron zum
// Klappwinkel, Signal-LED an der Notch-Kante + Kanten-Glow.
// Mechanik: KRANK-Overshoot-Settle + NOX-Forge forge-cut Ästhetik.
// ---------------------------------------------------------------------------

export interface FoldNotchPanelProps {
  notchSize?: number; // px der abgeschnittenen Ecke
  accent?: string;
  speed?: number;
  autoCycle?: boolean;
}

export function FoldNotchPanel({ notchSize = 22, accent = NOX_COLORS.red, speed = 1, autoCycle = true }: FoldNotchPanelProps) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const dur = 0.85 / Math.max(speed, 0.2);

  useEffect(() => {
    setOpen(true);
    if (!autoCycle || reduced) return;
    const iv = setInterval(() => setOpen((o) => !o), 3800);
    return () => clearInterval(iv);
  }, [autoCycle, reduced]);

  const clip = `polygon(0 0, calc(100% - ${notchSize}px) 0, 100% ${notchSize}px, 100% 100%, 0 100%)`;
  const shown = open || reduced;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(110% 100% at 50% 115%, #140b0c 0%, #0a0a0b 60%)', perspective: 900, fontFamily: 'var(--sans, sans-serif)' }}>
      <style>{`
        @keyframes fnp-led { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fnp-item { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .fnp-a { animation: none !important; transition: none !important; } }
      `}</style>
      <div style={{ position: 'relative', width: 'min(78%, 320px)' }}>
        <div
          className="fnp-a"
          style={{
            position: 'relative',
            clipPath: clip,
            background: 'linear-gradient(165deg, #17171b 0%, #101013 70%)',
            border: '1px solid #2a2a31',
            padding: '18px 20px 20px',
            transformOrigin: '50% 0%',
            transform: shown ? 'rotateX(0deg)' : 'rotateX(-84deg)',
            opacity: shown ? 1 : 0.25,
            transition: `transform ${dur}s ${shown ? EASE.krankOvershoot : EASE.inOutSoft}, opacity ${dur * 0.6}s ease`,
            // Schatten-Verlauf synchron zum Klappwinkel
            boxShadow: shown ? '0 22px 44px rgba(0,0,0,0.55)' : '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Notch-Kante mit Glow-Linie + LED */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: notchSize * 1.42, height: 1.5, background: `linear-gradient(90deg, transparent, ${accent})`, transform: `rotate(45deg) translateY(${notchSize * 0.7}px)`, transformOrigin: '100% 0%' }} />
          <span className="fnp-a" style={{ position: 'absolute', top: notchSize * 0.62, right: notchSize * 0.34, width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 9px ${accent}`, animation: reduced ? undefined : 'fnp-led 1.8s ease-in-out infinite' }} />

          <div className="fnp-a" style={{ animation: shown && !reduced ? `fnp-item 0.4s ${EASE.outExpo} ${dur * 0.55}s both` : undefined, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.26em', color: NOX_COLORS.textDim, marginBottom: 10 }}>
            PANEL // FOLD-07
          </div>
          <div className="fnp-a" style={{ animation: shown && !reduced ? `fnp-item 0.45s ${EASE.outExpo} ${dur * 0.65}s both` : undefined, fontSize: 20, fontWeight: 760, color: NOX_COLORS.text, marginBottom: 7 }}>
            NOTCH PROTOCOL
          </div>
          <div className="fnp-a" style={{ animation: shown && !reduced ? `fnp-item 0.5s ${EASE.outExpo} ${dur * 0.75}s both` : undefined, fontSize: 12.5, color: NOX_COLORS.textDim, lineHeight: 1.55 }}>
            Klappt physisch aus der Oberkante, Schattenwurf folgt dem Winkel, die Signal-LED sichert die geschnittene Ecke.
          </div>
          <div className="fnp-a" style={{ animation: shown && !reduced ? `fnp-item 0.5s ${EASE.outExpo} ${dur * 0.85}s both` : undefined, marginTop: 13, display: 'inline-block', fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.16em', color: accent, border: `1px solid ${accent}66`, padding: '6px 12px' }}>
            ▸ ENGAGE
          </div>
        </div>
        {/* Boden-Schattenfläche unter dem Panel */}
        <div className="fnp-a" style={{ position: 'absolute', left: '6%', right: '6%', bottom: -14, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(10px)', transform: shown ? 'scaleX(1)' : 'scaleX(0.6)', opacity: shown ? 1 : 0.4, transition: `transform ${dur}s ${EASE.outQuint}, opacity ${dur}s ease` }} />
      </div>
    </div>
  );
}

export default FoldNotchPanel;
