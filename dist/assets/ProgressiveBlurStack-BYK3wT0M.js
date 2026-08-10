import{r as o,l as v,j as i,m as a}from"./index-Dteotqf0.js";import{N as M}from"./motionPresets-DdDKkMP6.js";function w({text:c="NOX",layers:b=4,maxBlur:f=26,focus:d=0,pointerDriven:x=!0,color:m=M.gold,seed:l=20260810}){const t=o.useRef(null),n=a(Math.round(b),2,6),p=a(f,2,40),s=o.useMemo(()=>v(l),[l]),y=o.useMemo(()=>Array.from({length:n},(e,r)=>({blur:Math.round(r/Math.max(1,n-1)*p+s()*3),x:Math.round((s()-.5)*14),y:Math.round((s()-.5)*10)})),[n,p,s]);o.useEffect(()=>{const e=CSS;if(typeof e.registerProperty=="function")try{e.registerProperty({name:"--pbs-focus",syntax:"<number>",inherits:!0,initialValue:"0"})}catch{}},[]);const u=a(d,0,1),h=e=>{if(!x||!t.current)return;const r=t.current.getBoundingClientRect(),g=a((e.clientY-r.top)/Math.max(1,r.height),0,1);t.current.style.setProperty("--pbs-focus",g.toFixed(3))};return i.jsxs("div",{ref:t,className:"pbs-root",onPointerMove:h,onPointerLeave:()=>{var e;(e=t.current)==null||e.style.setProperty("--pbs-focus",u.toFixed(3))},style:{"--pbs-color":m},role:"img","aria-label":`${c} — Progressive Blur Stack`,children:[y.map((e,r)=>i.jsx("span",{className:"pbs-layer",style:{"--pbs-blur":`${e.blur}px`,"--pbs-x":`${e.x}px`,"--pbs-y":`${e.y}px`},children:c.slice(0,16)},r)),i.jsx("style",{children:`
.pbs-root{position:relative;width:100%;height:100%;min-height:200px;display:grid;
  place-items:center;overflow:hidden;background:
  radial-gradient(130% 130% at 50% 40%,#131210 0%,#0a0a0b 68%);
  --pbs-focus:${u.toFixed(3)};transition:--pbs-focus .6s ease}
.pbs-layer{position:absolute;inset:0;display:grid;place-items:center;
  font-family:var(--nox-font-display,Georgia,serif);font-weight:800;
  font-size:clamp(56px,15vw,170px);letter-spacing:.03em;color:#f0ece4;
  filter:blur(var(--pbs-blur));
  opacity:calc(1 - calc(abs(var(--pbs-focus) - ${.5.toFixed(2)}) * 1.4));
  transform:translate3d(var(--pbs-x),var(--pbs-y),0);
  transition:opacity .5s ease,filter .5s ease}
.pbs-layer:nth-child(1){color:var(--pbs-color);
  text-shadow:0 0 34px color-mix(in srgb, var(--pbs-color) 55%, transparent)}
.pbs-root::after{content:"";position:absolute;inset:0;pointer-events:none;
  backdrop-filter:blur(calc(var(--pbs-focus) * 6px));-webkit-backdrop-filter:blur(calc(var(--pbs-focus) * 6px))}
@media (prefers-reduced-motion:reduce){
  .pbs-layer,.pbs-root{transition:none}
}
`})]})}export{w as ProgressiveBlurStack,w as default};
