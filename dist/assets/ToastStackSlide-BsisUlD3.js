import{u as S,r as e,j as s,m as g}from"./index-Dteotqf0.js";import{N}from"./motionPresets-DdDKkMP6.js";const b={success:[{title:"Deployment live",body:"Version 2.4.0 ist auf Production ausgerollt."},{title:"Zahlung erhalten",body:"Rechnung 2026-0418 wurde beglichen."},{title:"Export fertig",body:"1.284 Datensaetze als CSV bereitgestellt."}],error:[{title:"Build fehlgeschlagen",body:"Typecheck bricht in 3 Dateien ab."},{title:"Verbindung verloren",body:"Der Agent antwortet seit 40 Sekunden nicht."},{title:"Limit erreicht",body:"Kontingent fuer diesen Monat aufgebraucht."}],info:[{title:"Neue Version",body:"Ein Update steht zur Installation bereit."},{title:"Wartung geplant",body:"Sonntag 02:00 bis 04:00 eingeschraenkt erreichbar."},{title:"Bericht erstellt",body:"Der Wochenreport liegt im Posteingang."}]};function C({position:p="top-right",duration:h=4200,maxStack:x=4,variant:n="success",showProgress:m=!0,color:_=N.gold}){const y=S(),[u,i]=e.useState([]),a=e.useRef(0),l=e.useRef([]),c=g(Math.round(h),1500,1e4),f=g(Math.round(x),1,6),d=e.useCallback(t=>{i(r=>r.filter(o=>o.id!==t))},[]),v=e.useCallback(()=>{const t=b[n]??b.info,r=t[a.current%t.length],o=a.current;a.current+=1,i(j=>[...j,{id:o,...r}].slice(-f));const w=window.setTimeout(()=>d(o),c);l.current.push(w)},[n,f,c,d]);e.useEffect(()=>()=>{for(const t of l.current)window.clearTimeout(t);l.current=[]},[]),e.useEffect(()=>{i([])},[n,p,x]);const k={"--tss-color":_,"--tss-life":`${c}ms`,"--tss-enter":y?"0s":".46s"};return s.jsxs("div",{className:"nox-tss",style:k,children:[s.jsx("style",{children:z}),s.jsx("button",{type:"button",className:"nox-tss__trigger",onClick:v,children:"Meldung ausloesen"}),s.jsx("div",{className:`nox-tss__stack is-${p}`,role:"status","aria-live":"polite",children:u.map((t,r)=>{const o=u.length-1-r;return s.jsxs("article",{className:`nox-tss__toast is-${n}`,style:{"--tss-depth":o},children:[s.jsxs("div",{className:"nox-tss__body",children:[s.jsx("strong",{children:t.title}),s.jsx("span",{children:t.body})]}),s.jsx("button",{type:"button",className:"nox-tss__close",onClick:()=>d(t.id),"aria-label":`Meldung schliessen: ${t.title}`,children:"×"}),m&&s.jsx("span",{className:"nox-tss__progress","aria-hidden":"true"})]},t.id)})})]})}const z=String.raw`
.nox-tss { position:relative; display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,30px); font-family:var(--sans,system-ui,sans-serif); }
.nox-tss__trigger { padding:10px 22px; border-radius:999px; border:1px solid color-mix(in srgb, var(--tss-color) 45%, transparent); background:color-mix(in srgb, var(--tss-color) 12%, transparent); color:#f2ecd9; font:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:background .24s ease; }
.nox-tss__trigger:hover { background:color-mix(in srgb, var(--tss-color) 20%, transparent); }
.nox-tss__trigger:focus-visible { outline:2px solid var(--tss-color); outline-offset:3px; }
.nox-tss__stack { position:absolute; display:flex; flex-direction:column; gap:9px; width:min(302px,72%); perspective:800px; pointer-events:none; }
.nox-tss__stack.is-top-right { top:16px; right:16px; }
.nox-tss__stack.is-top-left { top:16px; left:16px; }
.nox-tss__stack.is-bottom-right { bottom:16px; right:16px; flex-direction:column-reverse; }
.nox-tss__toast { position:relative; display:flex; align-items:flex-start; gap:10px; overflow:hidden; padding:12px 13px; border-radius:12px; border:1px solid rgba(236,231,219,.1); background:rgba(18,17,19,.94); backdrop-filter:blur(9px); box-shadow:0 14px 30px rgb(0 0 0 / .45); pointer-events:auto; transform-origin:center; animation:nox-tss-in var(--tss-enter) cubic-bezier(.22,1.2,.36,1) both; }
/* Aeltere Meldungen weichen in die Tiefe, statt einfach nach unten zu rutschen. */
.nox-tss__toast { transform:translateZ(calc(var(--tss-depth) * -26px)) scale(calc(1 - var(--tss-depth) * .035)); opacity:calc(1 - var(--tss-depth) * .16); transition:transform var(--tss-enter) cubic-bezier(.22,1,.36,1), opacity var(--tss-enter) ease; }
.nox-tss__stack.is-top-left .nox-tss__toast { animation-name:nox-tss-in-left; }
@keyframes nox-tss-in { from { transform:translateX(120%); opacity:0; } }
@keyframes nox-tss-in-left { from { transform:translateX(-120%); opacity:0; } }
.nox-tss__body { display:grid; gap:3px; flex:1 1 auto; }
.nox-tss__body strong { color:#f2ece1; font-size:12.5px; font-weight:650; }
.nox-tss__body span { color:rgba(236,231,219,.5); font-size:11.5px; line-height:1.45; }
.nox-tss__toast.is-success { border-left:2px solid var(--tss-color); }
.nox-tss__toast.is-error { border-left:2px solid #d8564f; }
.nox-tss__toast.is-info { border-left:2px solid #5aa9d8; }
.nox-tss__close { flex:0 0 auto; width:20px; height:20px; padding:0; border:0; border-radius:6px; background:transparent; color:rgba(236,231,219,.4); font-size:15px; line-height:1; cursor:pointer; }
.nox-tss__close:hover { color:#f2ece1; }
.nox-tss__close:focus-visible { outline:2px solid var(--tss-color); outline-offset:1px; }
/* Der Balken laeuft genau so lange wie die Meldung lebt. */
.nox-tss__progress { position:absolute; left:0; right:0; bottom:0; height:2px; background:var(--tss-color); transform-origin:left; animation:nox-tss-progress var(--tss-life) linear forwards; }
@keyframes nox-tss-progress { from { transform:scaleX(1); } to { transform:scaleX(0); } }
@media (prefers-reduced-motion:reduce) {
  .nox-tss__toast { animation:none; transition:none; }
  .nox-tss__progress { animation-duration:var(--tss-life); }
}
`;export{C as ToastStackSlide,C as default};
