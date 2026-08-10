import{r as a,u as S,l as R,j as e}from"./index-Dteotqf0.js";import{N as w}from"./motionPresets-DdDKkMP6.js";const A=["SIGNAL 01","SIGNAL 02","SIGNAL 03","SIGNAL 04","SIGNAL 05","SIGNAL 06"];function G({tiles:n=A,seed:d=20260810}){const[r,m]=a.useState(null),p=a.useRef(null);a.useRef(null);const g=a.useRef(null),f=S(),u=a.useMemo(()=>R(d),[d]),x=a.useMemo(()=>Array.from({length:n.length},()=>Math.floor(u()*360)),[n.length,u]),h=o=>{r===null&&(m(o),requestAnimationFrame(()=>{var b;const t=(b=p.current)==null?void 0:b.children[o],c=g.current;if(!t||!c||f)return;const s=t.getBoundingClientRect(),i=c.getBoundingClientRect(),v=s.width/i.width,N=s.height/i.height,j=s.left-i.left,k=s.top-i.top;c.animate([{transform:`translate(${j}px, ${k}px) scale(${v}, ${N})`,borderRadius:"12px"},{transform:"translate(0, 0) scale(1, 1)",borderRadius:"0px"}],{duration:f?0:480,easing:"cubic-bezier(.2,.9,.3,1.05)"})}))},l=()=>{m(null)},y={"--gfm-gold":w.gold};return e.jsxs("div",{className:"gfm-root",style:y,children:[e.jsx("div",{ref:p,className:"gfm-grid",children:n.map((o,t)=>e.jsxs("button",{type:"button",className:"gfm-tile",style:{background:`linear-gradient(150deg, hsl(${x[t]} 45% 16%), #0a0c10 70%)`},onClick:()=>h(t),"aria-label":`${o} öffnen`,children:[e.jsx("span",{className:"gfm-tile-label",children:o}),e.jsx("span",{className:"gfm-tile-idx",children:String(t+1).padStart(2,"0")})]},t))}),r!==null&&e.jsxs("div",{className:"gfm-overlay",role:"dialog","aria-modal":"true","aria-label":n[r],onClick:o=>{o.target===o.currentTarget&&l()},onKeyDown:o=>o.key==="Escape"&&l(),children:[e.jsx("div",{className:"gfm-backdrop"}),e.jsxs("div",{ref:g,className:"gfm-detail",style:{background:`linear-gradient(160deg, hsl(${x[r]} 45% 22%), #0a0c10 75%)`},tabIndex:-1,children:[e.jsx("span",{className:"gfm-detail-idx",children:String(r+1).padStart(2,"0")}),e.jsx("h3",{className:"gfm-detail-title",children:n[r]}),e.jsx("p",{className:"gfm-detail-body",children:"Deterministic FLIP morph — no library. Esc or backdrop closes."}),e.jsx("button",{type:"button",className:"gfm-close",onClick:l,"aria-label":"Schließen",children:"✕"})]})]}),e.jsx("style",{children:`
.gfm-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.gfm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
  width:min(86%,520px)}
.gfm-tile{position:relative;aspect-ratio:1;border:1px solid rgba(255,255,255,.1);
  border-radius:12px;cursor:pointer;display:grid;place-items:center;overflow:hidden;
  transition:border-color .2s,transform .15s}
.gfm-tile:hover{border-color:color-mix(in srgb,var(--gfm-gold) 55%,transparent);
  transform:translateY(-2px)}
.gfm-tile-label{color:#e8e6de;font:700 11px/1.3 ui-monospace,monospace;letter-spacing:.1em}
.gfm-tile-idx{position:absolute;top:8px;right:10px;color:var(--gfm-gold);
  font:600 9px/1 ui-monospace,monospace}
.gfm-overlay{position:absolute;inset:0;display:grid;place-items:center;z-index:50}
.gfm-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.65);
  backdrop-filter:blur(4px);animation:gfm-fade .25s ease-out}
.gfm-detail{position:relative;width:min(86%,460px);min-height:300px;border-radius:0;
  border:1px solid color-mix(in srgb,var(--gfm-gold) 32%,transparent);
  box-shadow:0 30px 90px rgba(0,0,0,.6);padding:30px;display:flex;
  flex-direction:column;justify-content:flex-end;will-change:transform}
.gfm-detail-idx{position:absolute;top:18px;left:22px;color:var(--gfm-gold);
  font:700 12px/1 ui-monospace,monospace;letter-spacing:.2em}
.gfm-detail-title{color:#fff;font:800 24px/1.2 ui-monospace,monospace;letter-spacing:.08em;
  margin:0 0 10px;text-shadow:0 0 24px color-mix(in srgb,var(--gfm-gold) 45%,transparent)}
.gfm-detail-body{color:#cfccc2;font:400 13px/1.6 ui-monospace,monospace;margin:0;max-width:34ch}
.gfm-close{position:absolute;top:14px;right:16px;background:none;border:none;color:#cfccc2;
  font-size:16px;cursor:pointer;transition:color .2s}
.gfm-close:hover{color:var(--gfm-gold)}
@keyframes gfm-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .gfm-backdrop{animation:none}
  .gfm-detail{animation:gfm-pop .2s ease-out}
}
@keyframes gfm-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
`})]})}export{G as GSAPFlipGalleryMorph,G as default};
