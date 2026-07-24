import { useRef } from 'react';
import { clamp, damp, lerp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxDataStreamJourney — "Vom Signal zum System" als erlebbarer Datenstrom.
// Mechanik-Vokabular aus der KRANK/Lusion-Forensik, eigene Implementierung:
//  - Partikel folgen einem Pipeline-Pfad durch benannte Stationen
//    (Signal → Lead → Qualifizierung → Pitch → Follow-up → Conversion).
//  - Trails über Decay-Smear (halbtransparentes Übermalen statt History-
//    Buffer — der Active-Theory-Trail-Effekt in Canvas2D-Ökonomie).
//  - Pointer stört den Strom lokal: Repulsion + tangentiale Verwirbelung
//    (vereinfachtes Curl: Kraft ⟂ zum Abstandsvektor), Falloff-Radius.
//  - Additiver Glow via globalCompositeOperation 'lighter' (Bloom-Ersatz).
// `progress` (0..1) schaltet Stationen frei — im Einsatz scroll-synced,
// in der Galerie per Auto-Loop.
// ---------------------------------------------------------------------------

export interface NoxDataStreamJourneyProps {
  particleCount?: number; // 20..140
  speed?: number; // 0.2..2 — Durchlaufgeschwindigkeit
  disturb?: number; // 0..1 — Stärke der Pointer-Störung
  progress?: number; // 0..1 — freigeschaltete Pipeline-Tiefe (-1 = Auto-Loop)
  labels?: boolean;
}

const STATIONS = ['SIGNAL', 'LEAD', 'QUALIFIZIERUNG', 'PITCH', 'FOLLOW-UP', 'CONVERSION'];

interface Particle {
  t: number; // 0..1 Position entlang des Pfads
  lane: number; // -1..1 Querversatz
  v: number; // individuelle Geschwindigkeit
  ox: number; // Störungs-Offset x/y (gedämpft zurückfedernd)
  oy: number;
  hue: number; // 0 = rot (roh), 1 = grün (konvertiert)
}

export function NoxDataStreamJourney({
  particleCount = 70,
  speed = 0.8,
  disturb = 0.6,
  progress = -1,
  labels = true,
}: NoxDataStreamJourneyProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const particles = useRef<Particle[] | null>(null);
  const smoothProgress = useRef(0);

  if (!particles.current || particles.current.length !== particleCount) {
    const rnd = seededRandom(7331);
    particles.current = Array.from({ length: particleCount }, () => ({
      t: rnd(),
      lane: (rnd() - 0.5) * 2,
      v: 0.5 + rnd() * 0.9,
      ox: 0,
      oy: 0,
      hue: 0,
    }));
  }

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const { w, h } = size;
      // Pipeline-Pfad: sanfte Sinuskurve durch die Stationsleiste.
      const px = (t: number) => lerp(w * 0.06, w * 0.94, t);
      const py = (t: number) => h * 0.52 + Math.sin(t * Math.PI * 2.2 + 0.4) * h * 0.13;

      const target = progress >= 0 ? clamp(progress, 0, 1) : 0.5 + 0.5 * Math.sin(elapsed * 0.22);
      smoothProgress.current = damp(smoothProgress.current, target, 4, dt);
      const prog = smoothProgress.current;

      // Trail-Decay statt clearRect: der Smear IST der Trail.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(10, 10, 11, 0.16)';
      ctx.fillRect(0, 0, w, h);

      // Basispfad.
      ctx.strokeStyle = 'rgba(240, 236, 228, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        if (i === 0) ctx.moveTo(px(t), py(t));
        else ctx.lineTo(px(t), py(t));
      }
      ctx.stroke();

      // Freigeschalteter Abschnitt glüht.
      ctx.strokeStyle = 'rgba(201, 48, 48, 0.34)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * prog;
        if (i === 0) ctx.moveTo(px(t), py(t));
        else ctx.lineTo(px(t), py(t));
      }
      ctx.stroke();

      const p = pointer.current;
      const mx = p.tx * w;
      const my = p.ty * h;
      const radius = Math.min(w, h) * 0.22;

      ctx.globalCompositeOperation = 'lighter';
      for (const part of particles.current!) {
        if (!reduced) {
          part.t += part.v * speed * dt * 0.07;
          if (part.t > prog + 0.02) part.t = prog > 0.05 ? 0 : part.t; // Strom endet an der Front
          if (part.t > 1) part.t = 0;
        }
        const bx = px(part.t);
        const by = py(part.t) + part.lane * h * 0.045;

        // Pointer-Störung: Repulsion + tangentiale Verwirbelung mit Falloff.
        if (p.inside && !reduced && disturb > 0) {
          const dx = bx - mx;
          const dy = by - my;
          const d = Math.hypot(dx, dy);
          if (d < radius && d > 0.001) {
            const f = (1 - d / radius) * disturb;
            part.ox += ((dx / d) * f * 46 - (dy / d) * f * 30) * dt * 8;
            part.oy += ((dy / d) * f * 46 + (dx / d) * f * 30) * dt * 8;
          }
        }
        part.ox = damp(part.ox, 0, 3.2, dt);
        part.oy = damp(part.oy, 0, 3.2, dt);
        part.hue = damp(part.hue, part.t > 0.86 ? 1 : 0, 5, dt);

        const x = bx + part.ox;
        const y = by + part.oy;
        const r = 1.1 + part.v * 1.1;
        const alpha = 0.5 + part.v * 0.4;
        const cr = Math.round(lerp(255, 120, part.hue));
        const cg = Math.round(lerp(80, 235, part.hue));
        const cb = Math.round(lerp(80, 170, part.hue));
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stationen.
      ctx.globalCompositeOperation = 'source-over';
      STATIONS.forEach((label, i) => {
        const t = i / (STATIONS.length - 1);
        const x = px(t);
        const y = py(t);
        const on = t <= prog + 0.001;
        const pulse = on && !reduced ? 0.5 + 0.5 * Math.sin(elapsed * 2.4 + i) : 0.4;

        ctx.beginPath();
        ctx.arc(x, y, on ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = on ? `rgba(255, 107, 107, ${0.75 + pulse * 0.25})` : 'rgba(240, 236, 228, 0.22)';
        ctx.fill();
        if (on) {
          ctx.beginPath();
          ctx.arc(x, y, 8 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(201, 48, 48, ${0.30 * (1 - pulse * 0.5)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (labels && w > 430) {
          ctx.font = '600 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = on ? 'rgba(240, 236, 228, 0.85)' : 'rgba(138, 135, 129, 0.55)';
          ctx.fillText(label, x, y + (i % 2 === 0 ? -18 : 26));
        }
      });
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', top: 14, left: 16, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
          NOX DATA STREAM // {reduced ? 'STATIC' : 'LIVE'}
        </div>
        <div style={{ fontSize: 'clamp(16px, 3cqw, 24px)', fontWeight: 800, color: NOX_COLORS.text, marginTop: 4 }}>
          Vom Signal zum System.
        </div>
      </div>
    </div>
  );
}

export default NoxDataStreamJourney;
