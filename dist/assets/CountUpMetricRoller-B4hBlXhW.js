import{u as R,r as a,j as e,m as p}from"./index-Dteotqf0.js";import{N as S}from"./motionPresets-DdDKkMP6.js";function k(s,c){const t=Math.sin(s*12.9898+c*78.233)*43758.5453;return t-Math.floor(t)}function C({target:s=1e5,variant:c="fade",duration:t=1400,decimals:i=0,prefix:m="",suffix:l="+",label:_="Aufrufe im Quartal",color:b=S.gold,salt:d=3}){const h=R(),g=a.useRef(null),[N,f]=a.useState(!1),o=p(Math.round(i),0,2),x=p(s,0,9999999),w=p(Math.round(t),300,3e3),v=a.useMemo(()=>x.toFixed(o),[x,o]);a.useEffect(()=>{f(!1)},[s,c,t,i,d]),a.useEffect(()=>{if(h){f(!0);return}const r=g.current;if(!r)return;const n=new IntersectionObserver(u=>{for(const y of u)y.isIntersecting&&(f(!0),n.disconnect())},{threshold:.4});return n.observe(r),()=>n.disconnect()},[h,s,c,t,i,d]);const M={"--cmr-color":b,"--cmr-dur":`${w}ms`,"--cmr-target":Math.round(x*10**o)},z=v.split("");return e.jsxs("div",{ref:g,className:`nox-cmr${N?" is-active":""}`,style:M,children:[e.jsx("style",{children:E}),e.jsxs("div",{className:"nox-cmr__value",children:[m&&e.jsx("span",{className:"nox-cmr__affix",children:m}),c==="fade"?e.jsx("span",{className:"nox-cmr__counter","aria-hidden":"true","data-decimals":o}):e.jsx("span",{className:"nox-cmr__slots","aria-hidden":"true",children:z.map((r,n)=>{if(r<"0"||r>"9")return e.jsx("span",{className:"nox-cmr__sep",children:r},n);const u=k(n,d)*.22;return e.jsx("span",{className:"nox-cmr__slot",children:e.jsx("span",{className:"nox-cmr__reel",style:{"--cmr-digit":Number(r),"--cmr-delay":`${u.toFixed(3)}s`},children:Array.from({length:10},(y,j)=>e.jsx("span",{children:j},j))})},n)})}),e.jsxs("span",{className:"nox-cmr__sr",children:[m,v,l]}),l&&e.jsx("span",{className:"nox-cmr__affix",children:l})]}),_&&e.jsx("p",{className:"nox-cmr__label",children:_})]})}const E=String.raw`
@property --cmr-n { syntax: '<integer>'; initial-value: 0; inherits: true; }
.nox-cmr { display:grid; place-content:center; justify-items:center; gap:10px; width:100%; height:100%; padding:clamp(16px,4vw,40px); font-family:var(--sans,system-ui,sans-serif); text-align:center; }
.nox-cmr__value { display:flex; align-items:baseline; gap:.06em; font-size:clamp(2.2rem,7vw,4.6rem); font-weight:780; letter-spacing:-.045em; line-height:1; color:var(--cmr-color); font-variant-numeric:tabular-nums; }
.nox-cmr__affix { opacity:.62; font-size:.62em; }
.nox-cmr__sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
/* fade: der Zaehler ist eine animierte @property, counter() rendert sie. */
.nox-cmr__counter::after { counter-reset: cmr var(--cmr-n); content: counter(cmr); }
.nox-cmr.is-active .nox-cmr__counter { animation: nox-cmr-count var(--cmr-dur) cubic-bezier(.22,1,.36,1) forwards; }
@keyframes nox-cmr-count { from { --cmr-n: 0; } to { --cmr-n: var(--cmr-target); } }
/* slot: jede Ziffer ist eine Spalte, die auf ihre Zielziffer hochrollt. */
.nox-cmr__slots { display:inline-flex; }
.nox-cmr__slot { display:inline-block; overflow:hidden; height:1em; }
.nox-cmr__reel { display:flex; flex-direction:column; transform:translateY(0); }
.nox-cmr__reel > span { display:block; height:1em; line-height:1; }
.nox-cmr.is-active .nox-cmr__reel { transition:transform var(--cmr-dur) cubic-bezier(.22,1,.36,1) var(--cmr-delay); transform:translateY(calc(var(--cmr-digit) * -1em)); }
.nox-cmr__sep { display:inline-block; }
.nox-cmr__label { margin:0; color:rgba(236,231,219,.4); font-size:11px; letter-spacing:.24em; text-transform:uppercase; }
@media (prefers-reduced-motion:reduce) {
  .nox-cmr__counter { animation:none !important; }
  .nox-cmr__counter::after { counter-reset: cmr var(--cmr-target); }
  .nox-cmr__reel { transition:none !important; transform:translateY(calc(var(--cmr-digit) * -1em)); }
}
`;export{C as CountUpMetricRoller,C as default};
