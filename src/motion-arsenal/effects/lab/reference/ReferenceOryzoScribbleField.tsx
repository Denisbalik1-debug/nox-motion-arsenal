import React, { useMemo, useRef } from 'react';
import { scribblePath, loopScribblePath } from '../../../lib/svgUtils';
import { seededRandom, usePointer, usePrefersReducedMotion, useRafLoop, damp } from '../../../lib/animationUtils';

// ---------------------------------------------------------------------------
// !!! REFERENCE STUDY — DO NOT SHIP DIRECTLY !!!
// Möglichst nahe technische Reproduktion der ORYZO-Referenz:
// rot/grün/orange leuchtende, abstrakte Scribbles/Symbole im Hintergrund,
// weiche Blur-/Blend-Staffelung, organische Rotation/Drift, Tiefe hinter
// Typografie. Farben orientieren sich an der Referenz — für Produktion
// IMMER NoxAdaptedScribbleField verwenden.
// Mechanik: absolute SVG-Layer + mix-blend-screen + blur-Glow-Kopien +
// stroke-dash Draw + Pointer-Parallax (Layering-Prinzip aus dem
// KRANK/Lusion-Capture: eine Physik-Quelle treibt alle Layer).
// ---------------------------------------------------------------------------

export interface OryzoRefProps {
  intensity?: number;
  speed?: number;
  density?: number;
  parallax?: number;
}

const ORYZO_COLORS = ['#ff3b30', '#39ff8b', '#ff9f2e']; // rot / grün / orange wie im Referenz-Screenshot

export function ReferenceOryzoScribbleField({ intensity = 0.9, speed = 1, density = 9, parallax = 0.6 }: OryzoRefProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();

  const layers = useMemo(() => {
    const rnd = seededRandom(42);
    return Array.from({ length: Math.max(4, Math.min(16, Math.round(density))) }, (_, i) => ({
      d: rnd() < 0.55
        ? scribblePath(101 + i * 13, 220, 200, 5 + Math.floor(rnd() * 5), 0.65 + rnd() * 0.45)
        : loopScribblePath(53 + i * 7, 55 + rnd() * 55, 2 + Math.floor(rnd() * 3), 0.4),
      color: ORYZO_COLORS[i % 3],
      x: 4 + rnd() * 84,
      y: 6 + rnd() * 80,
      depth: 0.2 + rnd() * 0.8,
      dur: (16 + rnd() * 20) / Math.max(speed, 0.05),
      delay: rnd() * -24,
      width: 1.2 + rnd() * 2,
    }));
  }, [density, speed]);

  const par = useRef({ x: 0, y: 0 });
  useRafLoop((dt) => {
    const p = pointer.current;
    par.current.x = damp(par.current.x, (p.tx - 0.5) * 2, 8, dt);
    par.current.y = damp(par.current.y, (p.ty - 0.5) * 2, 8, dt);
    rootRef.current?.querySelectorAll<HTMLElement>('[data-oryzo-depth]').forEach((el) => {
      const depth = Number(el.dataset.oryzoDepth) * parallax * 30;
      el.style.transform = `translate3d(${(-par.current.x * depth).toFixed(2)}px, ${(-par.current.y * depth).toFixed(2)}px, 0)`;
    });
  }, !reduced && parallax > 0);

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070708' }}>
      <style>{`
        @keyframes oryzoref-drift {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          30%  { transform: translate(2%, -2.5%) rotate(9deg) scale(1.06); }
          65%  { transform: translate(-2.2%, 1.8%) rotate(-12deg) scale(0.95); }
          100% { transform: translate(0,0) rotate(0deg) scale(1); }
        }
        @keyframes oryzoref-draw {
          0%   { stroke-dashoffset: 1; opacity: 0; }
          15%  { opacity: 1; }
          60%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) { .oryzoref-a { animation: none !important; } }
      `}</style>
      {layers.map((l, i) => (
        <div
          key={i}
          data-oryzo-depth={l.depth}
          style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, width: `${10 + l.depth * 16}%`, aspectRatio: '1.1', mixBlendMode: 'screen', willChange: 'transform' }}
        >
          <div className="oryzoref-a" style={{ width: '100%', height: '100%', animation: reduced ? undefined : `oryzoref-drift ${l.dur}s ease-in-out ${l.delay}s infinite` }}>
            <svg viewBox="0 0 220 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <path d={l.d} fill="none" stroke={l.color} strokeWidth={l.width * 3.6} strokeLinecap="round" style={{ filter: `blur(${10 + l.depth * 14}px)`, opacity: 0.9 * intensity }} />
              <path
                className="oryzoref-a"
                d={l.d}
                fill="none"
                stroke={l.color}
                strokeWidth={l.width}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={reduced ? 0 : 1}
                style={{ opacity: intensity, animation: reduced ? undefined : `oryzoref-draw ${(4 + i * 0.4) / Math.max(speed, 0.05)}s cubic-bezier(0.22,1,0.36,1) ${l.delay}s infinite alternate` }}
              />
            </svg>
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(30px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#f4f1ea' }}>REFERENCE STUDY</div>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.3em', color: '#6a675f', marginTop: 6 }}>ORYZO-CLASS SCRIBBLE FIELD — DO NOT SHIP</div>
        </div>
      </div>
    </div>
  );
}

export default ReferenceOryzoScribbleField;
