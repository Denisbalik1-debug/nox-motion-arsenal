import{r as s,u as S,l as b,v as j,j as r,m as g}from"./index-Dteotqf0.js";import{N}from"./motionPresets-DdDKkMP6.js";function $({text:h="DECOMPOSE",slices:v=10,spread:y=4,seed:m=20260810}){const w=s.useRef(null),u=s.useRef([]),i=s.useRef({active:!1}),R=S(),a=g(Math.round(v),4,16),c=g(y,1,8),t=s.useMemo(()=>b(m),[m]),E=s.useMemo(()=>Array.from({length:a},()=>({x:(t()-.5)*2*c,y:(t()-.5)*2*c*.6,rot:(t()-.5)*26,delay:t()*.35})),[a,t,c]);j(f=>{if(R)return;const e=i.current.active,l=f/1e3;u.current.forEach((d,O)=>{if(!d)return;const o=E[O],x=Math.max(0,l-o.delay),p=e?Math.min(1,x*3.2):Math.max(0,1-x*3.2),n=p*p*(3-2*p);d.style.transform=`translate3d(${o.x*n}em, ${o.y*n}em, 0) rotate(${o.rot*n}deg)`,d.style.opacity=String(1-n*.35)})},!0);const M={"--sst-gold":N.gold,"--sst-width":`${100/a}%`};return r.jsxs("div",{ref:w,className:"sst-root",style:M,onPointerEnter:()=>{i.current.active=!0},onPointerLeave:()=>{i.current.active=!1},children:[r.jsx("div",{className:"sst-text",children:Array.from({length:a},(f,e)=>r.jsx("div",{ref:l=>{u.current[e]=l},className:"sst-slice",style:{"--sst-i":e},children:h},e))}),r.jsx("p",{className:"sst-hint",children:"HOVER TO DECOMPOSE"}),r.jsx("style",{children:`
.sst-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);cursor:pointer}
.sst-text{position:relative;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em;
  color:var(--sst-gold);text-shadow:0 0 28px color-mix(in srgb,var(--sst-gold) 38%,transparent);
  white-space:nowrap;user-select:none}
.sst-slice{position:absolute;left:0;top:0;width:var(--sst-width);overflow:hidden;
  text-align:center;will-change:transform,opacity;
  -webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 1px),transparent calc(100% - 1px));
  mask-image:linear-gradient(90deg,#000 calc(100% - 1px),transparent calc(100% - 1px))}
.sst-hint{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .sst-slice{transform:none !important;opacity:1 !important}
  .sst-hint{display:none}
}
`})]})}export{$ as SplitSlicedTextDecomposition,$ as default};
