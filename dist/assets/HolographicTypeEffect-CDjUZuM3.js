import{j as e,m as d}from"./index-Dteotqf0.js";import{N as c}from"./motionPresets-DdDKkMP6.js";function m({text:a="HOLOGRAPHIC",hue:n=42,intensity:o=.85,seed:i=20260810}){const t=(n%360+360)%360,s=d(o,0,1),r=i%100/100*100,l={"--hot-gold":c.gold,"--hot-hue":`${t}`,"--hot-intensity":`${s}`,"--hot-light-x":`${r}%`};return e.jsxs("div",{className:"hot-root",style:l,"aria-hidden":"true",children:[e.jsx("span",{className:"hot-text","data-text":a,children:a}),e.jsx("span",{className:"hot-shine"}),e.jsx("style",{children:`
.hot-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0c0f17,#06080c)}
.hot-text{position:relative;font:900 clamp(42px,9vw,110px)/1 system-ui;letter-spacing:-.04em;
  background:linear-gradient(${t}deg,
    hsl(${t} 70% 62%) 0%,
    hsl(${(t+30)%360} 65% 46%) 32%,
    hsl(${(t+200)%360} 45% 58%) 62%,
    hsl(${t} 75% 66%) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 26px hsl(${t} 70% 55% / calc(var(--hot-intensity) * .4)))}
.hot-text::after{content:attr(data-text);position:absolute;inset:0;
  -webkit-text-stroke:1px hsl(${t} 70% 70% / .5);opacity:.35}
.hot-shine{position:absolute;inset:-20%;pointer-events:none;opacity:.5;
  background:radial-gradient(32% 42% at var(--hot-light-x) 38%,
    rgba(255,244,214,.9),transparent 70%);
  mix-blend-mode:screen;
  -webkit-mask-image:radial-gradient(42% 60% at 50% 50%,#000 30%,transparent 78%);
  mask-image:radial-gradient(42% 60% at 50% 50%,#000 30%,transparent 78%);
  animation:hot-drift 14s ease-in-out infinite alternate;will-change:transform}
@keyframes hot-drift{
  0%{transform:translateX(-6%)}
  100%{transform:translateX(6%)}
}
@media (prefers-reduced-motion:reduce){
  .hot-shine{animation:none;transform:none}
}
`})]})}export{m as HolographicTypeEffect,m as default};
