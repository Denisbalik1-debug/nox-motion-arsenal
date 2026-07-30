import React, { useMemo, useRef } from 'react';
import { useCanvas2D } from '../../../lib/canvasUtils';
import { usePrefersReducedMotion, seededRandom, fract } from '../../../lib/animationUtils';

// ---------------------------------------------------------------------------
// !!! REFERENCE STUDY — DO NOT SHIP DIRECTLY !!!
// Reproduktion der KRANK/Lusion-Partikel-Mechanik: Partikel werden von einem
// Curl-Noise-Vektorfeld advektiert (curl = numerische Ableitung des
// Noise-Felds, eps-Differenzen) und additiv mit Glow gerendert
// (Bloom-Ersatz: 'lighter'-Composite + radiale Gradients).
// Quelle: KRANK/src/hoisted.js — `curl()` (~15 Refs), `Particles`-Klasse,
// Bloom-Pass (Threshold 0.8, additive). Canvas2D-Nachbau der GPU-Mechanik.
// ---------------------------------------------------------------------------

export interface KrankCurlRefProps {
  count?: number;
  fieldScale?: number;
  speed?: number;
}

// Value noise + numerischer Curl (exakt die Mechanik aus dem Shader-Snippet:
// eps-Differenzen von snoise → Vektorfeld).
function makeNoise(seed: number) {
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
    return (
      g(xi, yi) * (1 - u) * (1 - v) +
      g(xi + 1, yi) * u * (1 - v) +
      g(xi, yi + 1) * (1 - u) * v +
      g(xi + 1, yi + 1) * u * v
    );
  };
  // curlNoise: eps = 0.001-Differenzen wie im extrahierten KRANK-Snippet
  const eps = 0.01;
  return (x: number, y: number, t: number): [number, number] => {
    const n1 = noise(x, y + eps + t);
    const n2 = noise(x, y - eps + t);
    const n3 = noise(x + eps, y + t);
    const n4 = noise(x - eps, y + t);
    return [(n1 - n2) / (2 * eps), -(n3 - n4) / (2 * eps)];
  };
}

export function ReferenceKrankCurlParticles({ count = 320, fieldScale = 2.4, speed = 1 }: KrankCurlRefProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const curl = useMemo(() => makeNoise(1337), []);
  const parts = useRef<Float32Array | null>(null);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const n = Math.max(50, Math.min(800, Math.round(count)));
      if (!parts.current || parts.current.length !== n * 4) {
        const rnd = seededRandom(9);
        const arr = new Float32Array(n * 4); // x, y, age, hue
        for (let i = 0; i < n; i++) {
          arr[i * 4] = rnd() * size.w;
          arr[i * 4 + 1] = rnd() * size.h;
          arr[i * 4 + 2] = rnd() * 6;
          arr[i * 4 + 3] = rnd();
        }
        parts.current = arr;
      }
      const arr = parts.current;
      const t = elapsed * 0.12 * speed;

      // Trail-Fade statt Clear (Referenz: FBO-Feedback) — leichtes Abdunkeln.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(7, 7, 8, 0.16)';
      ctx.fillRect(0, 0, size.w, size.h);

      ctx.globalCompositeOperation = 'lighter'; // additive Bloom-Ersatz
      const sc = fieldScale / Math.max(size.w, 1);
      for (let i = 0; i < n; i++) {
        const x = arr[i * 4];
        const y = arr[i * 4 + 1];
        const [cx, cy] = curl(x * sc * 4, y * sc * 4, t);
        const vx = cx * 34 * speed;
        const vy = cy * 34 * speed;
        arr[i * 4] = x + vx * dt * 4;
        arr[i * 4 + 1] = y + vy * dt * 4;
        arr[i * 4 + 2] -= dt;
        if (arr[i * 4 + 2] <= 0 || arr[i * 4] < -20 || arr[i * 4] > size.w + 20 || arr[i * 4 + 1] < -20 || arr[i * 4 + 1] > size.h + 20) {
          arr[i * 4] = (i * 97) % size.w;
          arr[i * 4 + 1] = (i * 61) % size.h;
          arr[i * 4 + 2] = 4 + (i % 5);
        }
        const speedMag = Math.min(Math.hypot(vx, vy) / 30, 1);
        // Farb-Mechanik: heiß (weiß-gold) bei hoher Feldstärke, dunkelrot bei niedriger
        const r = 200 + speedMag * 55;
        const g = 60 + speedMag * 150;
        const b = 40 + speedMag * 60;
        ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${0.25 + speedMag * 0.5})`;
        const rad = 0.8 + speedMag * 1.8;
        ctx.beginPath();
        ctx.arc(arr[i * 4], arr[i * 4 + 1], rad, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    !reduced,
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070708' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: 'var(--mono, monospace)', fontSize: 9.5, letterSpacing: '0.25em', color: '#6a675f', pointerEvents: 'none' }}>
        REFERENCE STUDY · KRANK CURL-NOISE FIELD — DO NOT SHIP
      </div>
    </div>
  );
}

export default ReferenceKrankCurlParticles;
