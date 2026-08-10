import{r as s,u as D,l as E,v as O,j as a,m as b}from"./index-Dteotqf0.js";import{N as v}from"./motionPresets-DdDKkMP6.js";function B({src:d,strips:R=12,tear:y=14,seed:g=20260810}){const l=s.useRef(null),u=s.useRef([]),o=s.useRef({dragging:!1,x:0,y:0,offsetX:0,offsetY:0});D();const n=b(Math.round(R),6,24),X=b(y,2,40),i=s.useMemo(()=>E(g),[g]),w=s.useMemo(()=>Array.from({length:n},()=>({dir:i()>.5?1:-1,mag:.4+i()*.6,delay:i()*.08})),[n,i]);O(()=>{const t=o.current,r=t.dragging?t.x-t.offsetX:0,e=t.dragging?t.y-t.offsetY:0;u.current.forEach((p,$)=>{if(!p)return;const m=w[$],M=t.dragging?m.dir*m.mag*X:0,c=p.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/),x=c?parseFloat(c[1]):0,h=c?parseFloat(c[2]):0,N=r+M,k=e,C=x+(N-x)*.22,A=h+(k-h)*.22;p.style.transform=`translate3d(${C}px, ${A}px, 0)`})},!0);const P=t=>{const r=l.current;if(!r)return;const e=r.getBoundingClientRect();o.current.dragging=!0,o.current.offsetX=t.clientX-e.left,o.current.offsetY=t.clientY-e.top,r.setPointerCapture(t.pointerId)},Y=t=>{if(!o.current.dragging)return;const r=l.current;if(!r)return;const e=r.getBoundingClientRect();o.current.x=t.clientX-e.left,o.current.y=t.clientY-e.top},f=()=>{o.current.dragging=!1},j={"--tp-gold":v.gold};return a.jsxs("div",{ref:l,className:"tp-root",style:j,onPointerDown:P,onPointerMove:Y,onPointerUp:f,onPointerCancel:f,children:[a.jsx("div",{className:"tp-frame",children:Array.from({length:n},(t,r)=>a.jsx("div",{ref:e=>{u.current[r]=e},className:"tp-strip",style:{backgroundImage:d?`url("${d}")`:void 0,backgroundPosition:`50% ${r/n*100}%`,backgroundSize:"cover",height:`${100/n}%`,...d?{}:{background:`linear-gradient(180deg, ${v.gold}, #0a0c10 ${r/n*100}%)`}}},r))}),a.jsx("p",{className:"tp-hint",children:"DRAG TO TEAR"}),a.jsx("style",{children:`
.tp-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);cursor:grab;touch-action:none}
.tp-root:active{cursor:grabbing}
.tp-frame{position:relative;width:min(62%,420px);aspect-ratio:3/4;overflow:hidden;
  border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.5);
  border:1px solid color-mix(in srgb,var(--tp-gold) 18%,transparent)}
.tp-strip{position:absolute;left:0;top:0;width:100%;will-change:transform;
  border-bottom:1px solid rgba(0,0,0,.35)}
.tp-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .tp-strip{transition:none}
  .tp-hint{display:none}
}
`})]})}export{B as TearingPhotoDrag,B as default};
