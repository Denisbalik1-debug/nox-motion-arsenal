import{r,u as M,l as O,p as j,v as y,m as w,j as o}from"./index-Dteotqf0.js";import{N}from"./motionPresets-DdDKkMP6.js";function P({title:d="NOX MOTION",subtitle:u="SCROLL DRIVEN CHOREOGRAPHY",curve:s="s",seed:l=20260810}){const i=r.useRef(null),p=r.useRef(null),m=M(),n=r.useMemo(()=>O(l),[l]),c=r.useMemo(()=>{const t=18+n()*14,e=42+n()*16;return s==="loop"?`M -5,${50+t} C 25,${e} 25,${100-e} 50,${50+t} C 75,${e} 75,${100-e} 105,${50-t}`:s==="wave"?`M -5,${50-t} C 25,${100-e} 50,${e} 75,${100-e} 105,${50-t}`:`M -5,${50+t} C 25,${50-t*1.6} 75,${50+t*1.6} 105,${50-t}`},[s,n]),g=r.useMemo(()=>c,[c]),x=j(i);y(t=>{if(m)return;const e=x.current,h=p.current;if(!h)return;const a=document.querySelector("#pfh-path");if(!a)return;const R=a.getTotalLength(),f=a.getPointAtLength(w(e,0,1)*R),v=s==="loop"?Math.sin(e*Math.PI*2)*14:Math.sin(e*Math.PI)*10;h.style.transform=`translate3d(${f.x}%, ${f.y}%, 0) rotate(${v}deg)`},!0);const $={"--pfh-gold":N.gold};return o.jsxs("div",{ref:i,className:"pfh-root",style:$,children:[o.jsx("svg",{className:"pfh-svg",viewBox:"0 0 100 100",preserveAspectRatio:"none","aria-hidden":"true",children:o.jsx("path",{id:"pfh-path",d:g,fill:"none",stroke:"var(--pfh-gold)",strokeOpacity:"0.28",strokeWidth:"0.4",strokeDasharray:"1.6 1.2"})}),o.jsxs("div",{ref:p,className:"pfh-hero",children:[o.jsx("h1",{children:d}),o.jsx("p",{children:u})]}),o.jsx("style",{children:`
.pfh-root{position:absolute;inset:0;overflow:hidden;background:
  radial-gradient(110% 90% at 50% 20%,#0d1019,#06080c)}
.pfh-svg{position:absolute;inset:0;width:100%;height:100%}
.pfh-hero{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;
  will-change:transform;color:var(--pfh-gold)}
.pfh-hero h1{margin:0;font:900 clamp(38px,8vw,88px)/1 system-ui;letter-spacing:-.04em;
  text-shadow:0 0 34px color-mix(in srgb,var(--pfh-gold) 38%,transparent)}
.pfh-hero p{margin:0;font:11px ui-monospace,monospace;letter-spacing:.34em;color:#b9b2a2}
@media (prefers-reduced-motion:reduce){
  .pfh-hero{transform:translate(-50%,-50%) !important}
}
`})]})}export{P as PathFollowHeroScroll,P as default};
