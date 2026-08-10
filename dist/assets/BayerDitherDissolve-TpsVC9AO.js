import{r as o,l as B,j as a,m as C}from"./index-Dteotqf0.js";const F=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];function z({frontLabel:p="NOX",backLabel:b="ARSENAL",duration:u=1600,cellSize:g=8,goldEdge:E=!0,autoPlay:M=!0,seed:h=20260810}){const m=o.useRef(null),[v,y]=o.useState(0),[d,x]=o.useState(!1),[w,k]=o.useState(M),s=o.useMemo(()=>B(h),[h]),R=o.useMemo(()=>Array.from({length:14},()=>({x:s()*100,y:s()*100,r:2+s()*5,op:.18+s()*.25})),[s]);o.useEffect(()=>{if(!w)return;let e=1,t=0;const i=window.setInterval(()=>{t+=e*(1e3/u)*.5,t>=1?(t=1,x(!0),e=-1):t<=0&&(t=0,x(!1),e=1),y(t)},16);return()=>window.clearInterval(i)},[w,u]),o.useEffect(()=>{const e=m.current;if(!e)return;const t=Math.max(2,Math.round(e.clientWidth/g)),i=Math.max(2,Math.round(e.clientHeight/g));e.width=t,e.height=i;const f=e.getContext("2d");if(!f)return;const j=f.createImageData(t,i),n=j.data,N=v*16;for(let l=0;l<i;l++)for(let c=0;c<t;c++){const $=F[l%4][c%4],A=$<N,r=(l*t+c)*4;if(A){const I=C((N-$)/8,0,1);n[r]=212,n[r+1]=162,n[r+2]=74+Math.round(I*60),n[r+3]=255}else n[r]=10,n[r+1]=10,n[r+2]=11,n[r+3]=255}f.putImageData(j,0,0)},[v,g]);const D={"--bdd-duration":`${u}ms`,"--bdd-scale":"scale(1)"};return a.jsxs("div",{className:"bdd-root",style:D,onPointerEnter:()=>k(!0),children:[a.jsxs("div",{className:"bdd-panel bdd-back","aria-hidden":!d,children:[a.jsx("span",{className:"bdd-label",children:b}),R.map((e,t)=>a.jsx("i",{className:"bdd-deco",style:{left:`${e.x.toFixed(1)}%`,top:`${e.y.toFixed(1)}%`,width:`${e.r}px`,height:`${e.r}px`,opacity:e.op}},t))]}),a.jsx("div",{className:"bdd-panel bdd-front","aria-hidden":d,style:E?void 0:{borderColor:"transparent"},children:a.jsx("span",{className:"bdd-label bdd-front-label",children:p})}),a.jsx("canvas",{ref:m,className:"bdd-canvas",role:"img","aria-label":`${p} zu ${b} — Bayer-Dither-Umschlag`}),a.jsx("button",{type:"button",className:"bdd-toggle",onClick:()=>{k(!1),y(e=>{const t=e>=.5?0:1;return x(t===1),t})},"aria-pressed":d,children:d?b:p}),a.jsx("style",{children:`
.bdd-root{position:relative;width:100%;height:100%;min-height:220px;overflow:hidden;
  border-radius:14px;background:#0a0a0b;contain:layout paint}
.bdd-panel{position:absolute;inset:0;display:grid;place-items:center;
  transition:opacity var(--bdd-duration) steps(24,end)}
.bdd-back{background:radial-gradient(120% 120% at 30% 20%,#1d1708 0%,#0a0a0b 55%)}
.bdd-front{background:radial-gradient(120% 120% at 70% 80%,#1a140a 0%,#0c0b09 60%);
  border:2px solid var(--nox-gold,#d4a24a);box-shadow:inset 0 0 42px rgba(212,162,74,.14)}
.bdd-front[aria-hidden="true"]{opacity:0;pointer-events:none}
.bdd-label{font-family:var(--nox-font-display,Georgia,serif);font-size:clamp(34px,9vw,84px);
  font-weight:700;letter-spacing:.08em;color:#f0ece4;text-shadow:0 0 24px rgba(212,162,74,.35)}
.bdd-front-label{color:#f0ece4;background:linear-gradient(180deg,#fff8e6,#d4a24a);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.bdd-deco{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffe9ad,transparent 70%);
  pointer-events:none}
.bdd-canvas{position:absolute;inset:0;width:100%;height:100%;
  image-rendering:pixelated;pointer-events:none;mix-blend-mode:screen;opacity:.92}
.bdd-toggle{position:absolute;left:14px;bottom:14px;z-index:3;padding:8px 16px;border-radius:999px;
  border:1px solid rgba(212,162,74,.5);background:rgba(10,10,11,.72);color:#d4a24a;
  font-size:12px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;
  backdrop-filter:blur(6px);transition:background .2s}
.bdd-toggle:hover{background:rgba(212,162,74,.16)}
@media (prefers-reduced-motion:reduce){
  .bdd-panel{transition:none}
  .bdd-canvas{display:none}
}
`})]})}export{z as BayerDitherDissolve,z as default};
