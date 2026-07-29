import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, damp, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { hexToRgb } from '../../lib/color';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';
import {
  PARTICLE_REVEAL_MODES,
  PARTICLE_REVEAL_PRESETS,
  PARTICLE_REVEAL_VARIANTS,
  type ParticleRevealMode,
  type ParticleRevealVariant,
} from './particleRevealPresets';
import { renderParticleField } from './particleRevealRenderer';
import { sampleSceneParticles, type ParticlePoint } from './particleRevealScene';
import { PARTICLE_REVEAL_STYLES } from './particleRevealStyles';

export interface ParticleRevealProps {
  variant?: ParticleRevealVariant;
  mode?: ParticleRevealMode;
  text?: string;
  resolveRadius?: number;
  scatter?: number;
  density?: number;
  particleSize?: number;
  color?: string;
  cloudScale?: number;
  glowStrength?: number;
  trailStrength?: number;
  burstStrength?: number;
  showVariantSwitcher?: boolean;
  showModeSwitcher?: boolean;
}

export function ParticleReveal({
  variant = 'ember-forge-materialize',
  mode = 'hybrid',
  text,
  resolveRadius = 0.245,
  scatter = 18,
  density = 3800,
  particleSize = 1.18,
  color,
  cloudScale = 0.93,
  glowStrength = 1,
  trailStrength = 0.78,
  burstStrength = 1,
  showVariantSwitcher = true,
  showModeSwitcher = true,
}: ParticleRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const [activeVariant, setActiveVariant] = useState<ParticleRevealVariant>(variant);
  const [activeMode, setActiveMode] = useState<ParticleRevealMode>(mode);
  const [copied, setCopied] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const particles = useRef<ParticlePoint[]>([]);
  const damped = useRef({ x: 0.5, y: 0.5, active: 0 });
  const burst = useRef({ startedAt: -20, x: 0.5, y: 0.5 });

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveMode(mode), [mode]);

  const preset = PARTICLE_REVEAL_PRESETS[activeVariant];
  const targetDensity = Math.round(clamp(density * preset.density, 800, 6200));

  useEffect(() => {
    particles.current = sampleSceneParticles(preset, text, targetDensity);
    setParticleCount(particles.current.length);
  }, [preset, text, targetDensity]);

  const palette = useMemo(() => ({
    primary: hexToRgb(color || preset.primary),
    secondary: hexToRgb(preset.secondary),
    hot: hexToRgb(preset.hot),
  }), [color, preset]);

  useCanvas2D(canvasRef, (ctx, size, dt, elapsed) => {
    ctx.clearRect(0, 0, size.w, size.h);
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed * preset.speed);
    const pointerAvailable = p.inside || !hoverCapable;
    damped.current.x = damp(damped.current.x, pointerAvailable ? p.tx : damped.current.x, 10, dt);
    damped.current.y = damp(damped.current.y, pointerAvailable ? p.ty : damped.current.y, 10, dt);
    damped.current.active = damp(damped.current.active, pointerAvailable ? 1 : 0, 7, dt);

    const sweepX = 0.5 + Math.sin(elapsed * 0.72 * preset.speed) * 0.29;
    const sweepY = 0.5 + Math.cos(elapsed * 0.51 * preset.speed + 0.8) * 0.22;
    let focusX = damped.current.x;
    let focusY = damped.current.y;
    let focusActive = damped.current.active;
    if (activeMode === 'sweep') {
      focusX = sweepX;
      focusY = sweepY;
      focusActive = 1;
    } else if (activeMode === 'hybrid' && damped.current.active < 0.16) {
      focusX = sweepX;
      focusY = sweepY;
      focusActive = 0.86;
    } else if (activeMode === 'pulse') {
      focusX = 0.5;
      focusY = 0.5;
      focusActive = 1;
    }

    const burstAge = performance.now() / 1000 - burst.current.startedAt;
    renderParticleField({
      ctx,
      size,
      particles: particles.current,
      palette,
      activeVariant,
      activeMode,
      focusX,
      focusY,
      focusActive,
      resolveRadius,
      scatterPx: scatter * preset.scatter,
      cloudScale,
      particleSize,
      glowStrength,
      trail: trailStrength * preset.trail,
      burstEnergy: reduced || burstAge < 0 ? 0 : Math.exp(-burstAge * 2.35) * burstStrength,
      burstX: burst.current.x,
      burstY: burst.current.y,
      t: elapsed * preset.speed,
      reduced,
    });
  }, !reduced);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    burst.current = {
      startedAt: performance.now() / 1000,
      x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
    };
  };

  const copyReference = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(preset.reference).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };

  const cssVars = {
    '--prx-primary': color || preset.primary,
    '--prx-secondary': preset.secondary,
    '--prx-bg': preset.background,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="prx-root"
      style={cssVars}
      data-particle-variant={activeVariant}
      data-particle-mode={activeMode}
      onPointerDown={onPointerDown}
      aria-label={`${preset.label} particle reveal in ${activeMode} mode`}
    >
      <style>{PARTICLE_REVEAL_STYLES}</style>
      <canvas ref={canvasRef} className="prx-canvas" />
      <div className="prx-corners" aria-hidden="true" />
      {showVariantSwitcher && (
        <nav className="prx-switcher" aria-label="Particle reveal variants">
          {PARTICLE_REVEAL_VARIANTS.map((id) => (
            <button key={id} type="button" aria-pressed={activeVariant === id} onClick={() => setActiveVariant(id)}>
              {PARTICLE_REVEAL_PRESETS[id].label}
            </button>
          ))}
        </nav>
      )}
      {showModeSwitcher && (
        <nav className="prx-mode" aria-label="Particle reveal modes">
          {PARTICLE_REVEAL_MODES.map((id) => (
            <button key={id} type="button" aria-pressed={activeMode === id} onClick={() => setActiveMode(id)}>
              {id.toUpperCase()}
            </button>
          ))}
        </nav>
      )}
      <div className="prx-reference">
        <code>{preset.reference}</code>
        <button type="button" onClick={copyReference}>{copied ? 'COPIED' : 'COPY REF'}</button>
      </div>
      <div className="prx-status" aria-live="polite">
        <strong>{preset.label} / {activeMode.toUpperCase()}</strong>
        {particleCount} PARTICLES · CLICK TO DISRUPT
      </div>
    </div>
  );
}

export default ParticleReveal;
