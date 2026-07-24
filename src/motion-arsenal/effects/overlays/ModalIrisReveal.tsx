import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ModalIrisReveal — Modal öffnet als Iris vom Klickpunkt aus:
// clip-path circle() wächst vom Trigger-Punkt, Backdrop blurt choreografiert
// ein, Border-Trace umläuft das Panel nach dem Andocken, Content staggert.
// Mechanik: Shopify View-Transition-Morph-Ästhetik + Border-Trace.
// ---------------------------------------------------------------------------

export interface ModalIrisRevealProps {
  speed?: number;
  accent?: string;
  blurBackdrop?: number;
}

export function ModalIrisReveal({ speed = 1, accent = NOX_COLORS.red, blurBackdrop = 8 }: ModalIrisRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const reduced = usePrefersReducedMotion();
  const dur = 0.55 / Math.max(speed, 0.2);

  const openFrom = useCallback((e: React.MouseEvent) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (r) setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0c0c0e', fontFamily: 'var(--sans, sans-serif)' }}>
      <style>{`
        @keyframes mir-trace { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes mir-item { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .mir-a { animation: none !important; transition: none !important; } }
      `}</style>
      {/* Basis-„Seite" */}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transition: reduced ? undefined : `filter ${dur}s ${EASE.outQuint}`, filter: open ? `blur(${blurBackdrop}px) brightness(0.6)` : 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginBottom: 12 }}>SYSTEM READY</div>
          <button
            onClick={openFrom}
            style={{ fontFamily: 'var(--mono, monospace)', fontSize: 12, letterSpacing: '0.16em', padding: '13px 26px', border: `1px solid ${accent}`, borderRadius: 8, color: NOX_COLORS.text, background: `${accent}22`, cursor: 'pointer' }}
          >
            ⊕ OPEN PROTOCOL
          </button>
        </div>
      </div>

      {/* Iris-Layer */}
      <div
        className="mir-a"
        onClick={() => setOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 8, 10, 0.72)',
          clipPath: open ? `circle(140% at ${origin.x}% ${origin.y}%)` : `circle(0% at ${origin.x}% ${origin.y}%)`,
          transition: reduced ? undefined : `clip-path ${dur}s ${EASE.outQuint}`,
          pointerEvents: open ? 'auto' : 'none',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 'min(78%, 380px)',
            background: '#141418',
            border: '1px solid #2a2a31',
            borderRadius: 14,
            padding: '22px 22px 18px',
            transform: open ? 'scale(1)' : 'scale(0.92)',
            transition: reduced ? undefined : `transform ${dur}s ${EASE.outBack}`,
          }}
        >
          {/* Border-Trace nach dem Andocken */}
          {open && !reduced && (
            <svg style={{ position: 'absolute', inset: -1, width: 'calc(100% + 2px)', height: 'calc(100% + 2px)', pointerEvents: 'none' }}>
              <rect
                className="mir-a"
                x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="14"
                fill="none" stroke={accent} strokeWidth="1.5" pathLength={1}
                strokeDasharray={1}
                style={{ animation: `mir-trace ${dur * 1.6}s ${EASE.outExpo} ${dur * 0.5}s both` }}
              />
            </svg>
          )}
          {['NOX PROTOCOL // 7', 'Iris-Reveal aktiv. Das Modal öffnet vom Klickpunkt, nicht aus dem Nichts.', 'ESC oder Backdrop schließt.'].map((line, i) => (
            <div
              key={i}
              className="mir-a"
              style={{
                animation: open && !reduced ? `mir-item 0.4s ${EASE.outExpo} ${dur * 0.5 + i * 0.09}s both` : undefined,
                fontFamily: i === 0 ? 'var(--mono, monospace)' : undefined,
                fontSize: i === 0 ? 10 : 13.5,
                letterSpacing: i === 0 ? '0.25em' : undefined,
                color: i === 0 ? accent : i === 2 ? NOX_COLORS.textDim : NOX_COLORS.text,
                marginBottom: i === 0 ? 10 : 6,
              }}
            >
              {line}
            </div>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{ marginTop: 10, fontFamily: 'var(--mono, monospace)', fontSize: 10.5, letterSpacing: '0.14em', padding: '8px 16px', border: '1px solid #34343c', borderRadius: 7, color: NOX_COLORS.textDim, background: 'none', cursor: 'pointer' }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalIrisReveal;
