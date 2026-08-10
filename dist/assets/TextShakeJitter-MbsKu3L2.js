import{u as b,r as e,j as s,m as c}from"./index-Dteotqf0.js";import{N as _}from"./motionPresets-DdDKkMP6.js";function y({text:l="ZUGRIFF VERWEIGERT",intensity:d=.5,duration:m=.4,trigger:t="event",color:p=_.gold,accentColor:u="#f7e8a4",fontSize:x="clamp(1.4rem, 5vw, 3rem)"}){const n=b(),[j,a]=e.useState(!1),o=e.useRef(void 0),f=c(d,0,1),r=c(m,.2,1);e.useEffect(()=>()=>window.clearTimeout(o.current),[]);const i=e.useCallback(()=>{n||(window.clearTimeout(o.current),a(!1),window.requestAnimationFrame(()=>{a(!0),o.current=window.setTimeout(()=>a(!1),r*1e3)}))},[n,r]),v={"--tsj-color":p,"--tsj-accent":u,"--tsj-size":x,"--tsj-amp":`${(f*9).toFixed(2)}px`,"--tsj-dur":`${r.toFixed(2)}s`},h=t==="loop"?!n:j;return s.jsxs("div",{className:"nox-tsj",style:v,children:[s.jsx("style",{children:g}),s.jsx("span",{className:`nox-tsj__text${h?" is-shaking":""}${t==="hover"?" on-hover":""}${t==="loop"?" is-loop":""}`,onMouseEnter:t==="hover"?i:void 0,children:l}),t==="event"&&s.jsx("button",{type:"button",className:"nox-tsj__button",onClick:i,children:"Ausloesen"})]})}const g=String.raw`
.nox-tsj { display:grid; place-content:center; justify-items:center; gap:20px; width:100%; height:100%; padding:clamp(16px,4vw,36px); font-family:var(--sans,system-ui,sans-serif); }
.nox-tsj__text { display:inline-block; font-size:var(--tsj-size); font-weight:800; letter-spacing:-.02em; text-align:center; background:linear-gradient(100deg, var(--tsj-color), var(--tsj-accent) 48%, var(--tsj-color)); -webkit-background-clip:text; background-clip:text; color:transparent; }
/* Abklingende Amplitude: der letzte Ausschlag ist ein Bruchteil des ersten. */
.nox-tsj__text.is-shaking { animation:nox-tsj-shake var(--tsj-dur) cubic-bezier(.36,.07,.19,.97) both; }
.nox-tsj__text.is-loop { animation-iteration-count:infinite; }
@keyframes nox-tsj-shake {
  0%   { transform:translate3d(0,0,0); }
  12%  { transform:translate3d(calc(var(--tsj-amp) * -1), 0, 0); }
  25%  { transform:translate3d(var(--tsj-amp), 0, 0); }
  38%  { transform:translate3d(calc(var(--tsj-amp) * -.68), 0, 0); }
  50%  { transform:translate3d(calc(var(--tsj-amp) * .58), 0, 0); }
  63%  { transform:translate3d(calc(var(--tsj-amp) * -.36), 0, 0); }
  75%  { transform:translate3d(calc(var(--tsj-amp) * .24), 0, 0); }
  88%  { transform:translate3d(calc(var(--tsj-amp) * -.1), 0, 0); }
  100% { transform:translate3d(0,0,0); }
}
.nox-tsj__button { padding:9px 20px; border-radius:999px; border:1px solid color-mix(in srgb, var(--tsj-color) 42%, transparent); background:color-mix(in srgb, var(--tsj-color) 11%, transparent); color:#f2ecd9; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
.nox-tsj__button:focus-visible { outline:2px solid var(--tsj-color); outline-offset:3px; }
@media (prefers-reduced-motion:reduce) {
  .nox-tsj__text.is-shaking, .nox-tsj__text.is-loop { animation:none; }
}
`;export{y as TextShakeJitter,y as default};
