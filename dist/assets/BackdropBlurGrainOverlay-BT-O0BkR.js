import{r as d,j as e,m as t}from"./index-Dteotqf0.js";import{N as c}from"./motionPresets-DdDKkMP6.js";function m({blur:a=8,grain:s=.5,goldEdge:o=!0,seed:r=20260810}){const i=t(a,2,20),n=t(s,0,1),b=d.useMemo(()=>{const g=`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${r%1e3}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;return`url("data:image/svg+xml,${encodeURIComponent(g)}")`},[r]),l={"--bbg-gold":c.gold,"--bbg-blur":`${i}px`,"--bbg-grain-opacity":String(n)};return e.jsxs("div",{className:"bbg-root",style:l,"aria-hidden":"true",children:[e.jsx("div",{className:"bbg-blur"}),e.jsx("div",{className:"bbg-grain",style:{backgroundImage:b}}),o&&e.jsx("div",{className:"bbg-edge"}),e.jsx("style",{children:`
.bbg-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.bbg-blur{position:absolute;inset:-30px;backdrop-filter:blur(var(--bbg-blur));
  -webkit-backdrop-filter:blur(var(--bbg-blur))}
.bbg-grain{position:absolute;inset:0;opacity:var(--bbg-grain-opacity);
  background-repeat:repeat;mix-blend-mode:overlay}
.bbg-edge{position:absolute;inset:0;pointer-events:none;border:1px solid
  color-mix(in srgb,var(--bbg-gold) 34%,transparent);
  box-shadow:inset 0 0 40px color-mix(in srgb,var(--bbg-gold) 10%,transparent)}
`})]})}export{m as BackdropBlurGrainOverlay,m as default};
