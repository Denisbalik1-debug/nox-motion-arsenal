import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { AtmosLayer, det } from './skilltreeShared';

export type EnergyFlowStyle =
  | 'forge-ember-flow'
  | 'plasma-signal-stream'
  | 'gold-command-current'
  | 'ghost-wire-pulse'
  | 'overdrive-storm';

export type EnergyDirectionMode = 'inward' | 'outward' | 'bidirectional';
export type EnergyIntensityPreset = 'calm' | 'active' | 'overdrive';

export interface SvgEnergyLinesFlowProps {
  /** Legacy control retained for existing callers. */
  lineCount?: number;
  particleCount?: number;
  flowSpeed?: number;
  trailLength?: number;
  glowStrength?: number;
  branchActivity?: number;
  nodePulseStrength?: number;
  styleVariant?: EnergyFlowStyle;
  directionMode?: EnergyDirectionMode;
  intensityPreset?: EnergyIntensityPreset;
  showStyleSwitcher?: boolean;
}

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

type NetworkPath = {
  id: string;
  d: string;
  x: number;
  y: number;
  label: string;
  phase: number;
};

type StyleConfig = {
  label: string;
  primary: string;
  secondary: string;
  hot: string;
  dim: string;
  background: string;
  dash: string;
  particleRadius: number;
  reference: string;
};

const NETWORK_PATHS: NetworkPath[] = [
  { id: 'north-west', d: 'M500 300 C420 210 292 118 92 86', x: 92, y: 86, label: 'INPUT', phase: 0.02 },
  { id: 'west', d: 'M500 300 C376 276 238 264 72 278', x: 72, y: 278, label: 'MEMORY', phase: 0.16 },
  { id: 'south-west', d: 'M500 300 C394 382 272 476 112 520', x: 112, y: 520, label: 'RESEARCH', phase: 0.3 },
  { id: 'north', d: 'M500 300 C508 212 514 132 500 52', x: 500, y: 52, label: 'SIGNAL', phase: 0.42 },
  { id: 'north-east', d: 'M500 300 C604 202 716 116 908 82', x: 908, y: 82, label: 'ROUTING', phase: 0.54 },
  { id: 'east', d: 'M500 300 C640 276 782 276 934 300', x: 934, y: 300, label: 'OUTPUT', phase: 0.68 },
  { id: 'south-east', d: 'M500 300 C624 392 744 486 896 526', x: 896, y: 526, label: 'DEPLOY', phase: 0.82 },
  { id: 'south', d: 'M500 300 C494 392 484 470 500 556', x: 500, y: 556, label: 'PROOF', phase: 0.94 },
];

const STYLE_ORDER: EnergyFlowStyle[] = [
  'forge-ember-flow',
  'plasma-signal-stream',
  'gold-command-current',
  'ghost-wire-pulse',
  'overdrive-storm',
];

const STYLE_CONFIG: Record<EnergyFlowStyle, StyleConfig> = {
  'forge-ember-flow': {
    label: 'EMBER',
    primary: '#ff5a36',
    secondary: '#ffb26b',
    hot: '#fff3cf',
    dim: '#5f211a',
    background: 'radial-gradient(circle at 50% 50%,rgba(255,89,48,.14),transparent 33%),linear-gradient(135deg,#140807,#050506 66%)',
    dash: '2 9',
    particleRadius: 2.3,
    reference: 'motion:skilltree-svg-energy-lines@forge-ember-flow',
  },
  'plasma-signal-stream': {
    label: 'PLASMA',
    primary: '#7a5cff',
    secondary: '#4ee9ff',
    hot: '#f6f2ff',
    dim: '#25214f',
    background: 'radial-gradient(circle at 50% 50%,rgba(91,77,255,.16),transparent 34%),linear-gradient(135deg,#09071a,#050508 70%)',
    dash: '1 7',
    particleRadius: 2.1,
    reference: 'motion:skilltree-svg-energy-lines@plasma-signal-stream',
  },
  'gold-command-current': {
    label: 'GOLD',
    primary: '#cda64a',
    secondary: '#ffe2a0',
    hot: '#fffaf0',
    dim: '#4e3a17',
    background: 'radial-gradient(circle at 50% 50%,rgba(212,175,55,.13),transparent 32%),linear-gradient(135deg,#100d07,#050505 70%)',
    dash: '5 12',
    particleRadius: 2.4,
    reference: 'motion:skilltree-svg-energy-lines@gold-command-current',
  },
  'ghost-wire-pulse': {
    label: 'GHOST',
    primary: '#78808c',
    secondary: '#dce4ee',
    hot: '#ffffff',
    dim: '#252a31',
    background: 'radial-gradient(circle at 50% 50%,rgba(190,205,224,.08),transparent 30%),linear-gradient(135deg,#080a0d,#030405 72%)',
    dash: '1 18',
    particleRadius: 1.7,
    reference: 'motion:skilltree-svg-energy-lines@ghost-wire-pulse',
  },
  'overdrive-storm': {
    label: 'STORM',
    primary: '#ff3c33',
    secondary: '#9b66ff',
    hot: '#ffffff',
    dim: '#4b1822',
    background: 'radial-gradient(circle at 48% 48%,rgba(255,60,51,.16),transparent 25%),radial-gradient(circle at 55% 54%,rgba(126,72,255,.12),transparent 40%),linear-gradient(135deg,#120609,#050506 68%)',
    dash: '3 6',
    particleRadius: 2.6,
    reference: 'motion:skilltree-svg-energy-lines@overdrive-storm',
  },
};

const INTENSITY = {
  calm: { speed: 0.62, particles: 0.58, glow: 0.62, label: 'CALM' },
  active: { speed: 1, particles: 1, glow: 1, label: 'ACTIVE' },
  overdrive: { speed: 1.55, particles: 1.45, glow: 1.35, label: 'OVERDRIVE' },
} as const;

const CSS = String.raw`
.efx-root { position:absolute; inset:0; overflow:hidden; container-type:size; color:#f7f3eb; background:var(--efx-bg); font-family:var(--sans,system-ui,sans-serif); }
.efx-root::before { content:''; position:absolute; inset:0; pointer-events:none; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:42px 42px; mask-image:radial-gradient(circle at center,#000,transparent 72%); opacity:.48; }
.efx-root::after { content:''; position:absolute; inset:-20%; pointer-events:none; opacity:.045; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); animation:efx-noise .28s steps(2) infinite; }
@keyframes efx-noise { 0%{transform:translate(-2%,-1%)}50%{transform:translate(2%,1%)}100%{transform:translate(-1%,2%)} }
.efx-svg { position:absolute; inset:0; width:100%; height:100%; z-index:3; }
.efx-path-base { fill:none; stroke:var(--efx-dim); stroke-width:1.25; opacity:.7; }
.efx-path-glow { fill:none; stroke:var(--efx-primary); stroke-width:7; opacity:calc(.07 * var(--efx-glow)); filter:url(#placeholder); }
.efx-path-flow { fill:none; stroke:var(--efx-secondary); stroke-width:1.65; stroke-linecap:round; stroke-dasharray:var(--efx-dash); opacity:.78; animation:efx-dash var(--efx-duration) linear infinite; }
.efx-path-head { fill:none; stroke:var(--efx-hot); stroke-width:2.7; stroke-linecap:round; stroke-dasharray:var(--efx-head) calc(100 - var(--efx-head)); opacity:calc(.88 * var(--efx-glow)); filter:url(#placeholder); animation:efx-head var(--efx-duration) linear infinite; }
@keyframes efx-dash { to { stroke-dashoffset:-64; } }
@keyframes efx-head { from { stroke-dashoffset:100; } to { stroke-dashoffset:-100; } }
.efx-center-shell { fill:rgba(5,5,7,.86); stroke:var(--efx-secondary); stroke-width:1.25; filter:url(#placeholder); }
.efx-center-ring { fill:none; stroke:var(--efx-primary); stroke-width:1; stroke-dasharray:5 7; transform-origin:500px 300px; animation:efx-spin 9s linear infinite; }
.efx-center-ring--b { stroke:var(--efx-secondary); stroke-dasharray:1 10; animation-direction:reverse; animation-duration:5.5s; }
@keyframes efx-spin { to { transform:rotate(360deg); } }
.efx-core-dot { fill:var(--efx-hot); filter:url(#placeholder); animation:efx-core-pulse 1.8s ease-in-out infinite; }
@keyframes efx-core-pulse { 50% { opacity:.42; transform:scale(.72); transform-origin:500px 300px; } }
.efx-node { fill:rgba(7,7,9,.92); stroke:var(--efx-primary); stroke-width:1.2; filter:url(#placeholder); }
.efx-node-ring { fill:none; stroke:var(--efx-secondary); stroke-width:1; opacity:.42; transform-box:fill-box; transform-origin:center; animation:efx-node-charge var(--efx-node-duration) ease-out infinite; animation-delay:var(--efx-node-delay); }
@keyframes efx-node-charge { 0%,58% { opacity:0; transform:scale(.65); } 70% { opacity:.9; transform:scale(1); } 100% { opacity:0; transform:scale(1.75); } }
.efx-node-label { fill:rgba(255,255,255,.36); font:700 10px/1 var(--mono,monospace); letter-spacing:.18em; }
.efx-particle { fill:var(--efx-hot); filter:url(#placeholder); }
.efx-particle--secondary { fill:var(--efx-secondary); opacity:.76; }
.efx-particle--ember { fill:var(--efx-primary); opacity:.72; }
.efx-switcher { position:absolute; left:14px; right:14px; top:13px; z-index:20; display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; }
.efx-switcher::-webkit-scrollbar { display:none; }
.efx-switcher button,.efx-intensity button { flex:0 0 auto; padding:6px 8px; border:1px solid rgba(255,255,255,.09); background:rgba(6,6,8,.7); color:rgba(255,255,255,.38); font:800 6px/1 var(--mono,monospace); letter-spacing:.14em; cursor:pointer; backdrop-filter:blur(8px); transition:.22s ease; }
.efx-switcher button:hover,.efx-intensity button:hover { color:#fff; border-color:var(--efx-primary); transform:translateY(-1px); }
.efx-switcher button[aria-pressed='true'],.efx-intensity button[aria-pressed='true'] { color:#fff; border-color:var(--efx-secondary); background:color-mix(in srgb,var(--efx-primary) 16%,rgba(6,6,8,.88)); box-shadow:0 0 12px color-mix(in srgb,var(--efx-primary) 28%,transparent); }
.efx-intensity { position:absolute; left:14px; top:47px; z-index:20; display:flex; gap:5px; }
.efx-reference { position:absolute; left:14px; bottom:13px; z-index:20; display:flex; align-items:center; gap:8px; max-width:58%; padding:7px 9px; border-left:1px solid var(--efx-primary); background:rgba(6,6,8,.68); backdrop-filter:blur(8px); }
.efx-reference code { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:rgba(255,255,255,.4); font:600 6px/1 var(--mono,monospace); }
.efx-reference button { padding:0; border:0; background:none; color:var(--efx-secondary); font:800 6px/1 var(--mono,monospace); letter-spacing:.12em; cursor:pointer; }
.efx-status { position:absolute; right:14px; bottom:13px; z-index:20; text-align:right; font:700 6px/1.5 var(--mono,monospace); letter-spacing:.14em; color:rgba(255,255,255,.34); }
.efx-status strong { display:block; color:var(--efx-secondary); font-size:8px; }
.efx-root[data-energy-style='ghost-wire-pulse'] .efx-path-base { opacity:.34; }
.efx-root[data-energy-style='ghost-wire-pulse'] .efx-path-flow { stroke-width:1; opacity:.55; }
.efx-root[data-energy-style='overdrive-storm'] .efx-path-glow { stroke-width:10; opacity:calc(.1 * var(--efx-glow)); }
.efx-root[data-energy-style='overdrive-storm'] .efx-center-ring { animation-duration:4.5s; }
.efx-root[data-energy-style='gold-command-current'] .efx-center-shell { rx:8px; }
@container (max-width:680px) { .efx-switcher { right:8px; left:8px; }.efx-intensity { left:8px; top:45px; }.efx-reference { left:8px; bottom:8px; max-width:68%; }.efx-status { right:8px; bottom:8px; }.efx-node-label { font-size:8px; } }
@media (prefers-reduced-motion:reduce) { .efx-root::after,.efx-path-flow,.efx-path-head,.efx-center-ring,.efx-core-dot,.efx-node-ring { animation:none!important; } .efx-particle { display:none; } }
`;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function SvgEnergyLinesFlow({
  lineCount,
  particleCount = 42,
  flowSpeed = 1,
  trailLength = 0.55,
  glowStrength = 0.9,
  branchActivity = 1,
  nodePulseStrength = 1,
  styleVariant = 'forge-ember-flow',
  directionMode = 'outward',
  intensityPreset = 'active',
  showStyleSwitcher = true,
}: SvgEnergyLinesFlowProps) {
  const rawId = useId();
  const prefix = useMemo(() => `efx-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);
  const [activeStyle, setActiveStyle] = useState<EnergyFlowStyle>(styleVariant);
  const [activeIntensity, setActiveIntensity] = useState<EnergyIntensityPreset>(intensityPreset);
  const [copied, setCopied] = useState(false);

  useEffect(() => setActiveStyle(styleVariant), [styleVariant]);
  useEffect(() => setActiveIntensity(intensityPreset), [intensityPreset]);

  const style = STYLE_CONFIG[activeStyle];
  const intensity = INTENSITY[activeIntensity];
  const visibleCount = clamp(Math.round(lineCount ?? 3 + branchActivity * 5), 3, NETWORK_PATHS.length);
  const visiblePaths = NETWORK_PATHS.slice(0, visibleCount);
  const totalParticles = clamp(Math.round(particleCount * intensity.particles), 8, 96);
  const speed = clamp(flowSpeed * intensity.speed, 0.15, 5);
  const headLength = clamp(Math.round(5 + trailLength * 23), 5, 28);
  const effectiveGlow = clamp(glowStrength * intensity.glow, 0.15, 1.8);
  const nodeDuration = clamp(3.8 / Math.max(0.25, nodePulseStrength * speed), 1.2, 8);

  const vars: CssVars = {
    '--efx-primary': style.primary,
    '--efx-secondary': style.secondary,
    '--efx-hot': style.hot,
    '--efx-dim': style.dim,
    '--efx-bg': style.background,
    '--efx-dash': style.dash,
    '--efx-head': headLength,
    '--efx-glow': effectiveGlow,
    '--efx-node-duration': `${nodeDuration}s`,
  };

  const copyReference = () => {
    navigator.clipboard?.writeText(style.reference).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className="efx-root" style={vars} data-energy-style={activeStyle} data-intensity={activeIntensity}>
      <style>{CSS.replaceAll('#placeholder', `#${prefix}-glow`)}</style>
      <AtmosLayer particles={activeIntensity === 'overdrive' ? 24 : 14} stars={activeIntensity === 'calm' ? 18 : 34} />

      {showStyleSwitcher && (
        <nav className="efx-switcher" aria-label="Energy flow styles">
          {STYLE_ORDER.map((id) => (
            <button key={id} type="button" aria-pressed={activeStyle === id} onClick={() => setActiveStyle(id)}>
              {STYLE_CONFIG[id].label}
            </button>
          ))}
        </nav>
      )}

      <div className="efx-intensity" aria-label="Energy intensity">
        {(Object.keys(INTENSITY) as EnergyIntensityPreset[]).map((id) => (
          <button key={id} type="button" aria-pressed={activeIntensity === id} onClick={() => setActiveIntensity(id)}>
            {INTENSITY[id].label}
          </button>
        ))}
      </div>

      <svg className="efx-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id={`${prefix}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation={activeStyle === 'overdrive-storm' ? 5.2 : 3.2} result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`${prefix}-core`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor={style.hot} stopOpacity=".95" />
            <stop offset=".18" stopColor={style.secondary} stopOpacity=".55" />
            <stop offset=".52" stopColor={style.primary} stopOpacity=".16" />
            <stop offset="1" stopColor="#050506" stopOpacity=".96" />
          </radialGradient>
          {visiblePaths.map((path) => <path key={path.id} id={`${prefix}-${path.id}`} d={path.d} pathLength="100" />)}
        </defs>

        {visiblePaths.map((path, index) => {
          const duration = clamp((6.8 - det(index, 31) * 1.4) / speed, 1.25, 14);
          const reverse = directionMode === 'inward' || (directionMode === 'bidirectional' && index % 2 === 1);
          const animationDirection = reverse ? 'reverse' : 'normal';
          return (
            <g key={path.id}>
              <path className="efx-path-base" d={path.d} />
              <path className="efx-path-glow" d={path.d} style={{ opacity: 0.06 + effectiveGlow * 0.035 }} />
              <path className="efx-path-flow" d={path.d} pathLength="100" style={{ '--efx-duration': `${duration}s`, animationDirection } as CssVars} />
              <path className="efx-path-head" d={path.d} pathLength="100" style={{ '--efx-duration': `${duration * 1.28}s`, animationDirection } as CssVars} />
              <circle className="efx-node" cx={path.x} cy={path.y} r={activeStyle === 'ghost-wire-pulse' ? 5 : 7} />
              <circle
                className="efx-node-ring"
                cx={path.x}
                cy={path.y}
                r="12"
                style={{ '--efx-node-delay': `${-(path.phase * nodeDuration).toFixed(2)}s` } as CssVars}
              />
              <text className="efx-node-label" x={path.x} y={path.y < 300 ? path.y - 18 : path.y + 25} textAnchor="middle">{path.label}</text>
            </g>
          );
        })}

        {Array.from({ length: totalParticles }, (_, index) => {
          const path = visiblePaths[index % visiblePaths.length];
          const pathIndex = index % visiblePaths.length;
          const reverse = directionMode === 'inward' || (directionMode === 'bidirectional' && index % 2 === 1);
          const duration = clamp((5.8 + det(index, 73) * 3.2) / speed, 1.15, 15);
          const begin = -(det(index, 97) * duration);
          const radius = style.particleRadius * (0.62 + det(index, 17) * 0.72);
          const className = index % 5 === 0 ? 'efx-particle efx-particle--ember' : index % 3 === 0 ? 'efx-particle efx-particle--secondary' : 'efx-particle';
          return (
            <circle key={`${path.id}-${index}`} className={className} r={radius} opacity={0.45 + det(index, 41) * 0.55}>
              <animateMotion
                dur={`${duration}s`}
                begin={`${begin}s`}
                repeatCount="indefinite"
                calcMode="linear"
                keyPoints={reverse ? '1;0' : '0;1'}
                keyTimes="0;1"
              >
                <mpath href={`#${prefix}-${visiblePaths[pathIndex].id}`} />
              </animateMotion>
            </circle>
          );
        })}

        <circle className="efx-center-ring" cx="500" cy="300" r="82" />
        <circle className="efx-center-ring efx-center-ring--b" cx="500" cy="300" r="64" />
        <rect className="efx-center-shell" x="449" y="249" width="102" height="102" rx={activeStyle === 'gold-command-current' ? 8 : 24} fill={`url(#${prefix}-core)`} />
        <circle className="efx-core-dot" cx="500" cy="300" r={activeStyle === 'overdrive-storm' ? 12 : 8} />
        <path d="M472 318L492 298L505 311L531 279" fill="none" stroke={style.secondary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${prefix}-glow)`} />
      </svg>

      <div className="efx-reference">
        <code>{style.reference}</code>
        <button type="button" onClick={copyReference}>{copied ? 'COPIED' : 'COPY REF'}</button>
      </div>
      <div className="efx-status">
        <strong>{style.label} / {INTENSITY[activeIntensity].label}</strong>
        {directionMode.toUpperCase()} · {totalParticles} PARTICLES · {visibleCount} BRANCHES
      </div>
    </div>
  );
}

export default SvgEnergyLinesFlow;
