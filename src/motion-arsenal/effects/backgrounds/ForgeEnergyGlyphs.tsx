import React, { useMemo, useRef } from 'react';
import { seededRandom, usePointer, usePrefersReducedMotion, useRafLoop, damp } from '../../lib/animationUtils';
import { toneVariants, mixRgb, rgbStr, type RGB } from '../../lib/color';
import { proximityEnergy, stepEnergy, pointerPx } from '../../lib/proximityField';
import { resolveGlyphs, type GlyphDef } from '../../lib/glyphRegistry';

// ---------------------------------------------------------------------------
// ForgeEnergyGlyphs — NOX Adapted, Variante „Runen/Energie".
//
// Referenz-Mechanik (jetzt echt): Pointer entzündet EINZELNE Glyphen.
//   Pointer-Nähe → Energie → Stroke-Draw (dashoffset 1→0) + Farbe gedämpft→Ember/Gold
//                → Glow + leichte Skalierung/Drift → langsames Nachglimmen (Decay).
//
// Kein zufälliges Ignite-Keyframe mehr: eine Glyphe zeichnet sich proportional
// zur Pointer-Nähe. Ohne Pointer (Touch/Mobile) atmet ein sehr feiner
// Ambient-Puls, damit das Feld lebt — organisch, nicht random.
//
// Das Symbolset ist austauschbar: `symbols` (GlyphDef[]) oder `glyphSet`
// ('nox-runes' | 'procedural'). Default sind die hand-gezeichneten NOX-Runen.
// ---------------------------------------------------------------------------

export interface ForgeEnergyGlyphsProps {
  glyphCount?: number;
  color?: string; // Basis-Akzent (Idle/Hot werden daraus abgeleitet)
  parallax?: number;
  intensity?: number;
  proximityRadius?: number; // px — Zünd-Radius um den Pointer
  glyphSet?: 'nox-runes' | 'procedural';
  symbols?: GlyphDef[]; // explizites Symbolset (überschreibt glyphSet)
}

interface GlyphObj {
  d: string;
  viewBox: string;
  idle: RGB;
  hot: RGB;
  x: number; // Center-%
  y: number;
  depth: number;
  size: number; // %
  rot: number;
  dir: number;
  phase: number; // Ambient-Puls-Phase
  width: number;
}

export function ForgeEnergyGlyphs({
  glyphCount = 10,
  color = '#d4a24a',
  parallax = 0.45,
  intensity = 0.9,
  proximityRadius = 170,
  glyphSet = 'nox-runes',
  symbols,
}: ForgeEnergyGlyphsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();

  const count = Math.max(4, Math.min(18, Math.round(glyphCount)));

  const objects = useMemo<GlyphObj[]>(() => {
    const rnd = seededRandom(313);
    const source = symbols ?? (glyphSet === 'procedural' ? 'procedural-glyphs' : 'nox-runes');
    const glyphs = resolveGlyphs(source, 701, count);
    return Array.from({ length: count }, (_, i) => {
      const g = glyphs[i % glyphs.length];
      // Some glyphs ignite red (hot signals), the rest gold/ember.
      const accent = g.energyColor ?? (rnd() > 0.72 ? '#ff4d4d' : color);
      const tone = toneVariants(accent);
      return {
        d: g.path,
        viewBox: g.viewBox ?? '0 0 120 120',
        idle: g.idleColor ? toneVariants(g.idleColor).idle : tone.idle,
        hot: tone.hot,
        x: 6 + rnd() * 82,
        y: 9 + rnd() * 74,
        depth: 0.25 + rnd() * 0.75,
        size: 7 + rnd() * 11,
        rot: (rnd() - 0.5) * 40,
        dir: rnd() > 0.5 ? 1 : -1,
        phase: rnd() * Math.PI * 2,
        width: (1.6 + rnd() * 0.8) * (g.weight ?? 1),
      };
    });
  }, [count, color, glyphSet, symbols]);

  const energyEls = useRef<Array<HTMLDivElement | null>>([]);
  const parallaxEls = useRef<Array<HTMLDivElement | null>>([]);
  const energies = useRef<number[]>(objects.map(() => 0.08));
  const par = useRef({ x: 0, y: 0 });

  useRafLoop(
    (dt, elapsed) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();

      par.current.x = damp(par.current.x, (pointer.current.tx - 0.5) * 2, 8, dt);
      par.current.y = damp(par.current.y, (pointer.current.ty - 0.5) * 2, 8, dt);

      const ptr = pointerPx(rect, pointer.current);
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        const pel = parallaxEls.current[i];
        if (pel) {
          const depth = o.depth * parallax * 22;
          pel.style.transform = `translate3d(${(-par.current.x * depth).toFixed(2)}px, ${(-par.current.y * depth).toFixed(2)}px, 0) rotate(${o.rot}deg)`;
        }
        const eel = energyEls.current[i];
        if (!eel) continue;

        // Ambient breathing so the field lives without a pointer (mobile/touch).
        const ambient = 0.08 + 0.05 * (0.5 + 0.5 * Math.sin(elapsed * 0.9 + o.phase));
        let target = ambient;
        let nudgeX = 0;
        let nudgeY = 0;
        if (ptr) {
          const cx = (o.x / 100) * rect.width;
          const cy = (o.y / 100) * rect.height;
          const dx = ptr.x - cx;
          const dy = ptr.y - cy;
          const dist = Math.hypot(dx, dy);
          const e = proximityEnergy(dist, proximityRadius);
          target = Math.max(ambient, e);
          if (dist > 0.001 && e > 0) {
            nudgeX = (dx / dist) * e * 7;
            nudgeY = (dy / dist) * e * 7;
          }
        }
        // Fast ignite, slow afterglow.
        const en = stepEnergy(energies.current[i], target, dt, 14, 2.0);
        energies.current[i] = en;

        const col = rgbStr(mixRgb(o.idle, o.hot, en));
        eel.style.setProperty('--feg-stroke', col);
        eel.style.setProperty('--feg-dash', (1 - en).toFixed(3)); // draws in with energy
        eel.style.setProperty('--feg-crisp-op', String(Math.min(1, (0.28 + en * 0.72) * (0.55 + intensity * 0.45))));
        eel.style.setProperty('--feg-glow-op', String(Math.min(1, en * 0.95 * intensity)));
        eel.style.setProperty('--feg-sw-crisp', `${(o.width * (1 + en * 0.7)).toFixed(2)}px`);
        eel.style.setProperty('--feg-sw-glow', `${(o.width * 3 * (1 + en * 0.5)).toFixed(2)}px`);
        eel.style.transform = `translate3d(${nudgeX.toFixed(2)}px, ${nudgeY.toFixed(2)}px, 0) scale(${(1 + en * 0.18).toFixed(3)})`;
      }
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(130% 100% at 50% 115%, #140c06 0%, #0a0a0b 58%)' }}>
      <style>{`@media (prefers-reduced-motion: reduce) { .feg-static path { stroke-dashoffset: 0 !important; } }`}</style>
      {objects.map((o, i) => {
        const idleCol = rgbStr(mixRgb(o.idle, o.hot, 0.1));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.size}%`,
              aspectRatio: '1',
              transform: 'translate(-50%, -50%)',
              mixBlendMode: 'screen',
              willChange: 'transform',
            }}
          >
            <div
              ref={(el) => { parallaxEls.current[i] = el; }}
              style={{ width: '100%', height: '100%', transform: `rotate(${o.rot}deg)`, willChange: 'transform' }}
            >
              <div
                ref={(el) => { energyEls.current[i] = el; }}
                className={reduced ? 'feg-static' : undefined}
                style={{
                  width: '100%',
                  height: '100%',
                  transformOrigin: '50% 50%',
                  willChange: 'transform',
                  ['--feg-stroke' as string]: idleCol,
                  ['--feg-dash' as string]: reduced ? '0' : '0.9',
                  ['--feg-crisp-op' as string]: String(0.6 * intensity),
                  ['--feg-glow-op' as string]: String(0.15 * intensity),
                  ['--feg-sw-crisp' as string]: `${o.width}px`,
                  ['--feg-sw-glow' as string]: `${o.width * 3}px`,
                }}
              >
                <svg viewBox={o.viewBox} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <path
                    d={o.d}
                    fill="none"
                    stroke="var(--feg-stroke)"
                    strokeLinecap="square"
                    style={{ strokeWidth: 'var(--feg-sw-glow)', filter: `blur(${8 + o.depth * 10}px)`, opacity: 'var(--feg-glow-op)' }}
                  />
                  <path
                    d={o.d}
                    fill="none"
                    stroke="var(--feg-stroke)"
                    strokeLinecap="square"
                    pathLength={1}
                    strokeDasharray={1}
                    style={{ strokeWidth: 'var(--feg-sw-crisp)', opacity: 'var(--feg-crisp-op)', strokeDashoffset: 'var(--feg-dash)' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(65% 50% at 50% 45%, rgba(10,10,11,0.5) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>FORGE PROTOCOL</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, letterSpacing: '-0.01em', color: '#f0ece4' }}>ENERGY GLYPHS</div>
        </div>
      </div>
    </div>
  );
}

export default ForgeEnergyGlyphs;
