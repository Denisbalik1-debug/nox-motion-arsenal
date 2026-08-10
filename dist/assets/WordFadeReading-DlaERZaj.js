import{r as t,u as T,p as y,v as b,j as a,m as v}from"./index-Dteotqf0.js";import{N as M}from"./motionPresets-DdDKkMP6.js";function I({text:n="MOTION IS THE LANGUAGE OF ATTENTION. EVERY FRAME CARRIES INTENT, EVERY TRANSITION TELLS THE NEXT CHAPTER.",focusWidth:w=5,seed:i=20260810}){const d=t.useRef(null),l=t.useRef([]),E=T(),o=t.useMemo(()=>n.split(/\s+/).filter(Boolean).slice(0,120),[n]),f=v(Math.round(w),3,9),R=t.useMemo(()=>{const s=1/Math.max(1,o.length);return o.map((e,r)=>s*(r+(i+r*7)%50/50))},[o,i]),g=y(d);b(s=>{if(E)return;const r=g.current*1.05;l.current.forEach((c,h)=>{if(!c)return;const x=R[h],p=Math.abs(x-r),u=p<f*.02,m=p<f*.045;c.style.opacity=u?"1":m?"0.55":"0.14",c.style.color=u?"var(--wfr-gold)":m?"#cfc9bd":"#6a6f7a"})},!0);const N={"--wfr-gold":M.gold};return a.jsxs("div",{ref:d,className:"wfr-root",style:N,children:[a.jsx("div",{className:"wfr-body",children:o.map((s,e)=>a.jsxs("span",{ref:r=>{l.current[e]=r},className:"wfr-word",children:[s," "]},e))}),a.jsx("style",{children:`
.wfr-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  padding:10% 12%;background:radial-gradient(120% 90% at 50% 30%,#0c0f17,#06080c)}
.wfr-body{max-width:820px;font:400 clamp(17px,2.2vw,26px)/1.75 Georgia,serif;color:#6a6f7a;
  text-align:left;letter-spacing:.01em}
.wfr-word{transition:opacity .12s linear,color .12s linear;will-change:opacity,color}
@media (prefers-reduced-motion:reduce){
  .wfr-word{opacity:1 !important;color:#cfc9bd !important}
}
`})]})}export{I as WordFadeReading,I as default};
