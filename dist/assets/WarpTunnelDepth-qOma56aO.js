import{r as _,j as r,m as l}from"./index-Dteotqf0.js";import{N as y}from"./motionPresets-DdDKkMP6.js";function n(d,s){const o=Math.sin(d*12.9898+s*78.233)*43758.5453;return o-Math.floor(o)}function j({streaks:d=70,speed:s=1,streakLength:o=1,color:u=y.gold,deepColor:h="#8ab4ff",coreGlow:g=!0,seed:e=9}){const c=l(Math.round(d),10,200),p=l(s,.1,3),w=l(o,.3,3),f=_.useMemo(()=>Array.from({length:c},(a,t)=>{const x=t%3,i=[1,.7,.45][x];return{angle:n(t,e)*360,start:4+n(t,e+13)*16,duration:(2.6+n(t,e+29)*2.4)/(p*i),delay:-n(t,e+47)*5,thickness:(1+n(t,e+61)*1.8)*i,length:(14+n(t,e+83)*26)*w*i,layer:x}}),[c,p,w,e]),m={"--wtd-color":u,"--wtd-deep":h};return r.jsxs("div",{className:"nox-wtd",style:m,children:[r.jsx("style",{children:v}),r.jsx("div",{className:"nox-wtd__field","aria-hidden":"true",children:f.map((a,t)=>r.jsx("span",{className:`nox-wtd__streak is-layer-${a.layer}`,style:{"--wtd-angle":`${a.angle.toFixed(2)}deg`,"--wtd-start":`${a.start.toFixed(2)}%`,"--wtd-dur":`${a.duration.toFixed(3)}s`,"--wtd-delay":`${a.delay.toFixed(3)}s`,"--wtd-w":`${a.thickness.toFixed(2)}px`,"--wtd-len":`${a.length.toFixed(1)}px`}},t))}),g&&r.jsx("span",{className:"nox-wtd__core","aria-hidden":"true"}),r.jsx("span",{className:"nox-wtd__vignette","aria-hidden":"true"})]})}const v=String.raw`
.nox-wtd { position:relative; width:100%; height:100%; overflow:hidden; background:radial-gradient(ellipse 60% 60% at 50% 50%, #0a0c14, #040406 72%); }
.nox-wtd__field { position:absolute; inset:0; }
/* Jeder Streifen wird um den Mittelpunkt gedreht und faehrt dann nach aussen —
   dadurch entsteht der Fluchtpunkt ohne 3D-Rechnung. */
.nox-wtd__streak { position:absolute; top:50%; left:50%; width:var(--wtd-w); height:var(--wtd-len); border-radius:999px; transform-origin:50% 0; background:linear-gradient(180deg, transparent, var(--wtd-color)); animation:nox-wtd-fly var(--wtd-dur) linear var(--wtd-delay) infinite; }
.nox-wtd__streak.is-layer-2 { background:linear-gradient(180deg, transparent, var(--wtd-deep)); opacity:.5; }
.nox-wtd__streak.is-layer-1 { opacity:.75; }
@keyframes nox-wtd-fly {
  0%   { transform:rotate(var(--wtd-angle)) translateY(var(--wtd-start)) scaleY(.35); opacity:0; }
  14%  { opacity:1; }
  100% { transform:rotate(var(--wtd-angle)) translateY(88vmax) scaleY(1); opacity:0; }
}
.nox-wtd__core { position:absolute; top:50%; left:50%; width:130px; height:130px; transform:translate(-50%,-50%); border-radius:50%; pointer-events:none; background:radial-gradient(circle, color-mix(in srgb, var(--wtd-color) 55%, transparent), transparent 68%); filter:blur(18px); }
.nox-wtd__vignette { position:absolute; inset:0; pointer-events:none; box-shadow:inset 0 0 130px 34px rgb(0 0 0 / .8); }
@media (prefers-reduced-motion:reduce) {
  .nox-wtd__streak { animation:none; opacity:.32; transform:rotate(var(--wtd-angle)) translateY(calc(var(--wtd-start) * 3)); }
}
`;export{j as WarpTunnelDepth,j as default};
