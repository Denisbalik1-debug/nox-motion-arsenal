import{u as n,j as r,m as t}from"./index-Dteotqf0.js";import{N as l}from"./motionPresets-DdDKkMP6.js";function c({open:e=!1,title:a="CLASSIFIED",children:o,peelSize:i=44}){n();const s=t(i,24,80);if(!e)return null;const p={"--prm-gold":l.gold,"--prm-peel":`${s}px`};return e?r.jsxs("div",{className:"prm-root",style:p,role:"dialog","aria-modal":"true","aria-label":a,children:[r.jsx("div",{className:"prm-backdrop"}),r.jsxs("div",{className:"prm-card",children:[r.jsx("div",{className:"prm-curl",title:"Close"}),r.jsxs("div",{className:"prm-inner",children:[r.jsx("h3",{className:"prm-title",children:a}),r.jsx("div",{className:"prm-body",children:o??r.jsx("p",{children:"Peeled open."})})]})]}),r.jsx("style",{children:`
.prm-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;z-index:50}
.prm-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.6);
  backdrop-filter:blur(4px);animation:prm-fade .3s ease-out}
.prm-card{position:relative;width:min(88%,420px);border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,#0c0f17,#080a10);
  border:1px solid color-mix(in srgb,var(--prm-gold) 28%,transparent);
  box-shadow:0 26px 80px rgba(0,0,0,.6);animation:prm-in .45s cubic-bezier(.2,.9,.3,1.12)}
.prm-curl{position:absolute;top:0;right:0;width:var(--prm-peel);height:var(--prm-peel);
  background:linear-gradient(315deg,var(--prm-gold),#8a5f1d 55%,transparent 56%);
  clip-path:polygon(0 0,100% 0,0 100%);
  cursor:pointer;z-index:2;transition:filter .2s}
.prm-curl:hover{filter:brightness(1.2)}
.prm-inner{padding:34px 26px 26px}
.prm-title{color:var(--prm-gold);font:800 15px/1.2 ui-monospace,monospace;
  letter-spacing:.16em;margin:0 0 14px;text-shadow:0 0 18px color-mix(in srgb,var(--prm-gold) 40%,transparent)}
.prm-body{color:#cfccc2;font:400 14px/1.7 ui-monospace,monospace}
@keyframes prm-in{from{opacity:0;transform:scale(.92) rotate(-1deg)}
  to{opacity:1;transform:none}}
@keyframes prm-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .prm-card,.prm-backdrop{animation:none}
}
`})]}):null}export{c as PeelRevealModal,c as default};
