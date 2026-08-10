import{u as w,r as o,m as u,j as s}from"./index-Dteotqf0.js";import{N as k}from"./motionPresets-DdDKkMP6.js";function d(n,c){const i=Math.sin(n*12.9898+c*78.233)*43758.5453;return i-Math.floor(i)}function S({text:n="APPROVED",buttonLabel:c="Antrag absenden",intensity:i=.6,color:g=k.gold,rotation:b=-8,delay:m=620,seed:a=5}){const _=w(),[e,l]=o.useState("idle"),p=o.useRef(void 0),x=Math.round(u(i,0,1)*12),f=o.useMemo(()=>Array.from({length:x},(r,t)=>({angle:t/Math.max(x,1)*360+d(t,a)*24,distance:52+d(t,a+17)*46,delay:d(t,a+41)*.12,size:3+d(t,a+63)*3})),[x,a]);o.useEffect(()=>()=>window.clearTimeout(p.current),[]);const h=o.useCallback(()=>{e==="idle"&&(l("pending"),p.current=window.setTimeout(()=>l("done"),u(m,0,3e3)))},[e,m]),v=o.useCallback(()=>{window.clearTimeout(p.current),l("idle")},[]),y={"--sss-color":g,"--sss-rot":`${u(b,-30,30)}deg`,"--sss-dur":_?"0s":".62s"};return s.jsxs("div",{className:`nox-sss is-${e}`,style:y,children:[s.jsx("style",{children:j}),s.jsxs("div",{className:"nox-sss__sheet",children:[s.jsxs("div",{className:"nox-sss__rows","aria-hidden":"true",children:[s.jsx("span",{style:{width:"68%"}}),s.jsx("span",{style:{width:"92%"}}),s.jsx("span",{style:{width:"54%"}})]}),e==="done"&&s.jsxs("div",{className:"nox-sss__stamp-wrap",children:[s.jsx("div",{className:"nox-sss__stamp",children:n}),f.map((r,t)=>s.jsx("span",{className:"nox-sss__spark","aria-hidden":"true",style:{"--sss-angle":`${r.angle.toFixed(1)}deg`,"--sss-dist":`${r.distance.toFixed(1)}px`,"--sss-delay":`${r.delay.toFixed(3)}s`,"--sss-size":`${r.size.toFixed(1)}px`}},t))]})]}),s.jsxs("button",{type:"button",className:"nox-sss__button",onClick:e==="done"?v:h,disabled:e==="pending",children:[e==="idle"&&c,e==="pending"&&"Wird geprueft …",e==="done"&&"Zuruecksetzen"]}),s.jsx("p",{className:"nox-sss__status","aria-live":"polite",children:e==="done"?`Bestaetigt: ${n}`:e==="pending"?"Wird geprueft":""})]})}const j=String.raw`
.nox-sss { display:grid; place-content:center; justify-items:center; gap:15px; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-sss__sheet { position:relative; display:grid; align-content:center; width:min(268px,80vw); aspect-ratio:1.42; padding:20px; border-radius:12px; border:1px solid rgba(236,231,219,.09); background:rgba(255,255,255,.024); }
.nox-sss__rows { display:grid; gap:9px; }
.nox-sss__rows span { display:block; height:8px; border-radius:999px; background:rgba(236,231,219,.09); }
.nox-sss__stamp-wrap { position:absolute; inset:0; display:grid; place-items:center; }
/* Overshoot im Easing gibt dem Aufsetzen das Gewicht. */
.nox-sss__stamp { padding:9px 18px; border:3px solid var(--sss-color); border-radius:7px; color:var(--sss-color); font-size:19px; font-weight:820; letter-spacing:.14em; mix-blend-mode:screen; transform:rotate(var(--sss-rot)); animation:nox-sss-stamp var(--sss-dur) cubic-bezier(.3,1.7,.5,1) both; }
@keyframes nox-sss-stamp { from { transform:rotate(var(--sss-rot)) scale(2.2); opacity:0; } to { transform:rotate(var(--sss-rot)) scale(1); opacity:1; } }
.nox-sss__spark { position:absolute; width:var(--sss-size); height:var(--sss-size); border-radius:50%; background:var(--sss-color); opacity:0; animation:nox-sss-spark .58s ease-out var(--sss-delay) both; }
@keyframes nox-sss-spark {
  0% { opacity:0; transform:rotate(var(--sss-angle)) translateX(0) scale(.4); }
  22% { opacity:1; }
  100% { opacity:0; transform:rotate(var(--sss-angle)) translateX(var(--sss-dist)) scale(.8); }
}
.nox-sss__button { padding:11px 24px; border-radius:999px; border:1px solid color-mix(in srgb, var(--sss-color) 45%, transparent); background:color-mix(in srgb, var(--sss-color) 13%, transparent); color:#f2ecd9; font:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:background .24s ease; }
.nox-sss__button:hover:not(:disabled) { background:color-mix(in srgb, var(--sss-color) 22%, transparent); }
.nox-sss__button:disabled { opacity:.5; cursor:default; }
.nox-sss__button:focus-visible { outline:2px solid var(--sss-color); outline-offset:3px; }
.nox-sss__status { min-height:1em; margin:0; color:rgba(236,231,219,.36); font-size:11px; letter-spacing:.1em; }
@media (prefers-reduced-motion:reduce) {
  .nox-sss__stamp { animation:none; }
  .nox-sss__spark { display:none; }
}
`;export{S as SuccessStampSubmit,S as default};
