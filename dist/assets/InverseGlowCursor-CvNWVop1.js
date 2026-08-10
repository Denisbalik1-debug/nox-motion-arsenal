import{r,u as M,t as O,v as C,x as v,j as i,m as d}from"./index-Dteotqf0.js";import{N as L}from"./motionPresets-DdDKkMP6.js";function S({size:R=96,ringSize:b=150,lag:w=.14,blend:y="difference",color:j=L.gold,showRing:z=!0}){const c=r.useRef(null),f=r.useRef(null),g=r.useRef(null),p=M(),a=d(R,40,160),l=d(b,60,240),x=d(w,.02,.9),$=O(c),u=r.useRef({w:1,h:1});r.useEffect(()=>{const n=c.current;if(!n)return;const t=()=>{const o=n.getBoundingClientRect();u.current={w:Math.max(1,o.width),h:Math.max(1,o.height)}};t();const s=new ResizeObserver(t);return s.observe(n),()=>s.disconnect()},[]);const N=r.useRef({x:-400,y:-400});C(n=>{const t=f.current,s=g.current;if(!t||!s)return;const o=$.current,m=o.x*u.current.w,h=o.y*u.current.h,e=N.current;e.x=v(e.x,m,p?1:x,.016),e.y=v(e.y,h,p?1:x,.016),t.style.transform=`translate3d(${m-a/2}px, ${h-a/2}px, 0)`,s.style.transform=`translate3d(${e.x-l/2}px, ${e.y-l/2}px, 0)`},!0);const E={"--igc-size":`${a}px`,"--igc-ring":`${l}px`,"--igc-color":j};return i.jsxs("div",{ref:c,className:"igc-root",style:E,"aria-hidden":"true",children:[i.jsx("div",{ref:f,className:"igc-spot",style:{mixBlendMode:y}}),z&&i.jsx("div",{ref:g,className:"igc-ring"}),i.jsx("style",{children:`
.igc-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;isolation:isolate}
.igc-spot{position:absolute;left:0;top:0;width:var(--igc-size);height:var(--igc-size);
  border-radius:50%;background:#fff;box-shadow:0 0 0 9999px #fff;opacity:.92;
  will-change:transform}
.igc-ring{position:absolute;left:0;top:0;width:var(--igc-ring);height:var(--igc-ring);
  border-radius:50%;border:1.5px solid color-mix(in srgb, var(--igc-color) 82%, transparent);
  box-shadow:0 0 18px color-mix(in srgb, var(--igc-color) 38%, transparent),
    inset 0 0 14px color-mix(in srgb, var(--igc-color) 22%, transparent);
  will-change:transform}
@media (prefers-reduced-motion:reduce){
  .igc-ring{transition:transform .3s linear}
}
@media (pointer:coarse){
  .igc-root{display:none}
}
`})]})}export{S as InverseGlowCursor,S as default};
