import React, { useMemo, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, usePointer, seededRandom, damp } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// BackgroundSymbolStorm — NOX Adapted (ORYZO-Klasse, Variante „Sturm").
// Viele kleine System-Symbole (Kreuze, Ringe, Dreiecke, Runen-Fragmente)
// driften in 3 Tiefenebenen mit Rotation; vordere Ebene schneller + schärfer,
// hintere langsamer + geblurrt (per Alpha statt Filter — Canvas-Perf).
// Pointer erzeugt eine sanfte Strömungs-Ablenkung (Curl-light).
// ---------------------------------------------------------------------------

export interface SymbolStormProps {
  density?: number; // Symbole gesamt
  speed?: number;
  color?: string;
  pointerInfluence?: number;
}

interface Sym {
  x: number;
  y: number;
  z: number; // 0 hinten .. 1 vorne
  rot: number;
  rotSpeed: number;
  size: number;
  kind: number;
  vx: number;
  vy: number;
  alpha: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [201, 48, 48];
}

export function BackgroundSymbolStorm({ density = 46, speed = 1, color = '#C93030', pointerInfluence = 0.6 }: SymbolStormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const syms = useRef<Sym[] | null>(null);
  const flow = useRef({ x: 0, y: 0 });
  const rgb = useMemo(() => hexToRgb(color), [color]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const n = Math.max(10, Math.min(120, Math.round(density)));
      if (!syms.current || syms.current.length !== n) {
        const rnd = seededRandom(55);
        syms.current = Array.from({ length: n }, () => {
          const z = rnd();
          return {
            x: rnd() * size.w,
            y: rnd() * size.h,
            z,
            rot: rnd() * Math.PI * 2,
            rotSpeed: (rnd() - 0.5) * 0.8,
            size: 4 + z * 14 + rnd() * 6,
            kind: Math.floor(rnd() * 5),
            vx: (rnd() - 0.5) * 6,
            vy: -4 - rnd() * 10,
            alpha: 0.12 + z * 0.5,
          };
        });
      }

      // Pointer-Strömung (gedämpft)
      const p = pointer.current;
      flow.current.x = damp(flow.current.x, p.inside ? (p.tx - 0.5) * 2 : 0, 4, dt);
      flow.current.y = damp(flow.current.y, p.inside ? (p.ty - 0.5) * 2 : 0, 4, dt);

      ctx.clearRect(0, 0, size.w, size.h);
      const bg = ctx.createLinearGradient(0, 0, 0, size.h);
      bg.addColorStop(0, '#0a0a0b');
      bg.addColorStop(1, '#100a0e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.w, size.h);

      const t = elapsed * speed;
      for (const s of syms.current.sort((a, b) => a.z - b.z)) {
        const drift = Math.sin(t * 0.4 + s.rot * 3) * 4;
        s.x += (s.vx + drift + flow.current.x * 26 * pointerInfluence * s.z) * dt * speed * (0.4 + s.z);
        s.y += (s.vy + flow.current.y * 20 * pointerInfluence * s.z) * dt * speed * (0.4 + s.z);
        s.rot += s.rotSpeed * dt * speed;
        // Wrap
        if (s.y < -30) { s.y = size.h + 20; s.x = (s.x + size.w * 0.3) % size.w; }
        if (s.x < -30) s.x = size.w + 20;
        if (s.x > size.w + 30) s.x = -20;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        const a = s.alpha * (0.7 + 0.3 * Math.sin(t * 1.2 + s.rot * 5));
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`;
        ctx.lineWidth = 0.8 + s.z * 1.4;
        const r = s.size;
        ctx.beginPath();
        switch (s.kind) {
          case 0: // Kreuz
            ctx.moveTo(-r / 2, 0); ctx.lineTo(r / 2, 0);
            ctx.moveTo(0, -r / 2); ctx.lineTo(0, r / 2);
            break;
          case 1: // Ring
            ctx.arc(0, 0, r / 2, 0, Math.PI * 2);
            break;
          case 2: // Dreieck
            ctx.moveTo(0, -r / 2); ctx.lineTo(r / 2, r / 2); ctx.lineTo(-r / 2, r / 2); ctx.closePath();
            break;
          case 3: // Winkel-Fragment
            ctx.moveTo(-r / 2, -r / 2); ctx.lineTo(r / 2, -r / 2); ctx.lineTo(r / 2, r / 2);
            break;
          default: // Diamant
            ctx.moveTo(0, -r / 2); ctx.lineTo(r / 2, 0); ctx.lineTo(0, r / 2); ctx.lineTo(-r / 2, 0); ctx.closePath();
        }
        ctx.stroke();
        // Vordere Ebene: Glow-Punch
        if (s.z > 0.75) {
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(a * 0.35).toFixed(3)})`;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>SIGNAL FIELD</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>SYMBOL STORM</div>
        </div>
      </div>
    </div>
  );
}

export default BackgroundSymbolStorm;
