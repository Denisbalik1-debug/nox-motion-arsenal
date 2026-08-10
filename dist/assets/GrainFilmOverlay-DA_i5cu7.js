import{j as e,m as t}from"./index-Dteotqf0.js";import{N as v}from"./motionPresets-DdDKkMP6.js";const r={fine:"%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.62'/%3E%3C/svg%3E",coarse:"%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.34' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E",vertical:"%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02 .9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.66'/%3E%3C/svg%3E",halftone:"%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Crect width='12' height='12' fill='black'/%3E%3Ccircle cx='6' cy='6' r='2.1' fill='white'/%3E%3C/svg%3E"},w=[{name:"a"},{name:"b"},{name:"c"},{name:"d"}];function E({intensity:s=.5,speed:l=1,glow:f=!0,glowColor:c=v.gold,grainScale:n=160,vignette:g=!0,grainStyle:i="fine",flicker:d=0,blobCount:m=2}){const h=t(s,0,1),o=t(l,.1,3),a=t(d,0,1),p=t(Math.round(m),0,4),x=r[i]??r.fine,u={"--gfo-opacity":(h*.34).toFixed(3),"--gfo-dur":`${(.66/o).toFixed(3)}s`,"--gfo-tile":i==="halftone"?`${t(n,60,400)/20}px`:`${t(n,60,400)}px`,"--gfo-glow":c,"--gfo-noise":`url("data:image/svg+xml,${x}")`,"--gfo-flicker-min":(1-a*.28).toFixed(3),"--gfo-flicker-dur":`${(2.4/o).toFixed(2)}s`};return e.jsxs("div",{className:`nox-gfo${a>0?" has-flicker":""}`,style:u,children:[e.jsx("style",{children:y}),e.jsxs("div",{className:"nox-gfo__scene",children:[e.jsx("span",{className:"nox-gfo__title",children:"FILM"}),e.jsx("span",{className:"nox-gfo__sub",children:"Korn, Licht und ein ruhiger Grund"})]}),f&&w.slice(0,p).map((b,_)=>e.jsx("span",{className:`nox-gfo__blob nox-gfo__blob--${b.name}`,"aria-hidden":"true"},_)),e.jsx("span",{className:"nox-gfo__grain","aria-hidden":"true"}),g&&e.jsx("span",{className:"nox-gfo__vignette","aria-hidden":"true"})]})}const y=String.raw`
.nox-gfo { position:relative; width:100%; height:100%; overflow:hidden; background:linear-gradient(150deg,#0c0b0d,#08080a 55%,#050506); font-family:var(--sans,system-ui,sans-serif); }
.nox-gfo__scene { position:absolute; inset:0; display:grid; place-content:center; justify-items:center; gap:9px; text-align:center; }
.nox-gfo__title { font-size:clamp(2.2rem,8vw,5rem); font-weight:780; letter-spacing:.18em; color:rgba(242,236,226,.9); }
.nox-gfo__sub { color:rgba(236,231,219,.32); font-size:11px; letter-spacing:.24em; text-transform:uppercase; }
/* steps() laesst das Korn springen — linear wuerde es weich gleiten lassen
   und damit nach Nebel aussehen statt nach Film. */
.nox-gfo__grain { position:absolute; inset:-100%; z-index:3; pointer-events:none; background-image:var(--gfo-noise); background-size:var(--gfo-tile) var(--gfo-tile); opacity:var(--gfo-opacity); animation:nox-gfo-grain var(--gfo-dur) steps(1,end) infinite; }
@keyframes nox-gfo-grain {
  0%   { transform:translate3d(0,0,0); }
  12%  { transform:translate3d(-2%,-3%,0); }
  25%  { transform:translate3d(-4%,2%,0); }
  37%  { transform:translate3d(3%,-1%,0); }
  50%  { transform:translate3d(-1%,4%,0); }
  62%  { transform:translate3d(4%,1%,0); }
  75%  { transform:translate3d(-3%,-2%,0); }
  87%  { transform:translate3d(1%,3%,0); }
}
.nox-gfo__blob { position:absolute; z-index:2; border-radius:50%; pointer-events:none; filter:blur(58px); opacity:.3; background:radial-gradient(circle, color-mix(in srgb, var(--gfo-glow) 62%, transparent), transparent 68%); }
.nox-gfo__blob--a { width:46%; aspect-ratio:1; top:-8%; left:-6%; animation:nox-gfo-drift-a 19s ease-in-out infinite alternate; }
.nox-gfo__blob--b { width:38%; aspect-ratio:1; bottom:-10%; right:-4%; animation:nox-gfo-drift-b 23s ease-in-out infinite alternate; }
.nox-gfo__blob--c { width:30%; aspect-ratio:1; top:34%; right:-12%; opacity:.22; animation:nox-gfo-drift-a 27s ease-in-out infinite alternate-reverse; }
.nox-gfo__blob--d { width:26%; aspect-ratio:1; bottom:22%; left:-10%; opacity:.2; animation:nox-gfo-drift-b 31s ease-in-out infinite alternate-reverse; }
@keyframes nox-gfo-drift-a { to { transform:translate3d(22%,16%,0) scale(1.18); } }
@keyframes nox-gfo-drift-b { to { transform:translate3d(-18%,-14%,0) scale(1.24); } }
/* Projektor-Flackern: eine leichte, unregelmaessige Helligkeitsschwankung
   ueber der ganzen Szene. Bei flicker 0 ist die Untergrenze 1 — also nichts. */
.nox-gfo.has-flicker .nox-gfo__scene { animation:nox-gfo-flicker var(--gfo-flicker-dur) steps(1,end) infinite; }
@keyframes nox-gfo-flicker {
  0%, 100% { opacity:1; }
  17% { opacity:var(--gfo-flicker-min); }
  34% { opacity:1; }
  51% { opacity:calc(var(--gfo-flicker-min) + (1 - var(--gfo-flicker-min)) * .45); }
  68% { opacity:1; }
  85% { opacity:var(--gfo-flicker-min); }
}
.nox-gfo__vignette { position:absolute; inset:0; z-index:4; pointer-events:none; box-shadow:inset 0 0 110px 26px rgb(0 0 0 / .72); }
@media (prefers-reduced-motion:reduce) {
  .nox-gfo__grain { animation:none; }
  .nox-gfo__blob { animation:none; }
  .nox-gfo.has-flicker .nox-gfo__scene { animation:none; }
}
`;export{E as GrainFilmOverlay,E as default};
