import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { mixRgb, rgbStr, toneVariants, type RGB } from '../../lib/color';
import { pointerPx, proximityEnergy, stepEnergy } from '../../lib/proximityField';
import { resolveGlyphs, type GlyphDef } from '../../lib/glyphRegistry';
import {
  FORGE_GLYPH_STATES,
  FORGE_GLYPH_STATE_IDS,
  FORGE_GLYPH_VARIANTS,
  FORGE_GLYPH_VARIANT_IDS,
  type ForgeGlyphVariantId,
  type GlyphFieldState,
} from './forgeEnergyGlyphData';
import { FORGE_ENERGY_GLYPH_CSS } from './forgeEnergyGlyphStyles';

export type GlyphInteractionMode = 'none' | 'pointer' | 'scroll' | 'hybrid';

export interface ForgeEnergyGlyphsProps {
  variant?: ForgeGlyphVariantId;
  stateMode?: GlyphFieldState;
  glyphCount?: number;
  density?: number;
  glowStrength?: number;
  floatSpeed?: number;
  rotationSpeed?: number;
  energyLevel?: number;
  rareGlyphChance?: number;
  heatDistortion?: number;
  interactionMode?: GlyphInteractionMode;
  proximityRadius?: number;
  parallax?: number;
  showVariantSwitcher?: boolean;
  showStateSwitcher?: boolean;
  seed?: number;
  color?: string;
  intensity?: number;
  glyphSet?: 'nox-runes' | 'procedural';
  symbols?: GlyphDef[];
}

type CssVars = CSSProperties & Record<`--${string}`, string | number>;
type GlyphLayer = 'ambient' | 'active' | 'hero';

type GlyphObject = {
  glyph: GlyphDef;
  x: number;
  y: number;
  size: number;
  depth: number;
  rotation: number;
  direction: number;
  phase: number;
  width: number;
  layer: GlyphLayer;
  idle: RGB;
  hot: RGB;
};

type Connector = { id: string; d: string; delay: number; duration: number };

export function ForgeEnergyGlyphs({
  variant = 'forge-ember-runes',
  stateMode = 'charged',
  glyphCount = 18,
  density = 1,
  glowStrength,
  floatSpeed = 1,
  rotationSpeed = 1,
  energyLevel = 1,
  rareGlyphChance = .18,
  heatDistortion = .55,
  interactionMode = 'hybrid',
  proximityRadius = 190,
  parallax = .5,
  showVariantSwitcher = true,
  showStateSwitcher = true,
  seed = 313,
  color,
  intensity,
  glyphSet,
  symbols,
}: ForgeEnergyGlyphsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const filterId = `feg-${uid}-glow`;
  const [selectedVariant, setSelectedVariant] = useState<ForgeGlyphVariantId>(variant);
  const [selectedState, setSelectedState] = useState<GlyphFieldState>(stateMode);
  const [copied, setCopied] = useState(false);

  useEffect(() => setSelectedVariant(variant), [variant]);
  useEffect(() => setSelectedState(stateMode), [stateMode]);

  const config = FORGE_GLYPH_VARIANTS[selectedVariant];
  const state = FORGE_GLYPH_STATES[selectedState];
  const effectiveGlow = glowStrength ?? intensity ?? 1;
  const effectiveCount = clamp(Math.round(glyphCount * density * state.density), 8, 30);

  const palette = useMemo(() => {
    if (!color) return config.palette;
    const tones = toneVariants(color);
    return {
      ...config.palette,
      primary: color,
      secondary: rgbStr(mixRgb(tones.hot, [255, 255, 255] as RGB, .22)),
      hot: '#fffaf0',
      dim: rgbStr(tones.idle),
    };
  }, [color, config.palette]);

  const objects = useMemo<GlyphObject[]>(() => {
    const variantIndex = FORGE_GLYPH_VARIANT_IDS.indexOf(selectedVariant);
    const rnd = seededRandom(seed + variantIndex * 911);
    const source = symbols?.length
      ? symbols
      : glyphSet === 'procedural'
        ? resolveGlyphs('procedural-glyphs', seed + variantIndex * 17, effectiveCount)
        : glyphSet === 'nox-runes'
          ? resolveGlyphs('nox-runes', seed, effectiveCount)
          : config.glyphs;
    const heroCount = clamp(Math.round(effectiveCount * clamp(rareGlyphChance, .05, .45)), 2, 4);

    return Array.from({ length: effectiveCount }, (_, index) => {
      const sourceGlyph = source[index % source.length];
      const layer: GlyphLayer = index < heroCount ? 'hero' : index % 3 === 0 ? 'ambient' : 'active';
      const angle = (index / Math.max(1, effectiveCount - 1)) * Math.PI * 4.6 + rnd() * 1.2;
      const ring = 19 + rnd() * 35;
      const x = clamp(50 + Math.cos(angle) * ring + (rnd() - .5) * 20, 7, 93);
      const y = clamp(50 + Math.sin(angle) * ring * .72 + (rnd() - .5) * 16, 8, 91);
      const sizeBase = layer === 'hero' ? 15 + rnd() * 7 : layer === 'active' ? 7 + rnd() * 8 : 4 + rnd() * 5;
      const accent = sourceGlyph.energyColor ?? (index % 7 === 0 ? palette.hot : palette.primary);
      return {
        glyph: sourceGlyph,
        x,
        y,
        size: sizeBase * (sourceGlyph.scale ?? 1),
        depth: layer === 'hero' ? 1 : layer === 'active' ? .62 + rnd() * .28 : .2 + rnd() * .25,
        rotation: (rnd() - .5) * 48,
        direction: rnd() > .5 ? 1 : -1,
        phase: rnd() * Math.PI * 2,
        width: (1.25 + rnd() * .75) * (sourceGlyph.weight ?? 1),
        layer,
        idle: sourceGlyph.idleColor ? toneVariants(sourceGlyph.idleColor).idle : toneVariants(palette.dim).idle,
        hot: toneVariants(accent).hot,
      };
    });
  }, [config.glyphs, effectiveCount, glyphSet, palette.dim, palette.hot, palette.primary, rareGlyphChance, seed, selectedVariant, symbols]);

  const connectors = useMemo<Connector[]>(() => {
    const active = objects.filter((object) => object.layer !== 'ambient').slice(0, 10);
    return active.slice(1).map((object, index) => {
      const previous = active[index];
      const midX = (previous.x + object.x) / 2 + (index % 2 === 0 ? 5 : -5);
      const midY = (previous.y + object.y) / 2 + (index % 3 - 1) * 4;
      return {
        id: `link-${index}`,
        d: `M ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} Q ${midX.toFixed(2)} ${midY.toFixed(2)} ${object.x.toFixed(2)} ${object.y.toFixed(2)}`,
        delay: -(index * .68),
        duration: 4.8 + (index % 4) * .72,
      };
    });
  }, [objects]);

  const dust = useMemo(() => {
    const rnd = seededRandom(seed + FORGE_GLYPH_VARIANT_IDS.indexOf(selectedVariant) * 131 + 41);
    const count = clamp(Math.round(24 * density * state.density), 12, 48);
    return Array.from({ length: count }, (_, id) => ({
      id,
      x: `${(rnd() * 100).toFixed(2)}%`, y: `${(rnd() * 100).toFixed(2)}%`,
      size: `${(.8 + rnd() * 2.4).toFixed(2)}px`, opacity: (.1 + rnd() * .42) * state.glow,
      duration: `${((8 + rnd() * 14) / Math.max(.2, floatSpeed * state.speed)).toFixed(2)}s`,
      delay: `${(-rnd() * 16).toFixed(2)}s`, dx: `${((rnd() - .5) * 38).toFixed(2)}px`, dy: `${(-8 - rnd() * 34).toFixed(2)}px`,
    }));
  }, [density, floatSpeed, seed, selectedVariant, state.density, state.glow, state.speed]);

  const energyElements = useRef<Array<HTMLDivElement | null>>([]);
  const parallaxElements = useRef<Array<HTMLDivElement | null>>([]);
  const energies = useRef<number[]>([]);
  const parallaxState = useRef({ x: 0, y: 0 });

  useEffect(() => { energies.current = objects.map(() => state.ambient); }, [objects, state.ambient]);

  useRafLoop((dt, elapsed) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const pointerEnabled = interactionMode === 'pointer' || interactionMode === 'hybrid';
    const scrollEnabled = interactionMode === 'scroll' || interactionMode === 'hybrid';
    const ptr = pointerEnabled ? pointerPx(rect, pointer.current) : null;
    const targetX = pointerEnabled ? (pointer.current.tx - .5) * 2 : 0;
    const targetY = pointerEnabled ? (pointer.current.ty - .5) * 2 : 0;
    parallaxState.current.x = damp(parallaxState.current.x, targetX, 8, dt);
    parallaxState.current.y = damp(parallaxState.current.y, targetY, 8, dt);

    let scrollEnergy = 0;
    if (scrollEnabled && typeof window !== 'undefined') {
      const viewportCenter = window.innerHeight * .5;
      const rootCenter = rect.top + rect.height * .5;
      scrollEnergy = clamp(1 - Math.abs(rootCenter - viewportCenter) / Math.max(window.innerHeight * .7, 1), 0, 1);
    }

    let maxEnergy = state.ambient;
    objects.forEach((object, index) => {
      const parallaxElement = parallaxElements.current[index];
      if (parallaxElement) {
        const depth = object.depth * parallax * 28;
        parallaxElement.style.transform = `translate3d(${(-parallaxState.current.x * depth).toFixed(2)}px,${(-parallaxState.current.y * depth).toFixed(2)}px,0) rotate(${object.rotation}deg)`;
      }
      const energyElement = energyElements.current[index];
      if (!energyElement) return;
      const ambient = state.ambient + .06 * state.glow * (.5 + .5 * Math.sin(elapsed * .75 * state.speed + object.phase));
      let target = ambient + scrollEnergy * .22 * energyLevel;
      let nudgeX = 0;
      let nudgeY = 0;
      if (ptr) {
        const dx = ptr.x - object.x / 100 * rect.width;
        const dy = ptr.y - object.y / 100 * rect.height;
        const distance = Math.hypot(dx, dy);
        const proximity = proximityEnergy(distance, proximityRadius) * energyLevel;
        target = Math.max(target, proximity);
        if (distance > .001 && proximity > 0) {
          nudgeX = dx / distance * proximity * (object.layer === 'hero' ? 11 : 7);
          nudgeY = dy / distance * proximity * (object.layer === 'hero' ? 11 : 7);
        }
      }
      if (selectedState === 'overdrive') target = Math.max(target, .52 + .22 * Math.sin(elapsed * 1.8 + object.phase));
      if (selectedState === 'ritual' && object.layer === 'hero') target = Math.max(target, .7);
      const next = stepEnergy(energies.current[index] ?? state.ambient, clamp(target, 0, 1), dt, 13 * state.speed, selectedState === 'stealth' ? 1.4 : 2.2);
      energies.current[index] = next;
      maxEnergy = Math.max(maxEnergy, next);
      energyElement.style.setProperty('--glyph-stroke', rgbStr(mixRgb(object.idle, object.hot, next)));
      energyElement.style.setProperty('--glyph-energy', next.toFixed(3));
      energyElement.style.setProperty('--glyph-dash', reduced ? '0' : (1 - next).toFixed(3));
      energyElement.style.setProperty('--glyph-opacity', Math.min(1, (.24 + next * .76) * effectiveGlow * state.glow).toFixed(3));
      energyElement.style.setProperty('--glyph-glow-opacity', Math.min(1, next * .88 * effectiveGlow * state.glow).toFixed(3));
      energyElement.style.setProperty('--glyph-width', `${(object.width * (1 + next * .55)).toFixed(2)}px`);
      energyElement.style.setProperty('--glyph-glow-width', `${(object.width * 4.2 * (1 + next * .45)).toFixed(2)}px`);
      energyElement.style.transform = `translate3d(${nudgeX.toFixed(2)}px,${nudgeY.toFixed(2)}px,0) scale(${(1 + next * (object.layer === 'hero' ? .22 : .14)).toFixed(3)})`;
    });
    root.style.setProperty('--feg-heat', maxEnergy.toFixed(3));
    root.style.setProperty('--feg-px', parallaxState.current.x.toFixed(3));
    root.style.setProperty('--feg-py', parallaxState.current.y.toFixed(3));
  }, !reduced);

  const copyReference = () => {
    const write = navigator.clipboard?.writeText(config.reference);
    write?.then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };

  const rootVars: CssVars = {
    '--feg-primary': palette.primary, '--feg-secondary': palette.secondary, '--feg-hot': palette.hot,
    '--feg-dim': palette.dim, '--feg-bg': palette.background, '--feg-heat': state.ambient,
    '--feg-events': state.events * energyLevel, '--feg-connect': state.connectors * energyLevel,
    '--feg-distortion': heatDistortion, '--feg-px': 0, '--feg-py': 0,
  };

  return (
    <div ref={rootRef} className="feg-root" style={rootVars} data-variant={selectedVariant} data-state={selectedState} aria-label={`${config.title} animated glyph field`}>
      <style>{FORGE_ENERGY_GLYPH_CSS.replaceAll('#placeholder', `#${filterId}`)}</style>
      <div className="feg-aura" />
      <div className="feg-dust" aria-hidden="true">{dust.map((p) => <span key={p.id} style={{ '--x': p.x, '--y': p.y, '--s': p.size, '--o': p.opacity, '--dur': p.duration, '--delay': p.delay, '--dx': p.dx, '--dy': p.dy } as CssVars} />)}</div>

      <svg className="feg-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={selectedState === 'overdrive' ? 2.6 : 1.7} result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          {connectors.map((c) => <path key={c.id} id={`${uid}-${c.id}`} d={c.d} />)}
        </defs>
        {connectors.map((c) => <g key={c.id}><path className="feg-link-base" d={c.d} vectorEffect="non-scaling-stroke" /><path className="feg-link-flow" d={c.d} vectorEffect="non-scaling-stroke" style={{ '--dur': `${(c.duration / Math.max(.2, state.speed)).toFixed(2)}s`, '--delay': `${c.delay}s` } as CssVars} />{!reduced && <circle className="feg-link-pulse" r=".36"><animateMotion dur={`${(c.duration * 1.15 / Math.max(.2, state.speed)).toFixed(2)}s`} begin={`${c.delay}s`} repeatCount="indefinite" calcMode="linear"><mpath href={`#${uid}-${c.id}`} /></animateMotion></circle>}</g>)}
      </svg>

      <div className="feg-field" aria-hidden="true">{objects.map((object, index) => {
        const heroIndex = objects.slice(0, index + 1).filter((candidate) => candidate.layer === 'hero').length - 1;
        const label = object.layer === 'hero' ? config.heroLabels[heroIndex % config.heroLabels.length] : '';
        const vars: CssVars = {
          '--x': `${object.x}%`, '--y': `${object.y}%`, '--size': `${object.size}%`,
          '--float-duration': `${((7 + object.depth * 6) / Math.max(.2, floatSpeed * state.speed)).toFixed(2)}s`,
          '--rotate-duration': `${((32 - object.depth * 12) / Math.max(.2, rotationSpeed * state.speed)).toFixed(2)}s`,
          '--delay': `${(-object.phase * 2.1).toFixed(2)}s`, '--float-x': `${((object.direction * 4 + Math.sin(object.phase) * 3) * object.depth).toFixed(2)}px`,
          '--float-y': `${(-5 - object.depth * 8).toFixed(2)}px`, '--rotate-end': `${object.direction * 360}deg`,
        };
        return <div key={`${object.glyph.id}-${index}`} className="feg-object" data-layer={object.layer} style={vars}><div ref={(el) => { parallaxElements.current[index] = el; }} className="feg-parallax" style={{ transform: `rotate(${object.rotation}deg)` }}><div className="feg-motion"><div ref={(el) => { energyElements.current[index] = el; }} className="feg-energy" data-label={label} style={{ '--glyph-stroke': palette.dim, '--glyph-energy': state.ambient, '--glyph-dash': reduced ? 0 : .9, '--glyph-opacity': .3 * state.glow, '--glyph-glow-opacity': .08 * state.glow, '--glyph-width': `${object.width}px`, '--glyph-glow-width': `${object.width * 4}px` } as CssVars}><svg viewBox={object.glyph.viewBox ?? '0 0 120 120'}><path className="feg-path-glow" d={object.glyph.path} /><path className="feg-path-crisp" d={object.glyph.path} pathLength={1} /></svg></div></div></div></div>;
      })}</div>

      {objects.filter((object) => object.layer === 'hero').slice(0, 3).map((object, index) => <div key={`event-${index}`} className="feg-event" style={{ '--x': `${object.x}%`, '--y': `${object.y}%`, '--size': `${object.size * 1.6}%`, '--event-duration': `${((4.8 + index * 1.1) / Math.max(.2, state.speed)).toFixed(2)}s`, '--delay': `${(-index * 1.7).toFixed(2)}s` } as CssVars} />)}
      <div className="feg-heat" /><div className="feg-vignette" />

      {showVariantSwitcher && <nav className="feg-switcher" aria-label="Forge glyph variants">{FORGE_GLYPH_VARIANT_IDS.map((id) => <button key={id} type="button" aria-pressed={selectedVariant === id} onClick={() => setSelectedVariant(id)}>{FORGE_GLYPH_VARIANTS[id].shortLabel}</button>)}</nav>}
      {showStateSwitcher && <nav className="feg-state-switcher" aria-label="Glyph field states">{FORGE_GLYPH_STATE_IDS.map((id) => <button key={id} type="button" aria-pressed={selectedState === id} onClick={() => setSelectedState(id)}>{FORGE_GLYPH_STATES[id].label}</button>)}</nav>}
      <div className="feg-reference"><code>{config.reference}</code><button type="button" onClick={copyReference}>{copied ? 'COPIED' : 'COPY REF'}</button></div>
      <div className="feg-status" aria-live="polite"><strong>{config.title}</strong><span>{config.subtitle} · {state.label} · {effectiveCount} GLYPHS</span></div>
    </div>
  );
}

export default ForgeEnergyGlyphs;
