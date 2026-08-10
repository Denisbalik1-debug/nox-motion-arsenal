import{r as s,u as R,l as N,p as j,v as O,j as l,m as $}from"./index-Dteotqf0.js";import{N as x}from"./motionPresets-DdDKkMP6.js";const f=[x.gold,"#2f6f8f","#1b2a4a","#6f4a2a","#4a5a8a","#8a6a3a"];function S({layers:c=["NOX","MOTION","ARSENAL","SYSTEM","CORE"],depth:h=800,mode:p="scroll",seed:u=20260810}){const g=s.useRef(null),m=s.useRef(null),y=R(),a=$(h,400,1200),d=c.length>0?c.slice(0,6):["NOX"],n=s.useMemo(()=>N(u),[u]),z=s.useMemo(()=>d.map((r,t)=>({label:r,z:-Math.round(a*(t+1)/(d.length+1)),hue:f[t%f.length],glyphs:Array.from({length:5+t%3},()=>({x:n()*100,y:n()*100,s:8+n()*22}))})),[d,a,n]),b=j(g),i=s.useRef({p:0,dir:1,playing:!0});O(r=>{if(y)return;let t=b.current;if(p==="auto"){const e=i.current;e.playing&&(e.p+=e.dir*r*.22,e.p>=1&&(e.p=1,e.dir=-1),e.p<=0&&(e.p=0,e.dir=1)),t=e.p}const o=m.current;if(o){const e=a*(1-t*2.2);o.style.transform=`translateZ(${e}px)`}},!0);const v={"--lzd-gold":x.gold};return l.jsxs("div",{ref:g,className:"lzd-root",style:v,children:[l.jsx("div",{className:"lzd-scene",children:l.jsx("div",{ref:m,className:"lzd-cam",style:{transform:`translateZ(${a}px)`},children:z.map((r,t)=>l.jsxs("div",{className:"lzd-layer",style:{transform:`translate3d(-50%,-50%,${r.z}px)`,color:r.hue,"--lzd-label":`"${r.label}"`},children:[r.label,r.glyphs.map((o,e)=>l.jsx("i",{style:{left:`${o.x}%`,top:`${o.y}%`,width:`${o.s}px`,height:`${o.s}px`}},e))]},t))})}),p==="auto"&&l.jsx("button",{type:"button",className:"lzd-toggle",onClick:()=>{i.current.playing=!i.current.playing},children:i.current.playing?"PAUSE":"PLAY"}),l.jsx("style",{children:`
.lzd-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:#06080c;perspective:900px;perspective-origin:50% 42%}
.lzd-scene{position:absolute;inset:0;display:grid;place-items:center}
.lzd-cam{position:relative;width:100%;height:100%;transform-style:preserve-3d;
  will-change:transform;transition:none}
.lzd-layer{position:absolute;left:50%;top:50%;width:110%;height:110%;
  display:grid;place-items:center;font:900 clamp(64px,17vw,190px)/1 system-ui;
  letter-spacing:-.05em;opacity:.92;will-change:transform;
  border:1px solid color-mix(in srgb,currentColor 16%,transparent);
  background:linear-gradient(160deg,color-mix(in srgb,currentColor 7%,#0a0d13),#080a0f 70%)}
.lzd-layer i{position:absolute;border:1px solid currentColor;opacity:.4;transform:rotate(45deg)}
.lzd-layer:nth-child(1){color:var(--lzd-gold)}
.lzd-toggle{position:absolute;bottom:18px;right:18px;z-index:5;border:1px solid
  color-mix(in srgb,var(--lzd-gold) 60%,transparent);background:#0b0d12cc;color:var(--lzd-gold);
  font:10px ui-monospace,monospace;letter-spacing:.16em;padding:8px 14px;cursor:pointer}
.lzd-toggle:hover{border-color:var(--lzd-gold)}
@media (prefers-reduced-motion:reduce){
  .lzd-cam{transform:translateZ(0) !important}
  .lzd-toggle{display:none}
}
`})]})}export{S as LayeredZoomDolly,S as default};
