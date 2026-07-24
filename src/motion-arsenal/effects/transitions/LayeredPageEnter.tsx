import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { EASE, NOX_COLORS, PHYSICS } from '../../lib/motionPresets';
import { damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// LayeredPageEnter — die neue Seite betritt als tiefengestaffelter
// Layer-Stack: Hintergrund → Panel → Typo-Zeilen → UI-Details, jede Ebene mit
// eigenem Delay-Step (Shopify Nav-Entrance-Cascade: 500ms + 100ms-Steps) und
// leichtem Pointer-Parallax pro Tiefenebene (Lusion-damp).
// ---------------------------------------------------------------------------

export interface LayeredPageEnterProps {
  speed?: number;
  stepMs?: number; // 60 .. 160 — cascade step between layers
  parallax?: number; // 0 .. 1 pointer parallax depth
  accent?: string;
}

const COPY = [
  {
    kicker: 'NOX // FORGE',
    line1: 'ENTER THE',
    line2: 'SYSTEM',
    sub: 'Every layer arrives in order: background, panel, type, detail.',
    chips: ['RANK 04', 'XP 1280', 'SCAN OK'],
    hue: 'rgba(201,48,48,0.16)',
  },
  {
    kicker: 'NOX // SIGNAL',
    line1: 'STACK THE',
    line2: 'LAYERS',
    sub: 'Depth-staggered entrance — the page builds itself like a rig.',
    chips: ['GRID ON', 'NODE 32', 'PING 12'],
    hue: 'rgba(212,162,74,0.14)',
  },
] as const;

export function LayeredPageEnter({
  speed = 1,
  stepMs = 100,
  parallax = 0.5,
  accent = NOX_COLORS.red,
}: LayeredPageEnterProps) {
  const reduced = usePrefersReducedMotion();
  const uid = `lpe${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const [cycle, setCycle] = useState(0);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  const spd = Math.max(0.3, Math.min(3, speed));
  const step = Math.max(60, Math.min(160, stepMs)) / 1000 / spd;
  const base = 0.12 / spd;
  const variant = COPY[cycle % 2];
  const prev = COPY[(cycle + 1) % 2];

  const trigger = useCallback(() => {
    if (busy.current || reduced) return;
    busy.current = true;
    setCycle((c) => c + 1);
    timers.current.push(
      window.setTimeout(() => {
        busy.current = false;
      }, (base + step * 7 + 0.9 / spd) * 1000),
    );
  }, [reduced, base, step, spd]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(trigger, 3500);
    return () => window.clearInterval(id);
  }, [reduced, trigger]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Pointer parallax on depth wrappers (separate element from the
  // keyframe-animated one, so transforms never fight each other).
  const par = useRef({ x: 0, y: 0 });
  useRafLoop((dt) => {
    const p = pointer.current;
    par.current.x = damp(par.current.x, (p.tx - 0.5) * 2, PHYSICS.scrollInertia, dt);
    par.current.y = damp(par.current.y, (p.ty - 0.5) * 2, PHYSICS.scrollInertia, dt);
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
      const d = Number(el.dataset.depth) * parallax * 18;
      el.style.transform = `translate3d(${(-par.current.x * d).toFixed(2)}px, ${(-par.current.y * d).toFixed(2)}px, 0)`;
    });
  }, !reduced && parallax > 0);

  const anim = (delaySteps: number, name: string, durS: number, ease: string) =>
    reduced ? undefined : `${uid}-${name} ${durS / spd}s ${ease} ${base + delaySteps * step}s both`;

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, fontFamily: 'system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes ${uid}-bg {
          from { opacity: 0; transform: scale(1.07); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ${uid}-panel {
          from { opacity: 0; transform: translate3d(0, 12%, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes ${uid}-line {
          from { opacity: 0; transform: translate3d(0, 120%, 0) rotate(2deg); }
          to   { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        @keyframes ${uid}-chip {
          from { opacity: 0; transform: scale(0.6) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      {/* Previous page stays beneath, dimmed — the new stack builds on top */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.25, filter: 'brightness(0.5) blur(1px)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(110% 90% at 50% 0%, ${prev.hue} 0%, #0a0a0b 60%)` }} />
      </div>
      <div key={cycle} style={{ position: 'absolute', inset: 0 }}>
        {/* Layer 1 — background */}
        <div data-depth={0.2} style={{ position: 'absolute', inset: '-4%' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(110% 90% at 50% 0%, ${variant.hue} 0%, #0a0a0b 62%)`,
              animation: anim(0, 'bg', 0.9, EASE.outExpo),
            }}
          />
        </div>
        {/* Layer 2 — panel */}
        <div data-depth={0.5} style={{ position: 'absolute', inset: '10% 8% 12% 8%' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(17,17,20,0.78)',
              border: '1px solid rgba(240,236,228,0.09)',
              borderRadius: 10,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              animation: anim(1.5, 'panel', 0.8, EASE.outExpo),
            }}
          />
        </div>
        {/* Layer 3 — typography (each line its own cascade step) */}
        <div data-depth={0.8} style={{ position: 'absolute', inset: '16% 14%' }}>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                letterSpacing: '0.35em',
                color: accent,
                animation: anim(3, 'line', 0.7, EASE.outExpo),
              }}
            >
              {variant.kicker}
            </div>
          </div>
          {[variant.line1, variant.line2].map((l, i) => (
            <div key={l} style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 46px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.06,
                  color: i === 1 ? accent : NOX_COLORS.text,
                  animation: anim(4 + i, 'line', 0.75, EASE.outExpo),
                }}
              >
                {l}
              </div>
            </div>
          ))}
          <div style={{ overflow: 'hidden', maxWidth: 340 }}>
            <div style={{ fontSize: 11, color: NOX_COLORS.textDim, marginTop: 8, animation: anim(6, 'line', 0.7, EASE.outExpo) }}>
              {variant.sub}
            </div>
          </div>
        </div>
        {/* Layer 4 — UI details */}
        <div data-depth={1} style={{ position: 'absolute', left: '14%', right: '14%', bottom: '16%', display: 'flex', gap: 8 }}>
          {variant.chips.map((c, i) => (
            <span
              key={c}
              style={{
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.18em',
                padding: '5px 10px',
                borderRadius: 999,
                border: `1px solid ${i === 0 ? accent : 'rgba(240,236,228,0.14)'}`,
                color: i === 0 ? accent : NOX_COLORS.textDim,
                background: 'rgba(10,10,11,0.6)',
                animation: anim(7 + i * 0.7, 'chip', 0.55, EASE.outBack),
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={trigger}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 50,
          background: 'rgba(17,17,20,0.8)',
          border: `1px solid ${accent}`,
          color: NOX_COLORS.text,
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          padding: '7px 14px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        ENTER →
      </button>
    </div>
  );
}

export default LayeredPageEnter;
