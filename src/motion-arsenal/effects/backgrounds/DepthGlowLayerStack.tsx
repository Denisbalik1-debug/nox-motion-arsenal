import React, { useMemo, useRef } from 'react';
import { seededRandom, usePointer, usePrefersReducedMotion, useRafLoop, damp } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// DepthGlowLayerStack — NOX Adapted. KEIN einzelner Glow-Kreis: ein Stapel
// aus 5-7 unabhängig driftenden Glow-Volumina auf Tiefenebenen (Größe, Blur,
// Hue und Drift-Periode pro Ebene verschieden), mit Grain-Overlay gegen
// Banding und Pointer-Parallax. Mechanik nach KRANK-Layering (eine
// Physik-Quelle) + Gobo-Light-Idee (weiche projizierte Lichtflecken).
// ---------------------------------------------------------------------------

export interface DepthGlowStackProps {
  layerCount?: number;
  hueMix?: number; // 0 = nur rot, 1 = voll gemischt (gold/orange dabei)
  driftSpeed?: number;
  parallax?: number;
  intensity?: number;
}

export function DepthGlowLayerStack({ layerCount = 6, hueMix = 0.7, driftSpeed = 1, parallax = 0.5, intensity = 0.85 }: DepthGlowStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();

  const layers = useMemo(() => {
    const rnd = seededRandom(19);
    const hues = ['201, 48, 48', '212, 162, 74', '255, 120, 60', '150, 30, 40', '255, 200, 120'];
    return Array.from({ length: Math.max(3, Math.min(9, Math.round(layerCount))) }, (_, i) => ({
      hue: hues[Math.floor(rnd() * (1 + hueMix * (hues.length - 1)))],
      x: 10 + rnd() * 80,
      y: 12 + rnd() * 76,
      size: 24 + rnd() * 42, // % of container
      depth: 0.2 + (i / layerCount) * 0.8,
      durX: (26 + rnd() * 30) / Math.max(driftSpeed, 0.05),
      durY: (32 + rnd() * 36) / Math.max(driftSpeed, 0.05),
      delay: -rnd() * 40,
      alpha: (0.14 + rnd() * 0.2) * intensity,
    }));
  }, [layerCount, hueMix, driftSpeed, intensity]);

  const par = useRef({ x: 0, y: 0 });
  useRafLoop((dt) => {
    const p = pointer.current;
    par.current.x = damp(par.current.x, (p.tx - 0.5) * 2, 7, dt);
    par.current.y = damp(par.current.y, (p.ty - 0.5) * 2, 7, dt);
    rootRef.current?.querySelectorAll<HTMLElement>('[data-dgs-depth]').forEach((el) => {
      const d = Number(el.dataset.dgsDepth) * parallax * 34;
      el.style.transform = `translate3d(${(-par.current.x * d).toFixed(2)}px, ${(-par.current.y * d).toFixed(2)}px, 0)`;
    });
  }, !reduced && parallax > 0);

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#08080a' }}>
      <style>{`
        @keyframes dgs-driftx { 0%,100% { margin-left: -3%; } 50% { margin-left: 3%; } }
        @keyframes dgs-drifty { 0%,100% { margin-top: -2.5%; } 50% { margin-top: 2.5%; } }
        @keyframes dgs-breathe { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(1.12); } }
        @media (prefers-reduced-motion: reduce) { .dgs-a { animation: none !important; } }
      `}</style>
      {layers.map((l, i) => (
        <div key={i} data-dgs-depth={l.depth} style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, width: 0, height: 0, willChange: 'transform' }}>
          <div
            className="dgs-a"
            style={{ animation: reduced ? undefined : `dgs-driftx ${l.durX}s ease-in-out ${l.delay}s infinite` }}
          >
            <div className="dgs-a" style={{ animation: reduced ? undefined : `dgs-drifty ${l.durY}s ease-in-out ${l.delay * 0.7}s infinite` }}>
              <div
                className="dgs-a"
                style={{
                  width: `${l.size}vmin`,
                  height: `${l.size * (0.7 + l.depth * 0.4)}vmin`,
                  marginLeft: `-${l.size / 2}vmin`,
                  marginTop: `-${l.size / 2}vmin`,
                  borderRadius: '50%',
                  background: `radial-gradient(50% 50% at 50% 50%, rgba(${l.hue}, ${l.alpha}) 0%, rgba(${l.hue}, ${l.alpha * 0.4}) 45%, transparent 72%)`,
                  filter: `blur(${6 + l.depth * 26}px)`,
                  mixBlendMode: 'screen',
                  animation: reduced ? undefined : `dgs-breathe ${l.durY * 0.6}s ease-in-out ${l.delay}s infinite`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
      {/* Grain gegen Banding (KRANK: blue noise) — SVG-Turbulence-Overlay */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, mixBlendMode: 'overlay' }} aria-hidden>
        <filter id="dgs-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /></filter>
        <rect width="100%" height="100%" filter="url(#dgs-grain)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>DEPTH VOLUME</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>GLOW LAYER STACK</div>
        </div>
      </div>
    </div>
  );
}

export default DepthGlowLayerStack;
