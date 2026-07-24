import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';

// ---------------------------------------------------------------------------
// ParticleObject — canvas-ui "Particle Object" mechanic (canvasui.dev/
// components/particle-object): rebuilds any image/SVG/3D-model as a particle
// cloud that scatters around the cursor and springs back into shape.
// canvas-ui also accepts GLB/glTF; this NOX variant scopes to raster/SVG
// assets sampled straight into a 2D point cloud (no GLTFLoader, no new
// dependency — stays inside the arsenal's "no extra packages" contract).
//
// This is the one component in the arsenal you can hand a real asset: drop
// an image or .svg directly onto the preview (or use the file button) and
// it re-samples live, right here in the gallery — no need to route it
// through a build step first. Falls back to a procedural NOX emblem when
// nothing has been dropped yet.
// ---------------------------------------------------------------------------

export interface ParticleObjectProps {
  particleSize?: number; // 1..4
  springStrength?: number; // 4..30
  repelRadius?: number; // 0.08..0.4 uv units
}

interface Particle {
  hx: number; hy: number; // home position, uv (0..1)
  x: number; y: number; // current px (set on first layout)
  vx: number; vy: number;
  color: string;
}

const SAMPLE_STEP = 4;
const MAX_PARTICLES = 3400;
// Below this luminance a pixel renders as a black dot on the arsenal's black
// stage — invisible. Wasting particle budget on it makes dropped photos read
// as "barely there". Only applied to fully-opaque sources (photos); images
// that actually use transparency (logos/cutouts) keep their black ink.
const MIN_LUMINANCE = 16;

function sampleCanvasToParticles(src: HTMLCanvasElement): Particle[] {
  const { width: w, height: h } = src;
  const ctx = src.getContext('2d')!;
  const data = ctx.getImageData(0, 0, w, h).data;

  let hasTransparency = false;
  for (let i = 3; i < data.length; i += 4 * 37) {
    if (data[i] < 250) { hasTransparency = true; break; }
  }

  const out: Particle[] = [];
  for (let y = 0; y < h; y += SAMPLE_STEP) {
    for (let x = 0; x < w; x += SAMPLE_STEP) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 40) continue;
      if (!hasTransparency) {
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luminance < MIN_LUMINANCE) continue;
      }
      out.push({ hx: x / w, hy: y / h, x: 0, y: 0, vx: 0, vy: 0, color: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})` });
    }
  }
  if (out.length > MAX_PARTICLES) {
    const rnd = seededRandom(11);
    return out.filter(() => rnd() < MAX_PARTICLES / out.length);
  }
  return out;
}

function drawDefaultEmblem(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d')!;
  const { width: w, height: h } = c;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = NOX_COLORS.gold;
  ctx.lineWidth = w * 0.02;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = NOX_COLORS.red;
  ctx.lineWidth = w * 0.028;
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.28);
  ctx.lineTo(w / 2, h * 0.72);
  ctx.moveTo(w * 0.28, h / 2);
  ctx.lineTo(w * 0.72, h / 2);
  ctx.stroke();
  ctx.fillStyle = NOX_COLORS.text;
  ctx.font = `800 ${Math.round(w * 0.1)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NOX', w / 2, h * 0.5);
}

export function ParticleObject({ particleSize = 2.4, springStrength = 14, repelRadius = 0.18 }: ParticleObjectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const particles = useRef<Particle[]>([]);
  const laidOut = useRef(false);
  const imageAspect = useRef(1);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: 0.5, y: 0.5, active: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [assetLabel, setAssetLabel] = useState('NOX EMBLEM (DEFAULT)');

  const loadFromSource = useCallback((source: CanvasImageSource, w: number, h: number) => {
    const buf = document.createElement('canvas');
    const BUF = 260;
    const aspect = w / h;
    buf.width = aspect >= 1 ? BUF : Math.round(BUF * aspect);
    buf.height = aspect >= 1 ? Math.round(BUF / aspect) : BUF;
    const bctx = buf.getContext('2d')!;
    bctx.drawImage(source, 0, 0, buf.width, buf.height);
    particles.current = sampleCanvasToParticles(buf);
    imageAspect.current = buf.width / buf.height;
    laidOut.current = false;
  }, []);

  const loadDefault = useCallback(() => {
    const buf = document.createElement('canvas');
    buf.width = 220;
    buf.height = 220;
    drawDefaultEmblem(buf);
    particles.current = sampleCanvasToParticles(buf);
    imageAspect.current = 1;
    laidOut.current = false;
    setAssetLabel('NOX EMBLEM (DEFAULT)');
  }, []);

  useEffect(() => {
    loadDefault();
  }, [loadDefault]);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        loadFromSource(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        setAssetLabel(file.name.toUpperCase());
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    },
    [loadFromSource],
  );

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : dampedPtr.current.x, 10, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : dampedPtr.current.y, 10, dt);
    dampedPtr.current.active = damp(dampedPtr.current.active, p.inside || !hoverCapable ? 1 : 0, 6, dt);
  }, !reduced);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt) => {
      ctx.clearRect(0, 0, size.w, size.h);
      const list = particles.current;
      if (!list.length) return;

      // Contain-fit the sampled cloud's own aspect ratio inside the available
      // box instead of stretching it to a fixed box — a wide photo like a
      // landscape shot must keep its proportions, not get squeezed square.
      const availW = size.w * 0.86;
      const availH = size.h * 0.86;
      const aspect = imageAspect.current;
      let boxW: number;
      let boxH: number;
      if (aspect >= availW / availH) {
        boxW = availW;
        boxH = availW / aspect;
      } else {
        boxH = availH;
        boxW = availH * aspect;
      }
      const offX = (size.w - boxW) / 2;
      const offY = (size.h - boxH) / 2;

      ctx.globalCompositeOperation = 'lighter';
      const px = dampedPtr.current.x * size.w;
      const py = dampedPtr.current.y * size.h;
      const active = dampedPtr.current.active;
      const repelPx = repelRadius * Math.max(size.w, size.h);

      for (const pt of list) {
        const tx = offX + pt.hx * boxW;
        const ty = offY + pt.hy * boxH;
        if (!laidOut.current) {
          pt.x = tx;
          pt.y = ty;
        }

        let fx = (tx - pt.x) * springStrength;
        let fy = (ty - pt.y) * springStrength;

        if (active > 0.01) {
          const dx = pt.x - px;
          const dy = pt.y - py;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
          if (dist < repelPx) {
            const push = ((repelPx - dist) / repelPx) * 900 * active;
            fx += (dx / dist) * push;
            fy += (dy / dist) * push;
          }
        }

        pt.vx = (pt.vx + fx * dt) * 0.86;
        pt.vy = (pt.vy + fy * dt) * 0.86;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;

        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - particleSize / 2, pt.y - particleSize / 2, particleSize, particleSize);
      }
      laidOut.current = true;
    },
    !reduced,
  );

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, touchAction: 'none' }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type.startsWith('image/') || file.name.endsWith('.svg'))) handleFile(file);
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          right: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.3em',
          color: NOX_COLORS.textDim,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assetLabel}</span>
        <span style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontFamily: 'inherit',
              fontSize: 9,
              letterSpacing: '0.2em',
              color: NOX_COLORS.text,
              background: 'rgba(212,162,74,0.14)',
              border: `1px solid ${NOX_COLORS.gold}55`,
              borderRadius: 5,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            DROP / SELECT
          </button>
          <button
            onClick={loadDefault}
            style={{
              fontFamily: 'inherit',
              fontSize: 9,
              letterSpacing: '0.2em',
              color: NOX_COLORS.textDim,
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 5,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            RESET
          </button>
        </span>
      </div>

      {dragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 10,
            border: `1.5px dashed ${NOX_COLORS.red}`,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(201,48,48,0.06)',
            pointerEvents: 'none',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 11,
            letterSpacing: '0.2em',
            color: NOX_COLORS.redBright,
          }}
        >
          DROP TO SAMPLE
        </div>
      )}
    </div>
  );
}

export default ParticleObject;
