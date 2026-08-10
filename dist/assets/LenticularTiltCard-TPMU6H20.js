import{r as d,u as y,v as R,m as n,j as o}from"./index-Dteotqf0.js";import{N as l}from"./motionPresets-DdDKkMP6.js";function N({frames:s,slices:p=24,maxTilt:f=18,wobble:m=0,seed:w=20260810}){const c=d.useRef(null),a=d.useRef(0),x=y(),g=n(Math.round(p),8,48),b=n(f,4,30),u=n(m,0,20),i=d.useMemo(()=>{if(s&&s.length>=2)return s.slice(0,8);const t=`linear-gradient(160deg, ${l.gold}33, #0d1019 60%)`,e=`linear-gradient(20deg, ${l.gold}55, #0a0c10 55%)`,r=`linear-gradient(250deg, #e8e6de22, ${l.gold}44 70%)`;return[t,e,r]},[s]),h=t=>{if(x)return;const e=c.current;if(!e)return;const r=e.getBoundingClientRect(),k=n((t.clientX-r.left)/r.width,0,1);a.current=(k-.5)*2};R(()=>{const t=c.current;if(!t)return;let e=a.current;u>0&&(e+=Math.sin(performance.now()/900)*(u/b)*.5);const r=n(e,-1,1);t.style.setProperty("--lnt-tilt",r.toFixed(3))});const v={"--lnt-gold":l.gold,"--lnt-tilt":"0"};return o.jsxs("div",{ref:c,className:"lnt-root",style:v,onPointerMove:h,onPointerLeave:()=>{a.current=0},children:[o.jsx("div",{className:"lnt-stack",children:Array.from({length:g},(t,e)=>o.jsx("div",{className:"lnt-slice",style:{width:`${100/g}%`,backgroundImage:i[Math.floor((a.current+1)/2*i.length)%i.length]??i[0],backgroundSize:"cover",backgroundPosition:"center"}},e))}),o.jsx("div",{className:"lnt-shine"}),o.jsx("style",{children:`
.lnt-root{position:absolute;inset:0;overflow:hidden;perspective:900px;display:grid;
  place-items:center;background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);
  cursor:grab}
.lnt-stack{position:relative;width:min(82%,520px);aspect-ratio:4/3;border-radius:14px;
  overflow:hidden;border:1px solid color-mix(in srgb,var(--lnt-gold) 26%,transparent);
  box-shadow:0 24px 70px rgba(0,0,0,.55);
  transform:rotateY(calc(var(--lnt-tilt) * 8deg)) rotateX(calc(var(--lnt-tilt) * -4deg));
  transition:transform .08s linear;display:flex;will-change:transform}
.lnt-slice{height:100%;background-size:cover;background-position:center;
  border-right:1px solid rgba(255,255,255,.05)}
.lnt-shine{position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;
  background:linear-gradient(105deg,transparent 42%,
    color-mix(in srgb,var(--lnt-gold) 30%,transparent) 50%,transparent 58%)}
@media (prefers-reduced-motion:reduce){
  .lnt-stack{transform:none}
}
`})]})}export{N as LenticularTiltCard,N as default};
