import{r as h,j as n,m as c}from"./index-Dteotqf0.js";import{N as v}from"./motionPresets-DdDKkMP6.js";function d(t,r){const e=Math.sin(t*12.9898+r*78.233)*43758.5453;return e-Math.floor(e)}function k({text:t="NOX",glow:r=.7,flicker:e=.4,color:m=v.gold,fontSize:x="clamp(3rem, 14vw, 9rem)",seed:l=7}){const i=c(r,0,1),o=c(e,0,1),p=h.useMemo(()=>t.split(""),[t]),u={"--ntf-color":m,"--ntf-size":x,"--ntf-glow-1":`${(2+i*4).toFixed(1)}px`,"--ntf-glow-2":`${(8+i*18).toFixed(1)}px`,"--ntf-glow-3":`${(20+i*52).toFixed(1)}px`,"--ntf-dim":(.28+(1-o)*.5).toFixed(3)};return n.jsxs("div",{className:"nox-ntf",style:u,children:[n.jsx("style",{children:y}),n.jsx("div",{className:"nox-ntf__tube",role:"img","aria-label":t,children:p.map((s,a)=>{const f=d(a,l),g=o>0&&f<.15+o*.4;return n.jsx("span",{className:`nox-ntf__letter${g?" is-flicker":""}`,"aria-hidden":"true",style:{"--ntf-delay":`${(f*5).toFixed(2)}s`,"--ntf-dur":`${(3.4+d(a,l+11)*4).toFixed(2)}s`},children:s===" "?" ":s},`${s}-${a}`)})})]})}const y=String.raw`
.nox-ntf { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,44px); background:radial-gradient(ellipse 60% 70% at 50% 55%, color-mix(in srgb, var(--ntf-color) 7%, transparent), transparent 70%); font-family:var(--sans,system-ui,sans-serif); }
.nox-ntf__tube { display:flex; font-size:var(--ntf-size); font-weight:760; letter-spacing:.06em; line-height:1; }
.nox-ntf__letter { color:#fff8e6; text-shadow:
    0 0 var(--ntf-glow-1) #fff8e6,
    0 0 var(--ntf-glow-2) var(--ntf-color),
    0 0 var(--ntf-glow-3) var(--ntf-color); }
.nox-ntf__letter.is-flicker { animation:nox-ntf-flicker var(--ntf-dur) steps(1,end) var(--ntf-delay) infinite; }
/* Kurze, unregelmaessige Aussetzer statt gleichmaessigem Pulsieren. */
@keyframes nox-ntf-flicker {
  0%, 41%, 43%, 46%, 71%, 74%, 100% { opacity:1; }
  42%, 45%, 72% { opacity:var(--ntf-dim); }
}
@media (prefers-reduced-motion:reduce) {
  .nox-ntf__letter.is-flicker { animation:none; opacity:1; }
}
`;export{k as NeonTubeFlickerText,k as default};
