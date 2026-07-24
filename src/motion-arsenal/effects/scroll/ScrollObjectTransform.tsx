import { useRef, useState } from 'react';
import { clamp, damp, lerp, smoothstep, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScrollObjectTransform — scroll-getriebene Keyframe-Stationen wie die
// Theatre.js-Timeline der Shopify-Editions-Szenen (Scroll-Position →
// Timeline-Frame): ein Objekt wandert/rotiert/morpht (border-radius-Morph)
// durch klare Stationen, mit smoothstep-Mapping zwischen den Stationen und
// damped Progress (Lenis-Deceleration-Gefühl). Ein Echo-Ghost mit halber
// Damping-Lambda hinkt hinterher und gibt Tiefe.
// ---------------------------------------------------------------------------

export interface ScrollObjectTransformProps {
  stations?: number; // 2..6 keyframe stations
  damping?: number; // smoothing lambda of the scroll progress
  spin?: number; // rotation multiplier across the journey
  morph?: number; // 0..1 — strength of the border-radius morph
  showRail?: boolean; // station dots on the right
}

interface Station {
  x: number; // % of container width
  y: number; // % of container height
  rot: number; // deg
  s: number; // scale
  br: [number, number, number, number]; // corner radii (%)
  c: string;
  label: string;
}

const ALL_STATIONS: Station[] = [
  { x: 24, y: 26, rot: 0, s: 1, br: [50, 50, 50, 50], c: NOX_COLORS.red, label: 'INIT — ORB' },
  { x: 70, y: 30, rot: 120, s: 0.78, br: [14, 14, 14, 14], c: NOX_COLORS.gold, label: 'LOCK — CORE' },
  { x: 32, y: 52, rot: 250, s: 1.28, br: [62, 38, 58, 42], c: NOX_COLORS.redBright, label: 'FLOW — BLOB' },
  { x: 71, y: 62, rot: 340, s: 0.92, br: [30, 70, 26, 74], c: NOX_COLORS.glowOrange, label: 'SHIFT — DRIFT' },
  { x: 46, y: 76, rot: 470, s: 1.36, br: [50, 50, 50, 50], c: NOX_COLORS.gold, label: 'PEAK — SPHERE' },
  { x: 52, y: 42, rot: 560, s: 1.05, br: [22, 78, 44, 56], c: NOX_COLORS.red, label: 'SEAL — SIGNET' },
];

function mixCorner(a: [number, number, number, number], b: [number, number, number, number], f: number, morph: number) {
  const m = (v: number) => 50 + (v - 50) * morph;
  const r = a.map((v, k) => lerp(m(v), m(b[k]), f));
  return `${r[0].toFixed(1)}% ${r[1].toFixed(1)}% ${r[2].toFixed(1)}% ${r[3].toFixed(1)}% / ${r[3].toFixed(1)}% ${r[2].toFixed(1)}% ${r[1].toFixed(1)}% ${r[0].toFixed(1)}%`;
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
}

export function ScrollObjectTransform({
  stations = 4,
  damping = 8,
  spin = 1,
  morph = 1,
  showRail = true,
}: ScrollObjectTransformProps) {
  const reduced = usePrefersReducedMotion();
  const n = clamp(Math.round(stations), 2, ALL_STATIONS.length);
  const defs = ALL_STATIONS.slice(0, n);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const objRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(0);
  const ghostSmooth = useRef(0);
  const [active, setActive] = useState(0);

  const applyState = (el: HTMLDivElement, t: number, ghost: boolean) => {
    const i = clamp(Math.floor(t), 0, n - 2);
    const f = smoothstep(0, 1, t - i);
    const a = defs[i];
    const b = defs[i + 1];
    const x = lerp(a.x, b.x, f);
    const y = lerp(a.y, b.y, f);
    const rot = lerp(a.rot, b.rot, f) * spin;
    const s = lerp(a.s, b.s, f) * (ghost ? 1.18 : 1);
    const color = mixHex(a.c, b.c, f);
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.transform = `translate(-50%, -50%) rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`;
    el.style.borderRadius = mixCorner(a.br, b.br, f, morph);
    if (ghost) {
      el.style.borderColor = color;
    } else {
      el.style.background = `linear-gradient(135deg, ${color} 0%, rgba(10,10,11,0.9) 78%)`;
      el.style.boxShadow = `0 0 34px color-mix(in srgb, ${color} 40%, transparent), inset 0 0 18px rgba(10,10,11,0.55)`;
    }
  };

  useRafLoop(
    (dt) => {
      const el = scrollerRef.current;
      const obj = objRef.current;
      const ghost = ghostRef.current;
      if (!el || !obj || !ghost) return;
      const raw = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      smooth.current = damp(smooth.current, raw, damping, dt);
      ghostSmooth.current = damp(ghostSmooth.current, raw, damping * 0.45, dt);
      const t = smooth.current * (n - 1);
      applyState(obj, t, false);
      applyState(ghost, ghostSmooth.current * (n - 1), true);
      const ai = clamp(Math.round(t), 0, n - 1);
      setActive((prev) => (prev === ai ? prev : ai));
    },
    !reduced,
  );

  // Reduced motion: object rests at the final station.
  const restT = n - 1;
  const rest = defs[reduced ? n - 1 : 0];
  const restStyle = {
    left: `${rest.x}%`,
    top: `${rest.y}%`,
    transform: `translate(-50%, -50%) rotate(${(reduced ? defs[n - 1].rot : 0) * spin}deg) scale(${rest.s})`,
    borderRadius: mixCorner(rest.br, rest.br, 0, morph),
  } as const;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: 'radial-gradient(120% 110% at 80% 100%, #120d0e 0%, #0a0a0b 62%)' }}>
      <style>{`
        .sot-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .sot-scroll::-webkit-scrollbar { width: 6px; }
        .sot-scroll::-webkit-scrollbar-track { background: transparent; }
        .sot-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
        .sot-dot { transition: transform 0.5s ${EASE.outBack}, background-color 0.3s ${EASE.outExpo}, box-shadow 0.3s ${EASE.outExpo}; }
      `}</style>
      {/* Non-scrolling stage overlay — object is driven purely by progress */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <div
          ref={ghostRef}
          style={{
            position: 'absolute',
            width: 'min(20cqw, 20cqh)',
            aspectRatio: '1',
            border: `1px dashed ${rest.c}`,
            opacity: 0.35,
            filter: 'blur(1.5px)',
            willChange: 'transform, border-radius',
            ...restStyle,
          }}
        />
        <div
          ref={objRef}
          style={{
            position: 'absolute',
            width: 'min(20cqw, 20cqh)',
            aspectRatio: '1',
            background: `linear-gradient(135deg, ${rest.c} 0%, rgba(10,10,11,0.9) 78%)`,
            boxShadow: `0 0 34px color-mix(in srgb, ${rest.c} 40%, transparent)`,
            willChange: 'transform, border-radius',
            ...restStyle,
          }}
        >
          <div style={{ position: 'absolute', inset: '30%', borderRadius: 'inherit', border: '1px solid rgba(240,236,228,0.35)' }} />
        </div>
        {showRail && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {defs.map((d, i) => {
              const on = reduced ? i <= restT : i === active;
              return (
                <div
                  key={d.label}
                  className="sot-dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: on ? d.c : 'rgba(240,236,228,0.18)',
                    transform: on ? 'scale(1.5)' : 'scale(1)',
                    boxShadow: on ? `0 0 10px ${d.c}` : 'none',
                  }}
                />
              );
            })}
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.3em', color: NOX_COLORS.textDim }}>
          TRANSFORM // {defs[reduced ? n - 1 : active].label}
        </div>
      </div>
      {/* Internal scroll container with the station sections */}
      <div ref={scrollerRef} className="sot-scroll" style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {defs.map((d, i) => (
          <div key={d.label} style={{ height: '100cqh', display: 'flex', alignItems: 'flex-end', padding: 'clamp(10px, 4%, 28px)' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.32em', color: d.c }}>
                STATION {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 'clamp(13px, 3.6cqw, 22px)', fontWeight: 750, letterSpacing: '-0.02em', color: NOX_COLORS.text, opacity: 0.9 }}>
                {d.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScrollObjectTransform;
