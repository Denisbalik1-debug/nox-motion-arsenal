import{m as o,j as s}from"./index-Dteotqf0.js";import{N as c}from"./motionPresets-DdDKkMP6.js";function g({variant:n="card",speed:i=1,baseColor:r="#1a1a1e",shimmerColor:d=c.gold,rows:x=4,radius:_=10}){const e=o(Math.round(x),1,12),k={"--sk-base":r,"--sk-shimmer":d,"--sk-dur":`${o(1.5/o(i,.1,3),.2,12).toFixed(2)}s`,"--sk-radius":`${o(_,0,24)}px`};return s.jsxs("div",{className:"nox-sk",style:k,"aria-busy":"true","aria-live":"polite",children:[s.jsx("style",{children:m}),s.jsx("span",{className:"nox-sk__sr",children:"Inhalte werden geladen"}),n==="card"&&s.jsxs("div",{className:"nox-sk__card",children:[s.jsx("div",{className:"nox-sk__block nox-sk__media"}),s.jsx("div",{className:"nox-sk__stack",children:Array.from({length:e},(t,a)=>s.jsx("div",{className:"nox-sk__block nox-sk__line",style:{width:`${l(a,e)}%`}},a))})]}),n==="list"&&s.jsx("div",{className:"nox-sk__stack",children:Array.from({length:e},(t,a)=>s.jsxs("div",{className:"nox-sk__row",children:[s.jsx("div",{className:"nox-sk__block nox-sk__dot"}),s.jsxs("div",{className:"nox-sk__stack nox-sk__stack--tight",children:[s.jsx("div",{className:"nox-sk__block nox-sk__line",style:{width:"62%"}}),s.jsx("div",{className:"nox-sk__block nox-sk__line nox-sk__line--sm",style:{width:"38%"}})]})]},a))}),n==="avatar"&&s.jsxs("div",{className:"nox-sk__row",children:[s.jsx("div",{className:"nox-sk__block nox-sk__dot nox-sk__dot--lg"}),s.jsx("div",{className:"nox-sk__stack nox-sk__stack--tight",children:Array.from({length:e},(t,a)=>s.jsx("div",{className:"nox-sk__block nox-sk__line",style:{width:`${l(a,e)}%`}},a))})]}),n==="line"&&s.jsx("div",{className:"nox-sk__stack",children:Array.from({length:e},(t,a)=>s.jsx("div",{className:"nox-sk__block nox-sk__line",style:{width:`${l(a,e)}%`}},a))})]})}function l(n,i){if(n===i-1)return 48;const r=[96,88,92,78,94,84];return r[n%r.length]}const m=String.raw`
.nox-sk { display:grid; align-content:center; width:min(460px,100%); margin:0 auto; padding:clamp(16px,4vw,30px); font-family:var(--sans,system-ui,sans-serif); }
.nox-sk__sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.nox-sk__card { display:grid; gap:14px; padding:16px; border-radius:calc(var(--sk-radius) + 5px); border:1px solid rgba(236,231,219,.07); background:rgba(255,255,255,.014); }
.nox-sk__stack { display:grid; gap:10px; }
.nox-sk__stack--tight { gap:7px; }
.nox-sk__row { display:flex; align-items:center; gap:13px; }
.nox-sk__row + .nox-sk__row { margin-top:13px; }
.nox-sk__block { position:relative; overflow:hidden; border-radius:var(--sk-radius); background:var(--sk-base); }
.nox-sk__media { height:118px; }
.nox-sk__line { height:11px; }
.nox-sk__line--sm { height:8px; }
.nox-sk__dot { flex:0 0 auto; width:38px; height:38px; border-radius:50%; }
.nox-sk__dot--lg { width:62px; height:62px; }
.nox-sk__stack--tight { flex:1 1 auto; }
/* Der Streifen ist breiter als die Form und fährt einmal pro Zyklus durch. */
.nox-sk__block::after { content:''; position:absolute; inset:0; background:linear-gradient(100deg, transparent 26%, color-mix(in srgb, var(--sk-shimmer) 17%, transparent) 50%, transparent 74%); transform:translateX(-100%); animation:nox-sk-sweep var(--sk-dur) linear infinite; }
@keyframes nox-sk-sweep { to { transform:translateX(100%); } }
@media (prefers-reduced-motion:reduce) {
  .nox-sk__block::after { animation:none; transform:none; background:color-mix(in srgb, var(--sk-shimmer) 7%, transparent); }
}
`;export{g as SkeletonShimmerLoader,g as default};
