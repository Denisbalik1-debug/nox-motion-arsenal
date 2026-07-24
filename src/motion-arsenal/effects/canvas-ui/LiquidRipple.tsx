import { useEffect, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// LiquidRipple — canvas-ui "Liquid" + "Ripple" mechanics combined: a low-
// amplitude ambient fluid field distorts the surface at all times, and every
// click sends an expanding, decaying ring that refracts it further — the
// "pond surface" read from canvasui.dev/components/ripple. canvas-ui warps
// the live DOM pixel buffer; here the source is a self-drawn NOX dashboard
// mock rendered once into a low-res offscreen buffer, then per-pixel-
// displaced and upscaled each frame (keeps the JS loop bounded regardless of
// preview size).
// ---------------------------------------------------------------------------

export interface LiquidRippleProps {
  ambientStrength?: number; // 0..6 — ambient liquid wobble in buffer px
  rippleStrength?: number; // 0..30 — click-ripple displacement in buffer px
}

const BUF_W = 240;
const BUF_H = 150;

interface RingRipple {
  x: number;
  y: number;
  born: number;
}

function paintDashboard(ctx: CanvasRenderingContext2D, rnd: () => number) {
  ctx.clearRect(0, 0, BUF_W, BUF_H);
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, BUF_W, BUF_H);

  ctx.strokeStyle = 'rgba(240,236,228,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < BUF_W; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BUF_H);
    ctx.stroke();
  }

  const cols = 4;
  const rows = 3;
  const cw = BUF_W / cols;
  const ch = BUF_H / rows;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const pad = 5;
      const x = cx * cw + pad;
      const y = cy * ch + pad;
      const w = cw - pad * 2;
      const h = ch - pad * 2;
      const warm = rnd() > 0.5;
      ctx.fillStyle = warm ? 'rgba(201,48,48,0.16)' : 'rgba(212,162,74,0.14)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = warm ? 'rgba(255,140,120,0.55)' : 'rgba(240,220,170,0.5)';
      ctx.fillRect(x + 5, y + 5, Math.max(4, w * (0.3 + rnd() * 0.4)), 3);
      ctx.fillStyle = 'rgba(240,236,228,0.18)';
      ctx.fillRect(x + 5, y + h - 10, Math.max(4, w * 0.5), 2);
    }
  }
}

export function LiquidRipple({ ambientStrength = 2.4, rippleStrength = 16 }: LiquidRippleProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const rings = useRef<RingRipple[]>([]);

  const srcCanvas = useRef<HTMLCanvasElement | null>(null);
  const srcData = useRef<ImageData | null>(null);
  const workCanvas = useRef<HTMLCanvasElement | null>(null);
  const workCtx = useRef<CanvasRenderingContext2D | null>(null);
  const workData = useRef<ImageData | null>(null);

  useEffect(() => {
    const src = document.createElement('canvas');
    src.width = BUF_W;
    src.height = BUF_H;
    const sctx = src.getContext('2d')!;
    paintDashboard(sctx, seededRandom(7));
    srcCanvas.current = src;
    srcData.current = sctx.getImageData(0, 0, BUF_W, BUF_H);

    const work = document.createElement('canvas');
    work.width = BUF_W;
    work.height = BUF_H;
    workCanvas.current = work;
    workCtx.current = work.getContext('2d');
    workData.current = workCtx.current!.createImageData(BUF_W, BUF_H);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onDown = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * BUF_W;
      const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * BUF_H;
      rings.current.push({ x, y, born: performance.now() });
      if (rings.current.length > 6) rings.current.shift();
    };
    root.addEventListener('pointerdown', onDown);
    return () => root.removeEventListener('pointerdown', onDown);
  }, []);

  useCanvas2D(
    canvasRef,
    (ctx, size, _dt, elapsed) => {
      const src = srcData.current;
      const wctx = workCtx.current;
      const wdata = workData.current;
      const work = workCanvas.current;
      if (!src || !wctx || !wdata || !work) return;

      const now = performance.now();
      const active = rings.current.filter((r) => now - r.born < 1400);
      rings.current = active;

      const s = src.data;
      const d = wdata.data;
      for (let y = 0; y < BUF_H; y++) {
        for (let x = 0; x < BUF_W; x++) {
          let ox = Math.sin((x * 0.09 + elapsed * 1.1)) * Math.cos(y * 0.08 - elapsed * 0.7) * ambientStrength;
          let oy = Math.cos((y * 0.1 - elapsed * 0.9)) * Math.sin(x * 0.07 + elapsed * 0.8) * ambientStrength;

          for (const ring of active) {
            const age = (now - ring.born) / 1000;
            const radius = age * 130;
            const dx = x - ring.x;
            const dy = y - ring.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
            const band = Math.exp(-Math.pow((dist - radius) / 14, 2));
            const decay = Math.max(0, 1 - age / 1.4);
            const push = band * decay * rippleStrength;
            ox += (dx / dist) * push;
            oy += (dy / dist) * push;
          }

          const sx = Math.max(0, Math.min(BUF_W - 1, Math.round(x + ox)));
          const sy = Math.max(0, Math.min(BUF_H - 1, Math.round(y + oy)));
          const si = (sy * BUF_W + sx) * 4;
          const di = (y * BUF_W + x) * 4;
          d[di] = s[si];
          d[di + 1] = s[si + 1];
          d[di + 2] = s[si + 2];
          d[di + 3] = s[si + 3];
        }
      }
      wctx.putImageData(wdata, 0, 0);

      ctx.clearRect(0, 0, size.w, size.h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(work, 0, 0, BUF_W, BUF_H, 0, 0, size.w, size.h);
    },
    !reduced,
  );

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, cursor: 'pointer', touchAction: 'none' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.4em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
        }}
      >
        LIQUID SURFACE // CLICK TO RIPPLE
      </div>
    </div>
  );
}

export default LiquidRipple;
