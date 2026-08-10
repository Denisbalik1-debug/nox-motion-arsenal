import{r as a,u as P,p as z,l as A,v as F,m as n,x as v,j as l}from"./index-Dteotqf0.js";import{N as G}from"./motionPresets-DdDKkMP6.js";function _({cols:b=4,rows:R=3,lag:w=.38,strength:M=90,prefix:j="0",color:N=G.gold,seed:p=20260810}){const d=a.useRef(null),f=a.useRef([]),C=P(),i=n(Math.round(b),2,6),u=n(Math.round(R),2,5),L=n(w,.05,.95),m=n(M,20,200),c=i*u,S=z(d),g=a.useMemo(()=>A(p),[p]),x=a.useMemo(()=>{const o=[];for(let t=0;t<c;t++){const r=.15+g()*.85,e=g()*Math.PI*2;o.push({stagger:r,angle:e})}return o},[c,g]),$=a.useRef(Array.from({length:c},()=>({x:0,y:0})));F(o=>{const t=S.current,r=$.current;for(let e=0;e<c;e++){const s=x[e];if(!s)continue;const h=f.current[e];if(!h)continue;const E=Math.cos(s.angle)*m*t*s.stagger,O=Math.sin(s.angle)*m*t*s.stagger,y=C?1:n(L+(1-s.stagger)*.4,.05,.95);r[e].x=v(r[e].x,E,y,.016),r[e].y=v(r[e].y,O,y,.016),h.style.transform=`translate3d(${r[e].x.toFixed(2)}px, ${r[e].y.toFixed(2)}px, 0)`}},!0);const k={"--elg-color":N,"--elg-gap":`${Math.round(10+i*1.5)}px`};return l.jsxs("div",{ref:d,className:"elg-root",style:{...k,gridTemplateColumns:`repeat(${i}, 1fr)`,gridTemplateRows:`repeat(${u}, 1fr)`},children:[x.map((o,t)=>l.jsxs("div",{ref:r=>{f.current[t]=r},className:"elg-cell",style:{"--elg-i":t},children:[l.jsxs("span",{className:"elg-num",children:[j,String(t+1).padStart(2,"0")]}),l.jsxs("span",{className:"elg-tag",style:{opacity:.35+o.stagger*.5},children:["LAG ",Math.round(o.stagger*100),"%"]})]},t)),l.jsx("style",{children:`
.elg-root{position:relative;width:100%;height:100%;min-height:280px;display:grid;
  gap:var(--elg-gap);contain:layout paint;perspective:900px}
.elg-cell{position:relative;border-radius:12px;border:1px solid
  color-mix(in srgb, var(--elg-color) 34%, transparent);
  background:linear-gradient(150deg,rgba(212,162,74,.07),rgba(10,10,11,.4) 55%);
  box-shadow:inset 0 0 22px rgba(0,0,0,.45);
  display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;
  padding:14px;will-change:transform;overflow:hidden}
.elg-cell::after{content:"";position:absolute;right:-30%;top:-30%;width:70%;height:70%;
  border-radius:50%;background:radial-gradient(circle at 40% 40%,
  color-mix(in srgb, var(--elg-color) 26%, transparent),transparent 70%);
  pointer-events:none}
.elg-num{font-family:var(--nox-font-mono,"Courier New",monospace);font-size:clamp(20px,4vw,34px);
  font-weight:700;color:#f0ece4;letter-spacing:.04em}
.elg-tag{font-family:var(--nox-font-mono,"Courier New",monospace);font-size:10px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--elg-color)}
@media (prefers-reduced-motion:reduce){
  .elg-cell{transition:none}
}
`})]})}export{_ as ElasticLagGrid,_ as default};
