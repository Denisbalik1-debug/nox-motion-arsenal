import{r as n,u as k,l as N,p as w,v as M,j as s,m as A}from"./index-Dteotqf0.js";import{N as O}from"./motionPresets-DdDKkMP6.js";function L({frontLabel:f="NOX",backLabel:b="ARSENAL",cellsPerAxis:x=4,mode:c="scroll",seed:g=20260810}){const d=n.useRef(null),m=n.useRef([]),h=k(),o=A(Math.round(x),2,8),p=n.useMemo(()=>N(g),[g]),i=n.useMemo(()=>{const r=1/(o*o);return Array.from({length:o*o},(t,e)=>{const a=e%o,j=Math.floor(e/o),u=p();return{x:a,y:j,w:100/o,h:100/o,from:u,to:Math.min(1,u+r*1.1)}}).sort((t,e)=>t.from-e.from)},[o,p]),y=w(d),l=n.useRef({p:0,dir:1,playing:!0}),v=(r,t,e)=>{if(r<=t)return 1;if(r>=e)return 0;const a=(r-t)/(e-t);return 1-a*a*(3-2*a)};M(r=>{if(h)return;let t=y.current;if(c==="auto"){const e=l.current;e.playing&&(e.p+=e.dir*r*.25,e.p>=1&&(e.p=1,e.dir=-1),e.p<=0&&(e.p=0,e.dir=1)),t=e.p}m.current.forEach((e,a)=>{e&&e.setAttribute("fill-opacity",String(v(t,i[a].from,i[a].to)))})},!0);const R={"--gbm-gold":O.gold};return s.jsxs("div",{ref:d,className:"gbm-root",style:R,children:[s.jsx("div",{className:"gbm-layer gbm-layer--back",children:b}),s.jsxs("div",{className:"gbm-layer gbm-layer--front",children:[f,s.jsx("svg",{className:"gbm-mask","aria-hidden":"true",children:s.jsx("defs",{children:s.jsxs("mask",{id:"gbm-grid-mask",maskUnits:"userSpaceOnUse",children:[s.jsx("rect",{x:"0",y:"0",width:"100%",height:"100%",fill:"#fff"}),i.map((r,t)=>s.jsx("rect",{ref:e=>{m.current[t]=e},x:`${r.x/o*100}%`,y:`${r.y/o*100}%`,width:`${r.w}%`,height:`${r.h}%`,fill:"#000",fillOpacity:1},t))]})})})]}),c==="auto"&&s.jsx("button",{type:"button",className:"gbm-toggle",onClick:()=>{l.current.playing=!l.current.playing},children:l.current.playing?"PAUSE":"PLAY"}),s.jsx("style",{children:`
.gbm-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:linear-gradient(150deg,#080a10,#10131f 60%,#080a10);color:var(--gbm-gold)}
.gbm-layer{position:absolute;inset:0;display:grid;place-items:center;
  font:900 clamp(44px,11vw,120px)/1 system-ui;letter-spacing:-.04em}
.gbm-layer--back{color:#f4eee4;opacity:.9}
.gbm-layer--front{color:var(--gbm-gold);text-shadow:0 0 30px color-mix(in srgb,var(--gbm-gold) 40%,transparent)}
.gbm-mask{position:absolute;inset:0;width:100%;height:100%}
.gbm-toggle{position:absolute;bottom:18px;right:18px;z-index:5;border:1px solid
  color-mix(in srgb,var(--gbm-gold) 60%,transparent);background:#0b0d12cc;color:var(--gbm-gold);
  font:10px ui-monospace,monospace;letter-spacing:.16em;padding:8px 14px;cursor:pointer}
.gbm-toggle:hover{border-color:var(--gbm-gold)}
@media (prefers-reduced-motion:reduce){
  .gbm-layer--front{color:var(--gbm-gold)}
  .gbm-mask{display:none}
  .gbm-toggle{display:none}
}
`})]})}export{L as GridBlindMaskReveal,L as default};
