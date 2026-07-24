import React, { useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, seededRandom, damp } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// OrbitalLightTrails — NOX Adapted der Active-Theory-Trail-Mechanik.
// Autonome Licht-Emitter auf elliptischen Lissajous-Orbits schreiben
// Positions-History-Trails (Decay + Taper, additive Komposition).
// NOX-Palette (Ember-Rot/Gold/Weißglut), langsamer und atmosphärischer als
// die Referenz — als Hintergrund hinter Content gedacht.
// ---------------------------------------------------------------------------

export interface OrbitalLightTrailsProps {
  orbCount?: number;
  trailLength?: number;
  speed?: number;
  intensity?: number;
}

interface Orb {
  hist: Array<{ x: number; y: number }>;
  x: number;
  y: number;
  color: [number, number, number];
  fx: number;
  fy: number;
  phase: number;
  rx: number;
  ry: number;
  lambda: number;
}

const NOX_TRAIL_COLORS: Array<[number, number, number]> = [
  [201, 48, 48], // nox red
  [212, 162, 74], // gold
  [255, 120, 60], // ember
  [240, 236, 228], // white heat
];

export function OrbitalLightTrails({ orbCount = 4, trailLength = 60, speed = 1, intensity = 0.85 }: OrbitalLightTrailsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const orbs = useRef<Orb[] | null>(null);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const n = Math.max(1, Math.min(8, Math.round(orbCount)));
      if (!orbs.current || orbs.current.length !== n) {
        const rnd = seededRandom(77);
        orbs.current = Array.from({ length: n }, (_, i) => ({
          hist: [],
          x: size.w / 2,
          y: size.h / 2,
          color: NOX_TRAIL_COLORS[i % NOX_TRAIL_COLORS.length],
          fx: 0.12 + rnd() * 0.22, // Lissajous-Frequenzen
          fy: 0.09 + rnd() * 0.2,
          phase: rnd() * Math.PI * 2,
          rx: 0.22 + rnd() * 0.22, // Orbit-Radien relativ zur Fläche
          ry: 0.18 + rnd() * 0.2,
          lambda: 3 + rnd() * 4,
        }));
      }

      ctx.clearRect(0, 0, size.w, size.h);
      // Hintergrund-Tiefe
      const bg = ctx.createRadialGradient(size.w / 2, size.h * 1.1, 0, size.w / 2, size.h * 1.1, size.h * 1.4);
      bg.addColorStop(0, '#170b08');
      bg.addColorStop(0.55, '#0a0a0b');
      bg.addColorStop(1, '#08080a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.globalCompositeOperation = 'lighter';
      const t = elapsed * speed;
      const H = Math.max(12, Math.min(120, Math.round(trailLength)));

      for (const o of orbs.current) {
        // Lissajous-Ziel + gedämpftes Folgen (AT-Lerp-Mechanik)
        const tx = size.w * (0.5 + Math.sin(t * o.fx * Math.PI * 2 + o.phase) * o.rx);
        const ty = size.h * (0.5 + Math.sin(t * o.fy * Math.PI * 2 + o.phase * 1.7) * o.ry);
        o.x = damp(o.x, tx, o.lambda, dt);
        o.y = damp(o.y, ty, o.lambda, dt);
        o.hist.push({ x: o.x, y: o.y });
        if (o.hist.length > H) o.hist.shift();

        for (let i = 1; i < o.hist.length; i++) {
          const a = o.hist[i - 1];
          const b = o.hist[i];
          const f = i / o.hist.length;
          ctx.strokeStyle = `rgba(${o.color[0]}, ${o.color[1]}, ${o.color[2]}, ${(f * f * 0.4 * intensity).toFixed(3)})`;
          ctx.lineWidth = 0.5 + f * 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 26);
        grd.addColorStop(0, `rgba(${o.color[0]}, ${o.color[1]}, ${o.color[2]}, ${0.55 * intensity})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(o.x, o.y, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // Vignette, damit Content lesbar bleibt
      const vg = ctx.createRadialGradient(size.w / 2, size.h * 0.45, 0, size.w / 2, size.h * 0.45, size.w * 0.6);
      vg.addColorStop(0, 'rgba(10,10,11,0.45)');
      vg.addColorStop(1, 'rgba(10,10,11,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    !reduced,
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>NOX ATMOSPHERE</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>ORBITAL LIGHT TRAILS</div>
        </div>
      </div>
    </div>
  );
}

export default OrbitalLightTrails;
