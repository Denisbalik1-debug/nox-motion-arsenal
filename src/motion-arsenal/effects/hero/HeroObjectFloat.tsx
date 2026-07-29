import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { PHYSICS } from '../../lib/motionPresets';
import { HeroObjectVisual } from './heroObjectFloatObjects';
import { HeroObjectGlassShell } from './heroObjectFloatShells';
import {
  HERO_OBJECT_DEFAULT_SHELL,
  HERO_OBJECT_ENERGIES,
  HERO_OBJECT_ENERGY_PRESETS,
  HERO_OBJECT_PRESETS,
  HERO_OBJECT_SHELL_PRESETS,
  HERO_OBJECT_SHELL_VARIANTS,
  HERO_OBJECT_VARIANTS,
  type HeroObjectEnergy,
  type HeroObjectShellVariant,
  type HeroObjectVariant,
} from './heroObjectFloatPresets';
import { HERO_OBJECT_FLOAT_STYLES } from './heroObjectFloatStyles';

export interface HeroObjectFloatProps {
  variant?: HeroObjectVariant;
  shellVariant?: HeroObjectShellVariant;
  energy?: HeroObjectEnergy;
  amplitude?: number;
  speed?: number;
  tilt?: number;
  accent?: string;
  seed?: number;
  objectScale?: number;
  depth?: number;
  orbit?: boolean;
  glassIntensity?: number;
  shellDepth?: number;
  showVariantSwitcher?: boolean;
  showShellSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

interface MotionState {
  rx: number;
  ry: number;
  rz: number;
  x: number;
  y: number;
  z: number;
  scale: number;
}

export function HeroObjectFloat({
  variant = 'forge-obsidian-relic',
  shellVariant,
  energy = 'charged',
  amplitude = 18,
  speed = 1,
  tilt = 1,
  accent,
  seed = 9,
  objectScale = 1,
  depth = 1,
  orbit = true,
  glassIntensity = 1,
  shellDepth = 1,
  showVariantSwitcher = true,
  showShellSwitcher = true,
  showEnergySwitcher = true,
}: HeroObjectFloatProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const [activeVariant, setActiveVariant] = useState<HeroObjectVariant>(variant);
  const [activeShell, setActiveShell] = useState<HeroObjectShellVariant>(
    shellVariant ?? HERO_OBJECT_DEFAULT_SHELL[variant],
  );
  const [activeEnergy, setActiveEnergy] = useState<HeroObjectEnergy>(energy);
  const [copied, setCopied] = useState(false);
  const motion = useRef<MotionState>({ rx: 0, ry: 0, rz: 0, x: 0, y: 0, z: 0, scale: objectScale });
  const impact = useRef({ startedAt: -20, x: 0.5, y: 0.5 });

  useEffect(() => {
    setActiveVariant(variant);
    if (!shellVariant) setActiveShell(HERO_OBJECT_DEFAULT_SHELL[variant]);
  }, [variant, shellVariant]);
  useEffect(() => {
    if (shellVariant) setActiveShell(shellVariant);
  }, [shellVariant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const phases = useMemo(() => {
    const random = seededRandom(seed);
    return {
      p1: random() * Math.PI * 2,
      p2: random() * Math.PI * 2,
      p3: random() * Math.PI * 2,
    };
  }, [seed]);

  const fieldDots = useMemo(() => {
    const random = seededRandom(seed * 37 + 11);
    return Array.from({ length: 18 }, (_, index) => ({
      id: index,
      left: 8 + random() * 84,
      top: 8 + random() * 78,
      size: 1 + random() * 2.4,
      opacity: 0.1 + random() * 0.34,
      delay: random() * -8,
    }));
  }, [seed]);

  const preset = HERO_OBJECT_PRESETS[activeVariant];
  const shellPreset = HERO_OBJECT_SHELL_PRESETS[activeShell];
  const energyPreset = HERO_OBJECT_ENERGY_PRESETS[activeEnergy];
  const resolvedAccent = accent ?? preset.accent;

  useRafLoop((dt, elapsed) => {
    const shell = shellRef.current;
    const shadow = shadowRef.current;
    const root = rootRef.current;
    if (!shell || !shadow || !root) return;

    const t = elapsed * speed * energyPreset.speed;
    const wave =
      Math.sin(t + phases.p1) +
      Math.sin(t * 2.1 + phases.p2) * 0.2 +
      Math.sin(t * 0.37 + phases.p3) * 0.3;
    const sway =
      Math.sin(t * 0.72 + phases.p2) +
      Math.sin(t * 2.24 + phases.p3) * 0.16 +
      Math.sin(t * 0.31 + phases.p1) * 0.34;
    const p = pointer.current;
    const pointerX = p.inside ? p.tx : 0.5 + Math.sin(t * 0.24 + phases.p1) * 0.09;
    const pointerY = p.inside ? p.ty : 0.5 + Math.sin(t * 0.19 + phases.p2) * 0.07;
    const now = performance.now() / 1000;
    const impactAge = now - impact.current.startedAt;
    const impactPulse = impactAge >= 0 && impactAge < 1.25
      ? Math.sin(Math.min(impactAge / 1.25, 1) * Math.PI) * Math.exp(-impactAge * 1.25)
      : 0;
    const directionX = impact.current.x - 0.5;
    const directionY = impact.current.y - 0.5;

    const targetRx = ((0.5 - pointerY) * 24 * tilt * energyPreset.tilt) + directionY * impactPulse * 16;
    const targetRy = ((pointerX - 0.5) * 28 * tilt * energyPreset.tilt) + directionX * impactPulse * 18;
    const targetRz = (sway / 1.5) * 2.8 + impactPulse * 3.5;
    const targetX = (sway / 1.5) * 4.5 + (pointerX - 0.5) * 8 * depth;
    const targetY = -(wave / 1.5) * amplitude * energyPreset.amplitude + impactPulse * -8;
    const targetZ = (wave / 1.5) * 7 * depth + impactPulse * 24 * depth;
    const targetScale = objectScale * (1 + impactPulse * 0.055);

    const damping = PHYSICS.cursorFollow;
    motion.current.rx = damp(motion.current.rx, targetRx, damping, dt);
    motion.current.ry = damp(motion.current.ry, targetRy, damping, dt);
    motion.current.rz = damp(motion.current.rz, targetRz, damping * 0.72, dt);
    motion.current.x = damp(motion.current.x, targetX, damping * 0.7, dt);
    motion.current.y = damp(motion.current.y, targetY, damping * 0.7, dt);
    motion.current.z = damp(motion.current.z, targetZ, damping * 0.62, dt);
    motion.current.scale = damp(motion.current.scale, targetScale, damping * 0.8, dt);

    const current = motion.current;
    shell.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, ${current.z.toFixed(2)}px) rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg) rotateZ(${current.rz.toFixed(2)}deg) scale(${current.scale.toFixed(4)})`;

    const lift = Math.max(0, Math.min(1, (wave / 1.5 + 1) / 2 + impactPulse * 0.35));
    shadow.style.transform = `translateX(-50%) scaleX(${(1 - lift * 0.34).toFixed(3)}) scaleY(${(1 - lift * 0.18).toFixed(3)})`;
    shadow.style.opacity = (0.58 - lift * 0.34).toFixed(3);
    shadow.style.filter = `blur(${(10 + lift * 15).toFixed(1)}px)`;
    root.style.setProperty('--hof-pointer-x', pointerX.toFixed(3));
    root.style.setProperty('--hof-pointer-y', pointerY.toFixed(3));
  }, !reduced);

  const onImpact = (event: PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    impact.current = {
      startedAt: performance.now() / 1000,
      x: (event.clientX - rect.left) / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) / Math.max(rect.height, 1),
    };
    const ring = impactRef.current;
    if (ring) {
      ring.style.left = `${impact.current.x * 100}%`;
      ring.style.top = `${impact.current.y * 100}%`;
      ring.style.animation = 'none';
      void ring.offsetWidth;
      ring.style.animation = 'hof-impact .9s cubic-bezier(.15,.8,.2,1) both';
    }
  };

  const copyReference = async () => {
    const configuration = `${preset.reference} + ${shellPreset.reference} + energy:${activeEnergy}`;
    try {
      await navigator.clipboard.writeText(configuration);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const selectObject = (id: HeroObjectVariant) => {
    setActiveVariant(id);
    if (!shellVariant) setActiveShell(HERO_OBJECT_DEFAULT_SHELL[id]);
  };

  const rootStyle = {
    '--hof-accent': resolvedAccent,
    '--hof-secondary': preset.secondary,
    '--hof-light': preset.light,
    '--hof-glow': energyPreset.glow,
    '--hof-orbit-speed': `${12 / energyPreset.orbit}s`,
    '--hof-depth': depth,
    '--hof-glass': glassIntensity,
    '--hof-shell-depth': shellDepth,
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: preset.background,
    display: 'grid',
    placeItems: 'center',
    userSelect: 'none',
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="hof-root"
      data-energy={activeEnergy}
      data-variant={activeVariant}
      data-shell={activeShell}
      style={rootStyle}
      onPointerDown={onImpact}
    >
      <style>{HERO_OBJECT_FLOAT_STYLES}</style>

      {fieldDots.map((dot) => (
        <span
          key={dot.id}
          className="hof-field-dot"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}

      <div className="hof-ui">
        <div className="hof-control-stack">
          {showVariantSwitcher ? (
            <div className="hof-controls" aria-label="Hero object variants">
              {HERO_OBJECT_VARIANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="hof-button"
                  data-active={id === activeVariant}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => selectObject(id)}
                >
                  {HERO_OBJECT_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
          {showShellSwitcher ? (
            <div className="hof-controls hof-shell-controls" aria-label="Glass shell variants">
              {HERO_OBJECT_SHELL_VARIANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="hof-button hof-shell-button"
                  data-active={id === activeShell}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setActiveShell(id)}
                >
                  {HERO_OBJECT_SHELL_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {showEnergySwitcher ? (
          <div className="hof-controls hof-energy-controls" aria-label="Hero object energy">
            {HERO_OBJECT_ENERGIES.map((id) => (
              <button
                key={id}
                type="button"
                className="hof-button"
                data-active={id === activeEnergy}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setActiveEnergy(id)}
              >
                {HERO_OBJECT_ENERGY_PRESETS[id].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hof-stage">
        <div ref={shellRef} className="hof-object-shell" style={reduced ? { transform: `scale(${objectScale})` } : undefined}>
          <div className="hof-aura" />
          <div className="hof-backplate" />
          {orbit ? (
            <>
              <div className="hof-orbit hof-orbit-one"><span className="hof-satellite" /></div>
              <div className="hof-orbit hof-orbit-two"><span className="hof-satellite" /></div>
              <div className="hof-orbit hof-orbit-three"><span className="hof-satellite" /></div>
            </>
          ) : null}
          <HeroObjectGlassShell variant={activeShell} seed={seed}>
            <HeroObjectVisual variant={activeVariant} seed={seed} />
          </HeroObjectGlassShell>
          <div ref={impactRef} className="hof-impact" />
        </div>
        <div ref={shadowRef} className="hof-shadow" />
        <div className="hof-label">
          <div className="hof-label-title">{preset.label}</div>
          <div className="hof-label-kicker">{shellPreset.label} // {preset.kicker}</div>
        </div>
      </div>

      <div className="hof-hint">HOVER TO TILT // TAP TO IMPULSE</div>
      <button
        type="button"
        className="hof-reference"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={copyReference}
      >
        {copied ? 'COPIED' : 'COPY CONFIG'}
      </button>
    </div>
  );
}

export default HeroObjectFloat;
