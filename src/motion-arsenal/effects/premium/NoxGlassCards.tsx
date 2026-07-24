import { useEffect, useRef, useState } from 'react';
import { clamp, damp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { GLSL_NOISE, useShaderQuad } from '../../lib/canvasUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxGlassCards — Active-Theory-Klasse lokaler 3D-Glaskarten, NOX-Adaption.
// Mechanik aus der Hydra-Forensik: Effekt lebt IM Element (per-card Szene),
// uMouse/uHover werden gelerpt (framerate-normalisiert via damp λ 8–12), der
// Glass-Look kommt aus einem eigenen Fragment-Shader: Fresnel-Leuchtsaum an
// den Kartenrändern ((1−N·V)^p-Näherung über UV-Randdistanz) + Refraktion
// eines prozeduralen NOX-Grids (uv-Offset ∝ Linsen-Bump um den Pointer).
// Kontext-Budget: EIN WebGL-Kontext, der zur aktiven (gehoverten) Karte
// wandert. Ruhende/gesperrte Karten fallen auf reines CSS zurück (Tilt +
// Gloss-Sweep) — dieselbe Fallback-Kette, die Shopify Editions produktiv
// fährt (full → reduced → static).
// ---------------------------------------------------------------------------

export interface NoxGlassCardsProps {
  tilt?: number; // 0..14 — max Grad Kartenneigung zur Pointerposition
  refraction?: number; // 0..0.12 — UV-Verschiebung der Glaslinse
  fresnel?: number; // 1..6 — Exponent des Randleuchtens
  gridScale?: number; // 6..26 — Frequenz des refraktierten NOX-Grids
}

const DEMO_CARDS = [
  { tag: 'MODUL 01', title: 'Leadgen Engine', body: 'Zielgruppen, Suchpfade und Anfragepunkte als wiederholbarer Leadfluss.' },
  { tag: 'MODUL 02', title: 'AI Agent Stack', body: 'Agenten übernehmen Recherche, Anreicherung und Follow-up-Routinen.' },
  { tag: 'MODUL 03', title: 'Conversion Layer', body: 'Website, CTA-Logik und Nachfasskette als eine Entscheidungsstrecke.' },
];

const FRAGMENT = `${GLSL_NOISE}
uniform float u_hover;      // 0..1 gelerpter Hover-Zustand
uniform float u_refraction; // UV-Offset-Stärke der Linse
uniform float u_fresnel;    // Randleucht-Exponent
uniform float u_scale;      // Grid-Frequenz

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 m = u_pointer;

  // Linsen-Bump: weiche Glocke um den Pointer verschiebt die Grid-UVs —
  // die Refraktions-Mechanik der Active-Theory-Karten, eigene Implementierung.
  float d = distance(uv, m);
  float bump = smoothstep(0.55, 0.0, d);
  vec2 dir = d > 0.0001 ? (uv - m) / d : vec2(0.0);
  vec2 ruv = uv + dir * bump * u_refraction * u_hover;

  // Prozedurales NOX-Grid als "Szene hinter dem Glas".
  vec2 g = ruv * u_scale;
  vec2 cell = abs(fract(g) - 0.5);
  float line = smoothstep(0.47, 0.5, max(cell.x, cell.y));
  float depth = fbm(ruv * 3.0 + u_time * 0.06);

  vec3 col = vec3(0.030, 0.030, 0.034);
  col += vec3(0.16, 0.15, 0.15) * line * (0.35 + 0.65 * depth);
  col += vec3(0.79, 0.19, 0.19) * line * bump * u_hover * 0.55;

  // Fresnel-Näherung über die UV-Randdistanz: flacher Blickwinkel am Rand
  // → Leuchtsaum. rim = (1 - randabstand)^p.
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float rim = pow(1.0 - clamp(edge * 6.0, 0.0, 1.0), u_fresnel);
  col += vec3(1.0, 0.42, 0.42) * rim * (0.10 + 0.50 * u_hover);

  // Specular-Streak: schmales diagonales Glanzband, wandert mit dem Pointer.
  float streak = smoothstep(0.10, 0.0, abs((uv.x + uv.y) * 0.5 - m.x * 0.9 - 0.06));
  col += vec3(0.95, 0.88, 0.84) * streak * u_hover * 0.10;

  // Innenraum leicht abdunkeln, damit DOM-Text lesbar bleibt.
  col *= 1.0 - 0.30 * smoothstep(0.42, 0.0, edge * 3.0);

  gl_FragColor = vec4(col, 0.92);
}
`;

export function NoxGlassCards({
  tilt = 8,
  refraction = 0.055,
  fresnel = 3.2,
  gridScale = 14,
}: NoxGlassCardsProps) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Pro Karte gedämpfte Tilt-Physik (eine Quelle, DOM-Vars als Ausgabe).
  const phys = useRef(
    DEMO_CARDS.map(() => ({ rx: 0, ry: 0, trx: 0, try_: 0, hover: 0, thover: 0 })),
  );
  const pointer = useRef({ x: 0.5, y: 0.5 });

  useRafLoop((dt) => {
    phys.current.forEach((p, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      p.rx = damp(p.rx, p.trx, 9, dt);
      p.ry = damp(p.ry, p.try_, 9, dt);
      p.hover = damp(p.hover, p.thover, 8, dt);
      el.style.setProperty('--gc-rx', `${p.rx.toFixed(3)}deg`);
      el.style.setProperty('--gc-ry', `${p.ry.toFixed(3)}deg`);
      el.style.setProperty('--gc-hover', p.hover.toFixed(3));
    });
  }, !reduced);

  useShaderQuad(canvasRef, {
    fragment: FRAGMENT,
    running: !reduced && active !== null,
    frozenTime: 3,
    pointerRef: pointer,
    dprCap: 1.5,
    uniforms: {
      u_hover: active !== null ? 1 : 0,
      u_refraction: refraction,
      u_fresnel: fresnel,
      u_scale: gridScale,
    },
  });

  // Der eine Canvas wandert zur aktiven Karte (Kontext-Budget: 1).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = active !== null ? cardRefs.current[active] : null;
    const slot = host?.querySelector('.ngc-glass-slot');
    if (slot) {
      slot.appendChild(canvas);
      // Inline-Größe der Parkposition überschreiben — sonst bleibt der
      // Canvas 1×1 (Inline-Style gewinnt gegen die Slot-CSS-Klasse).
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.inset = '0';
      canvas.style.opacity = '1';
    } else {
      canvas.style.width = '1px';
      canvas.style.height = '1px';
      canvas.style.opacity = '0';
    }
  }, [active]);

  const onMove = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = cardRefs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
    pointer.current.x = nx;
    pointer.current.y = ny;
    const p = phys.current[i];
    p.try_ = (nx - 0.5) * tilt;
    p.trx = -(ny - 0.5) * tilt;
    p.thover = 1;
  };

  const onLeave = (i: number) => () => {
    const p = phys.current[i];
    p.trx = 0;
    p.try_ = 0;
    p.thover = 0;
    setActive((a) => (a === i ? null : a));
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3cqw, 32px)',
      }}
    >
      <style>{`
        .ngc-card {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          max-width: 320px;
          border-radius: 12px;
          border: 1px solid rgba(240, 236, 228, 0.10);
          background: linear-gradient(160deg, rgba(24,24,27,0.92), rgba(13,13,15,0.96));
          padding: clamp(14px, 2.4cqw, 26px);
          transform: perspective(900px) rotateX(var(--gc-rx, 0deg)) rotateY(var(--gc-ry, 0deg))
            translateZ(calc(var(--gc-hover, 0) * 10px));
          transform-style: preserve-3d;
          transition: border-color 0.4s ${EASE.outExpo};
          will-change: transform;
        }
        .ngc-card:hover { border-color: rgba(201, 48, 48, 0.45); }
        .ngc-glass-slot {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          overflow: hidden;
          pointer-events: none;
        }
        .ngc-glass-slot canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity 0.35s ease;
        }
        /* CSS-Fallback-Gloss für ruhende Karten (und reduced motion). */
        .ngc-gloss {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          pointer-events: none;
          background: linear-gradient(115deg, transparent 42%, rgba(255,241,244,0.05) 50%, transparent 58%);
          opacity: calc(1 - var(--gc-hover, 0));
        }
        .ngc-rim {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          pointer-events: none;
          box-shadow: inset 0 0 22px rgba(201, 48, 48, calc(var(--gc-hover, 0) * 0.22)),
            0 24px 60px -32px rgba(201, 48, 48, calc(var(--gc-hover, 0) * 0.8));
        }
        .ngc-content { position: relative; z-index: 2; transform: translateZ(24px); }
      `}</style>

      <div style={{ display: 'flex', gap: 'clamp(10px, 2cqw, 22px)', width: '100%', maxWidth: 940, justifyContent: 'center' }}>
        {DEMO_CARDS.map((card, i) => (
          <div
            key={card.tag}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="ngc-card"
            onPointerMove={onMove(i)}
            onPointerEnter={() => !reduced && setActive(i)}
            onPointerLeave={onLeave(i)}
          >
            <div className="ngc-glass-slot" />
            <div className="ngc-gloss" />
            <div className="ngc-rim" />
            <div className="ngc-content">
              <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.34em', color: NOX_COLORS.red, marginBottom: 10 }}>
                {card.tag}
              </div>
              <div style={{ fontSize: 'clamp(15px, 1.9cqw, 20px)', fontWeight: 750, color: NOX_COLORS.text, marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.55, color: NOX_COLORS.textDim }}>{card.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Der wandernde Glass-Kontext startet unsichtbar außerhalb der Karten. */}
      <canvas ref={canvasRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default NoxGlassCards;
