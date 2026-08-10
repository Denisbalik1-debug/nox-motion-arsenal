import{m as e,j as r}from"./index-Dteotqf0.js";import{N as m}from"./motionPresets-DdDKkMP6.js";function v({progress:t=.64,speed:o=1,color:p=m.gold,size:c=190,thickness:l=6,showValue:d=!0,label:s="SCAN"}){const n=e(t,0,1),x=e(c,90,400),a=e(l,2,20),i=Math.round(n*100),g={"--prs-color":p,"--prs-size":`${x}px`,"--prs-dur":`${(3.2/e(o,.1,3)).toFixed(2)}s`};return r.jsxs("div",{className:"nox-prs",style:g,children:[r.jsx("style",{children:_}),r.jsxs("div",{className:"nox-prs__ring",role:"progressbar","aria-valuenow":i,"aria-valuemin":0,"aria-valuemax":100,"aria-label":s||"Fortschritt",children:[r.jsx("span",{className:"nox-prs__sweep","aria-hidden":"true"}),r.jsxs("svg",{viewBox:"0 0 100 100",className:"nox-prs__svg","aria-hidden":"true",children:[r.jsx("circle",{className:"nox-prs__track",cx:"50",cy:"50",r:"44",strokeWidth:a,pathLength:1}),r.jsx("circle",{className:"nox-prs__arc",cx:"50",cy:"50",r:"44",strokeWidth:a,pathLength:1,strokeDasharray:`${n} 1`})]}),d&&r.jsxs("div",{className:"nox-prs__center",children:[r.jsxs("strong",{children:[i,"%"]}),s&&r.jsx("span",{children:s})]})]})]})}const _=String.raw`
.nox-prs { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-prs__ring { position:relative; width:var(--prs-size); height:var(--prs-size); }
.nox-prs__svg { position:relative; z-index:2; width:100%; height:100%; transform:rotate(-90deg); overflow:visible; }
.nox-prs__track { fill:none; stroke:rgba(236,231,219,.08); }
.nox-prs__arc { fill:none; stroke:var(--prs-color); stroke-linecap:round; filter:drop-shadow(0 0 5px color-mix(in srgb, var(--prs-color) 60%, transparent)); transition:stroke-dasharray .6s cubic-bezier(.22,1,.36,1); }
/* Radar-Keil: ein rotierendes conic-gradient, per Maske auf den Ring begrenzt. */
.nox-prs__sweep { position:absolute; inset:0; z-index:1; border-radius:50%; background:conic-gradient(from 0deg, color-mix(in srgb, var(--prs-color) 34%, transparent), transparent 42%); animation:nox-prs-sweep var(--prs-dur) linear infinite; }
@keyframes nox-prs-sweep { to { transform:rotate(360deg); } }
.nox-prs__center { position:absolute; inset:0; z-index:3; display:grid; place-content:center; justify-items:center; gap:3px; pointer-events:none; }
.nox-prs__center strong { font-size:calc(var(--prs-size) * .19); font-weight:740; letter-spacing:-.03em; color:#f2ece1; font-variant-numeric:tabular-nums; }
.nox-prs__center span { color:rgba(236,231,219,.36); font-size:9.5px; letter-spacing:.3em; }
@media (prefers-reduced-motion:reduce) {
  .nox-prs__sweep { animation:none; opacity:.35; }
  .nox-prs__arc { transition:none; }
}
`;export{v as ProgressRingScanner,v as default};
