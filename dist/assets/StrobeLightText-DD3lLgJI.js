import{j as t,m}from"./index-Dteotqf0.js";import{N as h}from"./motionPresets-DdDKkMP6.js";function f({text:i="STROBE",frequency:r=4,mode:o="pulse",seed:l=20260810}){const n=m(r,.5,12),e=i.split(""),c=1/n,p=e.map((a,s)=>(l+s*31)%7===0),d={"--slt-gold":h.gold,"--slt-period":`${c}s`,"--slt-mode":o};return t.jsxs("div",{className:"slt-root",style:d,"aria-hidden":"true",children:[t.jsx("div",{className:"slt-word",children:e.map((a,s)=>t.jsx("span",{className:`slt-char ${p[s]?"slt-char--gap":""}`,children:a===" "?" ":a},s))}),t.jsx("p",{className:"slt-hint",children:o==="strobe"?"HOVER FOR STROBE":"AMBIENT PULSE"}),t.jsx("style",{children:`
.slt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.slt-word{display:flex;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em;
  color:var(--slt-gold);text-shadow:0 0 30px color-mix(in srgb,var(--slt-gold) 40%,transparent)}
.slt-char{animation:slt-pulse calc(var(--slt-period) * 2) ease-in-out infinite;
  animation-delay:calc(var(--slt-period) * var(--slt-i, 0))}
.slt-char--gap{animation:none;opacity:.9}
.slt-hint{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@keyframes slt-pulse{
  0%,100%{opacity:1}
  50%{opacity:.12}
}
@media (prefers-reduced-motion:reduce){
  .slt-char{animation:none;opacity:1}
  .slt-hint{display:none}
}
.slt-root:hover .slt-char{animation-name:slt-strobe;animation-duration:var(--slt-period);
  animation-timing-function:steps(1,end)}
@keyframes slt-strobe{
  0%{opacity:1}
  50%{opacity:0}
  100%{opacity:1}
}
`})]})}export{f as StrobeLightText,f as default};
