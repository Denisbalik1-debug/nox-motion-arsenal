import{m as i,j as s}from"./index-Dteotqf0.js";import{N as c}from"./motionPresets-DdDKkMP6.js";const x=[{label:"Schild",path:"M32 6 L54 15 V32 C54 44 44 54 32 58 C20 54 10 44 10 32 V15 Z"},{label:"Blitz",path:"M36 5 L16 35 H30 L26 59 L48 27 H34 Z"},{label:"Kompass",path:"M32 5 A27 27 0 1 1 31.9 5 M42 22 L36 36 L22 42 L28 28 Z"},{label:"Ebenen",path:"M32 8 L56 21 L32 34 L8 21 Z M8 32 L32 45 L56 32 M8 43 L32 56 L56 43"},{label:"Ziel",path:"M32 6 A26 26 0 1 1 31.9 6 M32 17 A15 15 0 1 1 31.9 17 M32 27 A5 5 0 1 1 31.9 27"},{label:"Puls",path:"M6 32 H20 L26 16 L34 48 L40 32 H58"}];function _({speed:a=1,glow:r=.5,stroke:t=2,color:l=c.gold,showLabels:d=!0}){const o=i(r,0,1),n={"--isd-color":l,"--isd-dur":`${(.85/i(a,.1,3)).toFixed(3)}s`,"--isd-stroke":i(t,1,4),"--isd-glow":`${(o*8).toFixed(1)}px`,"--isd-glow-alpha":o.toFixed(2)};return s.jsxs("div",{className:"nox-isd",style:n,children:[s.jsx("style",{children:h}),s.jsx("ul",{className:"nox-isd__grid",children:x.map((e,p)=>s.jsx("li",{className:"nox-isd__cell",children:s.jsxs("button",{type:"button",className:"nox-isd__item",style:{"--isd-delay":`${p%3*.05}s`},"aria-label":e.label,children:[s.jsx("svg",{viewBox:"0 0 64 64",className:"nox-isd__svg","aria-hidden":"true",children:s.jsx("path",{d:e.path,pathLength:1})}),d&&s.jsx("span",{className:"nox-isd__label",children:e.label})]})},e.label))})]})}const h=String.raw`
.nox-isd { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-isd__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; width:min(400px,100%); margin:0; padding:0; list-style:none; }
.nox-isd__cell { display:block; }
.nox-isd__item { display:grid; place-items:center; gap:7px; width:100%; padding:15px 8px; border:1px solid rgba(236,231,219,.08); border-radius:13px; background:rgba(255,255,255,.02); color:rgba(236,231,219,.4); font:inherit; cursor:pointer; transition:border-color .3s ease, background .3s ease, color .3s ease; }
.nox-isd__item:hover, .nox-isd__item:focus-visible { border-color:color-mix(in srgb, var(--isd-color) 42%, transparent); background:color-mix(in srgb, var(--isd-color) 6%, transparent); color:#f0ebe1; }
.nox-isd__item:focus-visible { outline:2px solid var(--isd-color); outline-offset:2px; }
.nox-isd__svg { width:38px; height:38px; overflow:visible; }
/* pathLength=1 macht den Strich zum Anteil — unabhaengig von der echten Laenge. */
.nox-isd__svg path { fill:none; stroke:var(--isd-color); stroke-width:calc(var(--isd-stroke) * 1px); stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset var(--isd-dur) cubic-bezier(.22,1,.36,1) var(--isd-delay); }
.nox-isd__item:hover .nox-isd__svg path,
.nox-isd__item:focus-visible .nox-isd__svg path { stroke-dashoffset:0; filter:drop-shadow(0 0 var(--isd-glow) color-mix(in srgb, var(--isd-color) calc(var(--isd-glow-alpha) * 100%), transparent)); }
.nox-isd__label { font-size:10px; letter-spacing:.16em; text-transform:uppercase; }
@media (prefers-reduced-motion:reduce) {
  .nox-isd__svg path { transition:none; stroke-dashoffset:0; }
  .nox-isd__item { transition:none; }
}
`;export{_ as IconStrokeDrawHover,_ as default};
