import{r as d,u as R,l as $,v as b,j as r,m as O}from"./index-Dteotqf0.js";import{N as A}from"./motionPresets-DdDKkMP6.js";function C({arcs:g=6,seed:f=20260810}){const w=d.useRef(null),u=R(),p=O(Math.round(g),2,10),o=d.useMemo(()=>$(f),[f]),c=d.useMemo(()=>[{cx:22,cy:38,n:26},{cx:48,cy:30,n:30},{cx:70,cy:42,n:24},{cx:34,cy:68,n:18},{cx:62,cy:72,n:20}].flatMap((s,e)=>Array.from({length:s.n},()=>{const a=o()*Math.PI*2,n=2.2+o()*5.5;return{x:s.cx+Math.cos(a)*n,y:s.cy+Math.sin(a)*n*.72,r:.5+o()*.9,cluster:e}})),[o]),M=d.useMemo(()=>{const t=[0,1,2,3,4],s=[];for(let e=0;e<p;e++){const a=t[e%t.length],n=t[(e*2+1)%t.length],i=c.find(m=>m.cluster===a),l=c.find(m=>m.cluster===n);if(!i||!l)continue;const j=i.x+(o()-.5)*4,h=i.y+(o()-.5)*4,k=l.x+(o()-.5)*4,x=l.y+(o()-.5)*4;s.push({x1:j,y1:h,x2:k,y2:x,midY:Math.max(h,x)-12-o()*18,delay:e*.9})}return s},[p,c,o]),y=d.useRef([]);b(t=>{u||y.current.forEach((s,e)=>{if(!s)return;const a=(t/1e3*.8+e*.35)%1;s.setAttribute("opacity",String(.35+Math.sin(a*Math.PI)*.55));const n=2.2+Math.sin(a*Math.PI)*1.6;s.setAttribute("r",String(n))})},!0);const v={"--dwm-gold":A.gold};return r.jsxs("div",{ref:w,className:"dwm-root",style:v,"aria-hidden":"true",children:[r.jsxs("svg",{className:"dwm-svg",viewBox:"0 0 100 100",preserveAspectRatio:"none",children:[r.jsx("defs",{children:r.jsxs("radialGradient",{id:"dwm-glow",children:[r.jsx("stop",{offset:"0",stopColor:"var(--dwm-gold)",stopOpacity:"0.9"}),r.jsx("stop",{offset:"1",stopColor:"var(--dwm-gold)",stopOpacity:"0"})]})}),!u&&M.map((t,s)=>r.jsx("path",{d:`M ${t.x1} ${t.y1} Q ${(t.x1+t.x2)/2} ${t.midY} ${t.x2} ${t.y2}`,fill:"none",stroke:"var(--dwm-gold)",strokeOpacity:"0.55",strokeWidth:"0.35",strokeDasharray:"3 2.4",className:"dwm-arc",style:{animationDelay:`${t.delay}s`}},s)),c.map((t,s)=>r.jsx("circle",{cx:t.x,cy:t.y,r:t.r,fill:"var(--dwm-gold)",opacity:"0.5"},s)),c.filter((t,s)=>s%37===0).map((t,s)=>r.jsx("circle",{ref:e=>{y.current[s]=e},cx:t.x,cy:t.y,r:2.2,fill:"url(#dwm-glow)"},`s${s}`))]}),r.jsx("style",{children:`
.dwm-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 50% 30%,#0b0e16,#05070b)}
.dwm-svg{width:100%;height:100%;padding:6%}
.dwm-arc{animation:dwm-dash 3.2s ease-in-out infinite;will-change:stroke-dashoffset}
@keyframes dwm-dash{
  0%{stroke-dashoffset:6;stroke-opacity:.15}
  50%{stroke-opacity:.75}
  100%{stroke-dashoffset:-6;stroke-opacity:.15}
}
@media (prefers-reduced-motion:reduce){
  .dwm-arc{display:none}
}
`})]})}export{C as DottedWorldMapConnect,C as default};
