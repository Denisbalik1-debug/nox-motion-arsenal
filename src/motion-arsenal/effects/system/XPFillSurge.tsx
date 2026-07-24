import React, { useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS, easeInOut } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// XPFillSurge — XP-Bar mit Flüssigkeits-Gefühl: Füllstand steigt mit
// Wellen-Oberkante aus 2 überlagerten Sinuswellen (Shopify-Butterfly-
// Wellenmix: sin(a)+sin(2.1b)*0.2), Funken-Partikel steigen an der Füllkante
// auf (additive), Level-Up-Flash bei 100%.
// ---------------------------------------------------------------------------

export interface XPFillSurgeProps {
  fillDuration?: number;
  accent?: string;
  sparkAmount?: number; // 0..2
  autoReplay?: boolean;
}

export function XPFillSurge({ fillDuration = 3.4, accent = NOX_COLORS.gold, sparkAmount = 1, autoReplay = true }: XPFillSurgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [runId, setRunId] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const reduced = usePrefersReducedMotion();
  const sim = useRef({ t: 0, sparks: [] as Array<{ x: number; y: number; vy: number; life: number }>, rnd: seededRandom(5), notified: false });

  useEffect(() => {
    sim.current = { t: 0, sparks: [], rnd: seededRandom(5 + runId), notified: false };
    setLevelUp(false);
  }, [runId]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const s = sim.current;
      if (!reduced) s.t += dt / Math.max(fillDuration, 0.5);
      const progress = reduced ? 1 : clamp(easeInOut(clamp(s.t, 0, 1)), 0, 1);
      if (s.t >= 1 && !s.notified) {
        s.notified = true;
        setLevelUp(true);
        if (autoReplay) setTimeout(() => setRunId((r) => r + 1), 3000);
      }

      ctx.clearRect(0, 0, size.w, size.h);

      // Bar-Geometrie
      const barW = Math.min(size.w * 0.78, 360);
      const barH = 44;
      const bx = (size.w - barW) / 2;
      const by = size.h / 2 - barH / 2;

      // Rahmen
      ctx.strokeStyle = '#2a2a31';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 4, by - 4, barW + 8, barH + 8);

      // Flüssigkeits-Füllung mit Wellen-Oberkante (in Bar geclippt)
      const fillX = bx + barW * progress;
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, barW, barH);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(bx, by + barH);
      ctx.lineTo(bx, by);
      // Wellenkante vertikal an der Füll-Front (Welle läuft die Kante entlang)
      for (let y = 0; y <= barH; y += 2) {
        const wave =
          Math.sin(y * 0.18 + elapsed * 4.2) * 3.2 +
          Math.sin(y * 0.11 + elapsed * 2.1) * 0.2 * 8; // Butterfly-Mix: f2=2.1, Gewicht 0.2
        ctx.lineTo(clamp(fillX + wave, bx, bx + barW), by + y);
      }
      ctx.lineTo(bx, by + barH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
      grad.addColorStop(0, '#7a4a12');
      grad.addColorStop(0.8, accent);
      grad.addColorStop(1, '#ffe9b8');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Funken an der Füllkante
      if (!reduced && progress < 1 && s.rnd() < 0.5 * sparkAmount) {
        s.sparks.push({ x: fillX, y: by + s.rnd() * barH, vy: -(24 + s.rnd() * 40), life: 0.6 + s.rnd() * 0.5 });
      }
      ctx.globalCompositeOperation = 'lighter';
      s.sparks = s.sparks.filter((sp) => sp.life > 0);
      for (const sp of s.sparks) {
        sp.life -= dt;
        sp.y += sp.vy * dt;
        sp.x += (s.rnd() - 0.5) * 26 * dt;
        ctx.fillStyle = `rgba(255, 220, 140, ${clamp(sp.life, 0, 1).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Glow unter der Bar
      const glow = ctx.createRadialGradient(bx + barW * progress * 0.9, by + barH, 0, bx + barW * progress * 0.9, by + barH, 70);
      glow.addColorStop(0, `rgba(212, 162, 74, ${0.22 * progress})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    true,
  );

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a0b', fontFamily: 'var(--mono, monospace)', overflow: 'hidden' }}>
      <style>{`
        @keyframes xps-flash { 0% { opacity: 0; transform: translate(-50%, 6px) scale(0.9); } 20% { opacity: 1; transform: translate(-50%, 0) scale(1.06); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .xps-a { animation: none !important; } }
      `}</style>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', left: '50%', top: 'calc(50% - 54px)', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: '0.28em', color: NOX_COLORS.textDim }}>
        XP SURGE
      </div>
      {(levelUp || reduced) && (
        <div className="xps-a" style={{ position: 'absolute', left: '50%', top: 'calc(50% + 40px)', transform: 'translateX(-50%)', animation: reduced ? undefined : 'xps-flash 0.6s cubic-bezier(.3, 0, .66, -.3) both', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', color: accent, textShadow: `0 0 18px ${accent}` }}>
          ▲ LEVEL UP
        </div>
      )}
    </div>
  );
}

export default XPFillSurge;
