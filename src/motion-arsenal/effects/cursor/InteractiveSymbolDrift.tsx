import { useMemo, useRef } from 'react';
import { clamp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';
import { driftPointer, useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// InteractiveSymbolDrift — Active-Theory emitter/particle pattern on a field
// of procedural glyphs. Each glyph is a particle with a home position; the
// pointer applies a radial force (repel OR attract, mode prop) and a spring
// pulls it back: velocity += (home - pos) * k - vel * damping. Velocity tilts
// the glyph rotation, a soft double-stroke fakes glow — all Canvas2D, one
// draw pass, no per-glyph DOM.
// ---------------------------------------------------------------------------

export interface InteractiveSymbolDriftProps {
  mode?: 'repel' | 'attract';
  forceRadius?: number; // px — pointer influence radius
  count?: number; // 12..60 glyphs
  colorMode?: 'nox' | 'ember' | 'mono';
  seed?: number;
}

const PALETTES: Record<string, string[]> = {
  nox: [NOX_COLORS.red, NOX_COLORS.gold, NOX_COLORS.text, NOX_COLORS.redBright],
  ember: ['#ff5a2e', NOX_COLORS.red, '#ffb347', '#7a1f1f'],
  mono: [NOX_COLORS.text, NOX_COLORS.textDim, '#5a5852', NOX_COLORS.text],
};

interface Glyph {
  path: Path2D;
  hx: number; // home, normalized 0..1
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rot: number;
  color: string;
}

export function InteractiveSymbolDrift({
  mode = 'repel',
  forceRadius = 130,
  count = 30,
  colorMode = 'nox',
  seed = 9,
}: InteractiveSymbolDriftProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();

  const glyphs = useMemo<Glyph[]>(() => {
    const n = clamp(Math.round(count), 12, 60);
    const rnd = seededRandom(seed);
    const palette = PALETTES[colorMode] ?? PALETTES.nox;
    const cols = Math.ceil(Math.sqrt(n * 1.7));
    const rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const hx = (col + 0.5) / cols + (rnd() - 0.5) * (0.55 / cols);
      const hy = (row + 0.5) / rows + (rnd() - 0.5) * (0.55 / rows);
      return {
        path: new Path2D(glyphPath(seed * 101 + i * 17, 26)),
        hx,
        hy,
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        scale: 0.55 + rnd() * 0.85,
        rot: (rnd() - 0.5) * 1.2,
        color: palette[i % palette.length],
      };
    });
  }, [count, colorMode, seed]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const p = pointer.current;
      if (!reduced && !hoverCapable) driftPointer(p, elapsed);
      const px = p.tx * size.w;
      const py = p.ty * size.h;

      ctx.clearRect(0, 0, size.w, size.h);

      const K = 42; // spring stiffness toward home
      const DAMPING = 5.5;
      const POWER = mode === 'repel' ? 900 : 640;

      for (const g of glyphs) {
        const gx = g.x * size.w;
        const gy = g.y * size.h;

        if (!reduced) {
          if (p.inside) {
            const dx = gx - px;
            const dy = gy - py;
            const d = Math.hypot(dx, dy);
            if (d < forceRadius && d > 0.0001) {
              const s = (1 - d / forceRadius) * POWER;
              const dir = mode === 'repel' ? 1 : -1;
              g.vx += ((dx / d) * s * dir * dt) / size.w;
              g.vy += ((dy / d) * s * dir * dt) / size.h;
            }
          }
          // Spring home + damping: velocity += (home - pos) * k - vel * damping.
          g.vx += (g.hx - g.x) * K * dt - g.vx * DAMPING * dt;
          g.vy += (g.hy - g.y) * K * dt - g.vy * DAMPING * dt;
          g.vx = clamp(g.vx, -1.6, 1.6);
          g.vy = clamp(g.vy, -1.6, 1.6);
          g.x += g.vx * dt;
          g.y += g.vy * dt;
        } else {
          g.x = g.hx;
          g.y = g.hy;
          g.vx = 0;
          g.vy = 0;
        }

        const speed = Math.hypot(g.vx, g.vy);
        const excite = clamp(speed * 3, 0, 1);
        ctx.save();
        ctx.translate(g.x * size.w, g.y * size.h);
        ctx.rotate(g.rot + g.vx * 1.4);
        ctx.scale(g.scale, g.scale);
        ctx.translate(-13, -13);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Glow underlay (thick, translucent) — brighter while in motion.
        ctx.strokeStyle = g.color;
        ctx.globalAlpha = 0.1 + excite * 0.3;
        ctx.lineWidth = 6;
        ctx.stroke(g.path);
        // Crisp stroke.
        ctx.globalAlpha = 0.55 + excite * 0.45;
        ctx.lineWidth = 1.6;
        ctx.stroke(g.path);
        ctx.restore();
      }

      // Pointer marker ring.
      if (!reduced && p.inside) {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = mode === 'repel' ? NOX_COLORS.red : NOX_COLORS.gold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, forceRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    !reduced,
  );

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 0%, #101014 0%, ${NOX_COLORS.bg} 62%)`,
        touchAction: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>
            EMITTER FIELD // {mode === 'repel' ? 'EVADE' : 'CONVERGE'}
          </div>
          <div style={{ fontSize: 'clamp(24px, 5.5cqw, 50px)', fontWeight: 810, letterSpacing: '-0.02em', color: NOX_COLORS.text, opacity: 0.92 }}>
            SYMBOL DRIFT
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveSymbolDrift;
