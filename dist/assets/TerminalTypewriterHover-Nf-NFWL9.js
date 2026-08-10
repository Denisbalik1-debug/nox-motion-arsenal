import{j as t,m as w}from"./index-Dteotqf0.js";import{N as h}from"./motionPresets-DdDKkMP6.js";function u({lines:e="scan --target arsenal --deep|resolving 285 effects …|contract check: 0 violations|deploy ready",speed:a=1,cursor:r=!0,color:s=h.gold,textColor:n="#d8d2c6",prompt:i="›",alwaysOn:p=!1}){const l=e.split("|").map(o=>o.trim()).filter(Boolean),d=w(a,.1,3),x={"--ttw-color":s,"--ttw-text":n};return t.jsxs("div",{className:`nox-ttw${p?" is-always":""}`,style:x,children:[t.jsx("style",{children:_}),t.jsxs("div",{className:"nox-ttw__frame",children:[t.jsxs("div",{className:"nox-ttw__bar","aria-hidden":"true",children:[t.jsx("span",{}),t.jsx("span",{}),t.jsx("span",{})]}),t.jsx("ul",{className:"nox-ttw__lines",children:l.map((o,c)=>t.jsxs("li",{className:"nox-ttw__row",tabIndex:0,children:[t.jsx("span",{className:"nox-ttw__prompt","aria-hidden":"true",children:i}),t.jsx("span",{className:`nox-ttw__type${r?" has-cursor":""}`,style:{"--ttw-chars":o.length,"--ttw-dur":`${(o.length*.045/d).toFixed(3)}s`},children:o})]},`${o}-${c}`))})]})]})}const _=String.raw`
.nox-ttw { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--mono,monospace); }
.nox-ttw__frame { width:min(470px,100%); overflow:hidden; border-radius:11px; border:1px solid rgba(236,231,219,.1); background:rgba(10,10,12,.92); }
.nox-ttw__bar { display:flex; gap:6px; padding:10px 13px; border-bottom:1px solid rgba(236,231,219,.07); }
.nox-ttw__bar span { width:9px; height:9px; border-radius:50%; background:rgba(236,231,219,.13); }
.nox-ttw__bar span:first-child { background:color-mix(in srgb, var(--ttw-color) 55%, transparent); }
.nox-ttw__lines { display:grid; gap:7px; margin:0; padding:15px 14px 17px; list-style:none; }
.nox-ttw__row { display:flex; align-items:baseline; gap:8px; font-size:12.5px; line-height:1.5; }
.nox-ttw__row:focus-visible { outline:2px solid var(--ttw-color); outline-offset:3px; border-radius:4px; }
.nox-ttw__prompt { flex:0 0 auto; color:var(--ttw-color); }
/* Ohne Hover steht die Zeile vollstaendig da — der Text ist nie versteckt. */
.nox-ttw__type { position:relative; display:inline-block; overflow:hidden; white-space:nowrap; color:var(--ttw-text); }
.nox-ttw__row:hover .nox-ttw__type,
.nox-ttw__row:focus-visible .nox-ttw__type,
.nox-ttw.is-always .nox-ttw__type { width:calc(var(--ttw-chars) * 1ch); animation:nox-ttw-type var(--ttw-dur) steps(var(--ttw-chars),end) 1 both; }
@keyframes nox-ttw-type { from { width:0; } to { width:calc(var(--ttw-chars) * 1ch); } }
.nox-ttw__type.has-cursor::after { content:''; position:absolute; right:-2px; top:.14em; width:7px; height:1em; background:var(--ttw-color); opacity:0; }
.nox-ttw__row:hover .has-cursor::after,
.nox-ttw__row:focus-visible .has-cursor::after,
.nox-ttw.is-always .has-cursor::after { animation:nox-ttw-blink .9s steps(1,end) infinite; }
@keyframes nox-ttw-blink { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
@media (prefers-reduced-motion:reduce) {
  .nox-ttw__type { width:auto !important; animation:none !important; }
  .has-cursor::after { animation:none !important; opacity:1; }
}
`;export{u as TerminalTypewriterHover,u as default};
