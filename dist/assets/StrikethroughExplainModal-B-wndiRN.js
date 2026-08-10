import{r as t,u as x,j as e,m as u}from"./index-Dteotqf0.js";import{N as f}from"./motionPresets-DdDKkMP6.js";function v({open:r=!1,wrongAnswer:n="42",explanation:l="The answer is actually 43 — off by one.",duration:m=.7,seed:g=20260810}){const[a,o]=t.useState("answer"),s=x(),i=u(m,.3,1.2);if(t.useEffect(()=>{if(!r)return;o("answer");const d=setTimeout(()=>o("strike"),s?0:600),p=setTimeout(()=>o("reveal"),s?0:i*1e3+950);return()=>{clearTimeout(d),clearTimeout(p)}},[r,s,i]),!r)return null;const c={"--sem-gold":f.gold,"--sem-duration":`${i}s`};return e.jsxs("div",{className:"sem-root",style:c,role:"dialog","aria-modal":"true","aria-label":"Explanation",children:[e.jsx("div",{className:"sem-backdrop"}),e.jsxs("div",{className:"sem-card",children:[e.jsx("p",{className:"sem-kicker",children:"EXPLAINED"}),e.jsxs("div",{className:"sem-answer","aria-live":"polite",children:[e.jsx("span",{className:"sem-answer-text",children:n}),e.jsx("span",{className:"sem-strike",style:{transform:a==="answer"?"scaleX(0)":"scaleX(1) skewX(-8deg)",transition:s?"none":"transform var(--sem-duration) cubic-bezier(.2,.9,.3,1.1)"}})]}),e.jsx("div",{className:"sem-reveal",style:{maxHeight:a==="reveal"?"160px":"0",opacity:a==="reveal"?1:0,transition:s?"none":"max-height .5s cubic-bezier(.2,.9,.3,1.1), opacity .4s"},"aria-hidden":a!=="reveal",children:e.jsx("p",{className:"sem-explanation",children:l})})]}),e.jsx("style",{children:`
.sem-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;z-index:50}
.sem-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.6);backdrop-filter:blur(4px);
  animation:sem-fade .3s ease-out}
.sem-card{position:relative;width:min(88%,400px);padding:28px 24px;border-radius:14px;
  background:linear-gradient(180deg,#0c0f17,#080a10);
  border:1px solid color-mix(in srgb,var(--sem-gold) 28%,transparent);
  box-shadow:0 26px 80px rgba(0,0,0,.6);animation:sem-in .4s cubic-bezier(.2,.9,.3,1.1)}
.sem-kicker{color:var(--sem-gold);font:700 11px/1 ui-monospace,monospace;
  letter-spacing:.3em;margin:0 0 16px}
.sem-answer{position:relative;display:inline-block;padding:2px 4px;margin-bottom:10px}
.sem-answer-text{color:#cfccc2;font:700 22px/1.2 ui-monospace,monospace}
.sem-strike{position:absolute;left:-6px;right:-6px;top:50%;height:3px;border-radius:2px;
  background:linear-gradient(90deg,var(--sem-gold),color-mix(in srgb,var(--sem-gold) 60%,#fff));
  transform-origin:left center;box-shadow:0 0 12px color-mix(in srgb,var(--sem-gold) 50%,transparent)}
.sem-reveal{overflow:hidden}
.sem-explanation{margin:0;color:#e8e6de;font:400 14px/1.7 ui-monospace,monospace;
  border-top:1px solid rgba(255,255,255,.08);padding-top:12px}
@keyframes sem-in{from{opacity:0;transform:translateY(10px) scale(.97)}
  to{opacity:1;transform:none}}
@keyframes sem-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .sem-card,.sem-backdrop{animation:none}
}
`})]})}export{v as StrikethroughExplainModal,v as default};
