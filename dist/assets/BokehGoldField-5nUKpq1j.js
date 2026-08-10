import{r as l,l as F,j as n,m as i}from"./index-Dteotqf0.js";import{N as $}from"./motionPresets-DdDKkMP6.js";const b=[{name:"near",scale:1,motion:1,opacity:.9},{name:"mid",scale:.68,motion:.62,opacity:.65},{name:"far",scale:.42,motion:.36,opacity:.4}];function k({count:d=10,speed:m=1,focus:g=.5,color:p=$.gold,seed:c=20260808}){const s=i(Math.round(d),4,16),f=i(m,.1,3),u=i(g,0,1),o=l.useMemo(()=>F(c),[c]),v=l.useMemo(()=>{const r=Math.ceil(s/b.length);return b.map((t,a)=>{const e=a*r,h=Math.min(e+r,s),y=Array.from({length:Math.max(0,h-e)},(w,M)=>{const j=e+M;return{x:o()*100,y:o()*100,r:Math.round((9+o()*17)*t.scale),d:Math.round((8+o()*14)*1e3/(t.motion*f)/10)*10,delay:Math.round(j*1.3%7*10)*10,v:.3+o()*.7,core:.24+o()*.2}});return{layer:t,items:y}})},[s,f,o]),x=r=>{const t=2+u*10*(1-r*.82);return Math.round(t*10)/10};return n.jsxs("div",{className:"bgf-root","aria-hidden":"true",children:[v.map(({layer:r,items:t})=>n.jsx("div",{className:"bgf-layer",style:{"--bgf-blur":`${x(r.motion)}px`},children:t.map((a,e)=>n.jsx("span",{className:"bgf-orb",style:{"--bgf-x":`${a.x.toFixed(2)}%`,"--bgf-y":`${a.y.toFixed(2)}%`,"--bgf-r":`${a.r}px`,"--bgf-d":`${a.d}ms`,"--bgf-delay":`${a.delay}ms`,"--bgf-v":a.v.toFixed(2),"--bgf-core":a.core.toFixed(2),"--bgf-op":r.opacity,"--bgf-color":p}},e))},r.name)),n.jsx("style",{children:`
.bgf-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;isolation:isolate}
.bgf-layer{position:absolute;inset:-12%;filter:blur(var(--bgf-blur));will-change:transform}
.bgf-orb{position:absolute;left:var(--bgf-x);top:var(--bgf-y);width:var(--bgf-r);height:var(--bgf-r);
  border-radius:50%;opacity:var(--bgf-op);
  background:radial-gradient(circle at 36% 36%,
    rgba(255,255,255,var(--bgf-core)),
    color-mix(in srgb, var(--bgf-color) 62%, transparent) 42%,
    color-mix(in srgb, var(--bgf-color) 22%, transparent) 64%,
    transparent 74%);
  animation:bgfDrift var(--bgf-d) ease-in-out var(--bgf-delay) infinite alternate}
@keyframes bgfDrift{
  0%{transform:translate3d(0,0,0) scale(1)}
  100%{transform:translate3d(4vw,calc(-3vh * var(--bgf-v)),0) scale(1.18)}
}
@media (prefers-reduced-motion:reduce){
  .bgf-orb{animation:none}
}
@media (max-width:640px){
  .bgf-orb{opacity:calc(var(--bgf-op) * 0.8)}
}
`})]})}export{k as BokehGoldField,k as default};
