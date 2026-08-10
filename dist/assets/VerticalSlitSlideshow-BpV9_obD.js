import{r as n,u as w,l as z,j as s,m as f}from"./index-Dteotqf0.js";import{N as u}from"./motionPresets-DdDKkMP6.js";function R({images:d,slits:h=8,interval:y=4,seed:p=20260810}){const[o,g]=n.useState(0),[v,i]=n.useState(!1),t=n.useRef(!1),l=w(),a=f(Math.round(h),4,16),m=f(y,2,10),c=n.useMemo(()=>z(p),[p]),k=n.useMemo(()=>Array.from({length:a},()=>({d:c()*.5,dir:c()>.5?1:-1})),[a,c]),j=n.useMemo(()=>[`linear-gradient(135deg, #0d1019 0%, ${u.gold}55 100%)`,`linear-gradient(225deg, #0a0c10 0%, ${u.gold}44 100%)`],[]),r=d&&d.length>0?d:j,b=()=>{t.current||(t.current=!0,i(!0),setTimeout(()=>{g(e=>(e+1)%r.length),t.current=!1,i(!1)},l?0:750))},N=()=>{t.current||(t.current=!0,i(!0),setTimeout(()=>{g(e=>(e-1+r.length)%r.length),t.current=!1,i(!1)},l?0:750))};n.useEffect(()=>{if(l)return;const e=setInterval(()=>{t.current||b()},m*1e3);return()=>clearInterval(e)},[m,l,r.length]);const S={"--vss-gold":u.gold};return s.jsxs("div",{className:"vss-root",style:S,children:[s.jsxs("div",{className:"vss-stage",children:[s.jsx("div",{className:"vss-slide",style:{backgroundImage:`url("${r[o]}")`,zIndex:v?0:1}}),v&&s.jsx("div",{className:"vss-slits",children:k.map((e,x)=>s.jsx("div",{className:"vss-slit",style:{width:`${100/a}%`,backgroundImage:`url("${r[o]}")`,backgroundSize:`${a*100}% 100%`,backgroundPosition:`${x/a*100}% 0`,animationDelay:`${e.d}s`,"--vss-dir":e.dir}},x))},o),s.jsx("div",{className:"vss-shade"})]}),s.jsxs("div",{className:"vss-nav",children:[s.jsx("button",{type:"button",className:"vss-btn",onClick:N,"aria-label":"Vorheriges Bild",children:"←"}),s.jsxs("span",{className:"vss-count",children:[String(o+1).padStart(2,"0")," / ",String(r.length).padStart(2,"0")]}),s.jsx("button",{type:"button",className:"vss-btn",onClick:b,"aria-label":"Nächstes Bild",children:"→"})]}),s.jsx("style",{children:`
.vss-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.vss-stage{position:relative;width:min(84%,560px);aspect-ratio:16/9;border-radius:12px;
  overflow:hidden;border:1px solid color-mix(in srgb,var(--vss-gold) 20%,transparent);
  box-shadow:0 18px 60px rgba(0,0,0,.5)}
.vss-slide{position:absolute;inset:0;background-size:cover;background-position:center;
  transition:opacity .4s}
.vss-slits{position:absolute;inset:0;display:flex;pointer-events:none;z-index:2}
.vss-slit{height:100%;background-size:cover;transform-origin:center;
  border-right:1px solid color-mix(in srgb,var(--vss-gold) 55%,transparent);
  animation:vss-slit .75s cubic-bezier(.2,.9,.3,1.05) forwards;
  will-change:transform,opacity}
@keyframes vss-slit{
  0%{transform:rotateX(0) translateZ(0);opacity:1}
  100%{transform:rotateX(calc(var(--vss-dir) * 86deg)) translateZ(-60px);opacity:0}
}
.vss-shade{position:absolute;inset:0;pointer-events:none;z-index:3;
  background:radial-gradient(120% 90% at 50% 30%,transparent 60%,rgba(0,0,0,.35))}
.vss-nav{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:14px;z-index:4}
.vss-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);
  color:var(--vss-gold);font:700 14px/1 ui-monospace,monospace;width:34px;height:34px;
  border-radius:8px;cursor:pointer;transition:border-color .2s}
.vss-btn:hover{border-color:var(--vss-gold)}
.vss-count{color:#8a8578;font:600 11px/1 ui-monospace,monospace;letter-spacing:.18em}
@media (prefers-reduced-motion:reduce){
  .vss-slit{animation:none;opacity:1}
  .vss-btn{display:none}
}
`})]})}export{R as VerticalSlitSlideshow,R as default};
