export type ParticleRevealVariant =
  | 'ghost-signal-assembly'
  | 'ember-forge-materialize'
  | 'plasma-command-interface'
  | 'gold-product-blueprint'
  | 'overdrive-particle-collapse';

export type ParticleRevealMode = 'cursor' | 'sweep' | 'pulse' | 'hybrid';
export type ParticleRevealScene = 'wordmark' | 'forge' | 'command' | 'blueprint' | 'collapse';

export interface ParticleRevealPreset {
  id: ParticleRevealVariant;
  label: string;
  title: string;
  subtitle: string;
  scene: ParticleRevealScene;
  primary: string;
  secondary: string;
  hot: string;
  dim: string;
  background: string;
  reference: string;
  scatter: number;
  speed: number;
  trail: number;
  density: number;
}

export const PARTICLE_REVEAL_PRESETS: Record<ParticleRevealVariant, ParticleRevealPreset> = {
  'ghost-signal-assembly': {
    id: 'ghost-signal-assembly',
    label: 'GHOST',
    title: 'NOX SIGNAL',
    subtitle: 'INTELLIGENCE EMERGING FROM NOISE',
    scene: 'wordmark',
    primary: '#6d7682',
    secondary: '#c6d0dc',
    hot: '#ffffff',
    dim: '#171b20',
    background: 'radial-gradient(circle at 50% 48%,rgba(188,205,224,.08),transparent 33%),linear-gradient(145deg,#080a0d,#030405 74%)',
    reference: 'motion:canvasui-particle-reveal@ghost-signal-assembly',
    scatter: 0.75,
    speed: 0.68,
    trail: 0.55,
    density: 0.82,
  },
  'ember-forge-materialize': {
    id: 'ember-forge-materialize',
    label: 'FORGE',
    title: 'FORGE THE SYSTEM',
    subtitle: 'PRESSURE / SIGNAL / CONTROL / ASCENSION',
    scene: 'forge',
    primary: '#d63b2f',
    secondary: '#ff9b4a',
    hot: '#fff0cf',
    dim: '#34110d',
    background: 'radial-gradient(circle at 50% 52%,rgba(216,56,42,.17),transparent 30%),radial-gradient(circle at 48% 60%,rgba(255,144,62,.08),transparent 46%),linear-gradient(145deg,#160806,#050506 72%)',
    reference: 'motion:canvasui-particle-reveal@ember-forge-materialize',
    scatter: 1.08,
    speed: 0.92,
    trail: 0.88,
    density: 1,
  },
  'plasma-command-interface': {
    id: 'plasma-command-interface',
    label: 'PLASMA',
    title: 'PROJECT X',
    subtitle: 'MULTI-AGENT COMMAND INTERFACE',
    scene: 'command',
    primary: '#7657ff',
    secondary: '#42dfff',
    hot: '#f8f4ff',
    dim: '#171438',
    background: 'radial-gradient(circle at 50% 48%,rgba(113,82,255,.18),transparent 30%),radial-gradient(circle at 58% 55%,rgba(45,221,255,.08),transparent 42%),linear-gradient(145deg,#0b081c,#040408 74%)',
    reference: 'motion:canvasui-particle-reveal@plasma-command-interface',
    scatter: 0.94,
    speed: 1.08,
    trail: 1,
    density: 1.02,
  },
  'gold-product-blueprint': {
    id: 'gold-product-blueprint',
    label: 'GOLD',
    title: 'SALES OS',
    subtitle: 'POSITION / OFFER / PIPELINE / SCALE',
    scene: 'blueprint',
    primary: '#b68b35',
    secondary: '#f4d992',
    hot: '#fffaf0',
    dim: '#33280f',
    background: 'radial-gradient(circle at 50% 50%,rgba(208,167,72,.14),transparent 34%),linear-gradient(145deg,#100d07,#050505 72%)',
    reference: 'motion:canvasui-particle-reveal@gold-product-blueprint',
    scatter: 0.82,
    speed: 0.78,
    trail: 0.72,
    density: 0.96,
  },
  'overdrive-particle-collapse': {
    id: 'overdrive-particle-collapse',
    label: 'STORM',
    title: 'SYSTEM ONLINE',
    subtitle: 'PARTICLE COLLAPSE // OVERDRIVE',
    scene: 'collapse',
    primary: '#ff3f35',
    secondary: '#9c65ff',
    hot: '#ffffff',
    dim: '#3c1420',
    background: 'radial-gradient(circle at 47% 48%,rgba(255,58,48,.2),transparent 25%),radial-gradient(circle at 58% 52%,rgba(126,71,255,.15),transparent 42%),linear-gradient(145deg,#130609,#040405 72%)',
    reference: 'motion:canvasui-particle-reveal@overdrive-particle-collapse',
    scatter: 1.45,
    speed: 1.45,
    trail: 1.35,
    density: 1.16,
  },
};

export const PARTICLE_REVEAL_VARIANTS = Object.keys(PARTICLE_REVEAL_PRESETS) as ParticleRevealVariant[];
export const PARTICLE_REVEAL_MODES: ParticleRevealMode[] = ['cursor', 'sweep', 'pulse', 'hybrid'];
