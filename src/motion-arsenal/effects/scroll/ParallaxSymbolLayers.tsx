import { useMemo, useRef } from 'react';
import { clamp, damp, lerp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath, loopScribblePath, scribblePath } from '../../lib/svgUtils';

// ---------------------------------------------------------------------------
// ParallaxSymbolLayers — ORYZO-Tiefenstaffelung als Scroll-Variante:
// 3–4 Layer aus prozeduralen Scribbles/Glyphen (svgUtils) bewegen sich mit
// unterschiedlichen Scroll-Geschwindigkeiten; hintere Layer sind geblurrt +
// gedimmt (Depth of Field), der vorderste Layer läuft ÜBER dem Text als
// Occlusion-Schicht. Progress kommt aus dem internen Scroll-Container und
// wird damped (λ≈8) — Lenis-Deceleration-Gefühl statt 1:1-Kopplung.
// ---------------------------------------------------------------------------

export interface ParallaxSymbolLayersProps {
  layers?: number; // 3..4 depth layers
  travel?: number; // parallax travel strength (0.3..1.2)
  blurMax?: number; // px blur on the deepest layer
  damping?: number;
  colorMode?: 'nox' | 'ember' | 'mono';
  seed?: number;
}

const PALETTES: Record<string, string[]> = {
  nox: [NOX_COLORS.red, NOX_COLORS.gold, NOX_COLORS.redBright, '#8a4a1f'],
  ember: ['#ff5a2e', NOX_COLORS.red, '#ffb347', '#7a1f1f'],
  mono: [NOX_COLORS.text, NOX_COLORS.textDim, '#5a5852', NOX_COLORS.text],
};

const CONTENT = [
  { kicker: 'LAYER 01', title: 'DEPTH', body: 'Vier Ebenen, vier Geschwindigkeiten — der Raum entsteht aus der Differenz.' },
  { kicker: 'LAYER 02', title: 'SIGNAL', body: 'Hinten unscharf, vorne scharf: die Blur-Staffelung ist das Tiefensignal.' },
  { kicker: 'LAYER 03', title: 'FIELD', body: 'Prozedurale Glyphen statt Assets — das Feld ist deterministisch geseedet.' },
  { kicker: 'LAYER 04', title: 'SYSTEM', body: 'Der vorderste Layer schneidet über den Text: Okklusion verkauft die Tiefe.' },
];

export function ParallaxSymbolLayers({
  layers = 4,
  travel = 0.7,
  blurMax = 6,
  damping = 8,
  colorMode = 'nox',
  seed = 5,
}: ParallaxSymbolLayersProps) {
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(0);
  const nLayers = clamp(Math.round(layers), 2, 4);

  const layerDefs = useMemo(() => {
    const rnd = seededRandom(seed * 7 + 1);
    const palette = PALETTES[colorMode] ?? PALETTES.nox;
    return Array.from({ length: nLayers }, (_, li) => {
      const depth = nLayers === 1 ? 1 : li / (nLayers - 1); // 0 = back, 1 = front
      const count = 6 - Math.round(depth * 2);
      const items = Array.from({ length: count }, (_, k) => {
        const kind = rnd();
        const s = Math.floor(rnd() * 9999) + li * 131 + k * 17;
        const d =
          kind < 0.4
            ? scribblePath(s, 220, 200, 5 + Math.floor(rnd() * 3), 0.5 + rnd() * 0.4)
            : kind < 0.75
              ? loopScribblePath(s, 55 + rnd() * 45, 2 + Math.floor(rnd() * 2), 0.3)
              : glyphPath(s, 140);
        return {
          d,
          x: 4 + rnd() * 84,
          y: 4 + rnd() * 130, // % of the (taller) layer sheet
          size: 10 + rnd() * 10 + depth * 10,
          rot: rnd() * 60 - 30,
          color: palette[Math.floor(rnd() * palette.length)],
          width: 1.2 + rnd() * 1.6,
        };
      });
      return {
        depth,
        speed: lerp(0.18, 1, depth),
        blur: (1 - depth) * blurMax,
        opacity: lerp(0.4, 0.95, depth),
        front: li === nLayers - 1,
        items,
      };
    });
  }, [seed, colorMode, nLayers, blurMax]);

  useRafLoop(
    (dt) => {
      const el = scrollerRef.current;
      const root = rootRef.current;
      if (!el || !root) return;
      const raw = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      smooth.current = damp(smooth.current, raw, damping, dt);
      root.querySelectorAll<HTMLElement>('[data-psl-speed]').forEach((layer) => {
        const speed = Number(layer.dataset.pslSpeed);
        // Layer sheets are 175% tall — travel the extra 75% scaled by depth speed.
        const y = -smooth.current * travel * speed * 42; // % of sheet height
        layer.style.transform = `translate3d(0, ${y.toFixed(3)}%, 0)`;
      });
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: 'radial-gradient(120% 90% at 50% 115%, #150a0c 0%, #0a0a0b 58%)' }}>
      <style>{`
        .psl-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .psl-scroll::-webkit-scrollbar { width: 6px; }
        .psl-scroll::-webkit-scrollbar-track { background: transparent; }
        .psl-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
      `}</style>
      {/* Depth layers (front layer sits ABOVE the text for occlusion) */}
      {layerDefs.map((l, li) => (
        <div
          key={li}
          data-psl-speed={l.speed}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '175%',
            zIndex: l.front ? 3 : 1,
            pointerEvents: 'none',
            filter: l.blur > 0.2 ? `blur(${l.blur.toFixed(1)}px)` : undefined,
            opacity: l.front ? l.opacity * 0.75 : l.opacity,
            transform: reduced ? `translate3d(0, ${(-0.5 * travel * l.speed * 42).toFixed(2)}%, 0)` : 'translate3d(0,0,0)',
            willChange: 'transform',
            mixBlendMode: 'screen',
          }}
        >
          {l.items.map((it, k) => (
            <svg
              key={k}
              viewBox="0 0 220 200"
              style={{
                position: 'absolute',
                left: `${it.x}%`,
                top: `${it.y / 1.75}%`,
                width: `${it.size}%`,
                aspectRatio: '1.1',
                overflow: 'visible',
                transform: `rotate(${it.rot}deg)`,
              }}
            >
              <path
                d={it.d}
                fill="none"
                stroke={it.color}
                strokeWidth={it.width * 3}
                strokeLinecap="round"
                style={{ filter: `blur(${(4 + l.depth * 4).toFixed(1)}px)`, opacity: 0.7 }}
              />
              <path d={it.d} fill="none" stroke={it.color} strokeWidth={it.width} strokeLinecap="round" style={{ opacity: 0.95 }} />
            </svg>
          ))}
        </div>
      ))}
      {/* Internal scroll container with the readable content */}
      <div ref={scrollerRef} className="psl-scroll" style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {CONTENT.map((c) => (
          <div key={c.kicker} style={{ height: '92cqh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '72%', textShadow: '0 2px 18px rgba(10,10,11,0.9)' }}>
              <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.34em', color: NOX_COLORS.textDim, marginBottom: 6 }}>{c.kicker}</div>
              <div style={{ fontSize: 'clamp(22px, 9cqw, 52px)', fontWeight: 800, letterSpacing: '-0.02em', color: NOX_COLORS.text, lineHeight: 0.95 }}>{c.title}</div>
              <div style={{ fontSize: 'clamp(10px, 2.4cqw, 13px)', lineHeight: 1.6, color: NOX_COLORS.textDim, marginTop: 10 }}>{c.body}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom vignette to seat the field */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(10,10,11,0.5) 0%, transparent 14%, transparent 86%, rgba(10,10,11,0.6) 100%)' }} />
    </div>
  );
}

export default ParallaxSymbolLayers;
