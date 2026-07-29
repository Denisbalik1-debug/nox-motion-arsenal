import type { GlyphDef } from '../../lib/glyphRegistry';

export type ForgeGlyphVariantId =
  | 'forge-ember-runes'
  | 'command-nexus-sigils'
  | 'revenue-ascension-seals'
  | 'automation-circuit-glyphs'
  | 'signal-growth-constellations';

export type GlyphFieldState = 'idle' | 'warming' | 'charged' | 'overdrive' | 'ritual' | 'stealth';

export type ForgeGlyphArt = GlyphDef & { label: string };

export type ForgeGlyphVariant = {
  id: ForgeGlyphVariantId;
  shortLabel: string;
  title: string;
  subtitle: string;
  reference: string;
  palette: { primary: string; secondary: string; hot: string; dim: string; background: string };
  glyphs: ForgeGlyphArt[];
  heroLabels: [string, string, string];
};

export type ForgeGlyphStateConfig = {
  label: string;
  ambient: number;
  speed: number;
  glow: number;
  density: number;
  events: number;
  connectors: number;
};

const g = (id: string, label: string, path: string, weight = 1): ForgeGlyphArt => ({
  id,
  label,
  path,
  viewBox: '0 0 120 120',
  weight,
});

const S = {
  forgeCore: g('forge-core', 'CORE', 'M60 9 91 37 79 98 60 111 41 98 29 37Z M60 29 76 49 67 84 53 84 44 49Z'),
  mastery: g('mastery', 'MASTERY', 'M60 10 103 60 60 110 17 60Z M60 30 83 60 60 90 37 60Z M17 60H103'),
  spear: g('ascension-spear', 'ASCEND', 'M60 8 78 42H67V103H53V42H42Z M33 88 60 111 87 88'),
  crown: g('crown', 'CROWN', 'M16 90 28 31 52 58 60 17 68 58 92 31 104 90Z M25 101H95'),
  eye: g('signal-eye', 'SIGNAL', 'M10 60C30 27 90 27 110 60 90 93 30 93 10 60Z M60 39A21 21 0 1 1 60 81 21 21 0 1 1 60 39'),
  orbit: g('orbit', 'ORBIT', 'M17 60A43 23 0 1 0 103 60 43 23 0 1 0 17 60 M60 17A23 43 0 1 1 60 103 23 43 0 1 1 60 17'),
  nexus: g('nexus', 'NEXUS', 'M60 13 99 35V85L60 107 21 85V35Z M60 34 80 46V74L60 86 40 74V46Z'),
  command: g('command', 'COMMAND', 'M60 10V110 M10 60H110 M60 10 49 28 M60 10 71 28 M110 60 92 49 M110 60 92 71'),
  grid: g('node-grid', 'GRID', 'M22 22H98V98H22Z M22 60H98 M60 22V98 M22 22 10 10 M98 22 110 10 M22 98 10 110 M98 98 110 110'),
  prism: g('prism', 'PRISM', 'M60 10 105 60 60 110 15 60Z M15 60 60 41 105 60 60 79Z'),
  routing: g('routing', 'ROUTING', 'M15 60H82 M82 60 62 40 M82 60 62 80 M94 25V95'),
  seal: g('seal', 'SEAL', 'M60 12 102 34V86L60 108 18 86V34Z M60 32A28 28 0 1 1 60 88 28 28 0 1 1 60 32'),
  pipeline: g('pipeline', 'PIPELINE', 'M13 93C28 93 34 75 43 62 51 50 59 46 69 46 85 46 93 34 107 17 M91 17H107V33'),
  funnel: g('funnel', 'FUNNEL', 'M14 20H106L74 61V97L60 110 46 97V61Z'),
  close: g('close', 'CLOSE', 'M60 14A46 46 0 1 1 22 34 M22 34V14 M22 34H42 M39 61 55 77 85 41'),
  growth: g('growth', 'GROWTH', 'M14 94 36 70 52 78 72 34 88 48 106 14 M90 14H106V30'),
  logic: g('logic', 'LOGIC', 'M60 14 98 36V84L60 106 22 84V36Z M60 34 80 46V74L60 86 40 74V46Z M60 14V34'),
  branch: g('branch', 'BRANCH', 'M60 13V54 M60 54 25 89 M60 54 95 89 M25 89V107 M95 89V107 M48 42 60 54 72 42'),
  io: g('io-gate', 'INPUT/OUTPUT', 'M13 35H48V85H13Z M72 35H107V85H72Z M48 60H72 M62 50 72 60 62 70'),
  validate: g('validate', 'VALIDATE', 'M60 12 102 34V86L60 108 18 86V34Z M34 62 52 80 87 41'),
  retry: g('retry', 'RETRY', 'M60 18A42 42 0 1 1 24 38 M24 38V18 M24 38H44 M60 102A42 42 0 1 1 96 82 M96 82V102 M96 82H76'),
  wave: g('wave', 'WAVE', 'M11 73C26 29 42 101 60 58 78 15 94 87 109 43 M11 91C34 58 48 103 68 70 84 44 97 72 109 56'),
  beacon: g('beacon', 'BEACON', 'M60 9V111 M36 34C20 48 20 72 36 86 M84 34C100 48 100 72 84 86 M46 46C38 54 38 66 46 74 M74 46C82 54 82 66 74 74'),
  star: g('star', 'STAR', 'M60 8 71 47 112 60 71 73 60 112 49 73 8 60 49 47Z'),
  resonance: g('resonance', 'RESONANCE', 'M60 18A42 42 0 1 1 60 102 42 42 0 1 1 60 18 M60 38A22 22 0 1 1 60 82 22 22 0 1 1 60 38 M60 54A6 6 0 1 1 60 66 6 6 0 1 1 60 54'),
};

export const FORGE_GLYPH_VARIANTS: Record<ForgeGlyphVariantId, ForgeGlyphVariant> = {
  'forge-ember-runes': {
    id: 'forge-ember-runes', shortLabel: 'FORGE', title: 'FORGE EMBER RUNES', subtitle: 'Skill · Unlock · Ascension',
    reference: 'motion:bg-forge-energy-glyphs@forge-ember-runes',
    palette: { primary: '#ff4f2f', secondary: '#ffb45f', hot: '#fff0c7', dim: '#4a1d18', background: 'radial-gradient(circle at 50% 58%,rgba(255,72,35,.16),transparent 34%),linear-gradient(145deg,#150807,#050506 70%)' },
    glyphs: [S.forgeCore, S.mastery, S.spear, S.crown, S.eye, S.orbit, S.prism, S.seal, S.star, S.beacon, S.growth, S.validate],
    heroLabels: ['MASTERY', 'ASCENSION', 'UNLOCK'],
  },
  'command-nexus-sigils': {
    id: 'command-nexus-sigils', shortLabel: 'COMMAND', title: 'COMMAND NEXUS SIGILS', subtitle: 'Agents · Routing · Operator',
    reference: 'motion:bg-forge-energy-glyphs@command-nexus-sigils',
    palette: { primary: '#765cff', secondary: '#55d9ff', hot: '#f4f2ff', dim: '#24204a', background: 'radial-gradient(circle at 50% 48%,rgba(100,76,255,.16),transparent 32%),linear-gradient(145deg,#09071a,#040407 72%)' },
    glyphs: [S.nexus, S.command, S.grid, S.routing, S.eye, S.orbit, S.seal, S.prism, S.logic, S.branch, S.io, S.beacon],
    heroLabels: ['NEXUS', 'COMMAND', 'ROUTING'],
  },
  'revenue-ascension-seals': {
    id: 'revenue-ascension-seals', shortLabel: 'REVENUE', title: 'REVENUE ASCENSION SEALS', subtitle: 'Offer · Pipeline · Close',
    reference: 'motion:bg-forge-energy-glyphs@revenue-ascension-seals',
    palette: { primary: '#c99b3d', secondary: '#ffe0a0', hot: '#fffaf0', dim: '#4b3717', background: 'radial-gradient(circle at 50% 52%,rgba(211,169,70,.14),transparent 34%),linear-gradient(145deg,#110d07,#050505 72%)' },
    glyphs: [S.forgeCore, S.mastery, S.pipeline, S.funnel, S.close, S.prism, S.crown, S.orbit, S.growth, S.star, S.seal, S.beacon],
    heroLabels: ['REVENUE', 'SCALE', 'CLOSE'],
  },
  'automation-circuit-glyphs': {
    id: 'automation-circuit-glyphs', shortLabel: 'OPS', title: 'AUTOMATION CIRCUIT GLYPHS', subtitle: 'Trigger · Logic · Control',
    reference: 'motion:bg-forge-energy-glyphs@automation-circuit-glyphs',
    palette: { primary: '#28d09a', secondary: '#a4ffe1', hot: '#f0fff9', dim: '#163c32', background: 'radial-gradient(circle at 50% 50%,rgba(35,208,151,.12),transparent 32%),linear-gradient(145deg,#06110e,#040606 72%)' },
    glyphs: [S.logic, S.branch, S.io, S.validate, S.retry, S.grid, S.routing, S.nexus, S.command, S.seal, S.orbit, S.beacon],
    heroLabels: ['ORCHESTRATE', 'VALIDATE', 'UPTIME'],
  },
  'signal-growth-constellations': {
    id: 'signal-growth-constellations', shortLabel: 'SIGNAL', title: 'SIGNAL GROWTH CONSTELLATIONS', subtitle: 'Demand · Reach · Resonance',
    reference: 'motion:bg-forge-energy-glyphs@signal-growth-constellations',
    palette: { primary: '#d94a55', secondary: '#ffb56d', hot: '#fff4dc', dim: '#4c2028', background: 'radial-gradient(circle at 48% 48%,rgba(220,65,82,.14),transparent 28%),radial-gradient(circle at 58% 58%,rgba(255,174,92,.08),transparent 42%),linear-gradient(145deg,#14070b,#050506 72%)' },
    glyphs: [S.resonance, S.eye, S.wave, S.star, S.orbit, S.beacon, S.prism, S.growth, S.pipeline, S.crown, S.seal, S.command],
    heroLabels: ['SIGNAL', 'RESONANCE', 'GROWTH'],
  },
};

export const FORGE_GLYPH_STATES: Record<GlyphFieldState, ForgeGlyphStateConfig> = {
  idle: { label: 'IDLE', ambient: .08, speed: .58, glow: .52, density: .72, events: .18, connectors: .25 },
  warming: { label: 'WARMING', ambient: .15, speed: .82, glow: .76, density: .9, events: .42, connectors: .48 },
  charged: { label: 'CHARGED', ambient: .25, speed: 1, glow: 1, density: 1, events: .72, connectors: .78 },
  overdrive: { label: 'OVERDRIVE', ambient: .38, speed: 1.45, glow: 1.35, density: 1.2, events: 1, connectors: 1 },
  ritual: { label: 'RITUAL', ambient: .22, speed: .52, glow: 1.08, density: .88, events: .82, connectors: .62 },
  stealth: { label: 'STEALTH', ambient: .045, speed: .4, glow: .32, density: .62, events: .08, connectors: .15 },
};

export const FORGE_GLYPH_VARIANT_IDS = Object.keys(FORGE_GLYPH_VARIANTS) as ForgeGlyphVariantId[];
export const FORGE_GLYPH_STATE_IDS = Object.keys(FORGE_GLYPH_STATES) as GlyphFieldState[];
