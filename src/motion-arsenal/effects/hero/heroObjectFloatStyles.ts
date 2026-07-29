export const HERO_OBJECT_FLOAT_STYLES = `
.hof-root { --hof-accent:#ff553d; --hof-secondary:#d89b42; --hof-light:#fff1da; --hof-glow:1; --hof-orbit-speed:12s; --hof-depth:1; }
.hof-root * { box-sizing:border-box; }
.hof-stage { position:relative; width:min(64vw, 340px); aspect-ratio:1/1; perspective:1100px; display:grid; place-items:center; transform-style:preserve-3d; }
.hof-object-shell { position:relative; width:72%; aspect-ratio:1/1; transform-style:preserve-3d; will-change:transform; cursor:grab; touch-action:none; }
.hof-object-shell:active { cursor:grabbing; }
.hof-object { position:absolute; inset:0; transform-style:preserve-3d; display:grid; place-items:center; }
.hof-aura { position:absolute; inset:7%; border-radius:50%; background:radial-gradient(circle, color-mix(in srgb, var(--hof-accent) 38%, transparent) 0%, transparent 68%); filter:blur(calc(22px * var(--hof-glow))); opacity:.72; transform:translateZ(-80px); pointer-events:none; }
.hof-backplate { position:absolute; inset:17%; border-radius:50%; border:1px solid color-mix(in srgb, var(--hof-accent) 28%, transparent); box-shadow:0 0 calc(28px * var(--hof-glow)) color-mix(in srgb, var(--hof-accent) 25%, transparent), inset 0 0 26px color-mix(in srgb, var(--hof-secondary) 10%, transparent); transform:translateZ(-42px); }
.hof-orbit { position:absolute; inset:4%; border-radius:50%; border:1px solid color-mix(in srgb, var(--hof-light) 16%, transparent); transform-style:preserve-3d; pointer-events:none; animation:hof-orbit var(--hof-orbit-speed) linear infinite; }
.hof-orbit:nth-of-type(2) { inset:12%; transform:rotateX(67deg) rotateZ(21deg); animation-duration:calc(var(--hof-orbit-speed) * .72); animation-direction:reverse; border-color:color-mix(in srgb, var(--hof-accent) 28%, transparent); }
.hof-orbit:nth-of-type(3) { inset:20%; transform:rotateY(66deg) rotateZ(-16deg); animation-duration:calc(var(--hof-orbit-speed) * .54); border-color:color-mix(in srgb, var(--hof-secondary) 30%, transparent); }
.hof-satellite { position:absolute; width:8px; height:8px; border-radius:50%; left:50%; top:-4px; transform:translateX(-50%); background:var(--hof-light); box-shadow:0 0 8px var(--hof-light), 0 0 20px var(--hof-accent); }
.hof-shadow { position:absolute; left:50%; bottom:5%; width:48%; height:18px; border-radius:50%; background:#000; opacity:.52; filter:blur(14px); transform:translateX(-50%); will-change:transform,opacity,filter; }
.hof-glare { position:absolute; inset:0; pointer-events:none; border-radius:inherit; background:linear-gradient(135deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,.035) 26%, transparent 48%); mix-blend-mode:screen; opacity:.74; will-change:transform; }
.hof-scan { position:absolute; inset:0; overflow:hidden; border-radius:inherit; pointer-events:none; opacity:.42; }
.hof-scan::after { content:''; position:absolute; left:-10%; right:-10%; height:22%; top:-24%; background:linear-gradient(180deg, transparent, color-mix(in srgb, var(--hof-light) 14%, transparent), transparent); filter:blur(2px); animation:hof-scan 4.8s ease-in-out infinite; }
.hof-grid { position:absolute; inset:0; opacity:.28; background-image:linear-gradient(color-mix(in srgb, var(--hof-light) 9%, transparent) 1px, transparent 1px),linear-gradient(90deg,color-mix(in srgb, var(--hof-light) 9%, transparent) 1px,transparent 1px); background-size:18px 18px; mask-image:radial-gradient(circle at center,#000 30%,transparent 78%); }
.hof-label { position:absolute; left:50%; top:calc(100% + 36px); transform:translateX(-50%); text-align:center; width:260px; pointer-events:none; }
.hof-label-title { font-size:11px; font-weight:800; letter-spacing:.2em; color:var(--hof-light); text-transform:uppercase; }
.hof-label-kicker { margin-top:7px; font:8px/1.2 var(--mono,monospace); letter-spacing:.34em; color:color-mix(in srgb, var(--hof-light) 48%, transparent); }
.hof-relic { inset:12%; clip-path:polygon(50% 0,86% 17%,100% 52%,82% 88%,50% 100%,17% 86%,0 51%,17% 16%); background:linear-gradient(145deg,#252126 0%,#0a090b 48%,#1a0808 100%); border:1px solid color-mix(in srgb,var(--hof-light) 20%,transparent); box-shadow:inset 0 0 0 10px rgba(255,255,255,.018), inset 0 0 40px rgba(0,0,0,.8), 0 0 calc(42px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 30%,transparent); transform:translateZ(18px); }
.hof-relic::before { content:''; position:absolute; inset:9%; clip-path:inherit; border:1px solid color-mix(in srgb,var(--hof-accent) 55%,transparent); background:conic-gradient(from 18deg,transparent 0 18%,color-mix(in srgb,var(--hof-accent) 18%,transparent) 21%,transparent 25% 52%,color-mix(in srgb,var(--hof-secondary) 18%,transparent) 56%,transparent 61%); }
.hof-relic-core { position:absolute; inset:27%; clip-path:polygon(50% 0,92% 26%,82% 82%,50% 100%,17% 82%,8% 26%); background:radial-gradient(circle at 45% 35%,color-mix(in srgb,var(--hof-accent) 30%,#241015),#090709 62%); border:1px solid color-mix(in srgb,var(--hof-light) 22%,transparent); display:grid; place-items:center; transform:translateZ(34px); }
.hof-relic-mark { width:66%; filter:drop-shadow(0 0 10px var(--hof-accent)); }
.hof-seam { position:absolute; width:2px; height:28%; top:7%; left:50%; transform-origin:50% 156%; background:linear-gradient(transparent,var(--hof-accent),transparent); box-shadow:0 0 8px var(--hof-accent); }
.hof-cube { inset:25%; transform-style:preserve-3d; animation:hof-cube-breathe 5.2s ease-in-out infinite; }
.hof-cube-face { position:absolute; inset:0; border:1px solid color-mix(in srgb,var(--hof-light) 24%,transparent); background:linear-gradient(145deg,color-mix(in srgb,var(--hof-accent) 16%,#11131d),#080910 64%); box-shadow:inset 0 0 24px rgba(0,0,0,.72),0 0 18px color-mix(in srgb,var(--hof-accent) 18%,transparent); overflow:hidden; }
.hof-cube-face.front { transform:translateZ(58px); }
.hof-cube-face.back { transform:rotateY(180deg) translateZ(58px); }
.hof-cube-face.right { transform:rotateY(90deg) translateZ(58px); }
.hof-cube-face.left { transform:rotateY(-90deg) translateZ(58px); }
.hof-cube-face.top { transform:rotateX(90deg) translateZ(58px); }
.hof-cube-face.bottom { transform:rotateX(-90deg) translateZ(58px); }
.hof-node { position:absolute; width:8px; height:8px; border-radius:50%; background:var(--hof-light); box-shadow:0 0 10px var(--hof-secondary); }
.hof-route { position:absolute; height:1px; transform-origin:left center; background:linear-gradient(90deg,var(--hof-accent),var(--hof-secondary)); box-shadow:0 0 7px var(--hof-accent); }
.hof-prism { inset:14% 22%; clip-path:polygon(50% 0,100% 84%,82% 100%,18% 100%,0 84%); background:linear-gradient(150deg,color-mix(in srgb,var(--hof-light) 12%,#24180b),#090704 55%,#1b0e06); border:1px solid color-mix(in srgb,var(--hof-light) 25%,transparent); box-shadow:inset 0 0 38px rgba(0,0,0,.72),0 0 calc(40px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 28%,transparent); transform:translateZ(24px); }
.hof-prism-inner { position:absolute; inset:13%; clip-path:inherit; border:1px solid color-mix(in srgb,var(--hof-accent) 44%,transparent); background:linear-gradient(180deg,rgba(255,255,255,.05),transparent 38%); }
.hof-bars { position:absolute; left:24%; right:24%; bottom:21%; height:42%; display:flex; align-items:flex-end; justify-content:center; gap:8%; transform:translateZ(38px); }
.hof-bar { width:16%; background:linear-gradient(180deg,var(--hof-light),var(--hof-accent)); box-shadow:0 0 10px color-mix(in srgb,var(--hof-accent) 55%,transparent); transform-origin:bottom; animation:hof-bars 2.8s ease-in-out infinite alternate; }
.hof-arrow { position:absolute; left:27%; top:24%; width:47%; height:42%; border-top:2px solid var(--hof-light); border-right:2px solid var(--hof-light); transform:skewY(-28deg) rotate(-8deg) translateZ(44px); filter:drop-shadow(0 0 8px var(--hof-accent)); }
.hof-chip { inset:15%; clip-path:polygon(26% 0,74% 0,100% 26%,100% 74%,74% 100%,26% 100%,0 74%,0 26%); background:linear-gradient(145deg,#17231e,#060b08 56%,#0b1712); border:1px solid color-mix(in srgb,var(--hof-light) 20%,transparent); box-shadow:inset 0 0 0 10px rgba(255,255,255,.018),inset 0 0 34px rgba(0,0,0,.8),0 0 calc(40px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 26%,transparent); transform:translateZ(22px); }
.hof-chip-core { position:absolute; inset:28%; border-radius:24%; border:1px solid color-mix(in srgb,var(--hof-accent) 60%,transparent); background:radial-gradient(circle,color-mix(in srgb,var(--hof-accent) 24%,#08120d),#030604 70%); box-shadow:0 0 18px color-mix(in srgb,var(--hof-accent) 35%,transparent),inset 0 0 18px rgba(0,0,0,.8); display:grid; place-items:center; transform:translateZ(34px); }
.hof-circuit { position:absolute; height:1px; background:linear-gradient(90deg,transparent,var(--hof-accent),var(--hof-secondary)); box-shadow:0 0 6px var(--hof-accent); transform-origin:left center; }
.hof-port { position:absolute; width:10px; height:10px; border:1px solid var(--hof-light); background:#07100b; box-shadow:0 0 8px var(--hof-accent); }
.hof-orb { inset:14%; border-radius:50%; background:radial-gradient(circle at 34% 27%,rgba(255,255,255,.34),color-mix(in srgb,var(--hof-secondary) 30%,transparent) 16%,color-mix(in srgb,var(--hof-accent) 28%,#0b0710) 48%,#030205 72%); border:1px solid color-mix(in srgb,var(--hof-light) 20%,transparent); box-shadow:inset -24px -24px 48px rgba(0,0,0,.7),inset 14px 10px 26px rgba(255,255,255,.05),0 0 calc(55px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 30%,transparent); transform:translateZ(28px); overflow:hidden; }
.hof-orb::after { content:''; position:absolute; inset:-18%; border-radius:50%; background:conic-gradient(from 0deg,transparent 0 20%,color-mix(in srgb,var(--hof-light) 28%,transparent) 25%,transparent 31% 68%,color-mix(in srgb,var(--hof-secondary) 22%,transparent) 73%,transparent 79%); animation:hof-spin 7s linear infinite; }
.hof-orb-ring { position:absolute; inset:23%; border-radius:50%; border:1px solid color-mix(in srgb,var(--hof-light) 38%,transparent); transform:rotateX(72deg) rotateZ(16deg) translateZ(46px); box-shadow:0 0 12px color-mix(in srgb,var(--hof-accent) 38%,transparent); }
.hof-pulse-dot { position:absolute; width:6px; height:6px; border-radius:50%; background:var(--hof-light); box-shadow:0 0 8px var(--hof-light),0 0 18px var(--hof-accent); animation:hof-dot 2.4s ease-in-out infinite; }
.hof-ui { position:absolute; top:14px; left:14px; right:14px; display:flex; justify-content:space-between; gap:12px; z-index:8; pointer-events:none; }
.hof-controls { display:flex; flex-wrap:wrap; gap:5px; pointer-events:auto; }
.hof-button { appearance:none; border:1px solid rgba(255,255,255,.11); background:rgba(5,5,7,.62); color:rgba(255,255,255,.48); border-radius:999px; padding:6px 9px; font:700 8px/1 var(--mono,monospace); letter-spacing:.12em; cursor:pointer; backdrop-filter:blur(8px); }
.hof-button[data-active='true'] { color:var(--hof-light); border-color:color-mix(in srgb,var(--hof-accent) 58%,transparent); box-shadow:0 0 12px color-mix(in srgb,var(--hof-accent) 18%,transparent); }
.hof-reference { position:absolute; right:16px; bottom:14px; z-index:8; border:1px solid rgba(255,255,255,.10); background:rgba(4,4,6,.62); color:rgba(255,255,255,.55); padding:7px 10px; border-radius:7px; font:700 8px/1 var(--mono,monospace); letter-spacing:.12em; cursor:pointer; backdrop-filter:blur(8px); }
.hof-hint { position:absolute; left:16px; bottom:17px; font:8px/1 var(--mono,monospace); letter-spacing:.2em; color:rgba(255,255,255,.35); pointer-events:none; }
.hof-root[data-energy='overdrive'] .hof-aura { opacity:1; }
.hof-root[data-energy='overdrive'] .hof-scan::after { animation-duration:2.2s; }
.hof-root[data-energy='overdrive'] .hof-pulse-dot { animation-duration:1.15s; }
.hof-root[data-energy='calm'] .hof-orbit { opacity:.55; }
@keyframes hof-orbit { to { rotate:1 1 .25 360deg; } }
@keyframes hof-spin { to { transform:rotate(360deg); } }
@keyframes hof-scan { 0%,12% { transform:translateY(-140%); opacity:0; } 35% { opacity:1; } 62%,100% { transform:translateY(620%); opacity:0; } }
@keyframes hof-cube-breathe { 0%,100% { transform:rotateX(-13deg) rotateY(34deg) scale(.94); } 50% { transform:rotateX(-8deg) rotateY(42deg) scale(1); } }
@keyframes hof-bars { from { transform:scaleY(.72); filter:brightness(.85); } to { transform:scaleY(1); filter:brightness(1.25); } }
@keyframes hof-dot { 0%,100% { opacity:.28; transform:scale(.7); } 50% { opacity:1; transform:scale(1.35); } }
@media (max-width:620px) { .hof-stage{width:min(78vw,300px)} .hof-ui{top:10px;left:10px;right:10px}.hof-button{padding:5px 7px;font-size:7px}.hof-reference{right:10px;bottom:10px}.hof-hint{left:10px;bottom:13px}.hof-label{top:calc(100% + 28px)} }
@media (prefers-reduced-motion:reduce) { .hof-orbit,.hof-scan::after,.hof-cube,.hof-bar,.hof-orb::after,.hof-pulse-dot{animation:none!important} }
`;
