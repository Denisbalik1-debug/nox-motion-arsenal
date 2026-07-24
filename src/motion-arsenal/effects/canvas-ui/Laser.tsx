import { useRef } from 'react';
import { damp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// Laser — canvas-ui "Laser" mechanic (canvasui.dev/components/laser): a beam
// sits near the bottom of the viewport and reveals the live HTML emerging
// from behind it as the page scrolls. Here the beam is pinned at a fixed
// fraction of the preview's own scroll viewport; a locked/desaturated
// duplicate layer sits in the same grid cell as the real content (both
// scroll together, zero-JS sync) and gets a per-frame CSS mask computed from
// scrollTop + beam position — everything above the beam (already scrolled
// past) unmasks to reveal the real content beneath, everything below stays
// behind the laser's scan-line look.
// ---------------------------------------------------------------------------

export interface LaserProps {
  beamPosition?: number; // 0.5..0.95 — beam distance from top of viewport
  softness?: number; // 4..80 — reveal transition width in px
}

const SECTIONS = [
  { kicker: 'SECTOR 01', title: 'DORMANT', body: 'Unter dem Strahl liegt das System im Ruhezustand — entsättigt, gerastert, unlesbar.' },
  { kicker: 'SECTOR 02', title: 'SCAN', body: 'Der Laser läuft nicht über den Inhalt — der Inhalt läuft durch den Laser. Jede Zeile wird einzeln freigegeben.' },
  { kicker: 'SECTOR 03', title: 'ONLINE', body: 'Einmal durchlaufen, bleibt der Abschnitt lesbar, solange der Strahl weiter oben steht.' },
  { kicker: 'SECTOR 04', title: 'SIGNAL', body: 'Scroll zurück, und der Strahl scannt erneut — der Zustand folgt live der Position, nicht der Historie.' },
];

export function Laser({ beamPosition = 0.78, softness = 26 }: LaserProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const smoothBeamY = useRef(0);
  const reduced = usePrefersReducedMotion();

  useRafLoop(
    (dt) => {
      const scroller = scrollerRef.current;
      const overlay = overlayRef.current;
      const beam = beamRef.current;
      if (!scroller || !overlay) return;
      const clientH = scroller.clientHeight;
      const targetBeamY = scroller.scrollTop + clientH * beamPosition;
      smoothBeamY.current = reduced ? targetBeamY : damp(smoothBeamY.current || targetBeamY, targetBeamY, 9, dt);
      const y = smoothBeamY.current;
      const soft = Math.max(2, softness);
      const mask = `linear-gradient(to bottom, transparent 0px, transparent ${(y - soft).toFixed(0)}px, black ${y.toFixed(0)}px, black 100%)`;
      overlay.style.maskImage = mask;
      overlay.style.webkitMaskImage = mask;
      if (beam) {
        beam.style.top = `${clientH * beamPosition}px`;
      }
    },
    true,
  );

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: '#08080a' }}
    >
      <style>{`
        .lsr-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .lsr-scroll::-webkit-scrollbar { width: 6px; }
        .lsr-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
        @keyframes lsr-sweep { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
      `}</style>

      <div ref={scrollerRef} className="lsr-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'grid' }}>
          {/* Real, revealed content — bright, one grid cell. */}
          <div style={{ gridRow: 1, gridColumn: 1 }}>
            {SECTIONS.map((s) => (
              <div key={s.kicker} style={{ height: '85cqh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', maxWidth: '80%' }}>
                  <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.34em', color: NOX_COLORS.gold, marginBottom: 6 }}>{s.kicker}</div>
                  <div style={{ fontSize: 'clamp(24px, 8cqw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', color: NOX_COLORS.text, lineHeight: 0.95 }}>{s.title}</div>
                  <div style={{ fontSize: 'clamp(10px, 2.2cqw, 13px)', lineHeight: 1.6, color: NOX_COLORS.textDim, marginTop: 10 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Locked/dormant duplicate — same grid cell, masked away above the beam. */}
          <div
            ref={overlayRef}
            style={{
              gridRow: 1,
              gridColumn: 1,
              pointerEvents: 'none',
              background: '#08080a',
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(240,236,228,0.05) 0px, rgba(240,236,228,0.05) 1px, transparent 1px, transparent 3px)',
            }}
          >
            {SECTIONS.map((s) => (
              <div key={s.kicker} style={{ height: '85cqh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
                <div style={{ textAlign: 'center', maxWidth: '80%', filter: 'grayscale(1) contrast(1.4) brightness(0.55)' }}>
                  <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.34em', color: '#666', marginBottom: 6 }}>{s.kicker}</div>
                  <div style={{ fontSize: 'clamp(24px, 8cqw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#888', lineHeight: 0.95 }}>{s.title}</div>
                  <div style={{ fontSize: 'clamp(10px, 2.2cqw, 13px)', lineHeight: 1.6, color: '#555', marginTop: 10 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Beam — pinned near the bottom of the viewport, not the content. */}
      <div
        ref={beamRef}
        style={{ position: 'absolute', left: 0, right: 0, height: 0, pointerEvents: 'none', zIndex: 3 }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -1,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${NOX_COLORS.redBright}, ${NOX_COLORS.gold}, ${NOX_COLORS.redBright}, transparent)`,
            boxShadow: `0 0 14px 2px ${NOX_COLORS.red}, 0 0 40px 8px rgba(201,48,48,0.35)`,
            animation: reduced ? undefined : `lsr-sweep 1.8s ${EASE.inOutSoft} infinite`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -18,
            height: 18,
            background: 'linear-gradient(to bottom, transparent, rgba(201,48,48,0.16))',
          }}
        />
      </div>

      <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.textDim, pointerEvents: 'none', zIndex: 4 }}>
        LASER SCAN // SCROLL TO REVEAL
      </div>
    </div>
  );
}

export default Laser;
