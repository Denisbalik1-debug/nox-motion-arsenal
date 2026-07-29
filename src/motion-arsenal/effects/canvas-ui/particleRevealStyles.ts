export const PARTICLE_REVEAL_STYLES = String.raw`
.prx-root { position:absolute; inset:0; overflow:hidden; container-type:size; color:#f8f4ec; background:var(--prx-bg); touch-action:none; isolation:isolate; font-family:var(--sans,system-ui,sans-serif); }
.prx-root::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.42; background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size:44px 44px; mask-image:radial-gradient(circle at 50% 50%,#000,transparent 74%); }
.prx-root::after { content:''; position:absolute; inset:-22%; z-index:1; pointer-events:none; opacity:.045; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); animation:prx-noise .28s steps(2) infinite; }
@keyframes prx-noise { 0%{transform:translate(-2%,-1%)}50%{transform:translate(2%,1%)}100%{transform:translate(-1%,2%)} }
.prx-canvas { position:absolute; inset:0; z-index:3; width:100%; height:100%; display:block; }
.prx-switcher { position:absolute; left:14px; right:14px; top:13px; z-index:20; display:flex; gap:5px; overflow-x:auto; scrollbar-width:none; }
.prx-switcher::-webkit-scrollbar { display:none; }
.prx-mode { position:absolute; left:14px; top:47px; z-index:20; display:flex; gap:5px; }
.prx-switcher button,.prx-mode button { flex:0 0 auto; padding:6px 8px; border:1px solid rgba(255,255,255,.09); background:rgba(6,6,8,.68); color:rgba(255,255,255,.38); font:800 6px/1 var(--mono,monospace); letter-spacing:.14em; cursor:pointer; backdrop-filter:blur(8px); transition:.22s ease; }
.prx-switcher button:hover,.prx-mode button:hover { color:#fff; border-color:var(--prx-primary); transform:translateY(-1px); }
.prx-switcher button[aria-pressed='true'],.prx-mode button[aria-pressed='true'] { color:#fff; border-color:var(--prx-secondary); background:color-mix(in srgb,var(--prx-primary) 16%,rgba(6,6,8,.88)); box-shadow:0 0 13px color-mix(in srgb,var(--prx-primary) 30%,transparent); }
.prx-reference { position:absolute; left:14px; bottom:13px; z-index:20; display:flex; align-items:center; gap:8px; max-width:62%; padding:7px 9px; border-left:1px solid var(--prx-primary); background:rgba(6,6,8,.68); backdrop-filter:blur(8px); }
.prx-reference code { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:rgba(255,255,255,.4); font:600 6px/1 var(--mono,monospace); }
.prx-reference button { padding:0; border:0; background:none; color:var(--prx-secondary); font:800 6px/1 var(--mono,monospace); letter-spacing:.12em; cursor:pointer; }
.prx-status { position:absolute; right:14px; bottom:13px; z-index:20; text-align:right; font:700 6px/1.5 var(--mono,monospace); letter-spacing:.14em; color:rgba(255,255,255,.34); }
.prx-status strong { display:block; color:var(--prx-secondary); font-size:8px; }
.prx-corners { position:absolute; inset:11px; z-index:5; pointer-events:none; border:1px solid rgba(255,255,255,.035); }
.prx-corners::before,.prx-corners::after { content:''; position:absolute; width:26px; height:26px; border-color:var(--prx-secondary); opacity:.42; }
.prx-corners::before { left:-1px; top:-1px; border-left:1px solid; border-top:1px solid; }
.prx-corners::after { right:-1px; bottom:-1px; border-right:1px solid; border-bottom:1px solid; }
.prx-root[data-particle-variant='overdrive-particle-collapse'] .prx-corners { box-shadow:inset 0 0 60px color-mix(in srgb,var(--prx-primary) 7%,transparent); }
@media (prefers-reduced-motion:reduce) { .prx-root::after { animation:none!important; } }
@container (max-width:680px) { .prx-switcher { left:8px; right:8px; }.prx-mode { left:8px; top:45px; }.prx-reference { left:8px; bottom:8px; max-width:70%; }.prx-status { right:8px; bottom:8px; } }
`;
