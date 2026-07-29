export const HERO_OBJECT_GLASS_SHELL_STYLES = `
.hof-control-stack { display:flex; flex-direction:column; gap:6px; min-width:0; pointer-events:none; }
.hof-control-stack > * { pointer-events:auto; }
.hof-shell-controls { opacity:.92; }
.hof-shell-button { border-radius:7px; background:rgba(13,14,18,.72); }
.hof-energy-controls { justify-content:flex-end; align-content:flex-start; }
.hof-glass-shell { position:absolute; inset:-2% 10%; transform-style:preserve-3d; pointer-events:none; --hof-shell-radius:24px; --hof-shell-border:rgba(255,255,255,.15); --hof-shell-fill:rgba(20,19,23,.46); --hof-shell-frost:10px; --hof-shell-edge:rgba(255,255,255,.10); --hof-shell-tint:color-mix(in srgb,var(--hof-accent) 8%,transparent); }
.hof-shell-depth { position:absolute; inset:0; border-radius:var(--hof-shell-radius); transform:translateZ(calc(-18px * var(--hof-shell-depth))) translate(7px,9px); background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(0,0,0,.52)); border:1px solid color-mix(in srgb,var(--hof-shell-border) 55%,transparent); box-shadow:0 28px 70px rgba(0,0,0,.52),0 0 calc(30px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 12%,transparent); opacity:calc(.55 + var(--hof-glass) * .22); }
.hof-shell-surface { position:absolute; inset:0; border-radius:var(--hof-shell-radius); transform-style:preserve-3d; overflow:hidden; background:linear-gradient(155deg,rgba(255,255,255,calc(.035 * var(--hof-glass))) 0%,var(--hof-shell-fill) 42%,rgba(3,3,5,.54) 100%); border:1px solid var(--hof-shell-border); box-shadow:inset 0 1px 0 rgba(255,255,255,calc(.12 * var(--hof-glass))),inset 0 -1px 0 rgba(255,255,255,.025),inset 0 0 38px rgba(0,0,0,.38),0 0 calc(34px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 12%,transparent); backdrop-filter:blur(var(--hof-shell-frost)) saturate(1.18); }
.hof-shell-tint { position:absolute; inset:0; background:radial-gradient(85% 65% at calc(var(--hof-pointer-x, .5) * 100%) calc(var(--hof-pointer-y, .5) * 100%),color-mix(in srgb,var(--hof-light) calc(10% * var(--hof-glass)),transparent),transparent 52%),linear-gradient(145deg,var(--hof-shell-tint),transparent 54%); opacity:.82; }
.hof-shell-grid { position:absolute; inset:0; opacity:.12; background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px); background-size:22px 22px; mask-image:linear-gradient(180deg,transparent,#000 24%,#000 76%,transparent); }
.hof-shell-caustic { position:absolute; width:70%; height:120%; left:-38%; top:-32%; transform:rotate(18deg) translateX(calc((var(--hof-pointer-x, .5) - .5) * 36px)); background:linear-gradient(90deg,transparent,rgba(255,255,255,calc(.10 * var(--hof-glass))),transparent); filter:blur(9px); mix-blend-mode:screen; opacity:.85; }
.hof-shell-sweep { position:absolute; inset:-35%; background:conic-gradient(from 220deg at 48% 52%,transparent 0 31%,color-mix(in srgb,var(--hof-accent) 12%,transparent) 38%,rgba(255,255,255,.10) 41%,transparent 46% 100%); animation:hof-shell-sweep 8s ease-in-out infinite; mix-blend-mode:screen; }
.hof-shell-edge-light { position:absolute; inset:1px; border-radius:calc(var(--hof-shell-radius) - 1px); box-shadow:inset 1px 1px 0 rgba(255,255,255,.12),inset -1px -1px 0 color-mix(in srgb,var(--hof-accent) 12%,transparent); }
.hof-shell-noise { position:absolute; inset:0; }
.hof-shell-noise span { position:absolute; display:block; border-radius:50%; background:var(--hof-light); box-shadow:0 0 5px var(--hof-accent); }
.hof-shell-corners { position:absolute; inset:10px; opacity:.45; }
.hof-shell-corner { position:absolute; width:17px; height:17px; border-color:color-mix(in srgb,var(--hof-light) 42%,transparent); }
.hof-shell-corner-tl { left:0; top:0; border-left:1px solid; border-top:1px solid; }
.hof-shell-corner-tr { right:0; top:0; border-right:1px solid; border-top:1px solid; }
.hof-shell-corner-bl { left:0; bottom:0; border-left:1px solid; border-bottom:1px solid; }
.hof-shell-corner-br { right:0; bottom:0; border-right:1px solid; border-bottom:1px solid; }
.hof-shell-serial { position:absolute; left:17px; bottom:13px; font:700 6px/1 var(--mono,monospace); letter-spacing:.28em; color:color-mix(in srgb,var(--hof-light) 30%,transparent); }
.hof-shell-core { position:absolute; left:7%; right:7%; top:13%; bottom:14%; transform-style:preserve-3d; transform:translateZ(calc(28px * var(--hof-shell-depth))); }
.hof-shell-core > .hof-object { position:absolute; inset:0; }
.hof-shell-classic-glass-card { --hof-shell-radius:24px; --hof-shell-border:rgba(240,236,228,.16); --hof-shell-fill:rgba(20,18,22,.48); --hof-shell-frost:9px; }
.hof-shell-classic-glass-card .hof-shell-surface { background:linear-gradient(150deg,rgba(255,255,255,.065),rgba(24,22,27,.50) 31%,rgba(9,8,11,.68) 76%,color-mix(in srgb,var(--hof-accent) 6%,rgba(8,6,8,.68))); }
.hof-shell-obsidian-plaque { inset:-1% 8%; --hof-shell-radius:18px; --hof-shell-border:color-mix(in srgb,var(--hof-accent) 24%,rgba(255,255,255,.08)); --hof-shell-fill:rgba(5,5,7,.82); --hof-shell-frost:4px; }
.hof-shell-obsidian-plaque .hof-shell-depth { transform:translateZ(calc(-24px * var(--hof-shell-depth))) translate(9px,12px); background:#030304; border-width:2px; }
.hof-shell-obsidian-plaque .hof-shell-surface { box-shadow:inset 0 0 0 7px rgba(255,255,255,.018),inset 0 0 54px rgba(0,0,0,.82),0 0 calc(42px * var(--hof-glow)) color-mix(in srgb,var(--hof-accent) 18%,transparent); }
.hof-shell-obsidian-plaque .hof-shell-grid { opacity:.05; }
.hof-shell-frosted-command-panel { inset:-3% 8%; --hof-shell-radius:20px; --hof-shell-border:rgba(221,239,255,.22); --hof-shell-fill:rgba(30,38,53,.32); --hof-shell-frost:18px; --hof-shell-tint:color-mix(in srgb,var(--hof-secondary) 12%,transparent); }
.hof-shell-frosted-command-panel .hof-shell-surface { background:linear-gradient(145deg,rgba(221,239,255,.12),rgba(27,33,47,.34) 42%,rgba(5,7,12,.61)); }
.hof-shell-frosted-command-panel .hof-shell-grid { opacity:.26; background-size:16px 16px; }
.hof-shell-frosted-command-panel .hof-shell-corners { opacity:.76; }
.hof-shell-museum-slab { inset:-5% 5%; --hof-shell-radius:9px; --hof-shell-border:rgba(255,255,255,.20); --hof-shell-fill:rgba(22,21,22,.24); --hof-shell-frost:13px; }
.hof-shell-museum-slab .hof-shell-surface { background:linear-gradient(155deg,rgba(255,255,255,.10),rgba(22,21,22,.25) 35%,rgba(7,7,8,.42)); box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 26px 80px rgba(0,0,0,.36); }
.hof-shell-museum-slab .hof-shell-grid,.hof-shell-museum-slab .hof-shell-corners { opacity:.04; }
.hof-shell-museum-slab .hof-shell-serial { color:rgba(255,255,255,.20); }
.hof-shell-holo-sigil-tablet { inset:-3% 8%; --hof-shell-radius:28px; --hof-shell-border:color-mix(in srgb,var(--hof-light) 24%,transparent); --hof-shell-fill:rgba(15,9,22,.38); --hof-shell-frost:14px; --hof-shell-tint:color-mix(in srgb,var(--hof-secondary) 14%,transparent); }
.hof-shell-holo-sigil-tablet .hof-shell-surface { background:linear-gradient(145deg,rgba(255,255,255,.09),color-mix(in srgb,var(--hof-secondary) 10%,rgba(18,10,27,.40)) 42%,color-mix(in srgb,var(--hof-accent) 8%,rgba(4,3,8,.68))); }
.hof-shell-holo-sigil-tablet .hof-shell-edge-light { box-shadow:inset 1px 1px 0 rgba(255,255,255,.16),inset -1px -1px 0 color-mix(in srgb,var(--hof-secondary) 26%,transparent),0 0 20px color-mix(in srgb,var(--hof-accent) 12%,transparent); }
.hof-shell-holo-sigil-tablet .hof-shell-grid { opacity:.18; transform:perspective(500px) rotateX(8deg); }
.hof-root[data-energy='overdrive'] .hof-shell-sweep { animation-duration:3.8s; opacity:1; }
.hof-root[data-energy='calm'] .hof-shell-sweep { opacity:.45; animation-duration:11s; }
@keyframes hof-shell-sweep { 0%,12% { transform:translate3d(-12%,-8%,0) rotate(-6deg); opacity:.18; } 48% { opacity:.92; } 76%,100% { transform:translate3d(12%,8%,0) rotate(8deg); opacity:.22; } }
@media (max-width:620px) { .hof-ui{align-items:flex-start}.hof-control-stack{gap:4px}.hof-shell-controls{max-width:220px}.hof-energy-controls{max-width:92px}.hof-glass-shell{inset:0 10%}.hof-label-kicker{letter-spacing:.2em}.hof-shell-serial{display:none} }
@media (prefers-reduced-motion:reduce) { .hof-shell-sweep{animation:none!important;opacity:.3} }
`;
