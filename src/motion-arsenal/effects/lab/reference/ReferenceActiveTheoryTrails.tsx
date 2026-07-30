import React, { useRef } from 'react';
import { useCanvas2D } from '../../../lib/canvasUtils';
import { usePrefersReducedMotion, usePointer, damp, seededRandom } from '../../../lib/animationUtils';

// ---------------------------------------------------------------------------
// !!! REFERENCE STUDY — DO NOT SHIP DIRECTLY !!!
// Reproduktion der Active-Theory-Trail-Mechanik: Positions-History-Buffer →
// Line-Strip mit Decay + Stroke-Taper, additive Komposition
// (blendFunc(ONE, ONE)), framerate-normalisiertes Lerp-Following.
// Quelle: public/activetheory-bundle.js — Trail-Rendering (967 Refs),
// lerp mit framerateNormalizeLerpAlpha, additive Blend-Palette.
// ---------------------------------------------------------------------------

export interface ATTrailsRefProps {
  trailCount?: number;
  historyLength?: number;
  speed?: number;
}

interface Trail {
  hist: Array<{ x: number; y: number }>;
  x: number;
  y: number;
  hue: [number, number, number];
  lambda: number;
  phase: number;
  orbit: number;
}

export function ReferenceActiveTheoryTrails({ trailCount = 5, historyLength = 42, speed = 1 }: ATTrailsRefProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const trails = useRef<Trail[] | null>(null);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const n = Math.max(2, Math.min(10, Math.round(trailCount)));
      if (!trails.current || trails.current.length !== n) {
        const rnd = seededRandom(21);
        const palette: Array<[number, number, number]> = [
          [255, 90, 60], [90, 210, 255], [255, 200, 90], [190, 120, 255], [120, 255, 170],
        ];
        trails.current = Array.from({ length: n }, (_, i) => ({
          hist: [],
          x: size.w / 2,
          y: size.h / 2,
          hue: palette[i % palette.length],
          // Verschiedene Dämpfungen → Follower fächern auf (AT: alpha 0.01–0.3)
          lambda: 2.2 + rnd() * 6,
          phase: rnd() * Math.PI * 2,
          orbit: 20 + rnd() * 46,
        }));
      }

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.globalCompositeOperation = 'lighter'; // blendFunc(ONE, ONE)

      const p = pointer.current;
      const hasPointer = p.inside;
      const t = elapsed * speed;
      const H = Math.max(8, Math.min(90, Math.round(historyLength)));

      for (const tr of trails.current) {
        // Ziel: Pointer (oder Auto-Orbit wenn kein Pointer im Feld)
        const targetX = hasPointer
          ? p.tx * size.w + Math.cos(t * 1.4 + tr.phase) * tr.orbit
          : size.w / 2 + Math.cos(t * 0.7 + tr.phase) * size.w * 0.28;
        const targetY = hasPointer
          ? p.ty * size.h + Math.sin(t * 1.4 + tr.phase) * tr.orbit
          : size.h / 2 + Math.sin(t * 0.9 + tr.phase * 1.7) * size.h * 0.26;

        // framerate-normalisiertes Lerp (AT-Kernbaustein) via damp()
        tr.x = damp(tr.x, targetX, tr.lambda, dt);
        tr.y = damp(tr.y, targetY, tr.lambda, dt);

        tr.hist.push({ x: tr.x, y: tr.y });
        if (tr.hist.length > H) tr.hist.shift();

        // Line-Strip mit Decay + Taper (AT-Trail-Mechanik)
        for (let i = 1; i < tr.hist.length; i++) {
          const a = tr.hist[i - 1];
          const b = tr.hist[i];
          const f = i / tr.hist.length; // 0 alt → 1 neu
          ctx.strokeStyle = `rgba(${tr.hue[0]}, ${tr.hue[1]}, ${tr.hue[2]}, ${(f * f * 0.55).toFixed(3)})`;
          ctx.lineWidth = 0.5 + f * 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // Glow-Kopf
        const grd = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, 18);
        grd.addColorStop(0, `rgba(${tr.hue[0]}, ${tr.hue[1]}, ${tr.hue[2]}, 0.6)`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050506' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.3em', color: '#4a4842' }}>MOVE POINTER</div>
      </div>
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: 'var(--mono, monospace)', fontSize: 9.5, letterSpacing: '0.25em', color: '#6a675f', pointerEvents: 'none' }}>
        REFERENCE STUDY · ACTIVE THEORY LIGHT TRAILS — DO NOT SHIP
      </div>
    </div>
  );
}

export default ReferenceActiveTheoryTrails;
