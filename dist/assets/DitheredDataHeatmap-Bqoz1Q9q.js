import{r as i,l as E,j as a,m as c}from"./index-Dteotqf0.js";import{N as A}from"./motionPresets-DdDKkMP6.js";const y=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];function _({cols:M=28,rows:j=16,seed:p=20260810,contrast:w=1,hotRatio:k=.14,scanline:N=!0}){const e=c(Math.round(M),8,48),n=c(Math.round(j),8,32),m=c(w,.2,1.5),g=c(k,0,.5),r=i.useMemo(()=>E(p),[p]),h=i.useMemo(()=>{const t=r()*e,o=r()*n,d=r()*e,s=r()*n,u=1.6+r()*2.2,x=1.2+r()*2.6;return Array.from({length:e*n},()=>r()).map((S,f)=>{const b=f%e,v=Math.floor(f/e),$=Math.exp(-((b-t)**2/(2*u**2)+(v-o)**2/(2*u**2))),C=Math.exp(-((b-d)**2/(2*x**2)+(v-s)**2/(2*x**2)));return Math.min(1,Math.max(0,S*.45+($*.62+C*.5)*m))})},[e,n,r,m]),l=i.useMemo(()=>Math.max(...h),[h]),O=i.useMemo(()=>{const t=h.map(d=>d).sort((d,s)=>s-d).slice(0,Math.max(1,Math.round(h.length*g))),o=new Set(t);return h.map((d,s)=>({i:s,v:l>0?d/l:0,bayer:y[s%4][Math.floor(s/e)%4],hot:o.has(d)}))},[h,l,g,e,n]),R={"--ddh-gold":A.gold,"--ddh-cols":`${e}`,"--ddh-rows":`${n}`};return a.jsxs("div",{className:"ddh-root",style:R,"aria-hidden":"true",children:[a.jsx("svg",{className:"ddh-pattern","aria-hidden":"true",children:a.jsx("defs",{children:a.jsx("pattern",{id:"ddh-bayer",width:"4",height:"4",patternUnits:"userSpaceOnUse",children:y.flat().map((t,o)=>a.jsx("rect",{x:o%4,y:Math.floor(o/4),width:"1",height:"1",fill:t>=8?"currentColor":"none"},o))})})}),a.jsx("div",{className:"ddh-grid",children:O.map(t=>{const o=Math.round(t.v*15),d=t.bayer<o;return a.jsx("div",{className:`ddh-cell ${t.hot?"ddh-cell--hot":""} ${d?"ddh-cell--dither":""}`,style:{opacity:.18+t.v*.82}},t.i)})}),N&&a.jsx("div",{className:"ddh-scan"}),a.jsx("style",{children:`
.ddh-root{position:absolute;inset:0;overflow:hidden;background:#07090d;color:var(--ddh-gold);
  display:grid;place-items:center;padding:6%}
.ddh-pattern{position:absolute;width:0;height:0}
.ddh-grid{display:grid;grid-template-columns:repeat(var(--ddh-cols),1fr);
  grid-template-rows:repeat(var(--ddh-rows),1fr);gap:1px;width:100%;height:100%;
  background:#0a0d13;border:1px solid color-mix(in srgb,var(--ddh-gold) 22%,transparent)}
.ddh-cell{background:var(--ddh-gold);box-shadow:0 0 6px color-mix(in srgb,var(--ddh-gold) 30%,transparent)}
.ddh-cell--hot{background:#ffd98a;box-shadow:0 0 10px color-mix(in srgb,#ffd98a 55%,transparent)}
.ddh-cell--dither{background:url(#ddh-bayer)}
.ddh-scan{position:absolute;inset-inline:0;height:3px;top:0;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--ddh-gold) 55%,transparent),transparent);
  animation:ddh-scan 7s ease-in-out infinite;pointer-events:none;opacity:.5}
@keyframes ddh-scan{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
@media (prefers-reduced-motion:reduce){.ddh-scan{display:none}}
`})]})}export{_ as DitheredDataHeatmap,_ as default};
