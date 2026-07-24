import { useRef } from 'react';
import { damp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxSignalParticles — die Shopify-Editions-Butterflies, NOX-adaptiert:
// statt verspielter Schmetterlinge kleine agentische Signal-Sparks, die
// Leads/Automationen symbolisieren. Übernommen ist NUR das Prinzip
// (ein Batch instanzierter Partikel mit Verhaltens-Choreografie, 1 Draw-Loop
// = 1 "Drawcall"-Äquivalent); Assets, Formen und Verhalten sind eigene.
// Drei Verhaltenszustände mit weichen Übergängen (damp auf Zielpositionen):
//  - orbit:  Sparks kreisen um Anker (ruhende Hero-Atmosphäre)
//  - swarm:  Sparks folgen dem Pointer als lockerer Schwarm
//  - settle: Sparks docken auf einer Ziellinie an (CTA-Moment)
// 'auto' wechselt zyklisch — so ist die Galerie-Preview selbsterklärend.
// ---------------------------------------------------------------------------

export interface NoxSignalParticlesProps {
  count?: number; // 12..90
  mode?: 'auto' | 'orbit' | 'swarm' | 'settle';
  intensity?: number; // 0.2..1.5 — Glow/Tempo
  sparkSize?: number; // 0.6..2.4
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  anchor: number; // Ankerindex für orbit
  phase: number;
  radius: number;
  speed: number;
  settleT: number; // 0..1 Position auf der Settle-Linie
  size: number;
}

const MODES = ['orbit', 'swarm', 'settle'] as const;

export function NoxSignalParticles({
  count = 42,
  mode = 'auto',
  intensity = 1,
  sparkSize = 1.2,
}: NoxSignalParticlesProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const sparks = useRef<Spark[] | null>(null);

  if (!sparks.current || sparks.current.length !== count) {
    const rnd = seededRandom(4242);
    sparks.current = Array.from({ length: count }, (_, i) => ({
      x: rnd(),
      y: rnd(),
      vx: 0,
      vy: 0,
      anchor: i % 3,
      phase: rnd() * Math.PI * 2,
      radius: 0.06 + rnd() * 0.16,
      speed: 0.4 + rnd() * 0.8,
      settleT: i / count,
      size: (0.7 + rnd() * 0.8) * sparkSize,
    }));
  }

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const { w, h } = size;
      const requestedMode = MODES.includes(mode as (typeof MODES)[number]) ? mode : 'auto';
      const activeMode: (typeof MODES)[number] = requestedMode === 'auto'
        ? MODES[Math.floor(elapsed / 5) % MODES.length] ?? 'orbit'
        : MODES.includes(requestedMode as (typeof MODES)[number])
          ? requestedMode as (typeof MODES)[number]
          : 'orbit';

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(10, 10, 11, 0.22)';
      ctx.fillRect(0, 0, w, h);

      const anchors = [
        { x: w * 0.3, y: h * 0.42 },
        { x: w * 0.62, y: h * 0.34 },
        { x: w * 0.5, y: h * 0.64 },
      ];
      const p = pointer.current;
      const mx = (p.inside ? p.tx : 0.5 + 0.2 * Math.sin(elapsed * 0.5)) * w;
      const my = (p.inside ? p.ty : 0.5 + 0.16 * Math.cos(elapsed * 0.4)) * h;

      ctx.globalCompositeOperation = 'lighter';
      for (const s of sparks.current!) {
        let tx: number;
        let ty: number;
        if (activeMode === 'orbit') {
          const a = anchors[s.anchor];
          const ang = s.phase + elapsed * s.speed * intensity;
          tx = a.x + Math.cos(ang) * s.radius * w;
          ty = a.y + Math.sin(ang * 1.14) * s.radius * h * 0.9;
        } else if (activeMode === 'swarm') {
          const ang = s.phase + elapsed * s.speed * 1.6 * intensity;
          tx = mx + Math.cos(ang) * (24 + s.radius * 130);
          ty = my + Math.sin(ang * 1.3) * (18 + s.radius * 100);
        } else {
          // settle: Andocken auf der CTA-Linie mit leichtem Puls.
          tx = w * 0.14 + s.settleT * w * 0.72;
          ty = h * 0.78 + Math.sin(elapsed * 2 + s.phase) * 2.4;
        }

        if (reduced) {
          s.x = tx;
          s.y = ty;
        } else {
          s.x = damp(s.x || tx, tx, 3.4, dt);
          s.y = damp(s.y || ty, ty, 3.4, dt);
        }

        const flicker = 0.66 + 0.34 * Math.sin(elapsed * 6 * s.speed + s.phase);
        const r = s.size * (activeMode === 'settle' ? 1.25 : 1) * (0.8 + 0.4 * flicker);
        const alpha = (0.36 + 0.5 * flicker) * Math.min(intensity, 1.2);

        // Spark-Körper + Kreuz-Glint (eigene Form, kein fremdes Asset).
        ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 200, 190, ${alpha * 0.5})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - r * 2.4, s.y);
        ctx.lineTo(s.x + r * 2.4, s.y);
        ctx.moveTo(s.x, s.y - r * 2.4);
        ctx.lineTo(s.x, s.y + r * 2.4);
        ctx.stroke();
      }

      // Settle-Ziellinie andeuten.
      if (activeMode === 'settle') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(201, 48, 48, 0.30)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, h * 0.78);
        ctx.lineTo(w * 0.88, h * 0.78);
        ctx.stroke();
      }

      // Modus-Label (Selbstdemonstration in der Galerie).
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '600 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(138, 135, 129, 0.8)';
      ctx.fillText(`MODE // ${activeMode.toUpperCase()}`, 16, h - 14);
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 14, left: 16, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
          SIGNAL PARTICLES // {reduced ? 'STATIC' : 'LIVE'}
        </div>
      </div>
    </div>
  );
}

export default NoxSignalParticles;
