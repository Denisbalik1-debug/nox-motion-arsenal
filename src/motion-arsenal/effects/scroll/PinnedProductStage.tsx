import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, lerp, smoothstep, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { glyphPath } from '../../lib/svgUtils';

// ---------------------------------------------------------------------------
// PinnedProductStage — cinematic product storytelling without a runtime motion
// dependency. An internal scroll timeline drives a sticky product stage,
// exploded layers, scan passes, telemetry and chapter copy.
// ---------------------------------------------------------------------------

export interface PinnedProductStageProps {
  damping?: number;
  rotatePerSection?: number;
  scalePulse?: number;
  colorShift?: boolean;
  seed?: number;
}

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

type StageSection = {
  kicker: string;
  title: string;
  body: string;
  accent: string;
  accent2: string;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  explode: number;
  scan: number;
  stat: string;
  statLabel: string;
  telemetry: [number, number, number];
  tags: string[];
};

const SECTIONS: StageSection[] = [
  {
    kicker: '01 / CORE',
    title: 'THE SYSTEM\nTAKES FORM',
    body: 'A product is introduced as a controlled object, not a flat screenshot. Every layer has a role, every movement carries information.',
    accent: '#d23b32',
    accent2: '#ff8a3d',
    rotX: -12,
    rotY: -18,
    rotZ: -3,
    scale: 0.92,
    explode: 0,
    scan: 0.08,
    stat: '01',
    statLabel: 'CORE ONLINE',
    telemetry: [42, 28, 18],
    tags: ['POSITION', 'FORM', 'IDENTITY'],
  },
  {
    kicker: '02 / ARCHITECTURE',
    title: 'OPEN THE\nMACHINE',
    body: 'The shell separates into visible systems. Scroll becomes a guided teardown: architecture, modules and differentiators appear in one continuous scene.',
    accent: '#d4af37',
    accent2: '#ffe08a',
    rotX: 8,
    rotY: 74,
    rotZ: 4,
    scale: 1.04,
    explode: 0.82,
    scan: 0.62,
    stat: '05',
    statLabel: 'LAYERS EXPOSED',
    telemetry: [78, 56, 38],
    tags: ['ENGINE', 'MODULES', 'DATA'],
  },
  {
    kicker: '03 / INTELLIGENCE',
    title: 'MAKE THE\nLOGIC VISIBLE',
    body: 'Signals travel through the core while live telemetry explains what the product is doing. Complexity becomes legible instead of abstract.',
    accent: '#8f62ff',
    accent2: '#d7c1ff',
    rotX: -7,
    rotY: 164,
    rotZ: -5,
    scale: 1.12,
    explode: 0.46,
    scan: 1,
    stat: '24/7',
    statLabel: 'AUTONOMOUS LOOP',
    telemetry: [96, 82, 68],
    tags: ['AGENTS', 'ROUTING', 'MEMORY'],
  },
  {
    kicker: '04 / PROOF',
    title: 'TURN FEATURES\nINTO EVIDENCE',
    body: 'The stage shifts from explanation to proof. Metrics, outcomes and reliability lock onto the object while the product remains the visual anchor.',
    accent: '#27d6a1',
    accent2: '#a9ffe5',
    rotX: 11,
    rotY: 258,
    rotZ: 3,
    scale: 0.98,
    explode: 0.18,
    scan: 0.34,
    stat: '+38%',
    statLabel: 'CONVERSION LIFT',
    telemetry: [100, 94, 88],
    tags: ['RESULTS', 'TRUST', 'SCALE'],
  },
  {
    kicker: '05 / DEPLOY',
    title: 'SHIP THE\nCOMPLETE SYSTEM',
    body: 'The layers converge into a final product state. This is the CTA frame: clear offer, clear outcome and a controlled transition into action.',
    accent: '#ff4f40',
    accent2: '#ffd2a8',
    rotX: -4,
    rotY: 360,
    rotZ: 0,
    scale: 1.08,
    explode: 0,
    scan: 0.12,
    stat: 'LIVE',
    statLabel: 'READY TO DEPLOY',
    telemetry: [100, 100, 100],
    tags: ['OFFER', 'CTA', 'LAUNCH'],
  },
];

const FRAGMENTS = [
  { x: -1, y: -0.72, z: 46, r: -16, label: 'INPUT' },
  { x: 0.92, y: -0.64, z: 34, r: 13, label: 'MODEL' },
  { x: -1.04, y: 0.62, z: 24, r: 10, label: 'MEMORY' },
  { x: 1.02, y: 0.7, z: 52, r: -12, label: 'OUTPUT' },
];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(lerp(ca[0], cb[0], t))}, ${Math.round(lerp(ca[1], cb[1], t))}, ${Math.round(lerp(ca[2], cb[2], t))})`;
}

const CSS = String.raw`
.pps-root { position:absolute; inset:0; overflow:hidden; container-type:size; color:#f4f0e8; background:#050506; font-family:var(--sans,system-ui,sans-serif); }
.pps-root::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; background:radial-gradient(circle at 22% 42%,color-mix(in srgb,var(--pps-accent) 14%,transparent),transparent 28%),radial-gradient(circle at 74% 38%,color-mix(in srgb,var(--pps-accent-2) 8%,transparent),transparent 36%),linear-gradient(115deg,#0d0b0d,#070709 58%,#030304); transition:background .5s ease; }
.pps-root::after { content:''; position:absolute; inset:-25%; z-index:1; pointer-events:none; opacity:.055; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E"); animation:pps-noise .25s steps(2) infinite; }
@keyframes pps-noise { 0%{transform:translate3d(-2%,-1%,0)}50%{transform:translate3d(2%,1%,0)}100%{transform:translate3d(-1%,2%,0)} }
.pps-scroll { position:absolute; inset:0; z-index:2; overflow-y:auto; overflow-x:hidden; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.16) transparent; overscroll-behavior:contain; }
.pps-scroll::-webkit-scrollbar { width:5px; }
.pps-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.14); border-radius:10px; }
.pps-stage { position:sticky; top:0; height:100cqh; overflow:hidden; isolation:isolate; }
.pps-stage-grid { position:absolute; inset:0; z-index:0; opacity:.3; background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px); background-size:54px 54px; mask-image:radial-gradient(circle at 38% 50%,#000 0 34%,transparent 76%); transform:perspective(700px) rotateX(62deg) translateY(42%) scale(1.6); transform-origin:center bottom; }
.pps-horizon { position:absolute; left:-10%; right:-10%; top:58%; z-index:0; height:1px; background:linear-gradient(90deg,transparent,var(--pps-accent),transparent); opacity:.22; box-shadow:0 0 32px var(--pps-accent); }
.pps-progress { position:absolute; left:18px; right:18px; top:15px; z-index:40; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:12px; font-family:var(--mono,monospace); font-size:8px; letter-spacing:.22em; color:rgba(255,255,255,.42); }
.pps-progress-track { position:relative; height:1px; background:rgba(255,255,255,.1); overflow:hidden; }
.pps-progress-fill { position:absolute; inset:0 auto 0 0; width:calc(var(--pps-progress) * 100%); background:linear-gradient(90deg,var(--pps-accent),var(--pps-accent-2)); box-shadow:0 0 10px var(--pps-accent); }
.pps-stage-code { color:var(--pps-accent-2); }
.pps-product-zone { position:absolute; left:4%; top:10%; bottom:10%; width:56%; z-index:8; display:grid; place-items:center; perspective:1200px; transform:translate3d(var(--pps-px),var(--pps-py),0); transition:transform .25s ease-out; }
.pps-aura { position:absolute; width:min(48cqw,58cqh); aspect-ratio:1; border-radius:50%; background:radial-gradient(circle,color-mix(in srgb,var(--pps-accent) 20%,transparent),transparent 58%); filter:blur(22px); opacity:calc(.34 + var(--pps-glow) * .38); transform:scale(calc(.78 + var(--pps-glow) * .3)); }
.pps-product-wrap { position:relative; width:min(31cqw,42cqh); aspect-ratio:1; transform-style:preserve-3d; }
.pps-product { position:absolute; inset:0; transform-style:preserve-3d; will-change:transform; }
.pps-shell { position:absolute; inset:var(--shell-inset); border:1px solid color-mix(in srgb,var(--pps-accent) calc(72% - var(--shell-index) * 9%),rgba(255,255,255,.08)); border-radius:calc(18px + var(--shell-index) * 5px); background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.008)); box-shadow:inset 0 0 26px rgba(255,255,255,.025),0 0 calc(8px + var(--pps-glow) * 24px) color-mix(in srgb,var(--pps-accent) 16%,transparent); transform:translateZ(calc((var(--shell-index) - 2) * 17px)) rotate(calc((var(--shell-index) - 2) * 8deg)) scale(calc(1 + var(--pps-explode) * var(--shell-index) * .045)); opacity:calc(1 - var(--shell-index) * .1); transition:border-color .35s ease; }
.pps-shell::before,.pps-shell::after { content:''; position:absolute; width:9px; height:9px; border-color:var(--pps-accent-2); opacity:.72; }
.pps-shell::before { top:8px; left:8px; border-top:1px solid; border-left:1px solid; }
.pps-shell::after { right:8px; bottom:8px; border-right:1px solid; border-bottom:1px solid; }
.pps-core { position:absolute; inset:27%; z-index:5; display:grid; place-items:center; border-radius:22%; transform:translateZ(58px); background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.16),transparent 22%),linear-gradient(145deg,color-mix(in srgb,var(--pps-accent) 22%,#0b0a0c),#070708 70%); border:1px solid var(--pps-accent); box-shadow:0 0 calc(20px + var(--pps-glow) * 34px) color-mix(in srgb,var(--pps-accent) 48%,transparent),inset 0 0 24px color-mix(in srgb,var(--pps-accent) 12%,transparent); }
.pps-core::before { content:''; position:absolute; inset:-11px; border:1px dashed color-mix(in srgb,var(--pps-accent-2) 45%,transparent); border-radius:28%; animation:pps-spin 14s linear infinite; }
.pps-core::after { content:''; position:absolute; inset:18%; border-radius:50%; background:radial-gradient(circle,#fff 0 3%,var(--pps-accent-2) 5%,transparent 44%); filter:drop-shadow(0 0 8px var(--pps-accent)); animation:pps-pulse 2.2s ease-in-out infinite; }
.pps-core svg { width:58%; height:58%; overflow:visible; filter:drop-shadow(0 0 8px var(--pps-accent)); }
.pps-core path { stroke:var(--pps-accent-2); }
.pps-orbit { position:absolute; left:50%; top:50%; z-index:2; width:calc(112% + var(--orbit-index) * 18%); aspect-ratio:1; border:1px solid color-mix(in srgb,var(--pps-accent) calc(30% - var(--orbit-index) * 5%),transparent); border-radius:50%; transform-style:preserve-3d; transform:translate(-50%,-50%) rotateX(calc(68deg - var(--orbit-index) * 13deg)) rotateZ(calc(var(--pps-orbit) * 1deg + var(--orbit-index) * 34deg)); }
.pps-orbit::before { content:''; position:absolute; width:7px; height:7px; left:12%; top:16%; border-radius:50%; background:var(--pps-accent-2); box-shadow:0 0 12px var(--pps-accent); }
.pps-fragment { position:absolute; left:50%; top:50%; z-index:8; width:25%; height:17%; padding:7px; border:1px solid color-mix(in srgb,var(--pps-accent-2) 48%,transparent); border-radius:8px; background:rgba(8,8,10,.82); backdrop-filter:blur(8px); transform-style:preserve-3d; transform:translate(-50%,-50%) translate3d(calc(var(--pps-explode) * var(--frag-x) * 118px),calc(var(--pps-explode) * var(--frag-y) * 118px),var(--frag-z)) rotate(calc(var(--pps-explode) * var(--frag-r))); opacity:calc(.22 + var(--pps-explode) * .78); box-shadow:0 0 18px color-mix(in srgb,var(--pps-accent) 16%,transparent); }
.pps-fragment strong { display:block; font:700 6px/1 var(--mono,monospace); letter-spacing:.18em; color:var(--pps-accent-2); }
.pps-fragment span { display:block; margin-top:7px; width:calc(30% + var(--pps-progress) * 55%); height:2px; background:var(--pps-accent); box-shadow:0 0 6px var(--pps-accent); }
.pps-scan { position:absolute; top:-18%; bottom:-18%; left:50%; z-index:15; width:1px; pointer-events:none; background:linear-gradient(180deg,transparent,var(--pps-accent-2),#fff,var(--pps-accent),transparent); box-shadow:0 0 16px var(--pps-accent),0 0 44px color-mix(in srgb,var(--pps-accent) 44%,transparent); opacity:var(--pps-scan); transform:translateX(calc((var(--pps-scan-phase) - .5) * 210px)); }
.pps-scan::after { content:''; position:absolute; top:0; bottom:0; left:-50px; width:100px; background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--pps-accent) 10%,transparent),transparent); }
.pps-ground { position:absolute; left:18%; right:18%; bottom:2%; height:4%; border-radius:50%; background:var(--pps-accent); filter:blur(18px); opacity:calc(.16 + var(--pps-glow) * .16); transform:scaleX(calc(.72 + var(--pps-explode) * .38)); }
.pps-telemetry { position:absolute; left:18px; bottom:18px; z-index:20; width:132px; padding:11px; border:1px solid rgba(255,255,255,.09); background:rgba(8,8,10,.62); backdrop-filter:blur(10px); }
.pps-telemetry-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:9px; font:700 7px/1 var(--mono,monospace); letter-spacing:.16em; color:rgba(255,255,255,.38); }
.pps-telemetry-head b { color:var(--pps-accent-2); }
.pps-meter { display:grid; grid-template-columns:28px 1fr; align-items:center; gap:7px; margin-top:6px; font:600 6px/1 var(--mono,monospace); letter-spacing:.1em; color:rgba(255,255,255,.32); }
.pps-meter-track { height:2px; background:rgba(255,255,255,.08); overflow:hidden; }
.pps-meter-fill { height:100%; width:var(--meter-value); background:linear-gradient(90deg,var(--pps-accent),var(--pps-accent-2)); box-shadow:0 0 7px var(--pps-accent); transition:width .45s ease; }
.pps-stat { position:absolute; left:calc(56% - 32px); top:21%; z-index:22; min-width:110px; padding:10px 12px; border-left:1px solid var(--pps-accent); background:linear-gradient(90deg,color-mix(in srgb,var(--pps-accent) 10%,rgba(5,5,6,.86)),transparent); backdrop-filter:blur(9px); }
.pps-stat strong { display:block; font-size:clamp(16px,3.5cqw,29px); line-height:.9; letter-spacing:-.05em; color:var(--pps-accent-2); text-shadow:0 0 18px color-mix(in srgb,var(--pps-accent) 55%,transparent); }
.pps-stat span { display:block; margin-top:6px; font:700 6px/1 var(--mono,monospace); letter-spacing:.18em; color:rgba(255,255,255,.38); }
.pps-copy-layer { position:relative; z-index:18; margin-top:-100cqh; }
.pps-section { height:100cqh; display:flex; align-items:center; justify-content:flex-end; padding:8% clamp(18px,5%,52px) 8% 58%; }
.pps-copy { width:min(100%,390px); opacity:.18; transform:translate3d(18px,12px,0) scale(.985); filter:blur(1.5px); transition:opacity .5s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1),filter .5s ease; }
.pps-copy[data-active='true'] { opacity:1; transform:none; filter:none; }
.pps-kicker { display:flex; align-items:center; gap:9px; margin-bottom:12px; font:800 8px/1 var(--mono,monospace); letter-spacing:.3em; color:var(--pps-accent-2); }
.pps-kicker::before { content:''; width:27px; height:1px; background:currentColor; box-shadow:0 0 8px currentColor; }
.pps-title { max-width:390px; font-size:clamp(22px,5.7cqw,52px); font-weight:820; letter-spacing:-.065em; line-height:.86; text-wrap:balance; }
.pps-title-line:last-child { color:transparent; -webkit-text-stroke:1px color-mix(in srgb,var(--pps-accent-2) 78%,white); text-shadow:0 0 24px color-mix(in srgb,var(--pps-accent) 26%,transparent); }
.pps-body { max-width:340px; margin-top:16px; font-size:clamp(10px,1.8cqw,14px); line-height:1.55; color:rgba(244,240,232,.56); }
.pps-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:16px; }
.pps-tag { padding:6px 8px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.025); font:700 6px/1 var(--mono,monospace); letter-spacing:.15em; color:rgba(255,255,255,.52); }
.pps-nav { position:absolute; right:18px; bottom:18px; z-index:42; display:flex; align-items:center; gap:5px; pointer-events:auto; }
.pps-nav button { position:relative; width:25px; height:25px; padding:0; border:1px solid rgba(255,255,255,.1); border-radius:50%; background:rgba(8,8,10,.7); color:rgba(255,255,255,.36); font:700 6px/1 var(--mono,monospace); cursor:pointer; transition:border-color .25s ease,color .25s ease,transform .25s ease,background .25s ease; }
.pps-nav button:hover { transform:translateY(-2px); border-color:var(--pps-accent); color:#fff; }
.pps-nav button[aria-current='step'] { border-color:var(--pps-accent-2); color:#fff; background:color-mix(in srgb,var(--pps-accent) 18%,rgba(8,8,10,.86)); box-shadow:0 0 14px color-mix(in srgb,var(--pps-accent) 32%,transparent); }
.pps-scroll-hint { position:absolute; right:20px; top:50%; z-index:21; writing-mode:vertical-rl; font:700 6px/1 var(--mono,monospace); letter-spacing:.24em; color:rgba(255,255,255,.26); }
.pps-scroll-hint::after { content:''; display:inline-block; width:1px; height:40px; margin-top:10px; background:linear-gradient(var(--pps-accent),transparent); animation:pps-hint 1.8s ease-in-out infinite; }
@keyframes pps-hint { 0%,100%{transform:scaleY(.3);transform-origin:top;opacity:.3}50%{transform:scaleY(1);opacity:1} }
@keyframes pps-spin { to{transform:rotate(360deg)} }
@keyframes pps-pulse { 50%{transform:scale(1.18);opacity:.72} }
@media (prefers-reduced-motion:reduce) { .pps-root::after,.pps-core::before,.pps-core::after,.pps-scroll-hint::after { animation:none!important; } .pps-copy { transition:none; filter:none; } }
@container (max-width:700px) {
  .pps-product-zone { left:0; top:3%; bottom:auto; width:100%; height:58%; }
  .pps-product-wrap { width:min(58cqw,34cqh); }
  .pps-stat { left:auto; right:13px; top:17%; min-width:92px; }
  .pps-telemetry { left:12px; bottom:auto; top:17%; width:105px; padding:8px; }
  .pps-section { align-items:flex-end; justify-content:flex-start; padding:57% 17px 52px; }
  .pps-copy { width:100%; padding:13px; border:1px solid rgba(255,255,255,.08); background:linear-gradient(135deg,rgba(7,7,9,.9),rgba(7,7,9,.66)); backdrop-filter:blur(12px); }
  .pps-title { font-size:clamp(22px,8cqw,38px); }
  .pps-body { margin-top:10px; font-size:10px; }
  .pps-tags { margin-top:10px; }
  .pps-nav { right:12px; bottom:12px; }
  .pps-scroll-hint { display:none; }
}
@container (max-height:430px) {
  .pps-product-zone { top:3%; bottom:3%; }
  .pps-telemetry { display:none; }
  .pps-stat { top:18%; }
  .pps-body { max-width:310px; font-size:9px; }
  .pps-tags { margin-top:9px; }
}
`;

export function PinnedProductStage({
  damping = 8,
  rotatePerSection = 90,
  scalePulse = 0.18,
  colorShift = true,
  seed = 11,
}: PinnedProductStageProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const smooth = useRef(reduced ? 1 : 0);
  const [active, setActive] = useState(reduced ? SECTIONS.length - 1 : 0);
  const glyph = useMemo(() => glyphPath(seed * 13 + 3, 120), [seed]);
  const n = SECTIONS.length;

  useRafLoop(
    (dt) => {
      const scroller = scrollerRef.current;
      const stage = stageRef.current;
      const product = productRef.current;
      if (!scroller || !stage || !product) return;

      const raw = scroller.scrollTop / Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      smooth.current = damp(smooth.current, raw, damping, dt);
      const progress = clamp(smooth.current, 0, 1);
      const timeline = progress * (n - 1);
      const sectionIndex = clamp(Math.floor(timeline), 0, n - 2);
      const local = smoothstep(0, 1, timeline - sectionIndex);
      const a = SECTIONS[sectionIndex];
      const b = SECTIONS[sectionIndex + 1];

      const rotX = lerp(a.rotX, b.rotX, local);
      const authoredRotY = lerp(a.rotY, b.rotY, local);
      const rotY = authoredRotY + timeline * (rotatePerSection - 90) * 0.22;
      const rotZ = lerp(a.rotZ, b.rotZ, local);
      const scale = lerp(a.scale, b.scale, local) * (1 + Math.sin(timeline * Math.PI) * scalePulse * 0.22);
      const explode = lerp(a.explode, b.explode, local);
      const scan = lerp(a.scan, b.scan, local);
      const accent = colorShift ? mixHex(a.accent, b.accent, local) : SECTIONS[0].accent;
      const accent2 = colorShift ? mixHex(a.accent2, b.accent2, local) : SECTIONS[0].accent2;
      const scanPhase = (progress * 3.4) % 1;

      product.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      stage.style.setProperty('--pps-progress', progress.toFixed(4));
      stage.style.setProperty('--pps-accent', accent);
      stage.style.setProperty('--pps-accent-2', accent2);
      stage.style.setProperty('--pps-glow', (0.42 + Math.sin(timeline * Math.PI) * 0.46).toFixed(3));
      stage.style.setProperty('--pps-explode', explode.toFixed(3));
      stage.style.setProperty('--pps-scan', scan.toFixed(3));
      stage.style.setProperty('--pps-scan-phase', scanPhase.toFixed(3));
      stage.style.setProperty('--pps-orbit', (progress * 390).toFixed(2));

      const nearest = clamp(Math.round(timeline), 0, n - 1);
      setActive((previous) => (previous === nearest ? previous : nearest));
    },
    !reduced,
  );

  const goToSection = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTo({ top: (index / (n - 1)) * max, behavior: reduced ? 'auto' : 'smooth' });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || reduced) return;
    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    stage.style.setProperty('--pps-px', `${(x * 10).toFixed(2)}px`);
    stage.style.setProperty('--pps-py', `${(y * 7).toFixed(2)}px`);
  };

  const final = SECTIONS[n - 1];
  const initial = SECTIONS[0];
  const stageVars: CssVars = {
    '--pps-progress': reduced ? 1 : 0,
    '--pps-accent': reduced ? final.accent : initial.accent,
    '--pps-accent-2': reduced ? final.accent2 : initial.accent2,
    '--pps-glow': reduced ? 0.75 : 0.42,
    '--pps-explode': reduced ? final.explode : initial.explode,
    '--pps-scan': reduced ? 0 : initial.scan,
    '--pps-scan-phase': 0.5,
    '--pps-orbit': reduced ? 360 : 0,
    '--pps-px': '0px',
    '--pps-py': '0px',
  };

  const productTransform = reduced
    ? `rotateX(${final.rotX}deg) rotateY(${final.rotY}deg) rotateZ(${final.rotZ}deg) scale(${final.scale})`
    : `rotateX(${initial.rotX}deg) rotateY(${initial.rotY}deg) rotateZ(${initial.rotZ}deg) scale(${initial.scale})`;

  return (
    <div ref={rootRef} className="pps-root" onPointerMove={handlePointerMove} style={stageVars}>
      <style>{CSS}</style>
      <div ref={scrollerRef} className="pps-scroll" aria-label="Scroll-driven product story">
        <div style={{ position: 'relative' }}>
          <div ref={stageRef} className="pps-stage" style={stageVars}>
            <div className="pps-stage-grid" />
            <div className="pps-horizon" />

            <div className="pps-progress" aria-hidden="true">
              <span>NOX PRODUCT STAGE</span>
              <div className="pps-progress-track"><div className="pps-progress-fill" /></div>
              <span className="pps-stage-code">{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            </div>

            <div className="pps-product-zone" aria-hidden="true">
              <div className="pps-aura" />
              <div className="pps-product-wrap">
                <div ref={productRef} className="pps-product" style={{ transform: productTransform }}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className="pps-shell"
                      style={{
                        '--shell-index': index,
                        '--shell-inset': `${index * 5}%`,
                      } as CssVars}
                    />
                  ))}

                  {[0, 1, 2].map((index) => (
                    <div key={index} className="pps-orbit" style={{ '--orbit-index': index } as CssVars} />
                  ))}

                  {FRAGMENTS.map((fragment) => (
                    <div
                      key={fragment.label}
                      className="pps-fragment"
                      style={{
                        '--frag-x': fragment.x,
                        '--frag-y': fragment.y,
                        '--frag-z': `${fragment.z}px`,
                        '--frag-r': `${fragment.r}deg`,
                      } as CssVars}
                    >
                      <strong>{fragment.label}</strong>
                      <span />
                    </div>
                  ))}

                  <div className="pps-core">
                    <svg viewBox="0 0 120 120">
                      <path d={glyph} fill="none" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="pps-scan" />
                </div>
                <div className="pps-ground" />
              </div>
            </div>

            <div className="pps-telemetry" aria-live="polite">
              <div className="pps-telemetry-head"><span>LIVE TELEMETRY</span><b>●</b></div>
              {['CORE', 'SIGNAL', 'OUTPUT'].map((label, index) => (
                <div className="pps-meter" key={label}>
                  <span>{label}</span>
                  <div className="pps-meter-track">
                    <div className="pps-meter-fill" style={{ '--meter-value': `${SECTIONS[active].telemetry[index]}%` } as CssVars} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pps-stat" aria-live="polite">
              <strong>{SECTIONS[active].stat}</strong>
              <span>{SECTIONS[active].statLabel}</span>
            </div>

            <div className="pps-scroll-hint">SCROLL TO OPERATE</div>

            <nav className="pps-nav" aria-label="Product story chapters">
              {SECTIONS.map((section, index) => (
                <button
                  key={section.kicker}
                  type="button"
                  aria-label={`Open chapter ${index + 1}: ${section.title.replace('\n', ' ')}`}
                  aria-current={active === index ? 'step' : undefined}
                  onClick={() => goToSection(index)}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
          </div>

          <div className="pps-copy-layer">
            {SECTIONS.map((section, index) => (
              <section key={section.kicker} className="pps-section" aria-label={section.title.replace('\n', ' ')}>
                <div className="pps-copy" data-active={reduced ? 'true' : String(index === active)}>
                  <div className="pps-kicker">{section.kicker}</div>
                  <div className="pps-title">
                    {section.title.split('\n').map((line) => <div className="pps-title-line" key={line}>{line}</div>)}
                  </div>
                  <div className="pps-body">{section.body}</div>
                  <div className="pps-tags">
                    {section.tags.map((tag) => <span className="pps-tag" key={tag}>{tag}</span>)}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinnedProductStage;
