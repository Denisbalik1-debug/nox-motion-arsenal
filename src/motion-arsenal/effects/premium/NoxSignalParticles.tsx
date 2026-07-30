import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, lerp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';

export const SIGNAL_PARTICLE_VARIANTS = [
  'agent-constellation',
  'revenue-funnel',
  'forge-murmuration',
  'signal-vortex',
  'command-formation',
] as const;

export const SIGNAL_PARTICLE_ENERGIES = ['calm', 'charged', 'overdrive'] as const;
export const SIGNAL_PARTICLE_MODES = ['auto', 'orbit', 'swarm', 'settle'] as const;

export type SignalParticleVariant = (typeof SIGNAL_PARTICLE_VARIANTS)[number];
export type SignalParticleEnergy = (typeof SIGNAL_PARTICLE_ENERGIES)[number];
export type SignalParticleMode = (typeof SIGNAL_PARTICLE_MODES)[number];

type Rgb = readonly [number, number, number];
type Geometry = 'constellation' | 'funnel' | 'murmuration' | 'vortex' | 'formation';

interface SignalPreset {
  id: SignalParticleVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  geometry: Geometry;
  primary: Rgb;
  secondary: Rgb;
  light: Rgb;
  background: string;
  anchors: number;
}

interface EnergyPreset {
  id: SignalParticleEnergy;
  label: string;
  speed: number;
  glow: number;
  trail: number;
  links: number;
  turbulence: number;
}

export const SIGNAL_PARTICLE_PRESETS: Record<SignalParticleVariant, SignalPreset> = {
  'agent-constellation': {
    id: 'agent-constellation', shortLabel: 'AGENTS', label: 'Agent Constellation', kicker: 'NODES // ROUTING // CONSENSUS', reference: 'motion:premium-signal-particles@agent-constellation', geometry: 'constellation', primary: [124, 126, 255], secondary: [45, 226, 210], light: [235, 249, 255], anchors: 5,
    background: 'radial-gradient(76% 72% at 50% 50%,rgba(66,63,186,.23),transparent 68%),linear-gradient(180deg,#060711,#020205)',
  },
  'revenue-funnel': {
    id: 'revenue-funnel', shortLabel: 'REVENUE', label: 'Revenue Funnel Flight', kicker: 'ATTENTION // QUALIFY // CLOSE', reference: 'motion:premium-signal-particles@revenue-funnel', geometry: 'funnel', primary: [242, 183, 75], secondary: [255, 101, 61], light: [255, 248, 224], anchors: 4,
    background: 'radial-gradient(74% 68% at 58% 52%,rgba(156,98,22,.22),transparent 68%),linear-gradient(180deg,#0b0804,#030201)',
  },
  'forge-murmuration': {
    id: 'forge-murmuration', shortLabel: 'FORGE', label: 'Forge Ember Murmuration', kicker: 'CHAOS // DISCIPLINE // FORM', reference: 'motion:premium-signal-particles@forge-murmuration', geometry: 'murmuration', primary: [255, 76, 55], secondary: [218, 155, 65], light: [255, 239, 214], anchors: 3,
    background: 'radial-gradient(80% 70% at 50% 56%,rgba(132,27,18,.24),transparent 68%),linear-gradient(180deg,#090607,#020203)',
  },
  'signal-vortex': {
    id: 'signal-vortex', shortLabel: 'VORTEX', label: 'Signal Resonance Vortex', kicker: 'NOISE // RESONANCE // DEMAND', reference: 'motion:premium-signal-particles@signal-vortex', geometry: 'vortex', primary: [255, 74, 164], secondary: [111, 101, 255], light: [255, 239, 251], anchors: 2,
    background: 'radial-gradient(82% 74% at 50% 50%,rgba(137,31,104,.24),transparent 70%),linear-gradient(180deg,#0a040b,#020204)',
  },
  'command-formation': {
    id: 'command-formation', shortLabel: 'COMMAND', label: 'Command Formation', kicker: 'DEPLOY // ALIGN // EXECUTE', reference: 'motion:premium-signal-particles@command-formation', geometry: 'formation', primary: [73, 171, 255], secondary: [120, 255, 208], light: [234, 249, 255], anchors: 6,
    background: 'radial-gradient(75% 70% at 50% 48%,rgba(35,103,170,.22),transparent 70%),linear-gradient(180deg,#030811,#010204)',
  },
};

export const SIGNAL_PARTICLE_ENERGY_PRESETS: Record<SignalParticleEnergy, EnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.68, glow: 0.62, trail: 0.68, links: 0.48, turbulence: 0.55 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, trail: 1, links: 1, turbulence: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.52, glow: 1.5, trail: 1.5, links: 1.38, turbulence: 1.5 },
};

export interface NoxSignalParticlesProps {
  count?: number;
  mode?: SignalParticleMode;
  intensity?: number;
  sparkSize?: number;
  variant?: SignalParticleVariant;
  energy?: SignalParticleEnergy;
  trailLength?: number;
  linkDistance?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
  showModeSwitcher?: boolean;
}

interface Spark {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  anchor: number;
  phase: number;
  radius: number;
  speed: number;
  settleT: number;
  size: number;
  depth: number;
}

interface Burst {
  x: number;
  y: number;
  started: number;
}

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
const MODES = ['orbit', 'swarm', 'settle'] as const;

function activeModeFor(requested: SignalParticleMode, elapsed: number): (typeof MODES)[number] {
  if (requested !== 'auto') return requested;
  return MODES[Math.floor(elapsed / 5.5) % MODES.length] ?? 'orbit';
}

function formationPoint(index: number, count: number, w: number, h: number) {
  const columns = Math.max(5, Math.round(Math.sqrt(count * 1.8)));
  const row = Math.floor(index / columns);
  const col = index % columns;
  const rows = Math.ceil(count / columns);
  return {
    x: w * 0.18 + (col / Math.max(1, columns - 1)) * w * 0.64,
    y: h * 0.25 + (row / Math.max(1, rows - 1)) * h * 0.5,
  };
}

const STYLES = `
.nsp-root{--nsp-primary:124,126,255;--nsp-secondary:45,226,210;--nsp-light:235,249,255;--nsp-glow:1;position:absolute;inset:0;overflow:hidden;isolation:isolate}.nsp-root *{box-sizing:border-box}.nsp-grid{position:absolute;inset:0;opacity:.11;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:30px 30px;mask-image:radial-gradient(ellipse at center,#000 18%,transparent 78%)}.nsp-aura{position:absolute;inset:-30%;background:conic-gradient(from 0deg at 50% 50%,transparent 0 18%,rgba(var(--nsp-primary),.08) 26%,transparent 36% 57%,rgba(var(--nsp-secondary),.07) 65%,transparent 76%);filter:blur(50px);animation:nsp-spin 24s linear infinite}.nsp-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 34%,rgba(0,0,0,.62) 100%);pointer-events:none}.nsp-ui{position:absolute;top:14px;left:14px;right:14px;z-index:5;display:flex;justify-content:space-between;gap:12px;pointer-events:none}.nsp-stack{display:flex;flex-direction:column;gap:5px}.nsp-controls{display:flex;flex-wrap:wrap;gap:5px;pointer-events:auto}.nsp-btn{appearance:none;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.42);border-radius:999px;padding:6px 9px;font:700 7.5px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(10px)}.nsp-btn[data-active='true']{color:rgb(var(--nsp-light));border-color:rgba(var(--nsp-primary),.55);box-shadow:0 0 14px rgba(var(--nsp-primary),.2)}.nsp-heading{position:absolute;left:16px;bottom:16px;z-index:5;pointer-events:none}.nsp-title{font-size:11px;font-weight:800;letter-spacing:.17em;color:rgb(var(--nsp-light));text-transform:uppercase}.nsp-kicker{margin-top:5px;font:700 7px/1 var(--mono,monospace);letter-spacing:.27em;color:rgba(var(--nsp-light),.34)}.nsp-mode{position:absolute;right:16px;bottom:15px;z-index:5;font:700 8px/1 var(--mono,monospace);letter-spacing:.18em;color:rgba(var(--nsp-secondary),.7)}.nsp-copy{position:absolute;right:16px;bottom:39px;z-index:5;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.5);padding:7px 10px;border-radius:8px;font:700 8px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer}.nsp-root[data-energy='overdrive'] .nsp-aura{animation-duration:9s;opacity:1}.nsp-root[data-energy='calm'] .nsp-aura{animation-duration:35s;opacity:.55}@keyframes nsp-spin{to{transform:rotate(360deg)}}@media(max-width:660px){.nsp-ui{align-items:flex-start}.nsp-controls{max-width:240px}.nsp-heading{display:none}.nsp-copy{display:none}}@media(prefers-reduced-motion:reduce){.nsp-aura{animation:none!important}}
`;

export function NoxSignalParticles({
  count = 72,
  mode = 'auto',
  intensity = 1,
  sparkSize = 1.15,
  variant = 'agent-constellation',
  energy = 'charged',
  trailLength = 1,
  linkDistance = 92,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
  showModeSwitcher = true,
}: NoxSignalParticlesProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const sparks = useRef<Spark[]>([]);
  const sparkSignature = useRef('');
  const burst = useRef<Burst | null>(null);
  const [activeVariant, setActiveVariant] = useState<SignalParticleVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<SignalParticleEnergy>(energy);
  const [activeMode, setActiveMode] = useState<SignalParticleMode>(mode);
  const [displayMode, setDisplayMode] = useState('ORBIT');
  const [copied, setCopied] = useState(false);

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);
  useEffect(() => setActiveMode(mode), [mode]);

  const preset = SIGNAL_PARTICLE_PRESETS[activeVariant];
  const energyPreset = SIGNAL_PARTICLE_ENERGY_PRESETS[activeEnergy];
  const safeCount = Math.max(12, Math.min(180, Math.round(count)));

  const seed = useMemo(() => SIGNAL_PARTICLE_VARIANTS.indexOf(activeVariant) * 173 + 4242, [activeVariant]);
  const signature = `${activeVariant}:${safeCount}:${sparkSize}`;
  if (sparkSignature.current !== signature) {
    const rnd = seededRandom(seed);
    sparks.current = Array.from({ length: safeCount }, (_, i) => ({
      x: Number.NaN, y: Number.NaN, px: 0, py: 0, vx: 0, vy: 0,
      anchor: i % preset.anchors,
      phase: rnd() * Math.PI * 2,
      radius: 0.045 + rnd() * 0.17,
      speed: 0.42 + rnd() * 0.95,
      settleT: i / Math.max(1, safeCount - 1),
      size: (0.65 + rnd() * 0.95) * sparkSize,
      depth: 0.25 + rnd() * 0.75,
    }));
    sparkSignature.current = signature;
  }

  useCanvas2D(canvasRef, (ctx, size, dt, elapsed) => {
    const { w, h } = size;
    const choreography = activeModeFor(activeMode, elapsed);
    if (displayMode !== choreography.toUpperCase()) setDisplayMode(choreography.toUpperCase());

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(2,3,7,${clamp(0.22 / Math.max(0.35, trailLength * energyPreset.trail), 0.035, 0.32)})`;
    ctx.fillRect(0, 0, w, h);

    const p = pointer.current;
    const mx = (p.inside ? p.tx : 0.5 + 0.21 * Math.sin(elapsed * 0.37)) * w;
    const my = (p.inside ? p.ty : 0.5 + 0.15 * Math.cos(elapsed * 0.31)) * h;
    const speed = intensity * energyPreset.speed;
    const nowBurst = burst.current;
    const burstAge = nowBurst ? performance.now() / 1000 - nowBurst.started : 99;

    const anchors = Array.from({ length: preset.anchors }, (_, i) => {
      const a = (i / preset.anchors) * Math.PI * 2 - Math.PI / 2;
      return { x: w * 0.5 + Math.cos(a) * w * 0.19, y: h * 0.5 + Math.sin(a) * h * 0.19 };
    });

    for (let i = 0; i < sparks.current.length; i++) {
      const s = sparks.current[i];
      s.px = s.x;
      s.py = s.y;
      let tx = w * 0.5;
      let ty = h * 0.5;

      if (choreography === 'swarm') {
        const angle = s.phase + elapsed * s.speed * 1.6 * speed;
        tx = mx + Math.cos(angle) * (20 + s.radius * w * 0.55);
        ty = my + Math.sin(angle * 1.27) * (18 + s.radius * h * 0.5);
      } else if (choreography === 'settle') {
        if (preset.geometry === 'formation') {
          const point = formationPoint(i, safeCount, w, h);
          tx = point.x; ty = point.y;
        } else if (preset.geometry === 'funnel') {
          tx = w * (0.14 + s.settleT * 0.72);
          ty = h * 0.5 + (s.settleT - 0.5) * (s.settleT - 0.5) * h * 0.28 * (i % 2 ? 1 : -1);
        } else {
          tx = w * 0.15 + s.settleT * w * 0.7;
          ty = h * 0.76 + Math.sin(elapsed * 2 + s.phase) * 2.5;
        }
      } else {
        const anchor = anchors[s.anchor % anchors.length];
        const angle = s.phase + elapsed * s.speed * speed;
        switch (preset.geometry) {
          case 'funnel': {
            const travel = (s.phase / (Math.PI * 2) + elapsed * 0.035 * s.speed * speed) % 1;
            tx = w * 0.12 + travel * w * 0.76;
            ty = h * 0.5 + Math.sin(angle) * h * 0.25 * (1 - travel) + (s.anchor - preset.anchors / 2) * 3;
            break;
          }
          case 'murmuration': {
            const wave = Math.sin(elapsed * 0.7 * speed + s.phase * 0.7);
            tx = w * 0.5 + Math.cos(angle * 0.72) * w * (0.18 + s.radius) + wave * w * 0.08;
            ty = h * 0.5 + Math.sin(angle * 1.08) * h * (0.12 + s.radius * 0.45) + Math.sin(elapsed + s.phase) * h * 0.04;
            break;
          }
          case 'vortex': {
            const r = (0.035 + s.radius * 1.65) * (0.76 + 0.24 * Math.sin(elapsed * 0.45 + s.phase));
            tx = w * 0.5 + Math.cos(angle * 1.4) * w * r;
            ty = h * 0.5 + Math.sin(angle * 1.4) * h * r * 0.78;
            break;
          }
          case 'formation': {
            const point = formationPoint(i, safeCount, w, h);
            tx = lerp(point.x, anchor.x + Math.cos(angle) * s.radius * w, 0.28);
            ty = lerp(point.y, anchor.y + Math.sin(angle) * s.radius * h, 0.28);
            break;
          }
          case 'constellation':
          default:
            tx = anchor.x + Math.cos(angle) * s.radius * w;
            ty = anchor.y + Math.sin(angle * 1.14) * s.radius * h * 0.86;
            break;
        }
      }

      if (p.inside && choreography !== 'swarm' && !reduced) {
        const dx = tx - mx;
        const dy = ty - my;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance < Math.min(w, h) * 0.24) {
          const force = (1 - distance / (Math.min(w, h) * 0.24)) * energyPreset.turbulence;
          tx += (dx / distance) * force * 42 - (dy / distance) * force * 18;
          ty += (dy / distance) * force * 42 + (dx / distance) * force * 18;
        }
      }

      if (nowBurst && burstAge < 1.2 && !reduced) {
        const bx = nowBurst.x * w;
        const by = nowBurst.y * h;
        const dx = tx - bx;
        const dy = ty - by;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const radius = Math.min(w, h) * (0.08 + burstAge * 0.7);
        if (distance < radius) {
          const force = (1 - distance / radius) * Math.sin(Math.min(1, burstAge / 1.2) * Math.PI) * 150 * energyPreset.glow;
          tx += (dx / distance) * force;
          ty += (dy / distance) * force;
        }
      }

      if (reduced) {
        s.x = tx; s.y = ty;
      } else {
        s.x = Number.isFinite(s.x) ? damp(s.x, tx, 3.2 + s.depth * 1.8, dt) : tx;
        s.y = Number.isFinite(s.y) ? damp(s.y, ty, 3.2 + s.depth * 1.8, dt) : ty;
      }
    }

    if (energyPreset.links > 0.4 && activeVariant !== 'forge-murmuration') {
      ctx.globalCompositeOperation = 'lighter';
      const maxLinks = activeEnergy === 'overdrive' ? 140 : activeEnergy === 'charged' ? 80 : 36;
      let links = 0;
      for (let i = 0; i < sparks.current.length && links < maxLinks; i += 2) {
        const a = sparks.current[i];
        for (let j = i + 3; j < sparks.current.length && j < i + 13 && links < maxLinks; j += 3) {
          const b = sparks.current[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          const threshold = linkDistance * energyPreset.links;
          if (distance < threshold) {
            const alpha = (1 - distance / threshold) * 0.13 * energyPreset.glow;
            ctx.strokeStyle = rgba(preset.secondary, alpha);
            ctx.lineWidth = 0.65;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            links++;
          }
        }
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const s of sparks.current) {
      const dx = s.x - s.px;
      const dy = s.y - s.py;
      const velocity = clamp(Math.hypot(dx, dy) * 2.4, 0, 1);
      const flicker = 0.68 + 0.32 * Math.sin(elapsed * 6 * s.speed + s.phase);
      const r = s.size * (0.8 + 0.45 * flicker) * (0.72 + s.depth * 0.45);
      const alpha = clamp((0.36 + 0.5 * flicker) * intensity * energyPreset.glow, 0, 1);
      const color = s.depth > 0.62 ? preset.primary : preset.secondary;

      ctx.strokeStyle = rgba(color, alpha * (0.16 + velocity * 0.48) * energyPreset.trail);
      ctx.lineWidth = Math.max(0.5, r * 0.75);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - dx * (9 + trailLength * 9), s.y - dy * (9 + trailLength * 9)); ctx.stroke();

      ctx.fillStyle = rgba(color, alpha);
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(preset.light, alpha * 0.55);
      ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(s.x - r * 2.5, s.y); ctx.lineTo(s.x + r * 2.5, s.y); ctx.moveTo(s.x, s.y - r * 2.5); ctx.lineTo(s.x, s.y + r * 2.5); ctx.stroke();
    }

    if (nowBurst && burstAge < 1.2) {
      ctx.globalCompositeOperation = 'lighter';
      const radius = Math.min(w, h) * burstAge * 0.6;
      ctx.strokeStyle = rgba(preset.light, Math.max(0, 0.65 - burstAge * 0.52));
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(nowBurst.x * w, nowBurst.y * h, radius, 0, Math.PI * 2); ctx.stroke();
    }
  }, !reduced);

  const onBurst = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    burst.current = { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1), started: performance.now() / 1000 };
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(`${preset.reference} + energy:${activeEnergy} + mode:${activeMode}`);
      setCopied(true); window.setTimeout(() => setCopied(false), 1200);
    } catch { setCopied(false); }
  };

  const style = {
    '--nsp-primary': preset.primary.join(','), '--nsp-secondary': preset.secondary.join(','), '--nsp-light': preset.light.join(','), '--nsp-glow': energyPreset.glow,
    background: preset.background,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="nsp-root" data-variant={activeVariant} data-energy={activeEnergy} style={style} onPointerDown={onBurst}>
      <style>{STYLES}</style><div className="nsp-grid" /><div className="nsp-aura" /><canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} /><div className="nsp-vignette" />
      <div className="nsp-ui">
        <div className="nsp-stack">
          {showVariantSwitcher ? <div className="nsp-controls" aria-label="Signal particle variants">{SIGNAL_PARTICLE_VARIANTS.map((id) => <button key={id} type="button" className="nsp-btn" data-active={id === activeVariant} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveVariant(id)}>{SIGNAL_PARTICLE_PRESETS[id].shortLabel}</button>)}</div> : null}
          {showModeSwitcher ? <div className="nsp-controls" aria-label="Particle choreography">{SIGNAL_PARTICLE_MODES.map((id) => <button key={id} type="button" className="nsp-btn" data-active={id === activeMode} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveMode(id)}>{id.toUpperCase()}</button>)}</div> : null}
        </div>
        {showEnergySwitcher ? <div className="nsp-controls" aria-label="Signal particle energy">{SIGNAL_PARTICLE_ENERGIES.map((id) => <button key={id} type="button" className="nsp-btn" data-active={id === activeEnergy} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveEnergy(id)}>{SIGNAL_PARTICLE_ENERGY_PRESETS[id].label}</button>)}</div> : null}
      </div>
      <div className="nsp-heading"><div className="nsp-title">{preset.label}</div><div className="nsp-kicker">{preset.kicker}</div></div>
      <div className="nsp-mode">MODE // {displayMode}</div><button type="button" className="nsp-copy" onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={copyReference}>{copied ? 'COPIED' : 'COPY CONFIG'}</button>
    </div>
  );
}

export default NoxSignalParticles;
