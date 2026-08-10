import{r as d,l as b,j as e,m as o}from"./index-Dteotqf0.js";import{N as u}from"./motionPresets-DdDKkMP6.js";function $({speed:c=1,goldIntensity:f=.7,blobCount:m=4,accent:t=u.gold,seed:s=20260810}){const i=o(c,0,2.5),g=o(f,0,1),n=o(Math.round(m),3,6),r=d.useMemo(()=>b(s),[s]),p=d.useMemo(()=>{const a=[t,"#2f6f8f","#1b2a4a","#4a5a8a","#6f4a2a",t];return Array.from({length:n},(l,v)=>({x:12+r()*76,y:10+r()*70,r:26+r()*38,driftX:(r()-.5)*2,driftY:(r()-.5)*2,scale:1+r()*.8,dur:16+r()*18,delay:-r()*20,hue:a[v%a.length]}))},[n,r,t]),x={"--aur-gold":u.gold,"--aur-accent":t,"--aur-speed":`${i}`,"--aur-gold-i":`${g}`};return e.jsxs("div",{className:"aur-root",style:x,"aria-hidden":"true",children:[e.jsx("div",{className:"aur-field",children:p.map((a,l)=>e.jsx("div",{className:"aur-blob",style:{left:`${a.x}%`,top:`${a.y}%`,width:`${a.r}%`,height:`${a.r}%`,background:`radial-gradient(circle at 38% 34%, ${a.hue}, transparent 68%)`,animationDuration:`${a.dur*(1/Math.max(.1,i))}s`,animationDelay:`${a.delay}s`,"--drift-x":`${a.driftX*14}px`,"--drift-y":`${a.driftY*14}px`,"--blob-scale":`${a.scale}`}},l))}),e.jsx("div",{className:"aur-vignette"}),e.jsx("style",{children:`
.aur-root{position:absolute;inset:0;overflow:hidden;background:
  linear-gradient(165deg,#05070c 0%,#0a0d16 42%,#10131f 100%);isolation:isolate}
.aur-field{position:absolute;inset:-6%;filter:blur(42px);will-change:transform}
.aur-blob{position:absolute;border-radius:50%;opacity:.55;mix-blend-mode:screen;
  animation:aur-drift var(--aur-dur,22s) ease-in-out var(--aur-delay,0s) infinite alternate;
  will-change:transform}
@keyframes aur-drift{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(var(--drift-x),var(--drift-y),0) scale(var(--blob-scale))}
  100%{transform:translate3d(calc(var(--drift-x) * -1.2),calc(var(--drift-y) * 0.7),0) scale(0.92)}
}
.aur-vignette{position:absolute;inset:0;
  background:
    radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(4,6,10,.72) 100%),
    linear-gradient(115deg,color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 14%),transparent),
      transparent 34%,transparent 68%,
      color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 10%),transparent));
  border:1px solid color-mix(in srgb,var(--aur-gold) calc(var(--aur-gold-i) * 26%),transparent);
  opacity:.9}
@media (prefers-reduced-motion:reduce){
  .aur-blob{animation:none;transform:translate3d(0,0,0) scale(1)}
  .aur-field{filter:blur(48px)}
}
`})]})}export{$ as AuroraBorealisBackground,$ as default};
