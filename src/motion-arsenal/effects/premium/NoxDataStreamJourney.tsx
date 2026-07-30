import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, lerp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';

export const DATA_STREAM_VARIANTS = [
  'revenue-river',
  'agent-swarm-routing',
  'conversion-helix',
  'signal-storm',
  'quantum-tunnel',
] as const;

export const DATA_STREAM_ENERGIES = ['calm', 'charged', 'overdrive'] as const;

export type DataStreamVariant = (typeof DATA_STREAM_VARIANTS)[number];
export type DataStreamEnergy = (typeof DATA_STREAM_ENERGIES)[number];

type Geometry = 'river' | 'swarm' | 'helix' | 'storm' | 'tunnel';
type Rgb = readonly [number, number, number];

interface DataStreamPreset {
  id: DataStreamVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  geometry: Geometry;
  primary: Rgb;
  secondary: Rgb;
  success: Rgb;
  background: string;
  fade: Rgb;
  stations: readonly string[];
}

interface EnergyPreset {
  id: DataStreamEnergy;
  label: string;
  speed: number;
  glow: number;
  turbulence: number;
  trailAlpha: number;
  rails: number;
  sparkChance: number;
}

export const DATA_STREAM_PRESETS: Record<DataStreamVariant, DataStreamPreset> = {
  'revenue-river': {
    id: 'revenue-river',
    shortLabel: 'REVENUE',
    label: 'Revenue River',
    kicker: 'SIGNAL → PIPELINE → CLOSE',
    reference: 'motion:premium-data-stream-journey@revenue-river',
    geometry: 'river',
    primary: [255, 77, 61],
    secondary: [240, 182, 77],
    success: [94, 238, 166],
    background: 'radial-gradient(80% 70% at 50% 54%, rgba(132, 28, 21, .22), transparent 68%), linear-gradient(180deg, #090607, #020203)',
    fade: [5, 3, 5],
    stations: ['SIGNAL', 'LEAD', 'QUALIFY', 'PITCH', 'FOLLOW-UP', 'CLOSE'],
  },
  'agent-swarm-routing': {
    id: 'agent-swarm-routing',
    shortLabel: 'AGENTS',
    label: 'Agent Swarm Routing',
    kicker: 'INPUT → ORCHESTRATION → OUTPUT',
    reference: 'motion:premium-data-stream-journey@agent-swarm-routing',
    geometry: 'swarm',
    primary: [124, 126, 255],
    secondary: [45, 226, 210],
    success: [224, 255, 250],
    background: 'radial-gradient(78% 72% at 50% 52%, rgba(65, 61, 182, .24), transparent 68%), linear-gradient(180deg, #060711, #020205)',
    fade: [3, 4, 10],
    stations: ['INPUT', 'TRIAGE', 'ROUTER', 'AGENT', 'REVIEW', 'OUTPUT'],
  },
  'conversion-helix': {
    id: 'conversion-helix',
    shortLabel: 'HELIX',
    label: 'Conversion Helix',
    kicker: 'INTENT → TRUST → ACTION',
    reference: 'motion:premium-data-stream-journey@conversion-helix',
    geometry: 'helix',
    primary: [244, 190, 79],
    secondary: [255, 103, 61],
    success: [255, 248, 221],
    background: 'radial-gradient(72% 76% at 50% 50%, rgba(154, 97, 22, .23), transparent 68%), linear-gradient(180deg, #0b0804, #030201)',
    fade: [7, 4, 2],
    stations: ['VISITOR', 'INTENT', 'TRUST', 'OFFER', 'ACTION', 'REVENUE'],
  },
  'signal-storm': {
    id: 'signal-storm',
    shortLabel: 'STORM',
    label: 'Signal Storm',
    kicker: 'NOISE → SIGNAL → DEMAND',
    reference: 'motion:premium-data-stream-journey@signal-storm',
    geometry: 'storm',
    primary: [255, 72, 166],
    secondary: [125, 108, 255],
    success: [85, 232, 255],
    background: 'radial-gradient(84% 74% at 52% 48%, rgba(136, 31, 104, .24), transparent 70%), linear-gradient(180deg, #0a040b, #020204)',
    fade: [6, 2, 8],
    stations: ['NOISE', 'FILTER', 'SIGNAL', 'AMPLIFY', 'DISTRIBUTE', 'DEMAND'],
  },
  'quantum-tunnel': {
    id: 'quantum-tunnel',
    shortLabel: 'TUNNEL',
    label: 'Quantum Decision Tunnel',
    kicker: 'CHAOS → VECTOR → SCALE',
    reference: 'motion:premium-data-stream-journey@quantum-tunnel',
    geometry: 'tunnel',
    primary: [75, 170, 255],
    secondary: [176, 126, 255],
    success: [235, 249, 255],
    background: 'radial-gradient(64% 82% at 83% 50%, rgba(69, 121, 210, .24), transparent 72%), linear-gradient(180deg, #030711, #010204)',
    fade: [2, 4, 10],
    stations: ['CHAOS', 'VECTOR', 'MODEL', 'DECISION', 'SYSTEM', 'SCALE'],
  },
};

export const DATA_STREAM_ENERGY_PRESETS: Record<DataStreamEnergy, EnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.72, glow: 0.68, turbulence: 0.52, trailAlpha: 0.19, rails: 3, sparkChance: 0.02 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, turbulence: 1, trailAlpha: 0.12, rails: 5, sparkChance: 0.08 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.46, glow: 1.52, turbulence: 1.55, trailAlpha: 0.065, rails: 7, sparkChance: 0.2 },
};

export interface NoxDataStreamJourneyProps {
  particleCount?: number;
  speed?: number;
  disturb?: number;
  progress?: number;
  labels?: boolean;
  variant?: DataStreamVariant;
  energy?: DataStreamEnergy;
  trailLength?: number;
  branchIntensity?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

interface Particle {
  t: number;
  lane: number;
  v: number;
  ox: number;
  oy: number;
  phase: number;
  size: number;
  spark: number;
}

interface PathPoint {
  x: number;
  y: number;
  dx: number;
  dy: number;
  depth: number;
}

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

function pathPosition(geometry: Geometry, t: number, lane: number, phase: number, w: number, h: number, elapsed: number) {
  const tt = clamp(t, 0, 1);
  const xLinear = lerp(w * 0.055, w * 0.945, tt);

  switch (geometry) {
    case 'swarm': {
      const envelope = Math.pow(Math.sin(Math.PI * tt), 1.3);
      const branch = lane < 0 ? -1 : 1;
      const branchSpread = branch * envelope * h * (0.07 + Math.abs(lane) * 0.13);
      return {
        x: xLinear + Math.sin(tt * Math.PI * 5 + phase) * w * 0.007,
        y: h * 0.5 + branchSpread + Math.sin(tt * Math.PI * 4 + phase + elapsed * 0.18) * h * 0.014,
        depth: 0.5 + Math.abs(lane) * 0.5,
      };
    }
    case 'helix': {
      const angle = tt * Math.PI * 4.4 + phase + lane * 1.4;
      const amp = h * (0.072 + Math.abs(lane) * 0.032);
      return {
        x: xLinear + Math.cos(angle) * w * 0.012,
        y: h * 0.5 + Math.sin(angle) * amp,
        depth: 0.5 + Math.cos(angle) * 0.5,
      };
    }
    case 'storm': {
      const high = Math.sin(tt * Math.PI * 10.2 + phase + elapsed * 0.25) * h * 0.035;
      const low = Math.sin(tt * Math.PI * 2.7 + phase * 0.31) * h * 0.12;
      return {
        x: xLinear + Math.sin(tt * Math.PI * 7 + phase) * w * 0.009,
        y: h * 0.5 + low + high * (1 - tt * 0.28) + lane * h * 0.035,
        depth: 0.45 + 0.55 * Math.abs(Math.sin(tt * Math.PI * 3 + phase)),
      };
    }
    case 'tunnel': {
      const spread = Math.pow(1 - tt, 0.72);
      return {
        x: xLinear,
        y: h * 0.5 + (lane * h * 0.31 + Math.sin(tt * Math.PI * 5.2 + phase) * h * 0.035) * spread,
        depth: tt,
      };
    }
    case 'river':
    default:
      return {
        x: xLinear,
        y: h * 0.52 + Math.sin(tt * Math.PI * 2.2 + 0.4) * h * 0.13 + lane * h * 0.044 + Math.sin(tt * Math.PI * 6 + phase) * h * 0.008,
        depth: 0.55 + Math.abs(lane) * 0.3,
      };
  }
}

function samplePath(geometry: Geometry, t: number, lane: number, phase: number, w: number, h: number, elapsed: number): PathPoint {
  const p = pathPosition(geometry, t, lane, phase, w, h, elapsed);
  const before = pathPosition(geometry, Math.max(0, t - 0.004), lane, phase, w, h, elapsed);
  const length = Math.max(0.001, Math.hypot(p.x - before.x, p.y - before.y));
  return {
    x: p.x,
    y: p.y,
    dx: (p.x - before.x) / length,
    dy: (p.y - before.y) / length,
    depth: p.depth,
  };
}

const DATA_STREAM_STYLES = `
.nds-root { --nds-primary:255,77,61; --nds-secondary:240,182,77; --nds-success:94,238,166; }
.nds-root * { box-sizing:border-box; }
.nds-vignette { position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at 50% 50%,transparent 38%,rgba(0,0,0,.52) 100%); }
.nds-scan { position:absolute; inset:-20%; pointer-events:none; opacity:.28; mix-blend-mode:screen; background:linear-gradient(100deg,transparent 28%,rgba(var(--nds-primary),.10) 44%,rgba(255,255,255,.08) 50%,rgba(var(--nds-secondary),.08) 56%,transparent 72%); animation:nds-scan 7s ease-in-out infinite; }
.nds-grid { position:absolute; inset:0; pointer-events:none; opacity:.13; background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px); background-size:32px 32px; mask-image:radial-gradient(ellipse at center,#000 18%,transparent 76%); }
.nds-ui { position:absolute; inset:14px 14px auto 14px; z-index:4; display:flex; justify-content:space-between; gap:16px; pointer-events:none; }
.nds-heading { pointer-events:none; min-width:0; }
.nds-kicker { font:700 8px/1.2 var(--mono,monospace); letter-spacing:.34em; color:rgba(255,255,255,.38); }
.nds-title { margin-top:5px; font-size:clamp(16px,3cqw,26px); font-weight:820; letter-spacing:-.03em; color:rgba(255,255,255,.94); text-shadow:0 0 28px rgba(var(--nds-primary),.24); }
.nds-subtitle { margin-top:5px; font:700 7px/1.2 var(--mono,monospace); letter-spacing:.24em; color:rgba(var(--nds-secondary),.66); }
.nds-controls { display:flex; flex-direction:column; align-items:flex-end; gap:5px; pointer-events:auto; }
.nds-control-row { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:4px; }
.nds-button { appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(4,5,9,.64); color:rgba(255,255,255,.42); border-radius:999px; padding:6px 8px; font:700 7px/1 var(--mono,monospace); letter-spacing:.11em; cursor:pointer; backdrop-filter:blur(10px); }
.nds-button[data-active='true'] { color:#fff; border-color:rgba(var(--nds-primary),.58); box-shadow:0 0 16px rgba(var(--nds-primary),.18),inset 0 0 10px rgba(var(--nds-primary),.07); }
.nds-reference { position:absolute; right:14px; bottom:12px; z-index:5; appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(3,4,8,.66); color:rgba(255,255,255,.48); border-radius:7px; padding:7px 9px; font:700 7px/1 var(--mono,monospace); letter-spacing:.13em; cursor:pointer; backdrop-filter:blur(9px); }
.nds-hint { position:absolute; left:14px; bottom:15px; z-index:4; font:700 7px/1 var(--mono,monospace); letter-spacing:.18em; color:rgba(255,255,255,.27); pointer-events:none; }
.nds-root[data-energy='overdrive'] .nds-scan { animation-duration:3.4s; opacity:.48; }
.nds-root[data-energy='calm'] .nds-scan { animation-duration:11s; opacity:.16; }
@keyframes nds-scan { 0%,12% { transform:translateX(-30%) rotate(-4deg); opacity:.05; } 48% { opacity:.42; } 82%,100% { transform:translateX(30%) rotate(5deg); opacity:.08; } }
@media (max-width:720px) { .nds-ui{inset:10px 10px auto}.nds-controls{max-width:52%}.nds-button{padding:5px 6px;font-size:6px}.nds-kicker{letter-spacing:.22em}.nds-subtitle{display:none}.nds-reference{right:10px;bottom:9px}.nds-hint{left:10px;bottom:12px} }
@media (prefers-reduced-motion:reduce) { .nds-scan{animation:none!important;opacity:.14} }
`;

export function NoxDataStreamJourney({
  particleCount = 110,
  speed = 0.9,
  disturb = 0.72,
  progress = -1,
  labels = true,
  variant = 'revenue-river',
  energy = 'charged',
  trailLength = 1,
  branchIntensity = 1,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
}: NoxDataStreamJourneyProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const particles = useRef<Particle[]>([]);
  const particleKey = useRef('');
  const smoothProgress = useRef(0.08);
  const impact = useRef({ startedAt: -20, x: 0.5, y: 0.5 });
  const [activeVariant, setActiveVariant] = useState<DataStreamVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<DataStreamEnergy>(energy);
  const [copied, setCopied] = useState(false);

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const preset = DATA_STREAM_PRESETS[activeVariant];
  const energyPreset = DATA_STREAM_ENERGY_PRESETS[activeEnergy];

  const particleSeed = useMemo(() => DATA_STREAM_VARIANTS.indexOf(activeVariant) * 7919 + 7331, [activeVariant]);
  const resolvedCount = Math.max(24, Math.min(260, Math.round(particleCount)));
  const nextParticleKey = `${particleSeed}:${resolvedCount}`;
  if (particleKey.current !== nextParticleKey) {
    const rnd = seededRandom(particleSeed);
    particles.current = Array.from({ length: resolvedCount }, () => ({
      t: rnd(),
      lane: (rnd() - 0.5) * 2,
      v: 0.55 + rnd() * 0.95,
      ox: 0,
      oy: 0,
      phase: rnd() * Math.PI * 2,
      size: 0.65 + rnd() * 1.55,
      spark: rnd(),
    }));
    particleKey.current = nextParticleKey;
  }

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const { w, h } = size;
      const energyScale = energyPreset.speed * speed;
      const autoTarget = 0.08 + ((elapsed * 0.075 * energyPreset.speed) % 1) * 0.92;
      const target = reduced ? 1 : progress >= 0 ? clamp(progress, 0, 1) : autoTarget;
      if (progress < 0 && target < smoothProgress.current - 0.55) smoothProgress.current = target;
      smoothProgress.current = damp(smoothProgress.current, target, 4.8, dt);
      const prog = Math.max(0.035, smoothProgress.current);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgba(preset.fade, reduced ? 1 : clamp(energyPreset.trailAlpha / Math.max(0.35, trailLength), 0.035, 0.36));
      ctx.fillRect(0, 0, w, h);

      const railGradient = ctx.createLinearGradient(w * 0.05, 0, w * 0.95, 0);
      railGradient.addColorStop(0, rgba(preset.primary, 0.06));
      railGradient.addColorStop(0.52, rgba(preset.secondary, 0.18 * energyPreset.glow));
      railGradient.addColorStop(1, rgba(preset.success, 0.08));

      ctx.globalCompositeOperation = 'lighter';
      const railCount = energyPreset.rails;
      for (let rail = 0; rail < railCount; rail++) {
        const lane = railCount <= 1 ? 0 : lerp(-0.9, 0.9, rail / (railCount - 1));
        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const t = i / 90;
          const point = samplePath(preset.geometry, t, lane * branchIntensity, rail * 0.79, w, h, elapsed);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = railGradient;
        ctx.lineWidth = rail === Math.floor(railCount / 2) ? 1.2 : 0.65;
        ctx.stroke();
      }

      ctx.beginPath();
      for (let i = 0; i <= 110; i++) {
        const t = (i / 110) * prog;
        const point = samplePath(preset.geometry, t, 0, 0, w, h, elapsed);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.strokeStyle = rgba(preset.primary, 0.24 * energyPreset.glow);
      ctx.lineWidth = 1.7;
      ctx.stroke();

      const p = pointer.current;
      const mx = p.tx * w;
      const my = p.ty * h;
      const radius = Math.min(w, h) * (activeEnergy === 'overdrive' ? 0.31 : 0.24);
      const impactAge = performance.now() / 1000 - impact.current.startedAt;
      const impactActive = impactAge >= 0 && impactAge < 1.35;
      const ix = impact.current.x * w;
      const iy = impact.current.y * h;
      const impactRadius = Math.min(w, h) * (0.08 + impactAge * 0.42);
      const impactPower = impactActive ? Math.sin(Math.min(impactAge / 1.35, 1) * Math.PI) * 1.35 : 0;

      for (const part of particles.current) {
        if (!reduced) {
          part.t += part.v * energyScale * dt * 0.072;
          if (part.t > prog + 0.018 || part.t > 1) part.t = 0;
        }

        const current = samplePath(preset.geometry, part.t, part.lane * branchIntensity, part.phase, w, h, elapsed);
        const bx = current.x;
        const by = current.y;

        if (p.inside && !reduced && disturb > 0) {
          const dx = bx - mx;
          const dy = by - my;
          const d = Math.hypot(dx, dy);
          if (d < radius && d > 0.001) {
            const f = Math.pow(1 - d / radius, 1.6) * disturb * energyPreset.turbulence;
            part.ox += ((dx / d) * f * 58 - (dy / d) * f * 46) * dt * 8;
            part.oy += ((dy / d) * f * 58 + (dx / d) * f * 46) * dt * 8;
          }
        }

        if (impactActive && !reduced) {
          const dx = bx - ix;
          const dy = by - iy;
          const d = Math.max(0.001, Math.hypot(dx, dy));
          const ringDistance = Math.abs(d - impactRadius);
          if (ringDistance < Math.min(w, h) * 0.09) {
            const f = (1 - ringDistance / (Math.min(w, h) * 0.09)) * impactPower;
            part.ox += (dx / d) * f * 180 * dt;
            part.oy += (dy / d) * f * 180 * dt;
          }
        }

        part.ox = damp(part.ox, 0, 3.4, dt);
        part.oy = damp(part.oy, 0, 3.4, dt);

        const conversion = clamp((part.t - 0.78) / 0.22, 0, 1);
        const laneMix = clamp(Math.abs(part.lane) * 0.65 + 0.15, 0, 1);
        const baseColor = mixRgb(preset.primary, preset.secondary, laneMix);
        const color = mixRgb(baseColor, preset.success, conversion);
        const x = bx + part.ox;
        const y = by + part.oy;
        const depthScale = 0.72 + current.depth * 0.7;
        const radiusPx = part.size * depthScale * (activeEnergy === 'overdrive' ? 1.15 : 1);
        const tail = (10 + part.v * 15) * trailLength * energyPreset.speed;
        const tailX = x - current.dx * tail;
        const tailY = y - current.dy * tail;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = rgba(color, 0.08 * energyPreset.glow);
        ctx.lineWidth = radiusPx * 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = rgba(color, 0.52 + current.depth * 0.32);
        ctx.lineWidth = Math.max(0.6, radiusPx * 0.9);
        ctx.stroke();

        ctx.fillStyle = rgba(color, 0.86);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.7, radiusPx), 0, Math.PI * 2);
        ctx.fill();

        if (part.spark < energyPreset.sparkChance && part.t > 0.08 && !reduced) {
          const sparkLength = 5 + part.size * 6;
          ctx.beginPath();
          ctx.moveTo(x - current.dy * sparkLength, y + current.dx * sparkLength);
          ctx.lineTo(x + current.dy * sparkLength, y - current.dx * sparkLength);
          ctx.strokeStyle = rgba(preset.success, 0.15 + 0.24 * Math.sin(elapsed * 7 + part.phase) ** 2);
          ctx.lineWidth = 0.55;
          ctx.stroke();
        }
      }

      preset.stations.forEach((label, i) => {
        const t = i / (preset.stations.length - 1);
        const point = samplePath(preset.geometry, t, 0, 0, w, h, elapsed);
        const on = t <= prog + 0.001;
        const pulse = on && !reduced ? 0.5 + 0.5 * Math.sin(elapsed * (2.2 + energyPreset.speed) + i * 0.9) : 0.35;
        const stationColor = i === preset.stations.length - 1 ? preset.success : i % 2 ? preset.secondary : preset.primary;

        ctx.beginPath();
        ctx.arc(point.x, point.y, on ? 4.4 + pulse * 1.8 : 2.7, 0, Math.PI * 2);
        ctx.fillStyle = on ? rgba(stationColor, 0.76 + pulse * 0.24) : 'rgba(240,236,228,.18)';
        ctx.fill();

        if (on) {
          for (let ring = 0; ring < (activeEnergy === 'overdrive' ? 3 : 2); ring++) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8 + ring * 5 + pulse * 4, 0, Math.PI * 2);
            ctx.strokeStyle = rgba(stationColor, (0.24 / (ring + 1)) * (1 - pulse * 0.3));
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (labels && w > 460) {
          ctx.font = '700 8px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = on ? 'rgba(244,244,248,.82)' : 'rgba(160,160,170,.34)';
          ctx.fillText(label, point.x, point.y + (i % 2 === 0 ? -20 : 28));
        }
      });

      const front = samplePath(preset.geometry, prog, 0, 0, w, h, elapsed);
      const frontPulse = 0.5 + 0.5 * Math.sin(elapsed * 4.2 * energyPreset.speed);
      ctx.beginPath();
      ctx.arc(front.x, front.y, 11 + frontPulse * 9, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(preset.success, 0.24 + frontPulse * 0.28);
      ctx.lineWidth = 1.1;
      ctx.stroke();

      if (impactActive) {
        const fade = 1 - impactAge / 1.35;
        for (let ring = 0; ring < 3; ring++) {
          ctx.beginPath();
          ctx.arc(ix, iy, impactRadius * (0.7 + ring * 0.16), 0, Math.PI * 2);
          ctx.strokeStyle = rgba(ring === 2 ? preset.secondary : preset.primary, fade * (0.38 - ring * 0.08));
          ctx.lineWidth = 1.2 - ring * 0.25;
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
    },
    !reduced,
  );

  const handleImpulse = (event: PointerEvent<HTMLDivElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    impact.current = {
      startedAt: performance.now() / 1000,
      x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
      y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
    };
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
    '--nds-primary': preset.primary.join(','),
    '--nds-secondary': preset.secondary.join(','),
    '--nds-success': preset.success.join(','),
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: preset.background,
    userSelect: 'none',
  } as CSSProperties;

  return (
    <div ref={rootRef} className="nds-root" data-energy={activeEnergy} data-variant={activeVariant} style={rootStyle} onPointerDown={handleImpulse}>
      <style>{DATA_STREAM_STYLES}</style>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div className="nds-grid" />
      <div className="nds-scan" />
      <div className="nds-vignette" />

      <div className="nds-ui">
        <div className="nds-heading">
          <div className="nds-kicker">NOX DATA STREAM // {reduced ? 'STATIC' : 'LIVE'}</div>
          <div className="nds-title">{preset.label}</div>
          <div className="nds-subtitle">{preset.kicker}</div>
        </div>
        <div className="nds-controls">
          {showVariantSwitcher ? (
            <div className="nds-control-row" aria-label="Data stream variants">
              {DATA_STREAM_VARIANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="nds-button"
                  data-active={id === activeVariant}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveVariant(id)}
                >
                  {DATA_STREAM_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
          {showEnergySwitcher ? (
            <div className="nds-control-row" aria-label="Data stream energy">
              {DATA_STREAM_ENERGIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="nds-button"
                  data-active={id === activeEnergy}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveEnergy(id)}
                >
                  {DATA_STREAM_ENERGY_PRESETS[id].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="nds-hint">MOVE TO DISTURB // TAP TO DETONATE</div>
      <button type="button" className="nds-reference" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={copyReference}>
        {copied ? 'COPIED' : 'COPY CONFIG'}
      </button>
    </div>
  );
}

export default NoxDataStreamJourney;
