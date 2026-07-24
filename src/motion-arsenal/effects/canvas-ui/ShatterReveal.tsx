import { useEffect, useRef, useState, type ReactNode } from 'react';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';

// ---------------------------------------------------------------------------
// ShatterReveal — canvas-ui "Shatter" mechanic (canvasui.dev/components/
// shatter): the surface breaks into a grid of glass shards that lift, tilt
// and float around the cursor with real perspective and soft shadow. Source
// there is the live DOM cut into WebGL geometry; here a CSS gradient
// "hero" backdrop is sliced into a DOM grid of shards, each carrying a
// pixel-aligned background-position offset so the pieces read as one
// coherent surface, then driven per-frame with damped rotateX/Y/Z from
// pointer distance (one physics source, no CSS transitions fighting rAF).
// ---------------------------------------------------------------------------

export interface ShatterRevealProps {
  cols?: number; // 4..12
  rows?: number; // 3..8
  liftRadius?: number; // 0.15..0.6 — influence radius in uv units
  liftStrength?: number; // 0..60 — max translateZ in px
}

const BG_IMAGE =
  'linear-gradient(135deg, #1a0a0a 0%, #0a0a0b 42%, #241505 78%, #0a0a0b 100%), ' +
  'radial-gradient(circle at 28% 22%, rgba(201,48,48,0.4), transparent 58%), ' +
  'radial-gradient(circle at 76% 72%, rgba(212,162,74,0.32), transparent 55%)';

export function ShatterReveal({ cols = 8, rows = 5, liftRadius = 0.32, liftStrength = 46 }: ShatterRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: 0.5, y: 0.5 });
  const shardState = useRef<Array<{ z: number; rx: number; ry: number }>>([]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = cols * rows;
  if (shardState.current.length !== total) {
    shardState.current = Array.from({ length: total }, () => ({ z: 0, rx: 0, ry: 0 }));
  }

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    const targetInside = reduced ? false : p.inside;
    dampedPtr.current.x = damp(dampedPtr.current.x, targetInside ? p.tx : 0.5, 9, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, targetInside ? p.ty : 0.5, 9, dt);

    if (!size.w || !size.h) return;
    const aspect = size.w / Math.max(size.h, 1);
    const px = dampedPtr.current.x;
    const py = dampedPtr.current.y;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const cx = (col + 0.5) / cols;
        const cy = (row + 0.5) / rows;
        const dx = (cx - px) * aspect;
        const dy = cy - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const fall = targetInside ? Math.max(0, 1 - dist / liftRadius) : 0;
        const eased = fall * fall * (3 - 2 * fall);

        const st = shardState.current[idx];
        st.z = damp(st.z, eased * liftStrength, 10, dt);
        st.rx = damp(st.rx, (cy - py) * eased * -26, 10, dt);
        st.ry = damp(st.ry, (cx - px) * eased * 26, 10, dt);

        const el = shardRefs.current[idx];
        if (el) {
          el.style.transform = `translateZ(${st.z.toFixed(1)}px) rotateX(${st.rx.toFixed(1)}deg) rotateY(${st.ry.toFixed(1)}deg)`;
          el.style.boxShadow = eased > 0.02 ? `0 ${(6 + st.z * 0.4).toFixed(0)}px ${(10 + st.z).toFixed(0)}px rgba(0,0,0,${(0.35 + eased * 0.25).toFixed(2)})` : 'none';
          el.style.filter = eased > 0.02 ? `brightness(${(1 + eased * 0.35).toFixed(2)})` : 'none';
        }
      }
    }
  }, true);

  const shardW = size.w / cols;
  const shardH = size.h / rows;
  const shards: ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      shards.push(
        <div
          key={idx}
          ref={(el) => {
            shardRefs.current[idx] = el;
          }}
          style={{
            position: 'absolute',
            left: col * shardW,
            top: row * shardH,
            width: shardW + 0.5,
            height: shardH + 0.5,
            backgroundImage: BG_IMAGE,
            backgroundSize: `${size.w}px ${size.h}px`,
            backgroundPosition: `${-col * shardW}px ${-row * shardH}px`,
            border: '1px solid rgba(255,255,255,0.03)',
            willChange: 'transform',
          }}
        />,
      );
    }
  }

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, touchAction: 'none' }}
    >
      <div style={{ position: 'absolute', inset: 0, perspective: 700 }}>{size.w > 0 && shards}</div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.42em', color: NOX_COLORS.textDim }}>
          SHATTER FIELD // {reduced ? 'FROZEN' : hoverCapable ? 'TRACK' : 'DRIFT'}
        </div>
        <div style={{ fontSize: 'clamp(22px, 5cqw, 46px)', fontWeight: 800, letterSpacing: '-0.02em', color: NOX_COLORS.text }}>
          REFRACT
        </div>
      </div>
    </div>
  );
}

export default ShatterReveal;
