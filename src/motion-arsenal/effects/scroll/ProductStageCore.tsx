import type { CSSProperties } from 'react';

export type ProductCoreVariantId =
  | 'nox-global-sales-os'
  | 'project-x-command-center'
  | 'ai-growth-engine'
  | 'conversion-website-system'
  | 'automation-ops-system';

export interface ProductStageCoreProps {
  variant: ProductCoreVariantId;
  glyph: string;
}

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

const CORE_LABELS: Record<ProductCoreVariantId, string> = {
  'nox-global-sales-os': 'REVENUE',
  'project-x-command-center': 'NEXUS',
  'ai-growth-engine': 'SIGNAL',
  'conversion-website-system': 'CONVERT',
  'automation-ops-system': 'OPS',
};

const CORE_CSS = String.raw`
.pcore { overflow:visible; isolation:isolate; transition:clip-path .45s ease,border-radius .45s ease,background .45s ease,box-shadow .45s ease; }
.pcore > style { display:none; }
.pcore-art { position:absolute; inset:8%; z-index:3; width:84%!important; height:84%!important; overflow:visible!important; filter:drop-shadow(0 0 10px var(--pps-accent)); }
.pcore-art * { vector-effect:non-scaling-stroke; }
.pcore-label { position:absolute; left:50%; bottom:11%; z-index:5; transform:translateX(-50%) translateZ(12px); color:color-mix(in srgb,var(--pps-accent-2) 76%,white); font:800 5px/1 var(--mono,monospace); letter-spacing:.22em; text-shadow:0 0 8px var(--pps-accent); }
.pcore-depth { position:absolute; inset:12%; z-index:1; border:1px solid color-mix(in srgb,var(--pps-accent-2) 42%,transparent); opacity:.7; transform:translateZ(-12px); }
.pcore-spark { position:absolute; z-index:6; width:4px; height:4px; border-radius:50%; background:#fff; box-shadow:0 0 8px 2px var(--pps-accent-2),0 0 18px 4px var(--pps-accent); animation:pcore-spark 2.8s ease-in-out infinite; }
.pcore-spark--a { left:22%; top:27%; }
.pcore-spark--b { right:20%; bottom:25%; animation-delay:-1.4s; }
@keyframes pcore-spin { to { transform:rotate(360deg); } }
@keyframes pcore-spin-reverse { to { transform:rotate(-360deg); } }
@keyframes pcore-breathe { 50% { opacity:.42; transform:scale(.92); } }
@keyframes pcore-spark { 0%,100% { opacity:.18; transform:scale(.55); } 45% { opacity:1; transform:scale(1.45); } }
@keyframes pcore-dash { to { stroke-dashoffset:-72; } }

/* Revenue Reactor — faceted, directional and premium. */
.pcore--nox-global-sales-os { border-radius:22%; clip-path:polygon(50% 0,88% 18%,100% 58%,72% 100%,26% 96%,0 58%,10% 18%); background:radial-gradient(circle at 50% 42%,rgba(255,190,105,.2),transparent 22%),linear-gradient(145deg,#1b0908,#080607 66%); }
.pcore--nox-global-sales-os::before { inset:-14px; border-radius:26%; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); clip-path:inherit; animation:pcore-spin 18s linear infinite; }
.pcore--nox-global-sales-os::after { inset:19%; border-radius:18%; background:conic-gradient(from 210deg,transparent 0 22%,var(--pps-accent-2) 24% 25%,transparent 27% 56%,var(--pps-accent) 58% 60%,transparent 62%); filter:drop-shadow(0 0 9px var(--pps-accent)); animation:pcore-spin-reverse 10s linear infinite; }
.pcore--nox-global-sales-os .pcore-depth { border-radius:22%; transform:rotate(45deg) translateZ(-12px); }
.pcore--nox-global-sales-os .pcore-art .pcore-primary { stroke:var(--pps-accent-2); stroke-width:2.4; fill:none; }
.pcore--nox-global-sales-os .pcore-art .pcore-secondary { stroke:var(--pps-accent); stroke-width:1.2; fill:none; opacity:.62; stroke-dasharray:4 7; animation:pcore-dash 5s linear infinite; }

/* Agent Nexus — a command chip with explicit ports and routing graph. */
.pcore--project-x-command-center { border-radius:7px; clip-path:polygon(10% 0,90% 0,100% 10%,100% 90%,90% 100%,10% 100%,0 90%,0 10%); background:linear-gradient(90deg,rgba(121,78,255,.08) 1px,transparent 1px),linear-gradient(rgba(121,78,255,.08) 1px,transparent 1px),linear-gradient(145deg,#100b1d,#06060a 70%); background-size:10px 10px,10px 10px,auto; }
.pcore--project-x-command-center::before { inset:-11px; border-radius:9px; border:1px dashed color-mix(in srgb,var(--pps-accent-2) 68%,transparent); animation:pcore-spin 26s linear infinite; }
.pcore--project-x-command-center::after { inset:30%; border-radius:50%; background:radial-gradient(circle,#fff 0 4%,var(--pps-accent-2) 6% 12%,transparent 15%),conic-gradient(from 0deg,transparent 0 20%,var(--pps-accent) 22% 24%,transparent 26% 46%,var(--pps-accent-2) 48% 50%,transparent 52% 72%,var(--pps-accent) 74% 76%,transparent 78%); filter:drop-shadow(0 0 9px var(--pps-accent)); animation:pcore-spin 8s linear infinite; }
.pcore--project-x-command-center .pcore-depth { inset:17%; border-radius:5px; box-shadow:10px 0 0 -9px var(--pps-accent-2),-10px 0 0 -9px var(--pps-accent-2),0 10px 0 -9px var(--pps-accent-2),0 -10px 0 -9px var(--pps-accent-2); }
.pcore--project-x-command-center .pcore-art .pcore-primary { stroke:var(--pps-accent-2); stroke-width:1.8; fill:none; }
.pcore--project-x-command-center .pcore-art .pcore-node { fill:#fff; stroke:var(--pps-accent); stroke-width:2; filter:drop-shadow(0 0 5px var(--pps-accent)); }

/* Signal Growth Nucleus — organic, radial and expanding. */
.pcore--ai-growth-engine { border-radius:50%; clip-path:none; background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.12) 0 3%,var(--pps-accent-2) 5%,color-mix(in srgb,var(--pps-accent) 25%,#09070f) 20%,#07070a 62%); }
.pcore--ai-growth-engine::before { inset:-18px; border-radius:50%; border:1px solid color-mix(in srgb,var(--pps-accent-2) 46%,transparent); box-shadow:0 0 0 9px color-mix(in srgb,var(--pps-accent) 8%,transparent),0 0 0 20px color-mix(in srgb,var(--pps-accent) 5%,transparent); animation:pcore-breathe 3.4s ease-in-out infinite; }
.pcore--ai-growth-engine::after { inset:18%; border-radius:50%; background:conic-gradient(from 20deg,transparent 0 14%,var(--pps-accent-2) 16% 17%,transparent 19% 45%,var(--pps-accent) 47% 49%,transparent 51% 78%,var(--pps-accent-2) 80% 81%,transparent 83%); animation:pcore-spin 7s linear infinite; }
.pcore--ai-growth-engine .pcore-depth { border-radius:50%; border-style:dashed; animation:pcore-spin-reverse 15s linear infinite; }
.pcore--ai-growth-engine .pcore-art .pcore-primary { stroke:var(--pps-accent-2); stroke-width:1.8; fill:none; }
.pcore--ai-growth-engine .pcore-art .pcore-secondary { stroke:var(--pps-accent); stroke-width:1; fill:none; opacity:.58; stroke-dasharray:2 6; animation:pcore-dash 4s linear infinite; }

/* Conversion Prism — stacked interfaces and one decisive route. */
.pcore--conversion-website-system { border-radius:12px; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); background:linear-gradient(135deg,rgba(255,255,255,.14),transparent 22%),linear-gradient(315deg,color-mix(in srgb,var(--pps-accent) 20%,#070708),#080709 62%); }
.pcore--conversion-website-system::before { inset:-12px; border-radius:0; border:1px solid color-mix(in srgb,var(--pps-accent-2) 62%,transparent); clip-path:inherit; animation:pcore-breathe 3s ease-in-out infinite; }
.pcore--conversion-website-system::after { inset:24%; border-radius:3px; transform:rotate(45deg); background:linear-gradient(180deg,color-mix(in srgb,var(--pps-accent-2) 26%,transparent),transparent 55%); border:1px solid color-mix(in srgb,var(--pps-accent-2) 52%,transparent); box-shadow:0 0 0 7px color-mix(in srgb,var(--pps-accent) 7%,transparent),0 0 16px var(--pps-accent); }
.pcore--conversion-website-system .pcore-depth { inset:20%; transform:rotate(45deg) translateZ(-12px); border-radius:4px; }
.pcore--conversion-website-system .pcore-art .pcore-primary { stroke:var(--pps-accent-2); stroke-width:2; fill:none; }
.pcore--conversion-website-system .pcore-art .pcore-secondary { stroke:var(--pps-accent); stroke-width:1.15; fill:none; opacity:.7; }

/* Automation Kernel — octagonal logic chip with controlled I/O. */
.pcore--automation-ops-system { border-radius:0; clip-path:polygon(24% 0,76% 0,100% 24%,100% 76%,76% 100%,24% 100%,0 76%,0 24%); background:linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(145deg,#0b1110,#050807 70%); background-size:9px 9px,9px 9px,auto; }
.pcore--automation-ops-system::before { inset:-12px; border-radius:0; clip-path:inherit; border:1px solid color-mix(in srgb,var(--pps-accent-2) 58%,transparent); animation:pcore-breathe 2.8s ease-in-out infinite; }
.pcore--automation-ops-system::after { inset:23%; border-radius:4px; background:linear-gradient(90deg,transparent 47%,var(--pps-accent-2) 49% 51%,transparent 53%),linear-gradient(transparent 47%,var(--pps-accent) 49% 51%,transparent 53%); border:1px solid color-mix(in srgb,var(--pps-accent-2) 52%,transparent); box-shadow:0 0 14px var(--pps-accent); }
.pcore--automation-ops-system .pcore-depth { inset:18%; border-radius:3px; border-style:dashed; }
.pcore--automation-ops-system .pcore-art .pcore-primary { stroke:var(--pps-accent-2); stroke-width:1.7; fill:none; stroke-linecap:round; }
.pcore--automation-ops-system .pcore-art .pcore-node { fill:#fff; stroke:var(--pps-accent); stroke-width:2; }

.pps-root[data-product-variant='nox-global-sales-os'] .pps-shell { border-radius:20%; background:linear-gradient(145deg,color-mix(in srgb,var(--pps-accent) 5%,rgba(255,255,255,.04)),rgba(255,255,255,.005)); }
.pps-root[data-product-variant='project-x-command-center'] .pps-shell { border-radius:5px; clip-path:polygon(8% 0,92% 0,100% 8%,100% 92%,92% 100%,8% 100%,0 92%,0 8%); }
.pps-root[data-product-variant='ai-growth-engine'] .pps-shell { border-radius:50%; }
.pps-root[data-product-variant='conversion-website-system'] .pps-shell { border-radius:10px; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.pps-root[data-product-variant='automation-ops-system'] .pps-shell { border-radius:0; clip-path:polygon(18% 0,82% 0,100% 18%,100% 82%,82% 100%,18% 100%,0 82%,0 18%); }
.pps-root[data-product-variant='project-x-command-center'] .pps-orbit { border-style:dashed; }
.pps-root[data-product-variant='ai-growth-engine'] .pps-orbit { border-width:2px; opacity:.72; }
.pps-root[data-product-variant='conversion-website-system'] .pps-orbit { border-radius:14%; transform:translate(-50%,-50%) rotateX(calc(68deg - var(--orbit-index) * 13deg)) rotateZ(calc(var(--pps-orbit) * 1deg + var(--orbit-index) * 34deg)); }
.pps-root[data-product-variant='automation-ops-system'] .pps-orbit { border-style:dotted; }
@media (prefers-reduced-motion:reduce) { .pcore::before,.pcore::after,.pcore-depth,.pcore-spark { animation:none!important; } }
`;

function CoreArtwork({ variant, glyph }: ProductStageCoreProps) {
  switch (variant) {
    case 'project-x-command-center':
      return (
        <svg className="pcore-art" viewBox="0 0 120 120">
          <path className="pcore-primary" d="M60 18V102M18 60H102M31 31L89 89M89 31L31 89" opacity=".32" />
          <path className="pcore-primary" d="M60 28L84 42V78L60 92L36 78V42Z" />
          <path className="pcore-primary" d="M60 42L75 50V70L60 78L45 70V50Z" />
          {[[60, 23], [97, 60], [60, 97], [23, 60]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="pcore-node" cx={cx} cy={cy} r="3" />)}
        </svg>
      );
    case 'ai-growth-engine':
      return (
        <svg className="pcore-art" viewBox="0 0 120 120">
          <circle className="pcore-primary" cx="60" cy="60" r="14" />
          <circle className="pcore-secondary" cx="60" cy="60" r="28" />
          <circle className="pcore-secondary" cx="60" cy="60" r="43" />
          <path className="pcore-primary" d="M60 60C72 43 89 38 103 43M60 60C81 65 91 78 94 95M60 60C49 82 33 90 18 84M60 60C44 45 29 39 16 45" />
          <circle className="pcore-node" cx="103" cy="43" r="3" fill="var(--pps-accent-2)" />
          <circle className="pcore-node" cx="94" cy="95" r="3" fill="var(--pps-accent-2)" />
          <circle className="pcore-node" cx="18" cy="84" r="3" fill="var(--pps-accent-2)" />
          <circle className="pcore-node" cx="16" cy="45" r="3" fill="var(--pps-accent-2)" />
        </svg>
      );
    case 'conversion-website-system':
      return (
        <svg className="pcore-art" viewBox="0 0 120 120">
          <rect className="pcore-secondary" x="27" y="27" width="66" height="66" rx="6" />
          <rect className="pcore-primary" x="34" y="35" width="52" height="48" rx="4" />
          <path className="pcore-secondary" d="M34 46H86M42 55H72M42 63H80" />
          <path className="pcore-primary" d="M42 73H66M66 73L60 67M66 73L60 79" />
          <circle cx="79" cy="73" r="4" fill="var(--pps-accent-2)" />
        </svg>
      );
    case 'automation-ops-system':
      return (
        <svg className="pcore-art" viewBox="0 0 120 120">
          <rect className="pcore-primary" x="36" y="36" width="48" height="48" rx="5" />
          <path className="pcore-primary" d="M60 36V18M60 84V102M36 60H18M84 60H102M43 43L27 27M77 43L93 27M43 77L27 93M77 77L93 93" />
          <path className="pcore-primary" d="M48 51H72V69H48Z" />
          {[[60, 18], [60, 102], [18, 60], [102, 60], [27, 27], [93, 27], [27, 93], [93, 93]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="pcore-node" cx={cx} cy={cy} r="2.5" />)}
        </svg>
      );
    default:
      return (
        <svg className="pcore-art" viewBox="0 0 120 120">
          <path className="pcore-secondary" d={glyph} />
          <path className="pcore-primary" d="M29 82L48 80L60 55L74 68L91 37" />
          <path className="pcore-primary" d="M78 37H91V50" />
          <path className="pcore-secondary" d="M28 91H92M35 25L60 13L85 25" />
          <circle cx="60" cy="55" r="4" fill="var(--pps-accent-2)" />
        </svg>
      );
  }
}

export function ProductStageCore({ variant, glyph }: ProductStageCoreProps) {
  const style = { '--pcore-variant': variant } as CssVars;
  return (
    <div className={`pps-core pcore pcore--${variant}`} style={style} data-core-artifact={variant}>
      <style>{CORE_CSS}</style>
      <div className="pcore-depth" />
      <CoreArtwork variant={variant} glyph={glyph} />
      <span className="pcore-spark pcore-spark--a" />
      <span className="pcore-spark pcore-spark--b" />
      <span className="pcore-label">{CORE_LABELS[variant]}</span>
    </div>
  );
}

export default ProductStageCore;
