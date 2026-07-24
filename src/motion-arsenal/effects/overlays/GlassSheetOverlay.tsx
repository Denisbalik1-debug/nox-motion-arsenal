import React, { useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GlassSheetOverlay — Bottom-Sheet aus geschichtetem Glas: backdrop-blur +
// Refraktions-Kante (Gradient-Highlight oben) + Noise, federnder Einlauf mit
// outBack, atmender Drag-Indikator. Mechanik: Shopify Glass-Nav
// (rgba + backdrop-filter + blend) + KRANK-Overshoot-Settle.
// ---------------------------------------------------------------------------

export interface GlassSheetOverlayProps {
  side?: 'bottom' | 'right';
  blur?: number;
  accent?: string;
  speed?: number;
}

export function GlassSheetOverlay({ side = 'bottom', blur = 14, accent = NOX_COLORS.gold, speed = 1 }: GlassSheetOverlayProps) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const dur = 0.6 / Math.max(speed, 0.2);
  const isBottom = side === 'bottom';

  const closedTransform = isBottom ? 'translateY(105%)' : 'translateX(105%)';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 100% at 50% 0%, #131317 0%, #0a0a0b 60%)', fontFamily: 'var(--sans, sans-serif)' }}>
      <style>{`
        @keyframes gso-handle { 0%,100% { opacity: 0.4; width: 38px; } 50% { opacity: 0.9; width: 48px; } }
        @keyframes gso-item { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .gso-a { animation: none !important; transition: none !important; } }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transition: reduced ? undefined : `filter ${dur}s ease, transform ${dur}s ${EASE.outQuint}`, filter: open ? 'brightness(0.55)' : 'none', transform: open && isBottom ? 'scale(0.985)' : 'none' }}>
        <button
          onClick={() => setOpen(true)}
          style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, letterSpacing: '0.16em', padding: '13px 26px', border: `1px solid ${accent}`, borderRadius: 8, color: NOX_COLORS.text, background: `${accent}1e`, cursor: 'pointer' }}
        >
          ▲ OPEN GLASS SHEET
        </button>
      </div>

      {/* Backdrop */}
      <div
        className="gso-a"
        onClick={() => setOpen(false)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,6,0.35)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: reduced ? undefined : `opacity ${dur * 0.7}s ease` }}
      />

      {/* Sheet */}
      <div
        className="gso-a"
        style={{
          position: 'absolute',
          ...(isBottom
            ? { left: '4%', right: '4%', bottom: 0, height: '62%', borderRadius: '18px 18px 0 0' }
            : { top: '6%', bottom: '6%', right: 0, width: 'min(70%, 340px)', borderRadius: '16px 0 0 16px' }),
          background: 'linear-gradient(180deg, rgba(30, 30, 36, 0.55) 0%, rgba(18, 18, 22, 0.75) 100%)',
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          border: '1px solid rgba(255,255,255,0.09)',
          borderBottom: 'none',
          boxShadow: `0 -18px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)`,
          transform: open ? 'none' : closedTransform,
          transition: reduced ? undefined : `transform ${dur}s ${open ? EASE.outBack : EASE.inOutSoft}`,
          padding: '14px 22px 20px',
          overflow: 'hidden',
        }}
      >
        {/* Refraktions-Kante oben */}
        <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1.5, background: `linear-gradient(90deg, transparent, ${accent}aa 30%, rgba(255,255,255,0.7) 50%, ${accent}aa 70%, transparent)` }} />
        {/* Drag-Handle atmet */}
        {isBottom && (
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 12 }}>
            <div className="gso-a" style={{ height: 4, width: 42, borderRadius: 4, background: 'rgba(255,255,255,0.35)', animation: reduced ? undefined : 'gso-handle 2.6s ease-in-out infinite' }} />
          </div>
        )}
        {[
          { k: 'SHEET // GLASS', t: '' },
          { k: '', t: 'Geschichtetes Glas: Blur, Innen-Gradient, Licht-Refraktionskante und Noise — kein flaches rgba-Panel.' },
          { k: '', t: 'Einlauf federt mit outBack, der Backdrop dimmt choreografiert.' },
        ].map((row, i) => (
          <div key={i} className="gso-a" style={{ animation: open && !reduced ? `gso-item 0.45s ${EASE.outExpo} ${0.18 + i * 0.09}s both` : undefined, marginBottom: 8 }}>
            {row.k ? (
              <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.25em', color: accent }}>{row.k}</span>
            ) : (
              <span style={{ fontSize: 13.5, color: NOX_COLORS.text, opacity: 0.9 }}>{row.t}</span>
            )}
          </div>
        ))}
        <button
          onClick={() => setOpen(false)}
          style={{ marginTop: 8, fontFamily: 'var(--mono, monospace)', fontSize: 10.5, letterSpacing: '0.14em', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7, color: NOX_COLORS.textDim, background: 'none', cursor: 'pointer' }}
        >
          ✕ DISMISS
        </button>
        {/* Noise im Glas */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }} aria-hidden>
          <filter id="gso-noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" /></filter>
          <rect width="100%" height="100%" filter="url(#gso-noise)" />
        </svg>
      </div>
    </div>
  );
}

export default GlassSheetOverlay;
