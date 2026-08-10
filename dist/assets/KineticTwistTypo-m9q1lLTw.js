import{r as a,l as v,j as e,m as g}from"./index-Dteotqf0.js";import{N as y}from"./motionPresets-DdDKkMP6.js";function w({text:o="NOX",speed:p=1,axis:d="y",color:m=y.gold,goldEdge:f=!0,seed:n=20260810}){const r=a.useMemo(()=>o.slice(0,14).toUpperCase()||"NOX",[o]),i=g(p,.4,3),[k,l]=a.useState(!1),s=a.useMemo(()=>v(n),[n]),h=a.useMemo(()=>Array.from(r).map(t=>({ch:t,phase:Math.round(s()*360),delay:Math.round(s()*900)})),[r,s]),x={"--ktt-speed":`${(3.6/i).toFixed(2)}s`,"--ktt-hover-speed":`${(1.4/i).toFixed(2)}s`,"--ktt-color":m};return e.jsxs("div",{className:"ktt-root",style:x,onPointerEnter:()=>l(!0),onPointerLeave:()=>l(!1),role:"img","aria-label":r,children:[h.map((t,c)=>e.jsxs("span",{className:`ktt-letter${k?" ktt-letter-hover":""}${f?"":" ktt-noedge"}`,style:{"--ktt-i":c,"--ktt-phase":`${t.phase}deg`,"--ktt-delay":`${t.delay}ms`,"--ktt-axis":d==="y"?"rotateY":"rotateX"},children:[e.jsx("span",{className:"ktt-face ktt-face-front",children:t.ch}),e.jsx("span",{className:"ktt-face ktt-face-back",children:t.ch})]},c)),e.jsx("style",{children:`
.ktt-root{position:relative;display:flex;justify-content:center;align-items:center;
  min-height:160px;gap:clamp(2px,1vw,10px);perspective:640px;user-select:none}
.ktt-letter{position:relative;display:inline-block;transform-style:preserve-3d;
  font-family:var(--nox-font-display,Georgia,serif);font-weight:800;
  font-size:clamp(56px,14vw,150px);line-height:1;letter-spacing:.04em;
  color:var(--ktt-color);text-shadow:0 0 26px color-mix(in srgb, var(--ktt-color) 42%, transparent);
  animation:kttTwist var(--ktt-speed) ease-in-out var(--ktt-delay) infinite alternate;
  transform:rotateY(var(--ktt-phase,0deg))}
.ktt-letter-hover{animation-duration:var(--ktt-hover-speed);
  filter:brightness(1.25);text-shadow:0 0 44px color-mix(in srgb, var(--ktt-color) 72%, transparent)}
.ktt-face{position:absolute;inset:0;display:grid;place-items:center;backface-visibility:hidden}
.ktt-face-back{transform:rotateY(180deg);color:#f0ece4;
  text-shadow:0 0 18px rgba(212,162,74,.55)}
.ktt-letter:not(.ktt-noedge)::after{content:"";position:absolute;left:-6%;right:-6%;top:50%;height:2px;
  background:linear-gradient(90deg,transparent,var(--ktt-color),transparent);
  opacity:.55;transform:scaleX(.2);transition:transform .5s cubic-bezier(.2,1.6,.4,1),opacity .5s}
.ktt-letter:hover::after{transform:scaleX(1);opacity:1}
@keyframes kttTwist{
  0%{transform:var(--ktt-axis)(-14deg) scale(1)}
  100%{transform:var(--ktt-axis)(14deg) scale(1.02)}
}
@media (prefers-reduced-motion:reduce){
  .ktt-letter{animation:none;transform:rotateY(0deg) rotateX(0deg)}
  .ktt-letter-hover{filter:none}
}
`})]})}export{w as KineticTwistTypo,w as default};
