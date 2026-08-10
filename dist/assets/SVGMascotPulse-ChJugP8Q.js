import{r as o,l as f,j as s,m as i}from"./index-Dteotqf0.js";import{N as x}from"./motionPresets-DdDKkMP6.js";function h({size:t=180,intensity:n=.8,seed:a=20260810}){const c=i(t,80,320),m=i(n,0,1),r=o.useMemo(()=>f(a),[a]),e=o.useMemo(()=>{const p=16+r()*10,d=46+r()*8;return{eyeGap:p,eyeY:d}},[r]),l={"--smp-gold":x.gold,"--smp-size":`${c}px`,"--smp-intensity":`${m}`,"--smp-phase":`${a%100/100}`};return s.jsxs("div",{className:"smp-root",style:l,"aria-hidden":"true",children:[s.jsxs("svg",{className:"smp-svg",viewBox:"0 0 120 120",children:[s.jsx("defs",{children:s.jsxs("radialGradient",{id:"smp-core",children:[s.jsx("stop",{offset:"0",stopColor:"#fff6dd"}),s.jsx("stop",{offset:"1",stopColor:"var(--smp-gold)"})]})}),s.jsx("circle",{className:"smp-ring",cx:"60",cy:"60",r:"46",fill:"none",stroke:"var(--smp-gold)",strokeOpacity:".5",strokeWidth:"1.5"}),s.jsx("circle",{className:"smp-head",cx:"60",cy:"60",r:"38",fill:"none",stroke:"var(--smp-gold)",strokeWidth:"2.5"}),s.jsx("circle",{className:"smp-core",cx:"60",cy:"60",r:"20",fill:"url(#smp-core)"}),s.jsx("circle",{cx:60-e.eyeGap,cy:e.eyeY,r:"3.4",fill:"#0a0c10"}),s.jsx("circle",{cx:60+e.eyeGap,cy:e.eyeY,r:"3.4",fill:"#0a0c10"}),s.jsx("path",{d:"M 44 74 Q 60 86 76 74",fill:"none",stroke:"#0a0c10",strokeWidth:"2.4",strokeLinecap:"round"})]}),s.jsx("style",{children:`
.smp-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.smp-svg{width:var(--smp-size);height:var(--smp-size);overflow:visible}
.smp-head{transform-origin:60px 60px;animation:smp-beat 1.6s ease-in-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
.smp-core{transform-origin:60px 60px;animation:smp-core 1.6s ease-in-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
.smp-ring{transform-origin:60px 60px;animation:smp-ring 1.6s ease-out infinite;
  animation-delay:calc(var(--smp-phase) * -1.6s)}
@keyframes smp-beat{
  0%,100%{transform:scale(1)}
  12%{transform:scale(calc(1 + var(--smp-intensity) * .05))}
  24%{transform:scale(1)}
  30%{transform:scale(calc(1 + var(--smp-intensity) * .035))}
  42%{transform:scale(1)}
}
@keyframes smp-core{
  0%,100%{transform:scale(1)}
  12%{transform:scale(calc(1 + var(--smp-intensity) * .12))}
  24%{transform:scale(1)}
  30%{transform:scale(calc(1 + var(--smp-intensity) * .08))}
  42%{transform:scale(1)}
}
@keyframes smp-ring{
  0%{transform:scale(.86);opacity:.7}
  60%{transform:scale(1.14);opacity:0}
  100%{transform:scale(1.14);opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .smp-head,.smp-core,.smp-ring{animation:none}
}
`})]})}export{h as SVGMascotPulse,h as default};
