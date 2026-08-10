import{u as L,r as o,v as P,j as e,m as c}from"./index-Dteotqf0.js";import{N as _}from"./motionPresets-DdDKkMP6.js";const A="M12 2.4l2.93 5.94 6.57.95-4.75 4.63 1.12 6.54L12 17.37l-5.87 3.09 1.12-6.54-4.75-4.63 6.57-.95z";function O({value:g=3,max:w=5,size:j=32,pop:y=!0,color:N=_.gold,label:d=""}){const M=L(),t=c(Math.round(w),3,10),S=c(j,16,64),u=c(Math.round(g),0,t),[n,h]=o.useState(u),[v,i]=o.useState(0),[m,f]=o.useState(u),[R,b]=o.useState(!1),p=o.useRef(u),x=o.useRef(void 0);o.useEffect(()=>()=>window.clearTimeout(x.current),[]),o.useEffect(()=>{const s=c(Math.round(g),0,t);s!==p.current&&(p.current=s,h(s),f(s))},[g,t]);const k=v>0?v:n,z=s=>{s!==p.current&&(p.current=s,h(s),y&&!M&&(window.clearTimeout(x.current),b(!0),x.current=window.setTimeout(()=>b(!1),650)),f(s))};P((s,l)=>{const r=m,a=n;if(r===a)return;const $=Math.min(l/450,1),E=1-Math.pow(1-$,3);f(r+(a-r)*E)},m!==n);const T=s=>k>=s?1:0;return e.jsxs("div",{className:"srgp-root",style:{"--srgp-color":N,"--srgp-size":`${S}px`},children:[e.jsxs("fieldset",{className:"srgp-field",children:[d?e.jsx("legend",{className:"srgp-legend",children:d}):null,e.jsx("div",{className:"srgp-row",role:"radiogroup","aria-label":d||"Bewertung",onMouseLeave:()=>i(0),children:Array.from({length:t},(s,l)=>{const r=l+1,a=T(r)===1;return e.jsxs("span",{className:`srgp-item${a&&R?" srgp-pop":""}`,children:[e.jsx("input",{className:"srgp-input",type:"radio",name:"srgp-rating",id:`srgp-${r}`,value:r,checked:n===r,onChange:()=>z(r),onFocus:()=>i(r),onBlur:()=>i(0),"aria-label":`${r} von ${t} Sternen`}),e.jsx("label",{className:"srgp-star",htmlFor:`srgp-${r}`,style:{"--i":l},onMouseEnter:()=>i(r),children:e.jsx("svg",{viewBox:"0 0 24 24",className:"srgp-svg","aria-hidden":"true",children:e.jsx("path",{className:"srgp-outline",d:A,fill:a?"var(--srgp-color)":"transparent",stroke:a?"var(--srgp-color)":"rgba(240,236,228,0.34)",strokeWidth:"1.3",strokeLinejoin:"round"})})})]},r)})})]}),e.jsxs("output",{className:"srgp-score","aria-live":"polite",children:[Math.round(m),e.jsxs("span",{className:"srgp-total",children:[" / ",t]})]}),e.jsx("style",{children:`
.srgp-root{display:inline-flex;flex-direction:column;gap:10px;align-items:center;font-family:var(--sans,sans-serif)}
.srgp-field{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;align-items:center}
.srgp-legend{padding:0;font:700 10px/1 var(--mono,monospace);letter-spacing:.16em;text-transform:uppercase;color:rgba(240,236,228,.46);margin-bottom:2px}
.srgp-row{display:flex;gap:6px;padding:6px;border-radius:14px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.06)}
.srgp-item{position:relative;display:flex}
.srgp-input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.srgp-input:focus-visible + .srgp-star{outline:2px solid var(--srgp-color);outline-offset:3px;border-radius:8px}
.srgp-star{display:flex;cursor:pointer;padding:2px;--i:0}
.srgp-svg{width:var(--srgp-size);height:var(--srgp-size);display:block;
  filter:drop-shadow(0 0 6px color-mix(in srgb, var(--srgp-color) 30%, transparent));
  transition:transform .18s cubic-bezier(.34,1.56,.64,1)}
.srgp-star:hover .srgp-svg{transform:scale(1.14)}
.srgp-item.srgp-pop .srgp-svg{animation:srgpPop .52s cubic-bezier(.34,1.56,.64,1) calc(var(--i) * 60ms) both}
.srgp-score{font:800 13px/1 var(--mono,monospace);letter-spacing:.08em;color:var(--srgp-color);
  min-width:56px;text-align:center;text-shadow:0 0 14px color-mix(in srgb, var(--srgp-color) 45%, transparent)}
.srgp-total{color:rgba(240,236,228,.38);font-weight:600}
@keyframes srgpPop{
  0%{transform:scale(.4)}
  60%{transform:scale(1.28)}
  100%{transform:scale(1)}
}
@media (prefers-reduced-motion:reduce){
  .srgp-star:hover .srgp-svg{transform:none}
  .srgp-item.srgp-pop .srgp-svg{animation:none}
}
@media (max-width:640px){
  .srgp-row{gap:2px}
  .srgp-star{padding:4px}
}
`})]})}export{O as StarRatingGoldPop,O as default};
