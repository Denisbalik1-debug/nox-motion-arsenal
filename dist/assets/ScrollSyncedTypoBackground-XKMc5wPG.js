import{r as s,u as k,p as E,v as O,j as a,m as i}from"./index-Dteotqf0.js";import{N as L}from"./motionPresets-DdDKkMP6.js";function X({lines:l=["NOX","ARSENAL"],maxRotation:u=10,drift:g=18,lineGap:v=.16,showOutline:x=!0,seed:c=20260810}){const d=s.useRef(null),n=s.useRef([]),o=k(),f=i(u,4,24),y=i(g,0,40),h=i(v,0,.6),m=l.length>0?l.slice(0,6):["NOX"],w=s.useRef(m.map((e,t)=>(t%2===0?1:-1)*(.72+(c+t*7)%29/100))),R=E(d),S=typeof CSS<"u"&&"animationTimeline"in CSS;s.useEffect(()=>{o&&n.current.forEach(e=>{e&&(e.style.transform="translate3d(0,0,0) rotate(0deg)")})},[o]),O(e=>{if(o||S)return;const t=R.current;n.current.forEach((r,b)=>{if(!r)return;const p=w.current[b],$=(t-.5)*2*f*p,j=(t-.5)*2*y*.35*p/100;r.style.transform=`translate3d(0, ${j*r.offsetHeight}px, 0) rotate(${$}deg)`})},!0);const N={"--sty-gold":L.gold,"--sty-rot":`${f}deg`,"--sty-drift":`${y}%`,"--sty-gap":`${h}em`};return a.jsxs("div",{ref:d,className:"sty-root",style:N,"aria-hidden":"true",children:[a.jsx("div",{className:"sty-lines",children:m.map((e,t)=>a.jsx("div",{ref:r=>{n.current[t]=r},className:`sty-line ${x&&t%2===1?"sty-line--outline":""}`,style:{animationDelay:`${(c+t*13)%100/100*-2}s`},children:e},t))}),a.jsx("style",{children:`
.sty-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:linear-gradient(180deg,#080a0f 0%,#0b0e16 55%,#080a0f 100%)}
.sty-lines{display:flex;flex-direction:column;align-items:center;gap:var(--sty-gap);
  width:100%;padding:0 4vw;transform:translateY(var(--sty-drift))}
.sty-line{font:900 clamp(52px,13vw,150px)/0.86 system-ui;letter-spacing:-.045em;
  color:var(--sty-gold);text-align:center;white-space:nowrap;
  text-shadow:0 0 26px color-mix(in srgb,var(--sty-gold) 34%,transparent);
  will-change:transform}
.sty-line--outline{color:transparent;-webkit-text-stroke:1.5px
  color-mix(in srgb,var(--sty-gold) 62%,transparent);text-shadow:none;
  opacity:.72}
@supports (animation-timeline: view()){
  .sty-line{animation:sty-rotate linear both;animation-timeline:view();
    animation-range:entry 10% exit 90%}
  .sty-line--outline{animation-name:sty-rotate-rev}
}
@keyframes sty-rotate{
  0%{transform:translate3d(0,calc(var(--sty-drift) * .4),0) rotate(calc(var(--sty-rot) * -1))}
  100%{transform:translate3d(0,calc(var(--sty-drift) * -.4),0) rotate(var(--sty-rot))}
}
@keyframes sty-rotate-rev{
  0%{transform:translate3d(0,calc(var(--sty-drift) * .5),0) rotate(var(--sty-rot))}
  100%{transform:translate3d(0,calc(var(--sty-drift) * -.5),0) rotate(calc(var(--sty-rot) * -1))}
}
@media (prefers-reduced-motion:reduce){
  .sty-line{animation:none;transform:none}
  .sty-lines{transform:none}
}
`})]})}export{X as ScrollSyncedTypoBackground,X as default};
