import React, { useMemo, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, seededRandom, fract } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// EmberCurlDrift — NOX Adapted der KRANK-Curl-Partikel: Glut-Funken steigen
// aus der Tiefe auf, werden von einem Curl-Noise-Feld seitlich verwirbelt
// (Schmiede-Funken statt Kaffee-Bohnen), additive Glow-Komposition, Funken
// kühlen über die Lebenszeit ab (weißgold → rot → aus).
// ---------------------------------------------------------------------------

export interface EmberCurlDriftProps {
  count?: number;
  updraft?: number; // Aufwind-Stärke
  turbulence?: number; // Curl-Einfluss
  speed?: number;
}

function makeCurl(seed: number) {
  const rnd = seededRandom(seed);
  const grad = Array.from({ length: 256 }, () => rnd() * 2 - 1);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = fract(x);
    const yf = fract(y);
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const g = (i: number, j: number) => grad[(i + j * 57) & 255];
    return g(xi, yi) * (1 - u) * (1 - v) + g(xi + 1, yi) * u * (1 - v) + g(xi, yi + 1) * (1 - u) * v + g(xi + 1, yi + 1) * u * v;
  };
  const eps = 0.01;
  return (x: number, y: number, t: number): number => (noise(x, y + eps + t) - noise(x, y - eps + t)) / (2 * eps);
}

export function EmberCurlDrift({ count = 140, updraft = 1, turbulence = 1, speed = 1 }: EmberCurlDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const curlX = useMemo(() => makeCurl(4242), []);
  const parts = useRef<Float32Array | null>(null);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const n = Math.max(30, Math.min(400, Math.round(count)));
      if (!parts.current || parts.current.length !== n * 5) {
        const rnd = seededRandom(3);
        const arr = new Float32Array(n * 5); // x, y, life, maxLife, size
        for (let i = 0; i < n; i++) {
          arr[i * 5] = rnd() * size.w;
          arr[i * 5 + 1] = size.h * (0.5 + rnd() * 0.5);
          arr[i * 5 + 3] = 3 + rnd() * 5;
          arr[i * 5 + 2] = rnd() * arr[i * 5 + 3];
          arr[i * 5 + 4] = 0.7 + rnd() * 1.8;
        }
        parts.current = arr;
      }
      const arr = parts.current;
      const t = elapsed * 0.15 * speed;

      // Hintergrund: Esse-Glut unten
      ctx.globalCompositeOperation = 'source-over';
      const bg = ctx.createLinearGradient(0, 0, 0, size.h);
      bg.addColorStop(0, '#0a0a0b');
      bg.addColorStop(0.75, '#120a08');
      bg.addColorStop(1, '#1d0d07');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const life = arr[i * 5 + 2] / arr[i * 5 + 3]; // 0 frisch → 1 tot
        const sway = curlX(arr[i * 5] * 0.008, arr[i * 5 + 1] * 0.008, t) * 26 * turbulence;
        arr[i * 5] += sway * dt;
        arr[i * 5 + 1] -= (18 + (1 - life) * 34) * updraft * dt * speed;
        arr[i * 5 + 2] += dt * speed;
        if (arr[i * 5 + 2] >= arr[i * 5 + 3] || arr[i * 5 + 1] < -10) {
          arr[i * 5] = (i * 83.7) % size.w;
          arr[i * 5 + 1] = size.h + 6;
          arr[i * 5 + 2] = 0;
        }
        // Abkühlung: weißgold → orange → dunkelrot, Alpha stirbt aus
        const heat = 1 - life;
        const r = 255;
        const g = 90 + heat * 150;
        const b = 30 + heat * 120;
        const a = Math.max(0, (1 - life) * 0.85) * (0.5 + 0.5 * Math.sin(elapsed * 8 + i)); // Flacker
        const rad = arr[i * 5 + 4] * (0.8 + heat * 0.8);
        ctx.fillStyle = `rgba(${r}, ${g | 0}, ${b | 0}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(arr[i * 5], arr[i * 5 + 1], rad, 0, Math.PI * 2);
        ctx.fill();
        // Glow-Hof für die heißesten Funken
        if (heat > 0.75) {
          const grd = ctx.createRadialGradient(arr[i * 5], arr[i * 5 + 1], 0, arr[i * 5], arr[i * 5 + 1], rad * 6);
          grd.addColorStop(0, `rgba(255, 160, 80, ${(a * 0.25).toFixed(3)})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(arr[i * 5], arr[i * 5 + 1], rad * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    !reduced,
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>FORGE ACTIVE</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>EMBER CURL DRIFT</div>
        </div>
      </div>
    </div>
  );
}

export default EmberCurlDrift;
