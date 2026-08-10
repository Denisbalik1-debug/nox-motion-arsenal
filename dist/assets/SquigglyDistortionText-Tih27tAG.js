import{j as e,m as l}from"./index-Dteotqf0.js";import{N as n}from"./motionPresets-DdDKkMP6.js";function p({text:r="DISTORTED",amount:o=.5,seed:s=20260810}){const t=l(o,0,1),i=.006+s%90/90*.012,a={"--sqt-gold":n.gold,"--sqt-amount":`${t*14}`,"--sqt-freq":`${i.toFixed(4)}`};return e.jsxs("div",{className:"sqt-root",style:a,"aria-hidden":"true",children:[e.jsx("svg",{className:"sqt-svg",children:e.jsx("defs",{children:e.jsxs("filter",{id:"sqt-displace",children:[e.jsx("feTurbulence",{type:"fractalNoise",baseFrequency:i.toFixed(4),numOctaves:"2",seed:s%100,result:"noise"}),e.jsx("feDisplacementMap",{in:"SourceGraphic",in2:"noise",scale:t*14,xChannelSelector:"R",yChannelSelector:"G"})]})})}),e.jsx("span",{className:"sqt-text",style:{filter:t>0?"url(#sqt-displace)":void 0},children:r}),e.jsx("style",{children:`
.sqt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sqt-svg{position:absolute;width:0;height:0}
.sqt-text{font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.04em;color:var(--sqt-gold);
  text-shadow:0 0 30px color-mix(in srgb,var(--sqt-gold) 36%,transparent);
  will-change:filter;display:inline-block}
@media (prefers-reduced-motion:reduce){
  .sqt-text{filter:none !important}
}
`})]})}export{p as SquigglyDistortionText,p as default};
