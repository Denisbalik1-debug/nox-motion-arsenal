import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';

export const DEPTH_GLOW_VARIANTS = [
  'ember-vault',
  'violet-nebula',
  'command-aurora',
  'gold-cathedral',
  'void-plasma',
] as const;

export const DEPTH_GLOW_ENERGIES = ['calm', 'charged', 'overdrive'] as const;

export type DepthGlowVariant = (typeof DEPTH_GLOW_VARIANTS)[number];
export type DepthGlowEnergy = (typeof DEPTH_GLOW_ENERGIES)[number];

type Rgb = readonly [number, number, number];
type LayerKind = 'orb' | 'beam' | 'arc' | 'cloud';

interface GlowPreset {
  id: DepthGlowVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  primary: Rgb;
  secondary: Rgb;
  tertiary: Rgb;
  background: string;
  grid: string;
  coreX: number;
  coreY: number;
  kindBias: readonly LayerKind[];
}

interface GlowEnergyPreset {
  id: DepthGlowEnergy;
  label: string;
  speed: number;
  glow: number;
  parallax: number;
  beam: number;
  core: number;
}

interface GlowLayer {
  id: number;
  kind: LayerKind;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  rotate: number;
  blur: number;
  alpha: number;
  duration: number;
  delay: number;
  color: Rgb;
  color2: Rgb;
}

export const DEPTH_GLOW_PRESETS: Record<DepthGlowVariant, GlowPreset> = {
  'ember-vault': {
    id: 'ember-vault',
    shortLabel: 'EMBER',
    label: 'Ember Vault',
    kicker: 'FORGE HEAT // VOLUMETRIC DEPTH',
    reference: 'motion:bg-depth-glow-stack@ember-vault',
    primary: [255, 69, 42],
    secondary: [236, 155, 61],
    tertiary: [255, 224, 183],
    background: 'radial-gradient(80% 70% at 50% 76%, rgba(118,24,13,.23), transparent 70%), linear-gradient(180deg,#0a0505,#020202)',
    grid: 'rgba(255,112,72,.08)',
    coreX: 50,
    coreY: 67,
    kindBias: ['orb', 'beam', 'cloud', 'arc', 'beam'],
  },
  'violet-nebula': {
    id: 'violet-nebula',
    shortLabel: 'NEBULA',
    label: 'Violet Nebula',
    kicker: 'SIGNAL CLOUD // DEEP FIELD',
    reference: 'motion:bg-depth-glow-stack@violet-nebula',
    primary: [152, 83, 255],
    secondary: [255, 73, 178],
    tertiary: [112, 202, 255],
    background: 'radial-gradient(75% 72% at 50% 52%, rgba(84,34,154,.24), transparent 69%), linear-gradient(180deg,#08040e,#020203)',
    grid: 'rgba(170,116,255,.08)',
    coreX: 52,
    coreY: 51,
    kindBias: ['cloud', 'orb', 'arc', 'cloud', 'beam'],
  },
  'command-aurora': {
    id: 'command-aurora',
    shortLabel: 'AURORA',
    label: 'Command Aurora',
    kicker: 'AGENT FIELD // LIVE ORCHESTRATION',
    reference: 'motion:bg-depth-glow-stack@command-aurora',
    primary: [63, 226, 218],
    secondary: [109, 106, 255],
    tertiary: [229, 252, 255],
    background: 'radial-gradient(72% 68% at 50% 48%, rgba(33,109,125,.22), transparent 70%), linear-gradient(180deg,#030a0d,#020204)',
    grid: 'rgba(82,229,222,.09)',
    coreX: 50,
    coreY: 48,
    kindBias: ['beam', 'arc', 'beam', 'cloud', 'orb'],
  },
  'gold-cathedral': {
    id: 'gold-cathedral',
    shortLabel: 'GOLD',
    label: 'Gold Cathedral',
    kicker: 'ASCENSION LIGHT // PREMIUM SCALE',
    reference: 'motion:bg-depth-glow-stack@gold-cathedral',
    primary: [240, 183, 76],
    secondary: [255, 225, 164],
    tertiary: [255, 248, 225],
    background: 'radial-gradient(62% 82% at 50% 12%, rgba(161,111,31,.20), transparent 72%), linear-gradient(180deg,#0c0904,#030201)',
    grid: 'rgba(240,183,76,.08)',
    coreX: 50,
    coreY: 27,
    kindBias: ['beam', 'beam', 'arc', 'orb', 'cloud'],
  },
  'void-plasma': {
    id: 'void-plasma',
    shortLabel: 'PLASMA',
    label: 'Void Plasma',
    kicker: 'EVENT HORIZON // ENERGY SHEAR',
    reference: 'motion:bg-depth-glow-stack@void-plasma',
    primary: [62, 142, 255],
    secondary: [169, 82, 255],
    tertiary: [232, 246, 255],
    background: 'radial-gradient(58% 70% at 72% 52%, rgba(40,81,174,.24), transparent 72%), linear-gradient(180deg,#02050d,#010102)',
    grid: 'rgba(94,156,255,.08)',
    coreX: 70,
    coreY: 52,
    kindBias: ['arc', 'orb', 'beam', 'arc', 'cloud'],
  },
};

export const DEPTH_GLOW_ENERGY_PRESETS: Record<DepthGlowEnergy, GlowEnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.72, glow: 0.68, parallax: 0.65, beam: 0.58, core: 0.68 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, parallax: 1, beam: 1, core: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.48, glow: 1.55, parallax: 1.22, beam: 1.42, core: 1.58 },
};

export interface DepthGlowStackProps {
  layerCount?: number;
  hueMix?: number;
  driftSpeed?: number;
  parallax?: number;
  intensity?: number;
  variant?: DepthGlowVariant;
  energy?: DepthGlowEnergy;
  beamCount?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

const rgb = (value: Rgb) => value.join(',');
const rgba = (value: Rgb, alpha: number) => `rgba(${rgb(value)},${alpha})`;

const DEPTH_GLOW_STYLES = `
.dgs2-root { --dgs-primary:255,69,42; --dgs-secondary:236,155,61; --dgs-tertiary:255,224,183; --dgs-grid:rgba(255,112,72,.08); --dgs-energy:1; --dgs-speed:1; }
.dgs2-root * { box-sizing:border-box; }
.dgs2-perspective-grid { position:absolute; left:-18%; right:-18%; bottom:-42%; height:78%; transform:perspective(620px) rotateX(67deg) translateY(calc(var(--dgs-py,0) * 7px)); transform-origin:50% 0%; opacity:.42; background-image:linear-gradient(var(--dgs-grid) 1px,transparent 1px),linear-gradient(90deg,var(--dgs-grid) 1px,transparent 1px); background-size:34px 34px; mask-image:linear-gradient(180deg,transparent,#000 18%,#000 66%,transparent); pointer-events:none; }
.dgs2-rays { position:absolute; inset:-58%; pointer-events:none; opacity:calc(.16 * var(--dgs-energy)); background:repeating-conic-gradient(from 192deg at var(--dgs-core-x) var(--dgs-core-y),transparent 0deg 10deg,rgba(var(--dgs-primary),.08) 12deg 15deg,transparent 18deg 27deg,rgba(var(--dgs-secondary),.055) 29deg 31deg,transparent 34deg 45deg); filter:blur(6px); mix-blend-mode:screen; animation:dgs2-rays calc(64s / var(--dgs-speed)) linear infinite; }
.dgs2-caustic { position:absolute; inset:-35%; pointer-events:none; opacity:calc(.26 * var(--dgs-energy)); background:conic-gradient(from 90deg at var(--dgs-core-x) var(--dgs-core-y),transparent 0 24%,rgba(var(--dgs-tertiary),.10) 31%,transparent 38% 58%,rgba(var(--dgs-secondary),.08) 64%,transparent 72%); filter:blur(22px); mix-blend-mode:screen; animation:dgs2-caustic calc(18s / var(--dgs-speed)) ease-in-out infinite alternate; }
.dgs2-layer { position:absolute; translate:-50% -50%; transform-style:preserve-3d; will-change:transform; pointer-events:none; }
.dgs2-shape { position:absolute; inset:0; opacity:var(--dgs-alpha); filter:blur(var(--dgs-blur)); mix-blend-mode:screen; transform-origin:center; will-change:transform,opacity; animation:dgs2-float calc(var(--dgs-duration) / var(--dgs-speed)) ease-in-out var(--dgs-delay) infinite alternate,dgs2-breathe calc(var(--dgs-duration) * .62 / var(--dgs-speed)) ease-in-out var(--dgs-delay) infinite; }
.dgs2-shape--orb { border-radius:50%; background:radial-gradient(ellipse at 42% 38%,rgba(var(--dgs-color2),calc(.82 * var(--dgs-energy))) 0%,rgba(var(--dgs-color),calc(.48 * var(--dgs-energy))) 26%,rgba(var(--dgs-color),calc(.16 * var(--dgs-energy))) 58%,transparent 76%); }
.dgs2-shape--cloud { border-radius:48% 52% 62% 38% / 46% 38% 62% 54%; background:radial-gradient(circle at 26% 34%,rgba(var(--dgs-color2),calc(.62 * var(--dgs-energy))),transparent 34%),radial-gradient(circle at 68% 48%,rgba(var(--dgs-color),calc(.52 * var(--dgs-energy))),transparent 45%),radial-gradient(circle at 48% 74%,rgba(var(--dgs-color2),calc(.28 * var(--dgs-energy))),transparent 54%); }
.dgs2-shape--beam { border-radius:50%; clip-path:polygon(43% 0,57% 0,82% 100%,18% 100%); background:linear-gradient(180deg,rgba(var(--dgs-color2),calc(.68 * var(--dgs-energy))) 0%,rgba(var(--dgs-color),calc(.26 * var(--dgs-energy))) 38%,transparent 92%); }
.dgs2-shape--arc { border-radius:50%; background:conic-gradient(from 20deg,transparent 0 16%,rgba(var(--dgs-color2),calc(.72 * var(--dgs-energy))) 22%,rgba(var(--dgs-color),calc(.38 * var(--dgs-energy))) 29%,transparent 38% 66%,rgba(var(--dgs-color),calc(.32 * var(--dgs-energy))) 72%,transparent 82%); -webkit-mask-image:radial-gradient(circle,transparent 0 48%,#000 53%,#000 63%,transparent 69%); mask-image:radial-gradient(circle,transparent 0 48%,#000 53%,#000 63%,transparent 69%); animation-name:dgs2-arc,dgs2-breathe; animation-timing-function:linear,ease-in-out; }
.dgs2-core { position:absolute; left:var(--dgs-core-x); top:var(--dgs-core-y); width:min(32vmin,230px); aspect-ratio:1; transform:translate(-50%,-50%) translate3d(calc(var(--dgs-px,0) * -8px),calc(var(--dgs-py,0) * -8px),0); border-radius:50%; pointer-events:none; background:radial-gradient(circle,rgba(var(--dgs-tertiary),calc(.20 * var(--dgs-energy))) 0%,rgba(var(--dgs-primary),calc(.13 * var(--dgs-energy))) 28%,transparent 67%); filter:blur(2px); box-shadow:0 0 calc(60px * var(--dgs-energy)) rgba(var(--dgs-primary),.18); }
.dgs2-core::before,.dgs2-core::after { content:''; position:absolute; border-radius:50%; inset:18%; border:1px solid rgba(var(--dgs-tertiary),calc(.20 * var(--dgs-energy))); box-shadow:0 0 24px rgba(var(--dgs-primary),.14),inset 0 0 24px rgba(var(--dgs-secondary),.08); animation:dgs2-ring calc(12s / var(--dgs-speed)) linear infinite; }
.dgs2-core::after { inset:31%; border-style:dashed; animation-duration:calc(7s / var(--dgs-speed)); animation-direction:reverse; }
.dgs2-noise { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:.055; mix-blend-mode:overlay; }
.dgs2-vignette { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at center,transparent 32%,rgba(0,0,0,.54) 100%); }
.dgs2-impact { position:absolute; width:20px; height:20px; transform:translate(-50%,-50%); border-radius:50%; border:1px solid rgba(var(--dgs-tertiary),.72); box-shadow:0 0 24px rgba(var(--dgs-primary),.68),inset 0 0 20px rgba(var(--dgs-secondary),.32); pointer-events:none; animation:dgs2-impact 1.05s cubic-bezier(.12,.8,.2,1) both; }
.dgs2-ui { position:absolute; inset:14px 14px auto; z-index:5; display:flex; align-items:flex-start; justify-content:space-between; gap:16px; pointer-events:none; }
.dgs2-heading { min-width:0; }
.dgs2-kicker { font:700 8px/1.2 var(--mono,monospace); letter-spacing:.32em; color:rgba(255,255,255,.36); }
.dgs2-title { margin-top:5px; color:rgba(255,255,255,.94); font-size:clamp(17px,3.3cqw,28px); font-weight:820; letter-spacing:-.035em; text-shadow:0 0 30px rgba(var(--dgs-primary),.24); }
.dgs2-subtitle { margin-top:5px; font:700 7px/1.2 var(--mono,monospace); letter-spacing:.22em; color:rgba(var(--dgs-secondary),.66); }
.dgs2-controls { display:flex; flex-direction:column; align-items:flex-end; gap:5px; pointer-events:auto; }
.dgs2-control-row { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:4px; }
.dgs2-button { appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(3,4,8,.62); color:rgba(255,255,255,.42); border-radius:999px; padding:6px 8px; font:700 7px/1 var(--mono,monospace); letter-spacing:.11em; cursor:pointer; backdrop-filter:blur(10px); }
.dgs2-button[data-active='true'] { color:#fff; border-color:rgba(var(--dgs-primary),.58); box-shadow:0 0 16px rgba(var(--dgs-primary),.20),inset 0 0 10px rgba(var(--dgs-primary),.08); }
.dgs2-reference { position:absolute; right:14px; bottom:12px; z-index:5; appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(3,4,8,.64); color:rgba(255,255,255,.48); border-radius:7px; padding:7px 9px; font:700 7px/1 var(--mono,monospace); letter-spacing:.13em; cursor:pointer; backdrop-filter:blur(9px); }
.dgs2-hint { position:absolute; left:14px; bottom:15px; z-index:4; font:700 7px/1 var(--mono,monospace); letter-spacing:.18em; color:rgba(255,255,255,.27); pointer-events:none; }
.dgs2-root[data-energy='overdrive'] .dgs2-caustic { opacity:.48; }
.dgs2-root[data-energy='overdrive'] .dgs2-perspective-grid { opacity:.62; }
.dgs2-root[data-energy='calm'] .dgs2-perspective-grid { opacity:.22; }
@keyframes dgs2-float { 0% { translate:-3% -2%; } 100% { translate:4% 3%; } }
@keyframes dgs2-breathe { 0%,100% { scale:.92; opacity:calc(var(--dgs-alpha) * .74); } 50% { scale:1.1; opacity:var(--dgs-alpha); } }
@keyframes dgs2-arc { to { transform:rotate(360deg); } }
@keyframes dgs2-rays { to { transform:rotate(360deg); } }
@keyframes dgs2-caustic { 0% { transform:translate3d(-5%,-3%,0) rotate(-8deg); } 100% { transform:translate3d(6%,4%,0) rotate(9deg); } }
@keyframes dgs2-ring { to { transform:rotate(360deg); } }
@keyframes dgs2-impact { 0% { opacity:0; scale:.15; } 18% { opacity:1; } 100% { opacity:0; scale:16; border-width:.15px; } }
@media (max-width:720px) { .dgs2-ui{inset:10px 10px auto}.dgs2-controls{max-width:54%}.dgs2-button{padding:5px 6px;font-size:6px}.dgs2-subtitle{display:none}.dgs2-reference{right:10px;bottom:9px}.dgs2-hint{left:10px;bottom:12px}.dgs2-perspective-grid{background-size:24px 24px} }
@media (prefers-reduced-motion:reduce) { .dgs2-shape,.dgs2-rays,.dgs2-caustic,.dgs2-core::before,.dgs2-core::after{animation:none!important}.dgs2-impact{display:none} }
`;

export function DepthGlowLayerStack({
  layerCount = 8,
  hueMix = 0.78,
  driftSpeed = 1,
  parallax = 0.62,
  intensity = 0.95,
  variant = 'ember-vault',
  energy = 'charged',
  beamCount = 3,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
}: DepthGlowStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const [activeVariant, setActiveVariant] = useState<DepthGlowVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<DepthGlowEnergy>(energy);
  const [copied, setCopied] = useState(false);
  const [impact, setImpact] = useState({ id: 0, x: 50, y: 50 });
  const parallaxState = useRef({ x: 0, y: 0 });

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const preset = DEPTH_GLOW_PRESETS[activeVariant];
  const energyPreset = DEPTH_GLOW_ENERGY_PRESETS[activeEnergy];
  const resolvedLayerCount = Math.max(3, Math.min(12, Math.round(layerCount)));
  const resolvedBeamCount = Math.max(0, Math.min(6, Math.round(beamCount)));

  const layers = useMemo<GlowLayer[]>(() => {
    const seed = 1907 + DEPTH_GLOW_VARIANTS.indexOf(activeVariant) * 8123;
    const rnd = seededRandom(seed);
    const colors = [preset.primary, preset.secondary, preset.tertiary] as const;
    const total = resolvedLayerCount + resolvedBeamCount;
    return Array.from({ length: total }, (_, index) => {
      const forcedBeam = index >= resolvedLayerCount;
      const kind = forcedBeam ? 'beam' : preset.kindBias[Math.floor(rnd() * preset.kindBias.length)];
      const depth = 0.16 + rnd() * 0.84;
      const colorIndex = rnd() > hueMix ? 0 : Math.floor(rnd() * colors.length);
      const baseSize = kind === 'beam' ? 48 + rnd() * 42 : kind === 'arc' ? 28 + rnd() * 42 : 24 + rnd() * 48;
      return {
        id: index,
        kind,
        x: kind === 'beam' ? preset.coreX - 28 + rnd() * 56 : 4 + rnd() * 92,
        y: kind === 'beam' ? preset.coreY - 58 + rnd() * 22 : 4 + rnd() * 88,
        width: kind === 'beam' ? baseSize * 0.34 : baseSize,
        height: kind === 'beam' ? baseSize * 1.65 : baseSize * (0.64 + depth * 0.58),
        depth,
        rotate: -62 + rnd() * 124,
        blur: 7 + depth * 34 + rnd() * 10,
        alpha: clamp((0.18 + rnd() * 0.3) * intensity * energyPreset.glow, 0.08, 0.8),
        duration: (16 + rnd() * 30) / Math.max(0.1, driftSpeed),
        delay: -rnd() * 38,
        color: colors[colorIndex],
        color2: colors[(colorIndex + 1 + Math.floor(rnd() * 2)) % colors.length],
      };
    });
  }, [activeVariant, driftSpeed, energyPreset.glow, hueMix, intensity, preset, resolvedBeamCount, resolvedLayerCount]);

  useRafLoop((dt) => {
    const p = pointer.current;
    const targetX = p.inside ? (p.tx - 0.5) * 2 : 0;
    const targetY = p.inside ? (p.ty - 0.5) * 2 : 0;
    parallaxState.current.x = damp(parallaxState.current.x, targetX, 6.5, dt);
    parallaxState.current.y = damp(parallaxState.current.y, targetY, 6.5, dt);
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--dgs-px', parallaxState.current.x.toFixed(3));
    root.style.setProperty('--dgs-py', parallaxState.current.y.toFixed(3));
    root.querySelectorAll<HTMLElement>('[data-dgs2-depth]').forEach((element) => {
      const depth = Number(element.dataset.dgs2Depth) || 0;
      const travel = depth * parallax * energyPreset.parallax * 42;
      const rotate = Number(element.dataset.dgs2Rotate) || 0;
      element.style.transform = `translate3d(${(-parallaxState.current.x * travel).toFixed(2)}px, ${(-parallaxState.current.y * travel).toFixed(2)}px, 0) rotate(${rotate}deg)`;
    });
  }, !reduced && parallax > 0);

  const handleImpulse = (event: PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setImpact((current) => ({
      id: current.id + 1,
      x: clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100, 0, 100),
    }));
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(`${preset.reference} + energy:${activeEnergy}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const rootStyle = {
    '--dgs-primary': rgb(preset.primary),
    '--dgs-secondary': rgb(preset.secondary),
    '--dgs-tertiary': rgb(preset.tertiary),
    '--dgs-grid': preset.grid,
    '--dgs-energy': energyPreset.glow,
    '--dgs-speed': energyPreset.speed,
    '--dgs-core-x': `${preset.coreX}%`,
    '--dgs-core-y': `${preset.coreY}%`,
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: preset.background,
    userSelect: 'none',
  } as CSSProperties;

  return (
    <div ref={rootRef} className="dgs2-root" data-variant={activeVariant} data-energy={activeEnergy} style={rootStyle} onPointerDown={handleImpulse}>
      <style>{DEPTH_GLOW_STYLES}</style>
      <div className="dgs2-perspective-grid" />
      <div className="dgs2-rays" />
      <div className="dgs2-caustic" />

      {layers.map((layer) => {
        const layerStyle = {
          left: `${layer.x}%`,
          top: `${layer.y}%`,
          width: `${layer.width}%`,
          height: `${layer.height}%`,
          '--dgs-color': rgb(layer.color),
          '--dgs-color2': rgb(layer.color2),
          '--dgs-alpha': layer.alpha,
          '--dgs-blur': `${layer.blur}px`,
          '--dgs-duration': `${layer.duration}s`,
          '--dgs-delay': `${layer.delay}s`,
        } as CSSProperties;
        return (
          <div key={layer.id} className="dgs2-layer" data-dgs2-depth={layer.depth} data-dgs2-rotate={layer.rotate} style={layerStyle}>
            <div className={`dgs2-shape dgs2-shape--${layer.kind}`} />
          </div>
        );
      })}

      <div className="dgs2-core" />
      {impact.id > 0 ? <span key={impact.id} className="dgs2-impact" style={{ left: `${impact.x}%`, top: `${impact.y}%` }} /> : null}

      <svg className="dgs2-noise" aria-hidden="true">
        <filter id="dgs2-grain"><feTurbulence type="fractalNoise" baseFrequency="0.76" numOctaves="3" seed="19" /></filter>
        <rect width="100%" height="100%" filter="url(#dgs2-grain)" />
      </svg>
      <div className="dgs2-vignette" />

      <div className="dgs2-ui">
        <div className="dgs2-heading">
          <div className="dgs2-kicker">DEPTH VOLUME // {reduced ? 'STATIC' : 'LIVE'}</div>
          <div className="dgs2-title">{preset.label}</div>
          <div className="dgs2-subtitle">{preset.kicker}</div>
        </div>
        <div className="dgs2-controls">
          {showVariantSwitcher ? (
            <div className="dgs2-control-row" aria-label="Depth glow variants">
              {DEPTH_GLOW_VARIANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="dgs2-button"
                  data-active={id === activeVariant}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveVariant(id)}
                >
                  {DEPTH_GLOW_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
          {showEnergySwitcher ? (
            <div className="dgs2-control-row" aria-label="Depth glow energy">
              {DEPTH_GLOW_ENERGIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="dgs2-button"
                  data-active={id === activeEnergy}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveEnergy(id)}
                >
                  {DEPTH_GLOW_ENERGY_PRESETS[id].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="dgs2-hint">MOVE TO BEND DEPTH // TAP TO IGNITE</div>
      <button type="button" className="dgs2-reference" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={copyReference}>
        {copied ? 'COPIED' : 'COPY CONFIG'}
      </button>
    </div>
  );
}

export default DepthGlowLayerStack;
