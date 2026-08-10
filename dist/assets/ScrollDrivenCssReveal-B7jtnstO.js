import{r as a,u as R,p as N,v as S,j as s}from"./index-Dteotqf0.js";import{N as O}from"./motionPresets-DdDKkMP6.js";function j({items:i=["FORM FOLLOWS","FUNCTION","MOTION IS","MEANING"],direction:p="up",seed:f=20260810}){const c=a.useRef(null),n=a.useRef([]),o=R(),d=i.length>0?i.slice(0,8):["NOX"],l=a.useRef(d.map((r,e)=>(f+e*37)%100/100)),u=typeof CSS<"u"&&"animationTimeline"in CSS,g=N(c);S(r=>{if(o||u)return;const e=g.current;n.current.forEach((t,v)=>{if(!t)return;const h=l.current[v],m=Math.max(0,e*1.15-h*.35),x=Math.min(1,m+.55);t.style.setProperty("--r0",String(m)),t.style.setProperty("--r1",String(x))})},!0),a.useEffect(()=>{o&&n.current.forEach(r=>r&&r.classList.add("sdr-item--static"))},[o]);const y={"--sdr-gold":O.gold,"--sdr-dir":p};return s.jsxs("div",{ref:c,className:"sdr-root",style:y,children:[s.jsx("div",{className:"sdr-list",children:d.map((r,e)=>s.jsx("div",{ref:t=>{n.current[e]=t},className:"sdr-item",style:{"--sdr-phase":l.current[e]},children:s.jsx("span",{children:r})},e))}),s.jsx("style",{children:`
.sdr-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(110% 90% at 50% 20%,#0d1019 0%,#06080c 75%)}
.sdr-list{display:flex;flex-direction:column;gap:0.4em;padding:8vh 6vw;width:100%}
.sdr-item{font:900 clamp(30px,7vw,74px)/1.02 system-ui;letter-spacing:-.03em;color:var(--sdr-gold);
  opacity:0;transform:translateY(2.4em);will-change:transform,opacity;
  animation:sdr-reveal linear both;animation-timeline:view();
  animation-range:entry 12% cover 44%}
.sdr-item span{display:inline-block;background:linear-gradient(90deg,#fff 0%,var(--sdr-gold) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes sdr-reveal{
  0%{opacity:0;transform:translateY(2.4em)}
  100%{opacity:1;transform:translateY(0)}
}
@supports not (animation-timeline: view()){
  .sdr-item{animation:none;opacity:calc(var(--r0, 1) * 1);transform:
    translateY(calc((1 - var(--r1, 0)) * 2.4em))}
  .sdr-item--static{opacity:1 !important;transform:none !important}
}
@media (prefers-reduced-motion:reduce){
  .sdr-item{animation:none;opacity:1;transform:none}
}
`})]})}export{j as ScrollDrivenCssReveal,j as default};
