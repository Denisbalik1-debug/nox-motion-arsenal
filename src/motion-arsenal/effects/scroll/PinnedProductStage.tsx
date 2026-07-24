import { useMemo, useRef, useState } from 'react';
import { clamp, damp, lerp, smoothstep, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';

// ---------------------------------------------------------------------------
// PinnedProductStage — Shopify-Editions-Szenen-Mechanik als CSS-Variante:
// eine Stage bleibt gepinnt (position:sticky im internen Scroller) während
// Text-Sektionen durchscrollen. Der Scroll-Progress wird wie bei
// Lenis→Theatre in einen "Timeline-Frame" übersetzt: das prozedurale
// 3D-CSS-Emblem rotiert/skaliert/färbt sich pro Abschnitt über
// smoothstep-Keyframe-Stationen. Progress wird damped (λ≈8) für das
// Lenis-Deceleration-Gefühl (~1.2–1.5s).
// ---------------------------------------------------------------------------

export interface PinnedProductStageProps {
  damping?: number; // lerp lambda for the smoothed scroll progress
  rotatePerSection?: number; // deg of emblem yaw per section
  scalePulse?: number; // 0..0.4 — scale breathing between sections
  colorShift?: boolean; // interpolate accent color per section
  seed?: number;
}

interface SectionDef {
  kicker: string;
  title: string;
  body: string;
  accent: string;
  rotX: number;
  scale: number;
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

const SECTIONS: SectionDef[] = [
  { kicker: '01 / FORGE', title: 'KERN SCHMIEDEN', body: 'Das System-Emblem wird aus Rohdaten geschmiedet — jede Facette ein Layer der Pipeline.', accent: NOX_COLORS.red, rotX: -14, scale: 1 },
  { kicker: '02 / SCAN', title: 'OBERFLÄCHE LESEN', body: 'Der Scan tastet die Struktur ab. Die Stage dreht das Objekt in die Leserichtung des Signals.', accent: NOX_COLORS.gold, rotX: 10, scale: 0.86 },
  { kicker: '03 / RANK', title: 'SIGNAL GEWICHTEN', body: 'Gewichtete Ränge ordnen das Feld. Das Emblem zieht sich zusammen und verdichtet den Kern.', accent: NOX_COLORS.redBright, rotX: -8, scale: 1.14 },
  { kicker: '04 / SIGNAL', title: 'SYSTEM SENDEN', body: 'Der finale Frame: das Objekt steht, das Signal geht raus. Timeline-Ende erreicht.', accent: NOX_COLORS.glowOrange, rotX: 6, scale: 0.95 },
];

export function PinnedProductStage({
  damping = 8,
  rotatePerSection = 100,
  scalePulse = 0.18,
  colorShift = true,
  seed = 11,
}: PinnedProductStageProps) {
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const objRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(0);
  const [active, setActive] = useState(0);
  const n = SECTIONS.length;

  const glyph = useMemo(() => glyphPath(seed * 13 + 3, 120), [seed]);

  useRafLoop(
    (dt) => {
      const el = scrollerRef.current;
      const obj = objRef.current;
      const stage = stageRef.current;
      if (!el || !obj || !stage) return;
      const raw = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      smooth.current = damp(smooth.current, raw, damping, dt);
      const t = smooth.current * (n - 1);
      const i = clamp(Math.floor(t), 0, n - 2);
      const f = smoothstep(0, 1, t - i);
      const a = SECTIONS[i];
      const b = SECTIONS[i + 1];
      const rotY = t * rotatePerSection;
      const rotX = lerp(a.rotX, b.rotX, f);
      const scale = lerp(a.scale, b.scale, f) * (1 + Math.sin(t * Math.PI) * scalePulse * 0.35);
      obj.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      const accent = colorShift ? mixHex(a.accent, b.accent, f) : SECTIONS[0].accent;
      stage.style.setProperty('--pps-accent', accent);
      stage.style.setProperty('--pps-glow', `${(0.5 + 0.5 * Math.sin(t * Math.PI)).toFixed(2)}`);
      const ai = clamp(Math.round(t), 0, n - 1);
      setActive((prev) => (prev === ai ? prev : ai));
    },
    !reduced,
  );

  const staticAccent = SECTIONS[reduced ? n - 1 : 0].accent;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: 'radial-gradient(130% 100% at 20% 0%, #141014 0%, #0a0a0b 60%)' }}>
      <style>{`
        .pps-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .pps-scroll::-webkit-scrollbar { width: 6px; }
        .pps-scroll::-webkit-scrollbar-track { background: transparent; }
        .pps-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
        .pps-section { transition: opacity 0.5s ${EASE.outExpo}, transform 0.5s ${EASE.krankOvershoot}; }
        .pps-section[data-active="false"] { opacity: 0.3; transform: translateX(6px); }
        .pps-section[data-active="true"] { opacity: 1; transform: translateX(0); }
        .pps-kicker { transition: color 0.3s ${EASE.outExpo}; }
      `}</style>
      <div
        ref={scrollerRef}
        className="pps-scroll"
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <div style={{ position: 'relative' }}>
          {/* Pinned stage — sticky within the internal scroller */}
          <div
            ref={stageRef}
            style={{
              position: 'sticky',
              top: 0,
              height: '100cqh',
              zIndex: 0,
              pointerEvents: 'none',
              // CSS var defaults (reduced motion = final state)
              ['--pps-accent' as string]: staticAccent,
              ['--pps-glow' as string]: '0.7',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '8%' }}>
              <div style={{ perspective: 900, width: 'min(34cqw, 34cqh)', aspectRatio: '1' }}>
                <div
                  ref={objRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transform: reduced
                      ? `rotateX(${SECTIONS[n - 1].rotX}deg) rotateY(${(n - 1) * rotatePerSection}deg) scale(${SECTIONS[n - 1].scale})`
                      : 'rotateX(-14deg) rotateY(0deg) scale(1)',
                    willChange: 'transform',
                    position: 'relative',
                  }}
                >
                  {[-2, -1, 0, 1, 2].map((z) => (
                    <div
                      key={z}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        transform: `translateZ(${z * 14}px) rotate(${z * 9}deg)`,
                        border: '1px solid var(--pps-accent)',
                        borderRadius: 16,
                        background: z === 0 ? 'rgba(20,16,18,0.85)' : 'rgba(240,236,228,0.02)',
                        boxShadow: z === 0 ? '0 0 40px calc(var(--pps-glow) * 22px) color-mix(in srgb, var(--pps-accent) 35%, transparent)' : undefined,
                        opacity: 1 - Math.abs(z) * 0.18,
                      }}
                    />
                  ))}
                  <svg viewBox="0 0 120 120" style={{ position: 'absolute', inset: '18%', transform: 'translateZ(34px)', overflow: 'visible' }}>
                    <path d={glyph} fill="none" stroke="var(--pps-accent)" strokeWidth={2.4} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 7px var(--pps-accent))' }} />
                  </svg>
                </div>
                {/* Ground glow */}
                <div style={{ position: 'absolute', left: '10%', right: '10%', bottom: '-16%', height: '10%', borderRadius: '50%', background: 'var(--pps-accent)', filter: 'blur(18px)', opacity: 0.22 }} />
              </div>
            </div>
            {/* Frame HUD */}
            <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.3em', color: NOX_COLORS.textDim }}>
              STAGE // PINNED
            </div>
          </div>
          {/* Scrolling text sections (pulled up over the sticky stage) */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '-100cqh' }}>
            {SECTIONS.map((s, i) => (
              <div key={s.kicker} style={{ height: '100cqh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 'clamp(14px, 6%, 48px)' }}>
                <div
                  className="pps-section"
                  data-active={reduced ? 'true' : String(i === active)}
                  style={{ width: 'min(48%, 340px)', borderLeft: `2px solid ${s.accent}`, paddingLeft: 14 }}
                >
                  <div className="pps-kicker" style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.32em', color: s.accent, marginBottom: 6 }}>
                    {s.kicker}
                  </div>
                  <div style={{ fontSize: 'clamp(15px, 4.4cqw, 26px)', fontWeight: 750, letterSpacing: '-0.02em', color: NOX_COLORS.text, lineHeight: 1.05, marginBottom: 8 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 'clamp(10px, 2.2cqw, 13px)', lineHeight: 1.55, color: NOX_COLORS.textDim }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinnedProductStage;
