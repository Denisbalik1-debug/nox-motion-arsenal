import{r as g,m as x,j as s}from"./index-Dteotqf0.js";import{N as f}from"./motionPresets-DdDKkMP6.js";function b(t,i){const r=Math.sin(t*12.9898+i*78.233)*43758.5453;return r-Math.floor(r)}function w({speed:t=1,beep:i=!0,color:r=f.gold,bars:m=42,code:n="4 018 293 771 204",seed:l=11}){const c=x(Math.round(m),12,90),u=g.useMemo(()=>{const a=[];let e=0;for(let o=0;o<c;o+=1){const p=.6+b(o,l)*2.4,d=.5+b(o,l+31)*1.6;a.push(`transparent ${e.toFixed(2)}%`),a.push(`#e9e3d6 ${e.toFixed(2)}%`),e+=p,a.push(`#e9e3d6 ${e.toFixed(2)}%`),a.push(`transparent ${e.toFixed(2)}%`),e+=d}const _=100/e;return`linear-gradient(90deg, ${a.map(o=>{const[p,d]=o.split(" ");return`${p} ${(parseFloat(d)*_).toFixed(2)}%`}).join(", ")})`},[c,l]),h={"--bsl-color":r,"--bsl-dur":`${(2.4/x(t,.3,3)).toFixed(2)}s`,"--bsl-bars":u};return s.jsxs("div",{className:"nox-bsl",style:h,children:[s.jsx("style",{children:v}),s.jsxs("div",{className:"nox-bsl__unit",children:[s.jsxs("div",{className:"nox-bsl__code",role:"img","aria-label":n?`Barcode ${n}`:"Barcode",children:[s.jsx("span",{className:"nox-bsl__bars","aria-hidden":"true"}),s.jsx("span",{className:"nox-bsl__laser","aria-hidden":"true"})]}),n&&s.jsx("span",{className:"nox-bsl__digits",children:n}),i&&s.jsx("span",{className:"nox-bsl__beep","aria-hidden":"true"})]})]})}const v=String.raw`
.nox-bsl { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,36px); font-family:var(--mono,monospace); }
.nox-bsl__unit { position:relative; display:grid; gap:9px; justify-items:center; width:min(320px,86%); }
.nox-bsl__code { position:relative; width:100%; height:104px; overflow:hidden; border-radius:6px; background:#0c0b0d; }
.nox-bsl__bars { position:absolute; inset:9px 10px; background-image:var(--bsl-bars); }
/* Die Linie faehrt ueber die volle Hoehe und traegt ihren Glow selbst. */
.nox-bsl__laser { position:absolute; left:0; right:0; height:2px; background:var(--bsl-color); box-shadow:0 0 9px var(--bsl-color), 0 0 26px color-mix(in srgb, var(--bsl-color) 65%, transparent); animation:nox-bsl-scan var(--bsl-dur) linear infinite; }
@keyframes nox-bsl-scan { 0% { transform:translateY(0); } 100% { transform:translateY(104px); } }
.nox-bsl__digits { color:rgba(236,231,219,.42); font-size:11px; letter-spacing:.28em; }
.nox-bsl__beep { position:absolute; top:-7px; right:-7px; width:11px; height:11px; border-radius:50%; background:var(--bsl-color); box-shadow:0 0 10px var(--bsl-color); animation:nox-bsl-beep var(--bsl-dur) ease-out infinite; }
@keyframes nox-bsl-beep { 0%, 84% { transform:scale(.6); opacity:.28; } 90% { transform:scale(1.5); opacity:1; } 100% { transform:scale(.6); opacity:.28; } }
@media (prefers-reduced-motion:reduce) {
  .nox-bsl__laser { animation:none; top:50%; }
  .nox-bsl__beep { animation:none; opacity:.5; }
}
`;export{w as BarcodeScanLine,w as default};
