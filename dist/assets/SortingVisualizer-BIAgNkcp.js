import{r as a,u as N,l as B,m as g,v as E,j as u}from"./index-Dteotqf0.js";import{N as O}from"./motionPresets-DdDKkMP6.js";function Y({bars:h=32,speed:x=1,seed:v=20260810}){const y=a.useRef(null),f=a.useRef([]),R=a.useRef({done:!1}),j=N(),m=g(Math.round(h),12,80),w=g(x,.25,2),b=a.useMemo(()=>B(v),[v]),p=a.useMemo(()=>Array.from({length:m},(r,s)=>{const t=b()*.55+.15,e=.25+.75*(s/m);return g(e*t,.08,1)}),[m,b]),l=a.useMemo(()=>{const r=[...p],s=[];for(let t=0;t<r.length-1;t++)for(let e=0;e<r.length-t-1;e++)r[e]>r[e+1]?([r[e],r[e+1]]=[r[e+1],r[e]],s.push({a:e,b:e+1,swap:!0})):s.push({a:e,b:e+1,swap:!1});return s},[p]),n=a.useRef(0);E(r=>{if(j)return;const s=R.current;if(s.done)return;if(n.current>=l.length){s.done=!0;return}const e=Math.max(1,Math.round(2*w));for(let d=0;d<e&&n.current<l.length;d++){const o=l[n.current];if(n.current+=1,o.swap){const i=f.current[o.a],c=f.current[o.b];if(i&&c){const k=i.style.transform;i.style.transform=c.style.transform,c.style.transform=k}}}f.current.forEach((d,o)=>{var i,c;d&&(d.style.opacity=o===((i=l[n.current])==null?void 0:i.a)||o===((c=l[n.current])==null?void 0:c.b)?"1":"0.55")})},!0);const M={"--sv-gold":O.gold};return u.jsxs("div",{ref:y,className:"sv-root",style:M,"aria-hidden":"true",children:[u.jsx("div",{className:"sv-stage",children:p.map((r,s)=>u.jsx("div",{ref:t=>{f.current[s]=t},className:"sv-bar",style:{transform:`scaleY(${r})`,animationDelay:`${s*.02}s`}},s))}),u.jsx("p",{className:"sv-hint",children:"BUBBLE SORT"}),u.jsx("style",{children:`
.sv-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sv-stage{display:flex;align-items:flex-end;gap:3px;height:62%;width:88%;
  padding:8px;border:1px solid color-mix(in srgb,var(--sv-gold) 22%,transparent);
  border-radius:10px;background:rgba(255,255,255,.02)}
.sv-bar{flex:1;background:linear-gradient(180deg,var(--sv-gold),color-mix(in srgb,var(--sv-gold) 45%,#000));
  border-radius:2px 2px 0 0;transform-origin:bottom;opacity:.55;will-change:transform,opacity;
  animation:sv-in .5s ease-out backwards}
@keyframes sv-in{from{transform:scaleY(.02);opacity:0}}
.sv-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
@media (prefers-reduced-motion:reduce){
  .sv-bar{animation:none;transform:scaleY(1)}
  .sv-hint{display:none}
}
`})]})}export{Y as SortingVisualizer,Y as default};
