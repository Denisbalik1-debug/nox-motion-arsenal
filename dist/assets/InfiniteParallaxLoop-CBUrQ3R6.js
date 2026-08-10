import{r as l,u as N,l as R,v,j as t,m as w}from"./index-Dteotqf0.js";import{N as h}from"./motionPresets-DdDKkMP6.js";const u=[h.gold,"#2f6f8f","#1b2a4a","#6f4a2a"];function M({layers:c=["NOX","ARSENAL","MOTION","SYSTEM"],speed:m=1,direction:x=1,seed:p=20260810}){const g=l.useRef(null),d=l.useRef([]),n=l.useRef([]),y=N(),b=w(m,.2,3),o=l.useMemo(()=>R(p),[p]),f=c.length>0?c.slice(0,4):["NOX"],i=l.useMemo(()=>f.map((e,r)=>({label:e,factor:.35+r*.32+o()*.18,hue:u[r%u.length],dots:Array.from({length:6+r%3*3},()=>({x:o()*100,y:o()*100,s:2+o()*6}))})),[f,o]);l.useMemo(()=>{n.current=i.map((e,r)=>(p+r*61)%500/10)},[i]),v(e=>{if(y)return;const r=26*b*x;d.current.forEach((a,s)=>{a&&(n.current[s]=(n.current[s]+e*r*i[s].factor/60)%50,a.style.transform=`translate3d(${n.current[s]}%, 0, 0)`)})},!0);const j={"--ipl-gold":h.gold};return t.jsxs("div",{ref:g,className:"ipl-root",style:j,"aria-hidden":"true",children:[i.map((e,r)=>t.jsxs("div",{ref:a=>{d.current[r]=a},className:"ipl-layer",style:{"--ipl-hue":e.hue,"--ipl-factor":e.factor},children:[t.jsxs("div",{className:"ipl-band",children:[t.jsx("span",{children:e.label}),t.jsx("span",{children:e.label}),t.jsx("span",{children:e.label})]}),t.jsxs("div",{className:"ipl-band","aria-hidden":"true",children:[t.jsx("span",{children:e.label}),t.jsx("span",{children:e.label}),t.jsx("span",{children:e.label})]}),e.dots.map((a,s)=>t.jsx("i",{className:"ipl-dot",style:{left:`${a.x}%`,top:`${a.y}%`,width:`${a.s}px`,height:`${a.s}px`}},s))]},r)),t.jsx("style",{children:`
.ipl-root{position:absolute;inset:0;overflow:hidden;background:#06080c}
.ipl-layer{position:absolute;left:0;right:0;top:${12 .toFixed(0)}%;
  height:18%;will-change:transform;display:flex;align-items:center;gap:0}
.ipl-layer:nth-child(2){top:34%}
.ipl-layer:nth-child(3){top:56%}
.ipl-layer:nth-child(4){top:78%}
.ipl-band{display:flex;align-items:center;flex:0 0 auto;width:200%;gap:0}
.ipl-band span{font:900 clamp(30px,6vw,64px)/1 system-ui;letter-spacing:-.03em;color:var(--ipl-hue);
  white-space:nowrap;padding-right:0.5em;opacity:.9;
  text-shadow:0 0 22px color-mix(in srgb,var(--ipl-hue) 36%,transparent)}
.ipl-dot{position:absolute;border:1px solid currentColor;opacity:.35;transform:rotate(45deg)}
@media (prefers-reduced-motion:reduce){
  .ipl-layer{transform:none !important}
}
`})]})}export{M as InfiniteParallaxLoop,M as default};
