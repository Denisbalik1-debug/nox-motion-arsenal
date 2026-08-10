import{r as d,u as b,p as v,v as y,j as e,m as k}from"./index-Dteotqf0.js";import{N as E}from"./motionPresets-DdDKkMP6.js";function w({src:i,frames:c=6,reverse:p=!1,seed:u=20260810}){const a=d.useRef(null),n=d.useRef(null),m=b(),r=k(Math.round(c),3,12),g=v(a),f=Array.from({length:r},(o,s)=>{const t=(u+s*47)%360;return{from:`hsl(${t} 42% 32%)`,to:`hsl(${(t+40)%360} 55% 12%)`}});y(o=>{if(m)return;const s=n.current;if(!s)return;const t=g.current,l=Math.min(r-1,Math.max(0,Math.floor(t*r))),h=p?l*100:-l*100;s.style.backgroundPositionX=`${h}%`},!0);const x={"--lsi-gold":E.gold,"--lsi-frames":`${r}`};return e.jsxs("div",{ref:a,className:"lsi-root",style:x,"aria-hidden":"true",children:[e.jsx("div",{ref:n,className:"lsi-strip",style:i?{backgroundImage:`url(${i})`}:void 0,children:!i&&f.map((o,s)=>e.jsx("div",{className:"lsi-frame",style:{background:`linear-gradient(140deg, ${o.from} 0%, ${o.to} 100%)`}},s))}),e.jsx("div",{className:"lsi-grain"}),e.jsxs("div",{className:"lsi-hud",children:[e.jsx("span",{children:"INTERLACE"}),e.jsxs("i",{children:[r," FRAMES"]})]}),e.jsx("style",{children:`
.lsi-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:#07090d}
.lsi-strip{width:min(420px,70%);aspect-ratio:4/3;background-size:100% 100%;
  background-repeat:repeat-x;background-position-x:0;
  display:flex;will-change:background-position-x;
  border:1px solid color-mix(in srgb,var(--lsi-gold) 30%,transparent);
  box-shadow:0 24px 60px #0009}
.lsi-frame{flex:0 0 100%;height:100%}
.lsi-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")}
.lsi-hud{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  display:flex;gap:14px;font:10px ui-monospace,monospace;letter-spacing:.2em;
  color:var(--lsi-gold);background:#0b0d12cc;padding:6px 12px;border:1px solid
  color-mix(in srgb,var(--lsi-gold) 40%,transparent)}
@media (prefers-reduced-motion:reduce){
  .lsi-strip{background-position-x:0 !important}
}
`})]})}export{w as LenticularScrollImage,w as default};
