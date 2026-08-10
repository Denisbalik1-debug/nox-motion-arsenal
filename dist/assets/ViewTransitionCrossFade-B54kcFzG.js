import{r as a,u,l as g,j as t}from"./index-Dteotqf0.js";import{N as m}from"./motionPresets-DdDKkMP6.js";const b=["IDLE","SIGNAL","LOCK","DRIFT","PULSE"];function w({states:e=b,seed:n=20260810}){const[o,s]=a.useState(0),l=u(),i=a.useMemo(()=>g(n),[n]),d=a.useMemo(()=>Array.from({length:e.length},()=>Math.floor(i()*360)),[e.length,i]),c=v=>{const r=(v%e.length+e.length)%e.length;if(r===o)return;if(!(typeof document<"u"&&"startViewTransition"in document)||l){s(r);return}document.startViewTransition(()=>s(r))},p={"--vtc-gold":m.gold,"--vtc-hue":String(d[o])};return t.jsxs("div",{className:"vtc-root",style:p,children:[t.jsxs("div",{className:"vtc-stage",children:[t.jsx("div",{className:"vtc-glow"}),t.jsx("h2",{className:"vtc-label",children:e[o]}),t.jsxs("p",{className:"vtc-sub",children:[String(o+1).padStart(2,"0")," / ",String(e.length).padStart(2,"0")]})]},o),t.jsxs("div",{className:"vtc-nav",children:[t.jsx("button",{type:"button",className:"vtc-btn",onClick:()=>c(o-1),"aria-label":"Zurück",children:"←"}),t.jsx("button",{type:"button",className:"vtc-btn",onClick:()=>c(o+1),"aria-label":"Weiter",children:"→"})]}),t.jsx("style",{children:`
.vtc-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,hsl(var(--vtc-hue) 28% 9%),#06080c)}
.vtc-stage{position:relative;width:min(84%,480px);aspect-ratio:16/9;display:grid;
  place-items:center;border:1px solid color-mix(in srgb,var(--vtc-gold) 24%,transparent);
  border-radius:14px;background:rgba(6,8,12,.55);overflow:hidden;
  box-shadow:0 22px 70px rgba(0,0,0,.5)}
.vtc-glow{position:absolute;width:60%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle,hsl(var(--vtc-hue) 70% 45% / .3),transparent 70%)}
.vtc-label{position:relative;color:#fff;font:800 34px/1 ui-monospace,monospace;
  letter-spacing:.2em;text-shadow:0 0 30px color-mix(in srgb,var(--vtc-gold) 55%,transparent);
  margin:0}
.vtc-sub{position:absolute;bottom:14px;right:18px;color:#8a8578;
  font:600 10px/1 ui-monospace,monospace;letter-spacing:.2em;margin:0}
.vtc-nav{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);
  display:flex;gap:10px}
.vtc-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);
  color:var(--vtc-gold);font:700 14px/1 ui-monospace,monospace;width:36px;height:36px;
  border-radius:8px;cursor:pointer;transition:border-color .2s}
.vtc-btn:hover{border-color:var(--vtc-gold)}
::view-transition-old(vtc-stage){animation:vtc-out .35s ease-in forwards}
::view-transition-new(vtc-stage){animation:vtc-in .45s cubic-bezier(.2,.9,.3,1.1) forwards}
@keyframes vtc-out{to{opacity:0;transform:scale(.96) translateY(-6px)}}
@keyframes vtc-in{from{opacity:0;transform:scale(1.04) translateY(8px)}}
@media (prefers-reduced-motion:reduce){
  ::view-transition-old(vtc-stage),::view-transition-new(vtc-stage){animation:none}
}
`})]})}export{w as ViewTransitionCrossFade,w as default};
