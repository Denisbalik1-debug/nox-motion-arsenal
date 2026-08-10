import{r as f,u as b,m as w,j as s}from"./index-Dteotqf0.js";import{N as g}from"./motionPresets-DdDKkMP6.js";function h({steps:n=["CONFIG","SIGNAL","VERIFY"],panels:t,seed:m=20260810}){const[e,i]=f.useState(0),l=b(),a=w(n.length,2,8),c=o=>o<e?"done":o===e?"active":"todo",d=a>1?e/(a-1):1,p={"--sfw-gold":g.gold,"--sfw-progress":`${d*100}%`};return s.jsxs("div",{className:"sfw-root",style:p,children:[s.jsx("ol",{className:"sfw-track",children:n.slice(0,a).map((o,r)=>s.jsxs("li",{className:"sfw-step","data-state":c(r),style:{transitionDelay:l?"0s":`${r*.04}s`},children:[s.jsx("span",{className:"sfw-dot",children:c(r)==="done"?"✓":r+1}),s.jsx("span",{className:"sfw-label",children:o})]},r))}),s.jsx("div",{className:"sfw-line",children:s.jsx("span",{className:"sfw-fill"})}),s.jsx("div",{className:"sfw-panel",children:(t==null?void 0:t[e])??s.jsxs("p",{className:"sfw-placeholder",children:["STEP ",String(e+1).padStart(2,"0")," / ",String(a).padStart(2,"0")]})},e),s.jsxs("div",{className:"sfw-nav",children:[s.jsx("button",{type:"button",className:"sfw-btn",disabled:e===0,onClick:()=>i(o=>Math.max(0,o-1)),children:"← BACK"}),s.jsx("button",{type:"button",className:"sfw-btn sfw-btn--primary",disabled:e>=a-1,onClick:()=>i(o=>Math.min(a-1,o+1)),children:"NEXT →"})]}),s.jsx("style",{children:`
.sfw-root{position:absolute;inset:0;display:flex;flex-direction:column;gap:18px;
  justify-content:center;padding:6%;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sfw-track{display:flex;justify-content:space-between;list-style:none;margin:0;
  padding:0 6px;position:relative;z-index:1}
.sfw-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;
  text-align:center;opacity:.55;transition:opacity .3s}
.sfw-step[data-state=active],.sfw-step[data-state=done]{opacity:1}
.sfw-dot{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;
  font:700 13px/1 ui-monospace,monospace;color:#8a8578;
  background:#0b0e15;border:1px solid rgba(255,255,255,.14);
  transition:background .35s cubic-bezier(.2,.9,.3,1.2),border-color .35s,color .35s}
.sfw-step[data-state=active] .sfw-dot{color:#0a0c10;background:var(--sfw-gold);
  border-color:var(--sfw-gold);box-shadow:0 0 20px color-mix(in srgb,var(--sfw-gold) 45%,transparent)}
.sfw-step[data-state=done] .sfw-dot{color:var(--sfw-gold);border-color:var(--sfw-gold)}
.sfw-label{font:600 10px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#cfccc2}
.sfw-line{position:relative;height:2px;margin:0 34px;background:rgba(255,255,255,.08);
  border-radius:2px;overflow:hidden}
.sfw-fill{position:absolute;inset:0;transform-origin:left;
  transform:scaleX(calc(var(--sfw-progress) / 100));
  background:linear-gradient(90deg,var(--sfw-gold),color-mix(in srgb,var(--sfw-gold) 55%,#fff));
  transition:transform .5s cubic-bezier(.2,.9,.3,1.12);width:100%}
.sfw-panel{min-height:120px;display:grid;place-items:center;border:1px dashed
  color-mix(in srgb,var(--sfw-gold) 22%,transparent);border-radius:12px;
  background:rgba(255,255,255,.02);padding:18px;
  animation:sfw-panel .38s cubic-bezier(.2,.9,.3,1.1)}
.sfw-placeholder{color:#8a8578;font:600 13px/1.6 ui-monospace,monospace;letter-spacing:.14em}
.sfw-nav{display:flex;justify-content:space-between}
.sfw-btn{background:none;border:1px solid rgba(255,255,255,.16);color:#cfccc2;
  font:600 11px/1 ui-monospace,monospace;letter-spacing:.12em;padding:11px 18px;
  border-radius:8px;cursor:pointer;transition:border-color .25s,color .25s}
.sfw-btn:hover:not(:disabled){border-color:var(--sfw-gold);color:var(--sfw-gold)}
.sfw-btn:disabled{opacity:.35;cursor:default}
.sfw-btn--primary{background:var(--sfw-gold);border-color:var(--sfw-gold);color:#0a0c10}
.sfw-btn--primary:hover:not(:disabled){color:#0a0c10;filter:brightness(1.1)}
@keyframes sfw-panel{from{opacity:0;transform:translateX(14px)}
  to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .sfw-panel{animation:none}
  .sfw-fill{transition:none}
}
`})]})}export{h as StepFlowWizard,h as default};
