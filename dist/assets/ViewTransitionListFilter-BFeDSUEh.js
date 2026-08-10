import{r as n,u as m,l as x,j as a}from"./index-Dteotqf0.js";import{N as b}from"./motionPresets-DdDKkMP6.js";const f=[{id:"alpha-01",label:"Alpha Signal",group:"signals"},{id:"beta-02",label:"Beta Carrier",group:"carriers"},{id:"gamma-03",label:"Gamma Pulse",group:"pulses"},{id:"delta-04",label:"Delta Wave",group:"signals"},{id:"epsilon-05",label:"Epsilon Link",group:"carriers"},{id:"zeta-06",label:"Zeta Burst",group:"pulses"},{id:"eta-07",label:"Eta Drift",group:"signals"},{id:"theta-08",label:"Theta Lock",group:"carriers"}],h=["all","signals","carriers","pulses"];function w(o){return`nvt-${o.replace(/[^a-z0-9-_]/gi,"-").toLowerCase()}`}function j({items:o=f,seed:i=20260810}){const[r,l]=n.useState("all"),c=m(),p=n.useMemo(()=>x(i),[i]),d=n.useMemo(()=>{const e=new Map;for(const t of o){const s=w(t.id);e.set(t.id,e.has(t.id)?`${s}-${Math.floor(p()*1e6)}`:s)}return e},[o,p]),u=n.useMemo(()=>r==="all"?o:o.filter(e=>e.group===r),[o,r]),g=e=>{if(e===r)return;if(!(typeof document<"u"&&"startViewTransition"in document)||c){l(e);return}document.startViewTransition(()=>l(e))},v={"--nvt-gold":b.gold};return a.jsxs("div",{className:"nvt-root",style:v,children:[a.jsx("div",{className:"nvt-chips",children:h.map(e=>a.jsx("button",{type:"button",className:`nvt-chip ${r===e?"nvt-chip--active":""}`,onClick:()=>g(e),children:e},e))}),a.jsx("ul",{className:"nvt-list",children:u.map(e=>a.jsxs("li",{className:"nvt-item",style:{viewTransitionName:d.get(e.id)},children:[a.jsx("span",{className:"nvt-dot"}),a.jsx("span",{className:"nvt-label",children:e.label}),a.jsx("span",{className:"nvt-group",children:e.group})]},e.id))}),a.jsx("style",{children:`
.nvt-root{position:absolute;inset:0;display:flex;flex-direction:column;gap:16px;
  padding:6%;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.nvt-chips{display:flex;gap:8px;flex-wrap:wrap}
.nvt-chip{background:none;border:1px solid rgba(255,255,255,.16);color:#8a8578;
  font:600 11px/1 ui-monospace,monospace;letter-spacing:.1em;padding:9px 14px;
  border-radius:999px;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
.nvt-chip:hover{border-color:var(--nvt-gold);color:var(--nvt-gold)}
.nvt-chip--active{background:var(--nvt-gold);border-color:var(--nvt-gold);color:#0a0c10}
.nvt-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;
  max-height:60%;overflow-y:auto}
.nvt-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:10px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
.nvt-dot{width:8px;height:8px;border-radius:50%;background:var(--nvt-gold);
  box-shadow:0 0 10px color-mix(in srgb,var(--nvt-gold) 60%,transparent)}
.nvt-label{flex:1;color:#e8e6de;font:500 14px/1.3 ui-monospace,monospace}
.nvt-group{color:#5f5b52;font:10px ui-monospace,monospace;letter-spacing:.14em;
  text-transform:uppercase}
`})]})}export{j as ViewTransitionListFilter,j as default};
