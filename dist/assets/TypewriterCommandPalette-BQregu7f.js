import{r as l,u as f,l as x,j as t}from"./index-Dteotqf0.js";import{N as h}from"./motionPresets-DdDKkMP6.js";const b=[{id:"scan",label:"Run Watchlist Scan",hint:"⌘S"},{id:"brief",label:"Generate Morning Briefing",hint:"⌘B"},{id:"audit",label:"Audit Vault Integrity",hint:"⌘A"},{id:"export",label:"Export Trade Drafts",hint:"⌘E"},{id:"graph",label:"Rebuild Knowledge Graph",hint:"⌘G"},{id:"health",label:"System Healthcheck",hint:"⌘H"},{id:"archive",label:"Archive Blog Digest",hint:"⌘A"},{id:"predict",label:"Run Prediction Review",hint:"⌘P"}];function y(c,r){const n=c.toLowerCase(),o=r.toLowerCase();if(n.length===0)return 1;let i=0,p=0,d=-1;for(let a=0;a<o.length&&i<n.length;a++)o[a]===n[i]&&(p+=1+(a===d+1?1.5:0),d=a,i+=1);return i<n.length?0:p/o.length}function w({open:c=!1,commands:r=b,seed:n=20260810}){const[o,i]=l.useState(""),p=l.useRef(null),d=f(),a=l.useMemo(()=>x(n),[n]),m=l.useMemo(()=>r.map((e,s)=>({i:s,d:a()*.28})),[r,a]);l.useEffect(()=>{c&&(i(""),requestAnimationFrame(()=>{var e;return(e=p.current)==null?void 0:e.focus()}))},[c]);const u=l.useMemo(()=>r.map((e,s)=>({...e,score:y(o,e.label),si:m[s].d})).filter(e=>e.score>0).sort((e,s)=>s.score-e.score||e.si-s.si).slice(0,6),[r,o,m]);if(!c)return null;const g={"--tcp-gold":h.gold};return t.jsxs("div",{className:"tcp-root",style:g,role:"dialog","aria-label":"Command palette",children:[t.jsxs("div",{className:"tcp-modal",children:[t.jsxs("div",{className:"tcp-inputrow",children:[t.jsx("span",{className:"tcp-prompt",children:"❯"}),t.jsx("input",{ref:p,className:"tcp-input",value:o,onChange:e=>i(e.target.value),placeholder:"type a command…",spellCheck:!1,autoComplete:"off"}),t.jsx("span",{className:"tcp-caret"})]}),t.jsxs("ul",{className:"tcp-list",children:[u.length===0&&t.jsx("li",{className:"tcp-empty",children:"no match"}),u.map(e=>t.jsxs("li",{className:"tcp-item",style:{transitionDelay:d?"0s":`${e.si}s`},children:[t.jsx("span",{className:"tcp-label",children:e.label}),t.jsx("span",{className:"tcp-hint",children:e.hint})]},e.id))]})]}),t.jsx("style",{children:`
.tcp-root{position:absolute;inset:0;display:grid;place-items:start center;padding-top:14vh;
  background:rgba(4,6,10,.55);backdrop-filter:blur(6px);z-index:60;overflow:hidden}
.tcp-modal{width:min(92%,520px);border:1px solid color-mix(in srgb,var(--tcp-gold) 24%,transparent);
  border-radius:12px;background:linear-gradient(180deg,#0c0f17,#080a10);
  box-shadow:0 24px 70px rgba(0,0,0,.6);overflow:hidden}
.tcp-inputrow{display:flex;align-items:center;gap:10px;padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,.07)}
.tcp-prompt{color:var(--tcp-gold);font:700 16px ui-monospace,monospace}
.tcp-input{flex:1;background:none;border:none;outline:none;color:#e8e6de;
  font:400 15px/1.4 ui-monospace,monospace;caret-color:transparent}
.tcp-input::placeholder{color:#6b675e}
.tcp-caret{width:9px;height:18px;background:var(--tcp-gold);opacity:.85;
  animation:tcp-blink 1.1s steps(1,end) infinite;margin-left:-14px;pointer-events:none}
.tcp-list{list-style:none;margin:0;padding:8px;max-height:280px;overflow-y:auto}
.tcp-item{display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:9px 12px;border-radius:8px;opacity:0;transform:translateY(5px);
  animation:tcp-in .18s ease-out forwards}
.tcp-item:first-child{background:color-mix(in srgb,var(--tcp-gold) 14%,transparent);
  outline:1px solid color-mix(in srgb,var(--tcp-gold) 40%,transparent)}
.tcp-item:first-child .tcp-label{color:var(--tcp-gold)}
.tcp-label{color:#cfccc2;font:400 14px/1.3 ui-monospace,monospace}
.tcp-hint{color:#5f5b52;font:11px ui-monospace,monospace;letter-spacing:.04em}
.tcp-empty{padding:12px;color:#6b675e;font:13px ui-monospace,monospace}
@keyframes tcp-in{to{opacity:1;transform:none}}
@keyframes tcp-blink{0%,55%{opacity:.85}56%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .tcp-caret{animation:none;opacity:0}
  .tcp-item{animation:none;opacity:1;transform:none}
}
`})]})}export{w as TypewriterCommandPalette,w as default};
