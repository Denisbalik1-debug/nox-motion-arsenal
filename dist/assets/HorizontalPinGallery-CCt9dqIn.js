import{r as t,u as R,l as k,p as N,v as j,j as e,m as w}from"./index-Dteotqf0.js";import{N as y}from"./motionPresets-DdDKkMP6.js";function O({cards:n=["01 / SIGNAL","02 / STRUCTURE","03 / MOTION","04 / SYSTEM","05 / ARSENAL"],pinHeight:f=220,seed:i=20260810}){const l=t.useRef(null),c=t.useRef(null),p=t.useRef(null),m=R(),a=n.length>0?n.slice(0,8):["NOX"],u=w(f,120,320),o=t.useMemo(()=>k(i),[i]),g=t.useMemo(()=>a.map(()=>({h:20+o()*40,s:30+o()*25})),[a,o]),x=N(l);j(d=>{if(m)return;const r=x.current,s=c.current,h=p.current;if(!s||!h)return;const b=Math.max(0,s.scrollWidth-s.clientWidth);s.style.transform=`translate3d(${-r*b}px, 0, 0)`,h.style.transform=`scaleX(${r})`},!0);const v={"--hpg-gold":y.gold,"--hpg-height":`${u}vh`};return e.jsxs("div",{ref:l,className:"hpg-root",style:v,children:[e.jsxs("div",{className:"hpg-sticky",children:[e.jsx("div",{ref:c,className:"hpg-track",children:a.map((d,r)=>e.jsxs("div",{className:"hpg-card",style:{"--hpg-hue":`hsl(${g[r].h} ${g[r].s}% 30%)`},children:[e.jsx("div",{className:"hpg-art",children:e.jsx("span",{children:String(r+1).padStart(2,"0")})}),e.jsx("p",{children:d})]},r))}),e.jsx("div",{className:"hpg-rail",children:e.jsx("div",{ref:p,className:"hpg-rail-fill"})})]}),e.jsx("style",{children:`
.hpg-root{position:absolute;inset:0;overflow:hidden;height:var(--hpg-height);
  background:linear-gradient(180deg,#0a0d13,#06080c)}
.hpg-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;
  align-items:center}
.hpg-track{display:flex;gap:3vw;padding:0 6vw;will-change:transform;
  align-items:center}
.hpg-card{flex:0 0 min(340px,62vw);aspect-ratio:4/3;position:relative;overflow:hidden;
  border:1px solid color-mix(in srgb,var(--hpg-gold) 26%,transparent);
  background:#0b0e14;box-shadow:0 18px 44px #0008}
.hpg-art{position:absolute;inset:0;background:
  radial-gradient(90% 70% at 30% 22%,color-mix(in srgb,var(--hpg-hue) 70%,#0b0e14),#0b0e14 75%);
  display:grid;place-items:center;font:700 clamp(28px,4vw,44px) ui-monospace,monospace;
  color:color-mix(in srgb,var(--hpg-gold) 85%,#fff)}
.hpg-art::after{content:'';position:absolute;inset:0;
  background:linear-gradient(115deg,transparent 42%,#ffffff14 50%,transparent 58%)}
.hpg-card p{position:absolute;left:14px;bottom:10px;margin:0;font:10px ui-monospace,monospace;
  letter-spacing:.22em;color:var(--hpg-gold)}
.hpg-rail{position:absolute;left:6vw;right:6vw;bottom:22px;height:2px;background:#1a1f2a}
.hpg-rail-fill{height:100%;background:var(--hpg-gold);transform:scaleX(0);
  transform-origin:left;will-change:transform}
@media (prefers-reduced-motion:reduce){
  .hpg-track{transform:none !important}
  .hpg-rail-fill{transform:none !important}
}
`})]})}export{O as HorizontalPinGallery,O as default};
