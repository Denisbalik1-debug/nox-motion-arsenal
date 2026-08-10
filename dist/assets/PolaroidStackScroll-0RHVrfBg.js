import{r as d,u as E,l as P,p as _,v as C,j as t,m as l}from"./index-Dteotqf0.js";import{N as L}from"./motionPresets-DdDKkMP6.js";const y=["#8a6a3a","#3a5a7a","#4a7a4a","#7a3a4a","#5a4a7a","#7a6a2a","#2a6a6a","#6a3a2a"];function A({count:b=5,stackOffset:v=6,scatter:j=30,seed:u=20260810}){const f=d.useRef(null),h=d.useRef([]),R=E(),i=l(Math.round(b),3,8),m=l(v,2,16),c=l(j,10,45),r=d.useMemo(()=>P(u),[u]),g=d.useMemo(()=>Array.from({length:i},(s,e)=>({id:e,sx:(r()-.5)*2*c,sy:(r()-.5)*2*c,rot:(r()-.5)*34,blur:1+r()*4,hue:y[e%y.length]})),[i,r,c]),S=_(f);C(s=>{if(R)return;const e=S.current;h.current.forEach((o,n)=>{if(!o)return;const p=g[n],x=Math.min(1,Math.max(0,(e-n*.12)/.6)),a=1-(1-x)*(1-x),N=p.sx*(1-a)+(n-(i-1)/2)*m*a,M=p.sy*(1-a)+n*m*.4*a,k=p.rot*(1-a),O=p.blur*(1-a),$=.25+a*.75;o.style.transform=`translate3d(${N}%, ${M}%, 0) rotate(${k}deg)`,o.style.filter=`blur(${O}px)`,o.style.opacity=String($),o.style.zIndex=String(n+1)})},!0);const w={"--pps-gold":L.gold,"--pps-count":`${i}`};return t.jsxs("div",{ref:f,className:"pps-root",style:w,"aria-hidden":"true",children:[t.jsx("div",{className:"pps-field",children:g.map(s=>t.jsxs("div",{ref:e=>{h.current[s.id]=e},className:"pps-card",style:{"--pps-hue":s.hue},children:[t.jsx("div",{className:"pps-photo"}),t.jsxs("div",{className:"pps-caption",children:[t.jsxs("span",{children:["NOX — ",String(s.id+1).padStart(2,"0")]}),t.jsx("i",{})]})]},s.id))}),t.jsx("style",{children:`
.pps-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 100% at 50% 0%,#0e1120 0%,#07090d 70%)}
.pps-field{position:relative;width:min(320px,62%);aspect-ratio:3/4;max-height:78%}
.pps-card{position:absolute;left:50%;top:50%;width:56%;aspect-ratio:3/4;
  margin-left:-28%;margin-top:-22%;background:#f6f1e6;border-radius:3px;
  padding:5% 5% 0;box-shadow:0 18px 44px #000a;will-change:transform,opacity,filter}
.pps-photo{width:100%;height:76%;background:
  linear-gradient(150deg,var(--pps-hue),#0a0d13 120%);
  border:1px solid #00000022;position:relative}
.pps-photo::after{content:'';position:absolute;inset:0;
  background:radial-gradient(80% 60% at 30% 20%,#ffffff26,transparent 60%)}
.pps-caption{display:flex;align-items:center;justify-content:space-between;
  padding:8% 2% 6%;font:10px ui-monospace,monospace;letter-spacing:.12em;color:#3a342a}
.pps-caption i{width:14px;height:14px;border:1px solid var(--pps-gold);border-radius:50%}
@media (prefers-reduced-motion:reduce){
  .pps-card{transform:none;filter:none;opacity:1}
}
`})]})}export{A as PolaroidStackScroll,A as default};
