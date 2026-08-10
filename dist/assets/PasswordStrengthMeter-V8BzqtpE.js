import{r as d,j as s,m as g}from"./index-Dteotqf0.js";import{N as w}from"./motionPresets-DdDKkMP6.js";const c=["Zu schwach","Schwach","Brauchbar","Stark","Sehr stark","Ausgezeichnet"];function N(e,t){if(!e)return 0;const n=Number(/[a-z]/.test(e))+Number(/[A-Z]/.test(e))+Number(/\d/.test(e))+Number(/[^A-Za-z0-9]/.test(e)),i=t?14:10;let r=Math.min(e.length/i,1)*.55+n/4*.45;return/(.)\1{2,}/.test(e)&&(r-=.15),/(012|123|234|345|456|567|678|789|abc|qwe|asd)/i.test(e)&&(r-=.15),/^(passwort|password|admin|willkommen|welcome)/i.test(e)&&(r-=.35),t&&e.length<8&&(r-=.25),g(r,0,1)}function S({segments:e=4,color:t=w.gold,rules:n="standard",label:i=!0,initialValue:r=""}){const[o,u]=d.useState(r),[p,b]=d.useState(!1),l=g(Math.round(e),2,6),m=d.useMemo(()=>N(o,n==="strict"),[o,n]),f=o?Math.max(1,Math.ceil(m*l)):0,h=o?c[Math.min(Math.round(m*(c.length-1)),c.length-1)]:"Noch nichts eingegeben",_={"--psm-color":t,"--psm-count":l};return s.jsxs("div",{className:"nox-psm",style:_,children:[s.jsx("style",{children:v}),s.jsxs("div",{className:"nox-psm__field",children:[s.jsx("input",{id:"nox-psm-input",className:"nox-psm__input",type:p?"text":"password",value:o,onChange:a=>u(a.target.value),placeholder:"Passwort eingeben","aria-describedby":"nox-psm-status",autoComplete:"new-password"}),s.jsx("button",{type:"button",className:"nox-psm__toggle",onClick:()=>b(a=>!a),"aria-pressed":p,children:p?"verbergen":"zeigen"})]}),s.jsx("div",{className:"nox-psm__bars","aria-hidden":"true",children:Array.from({length:l},(a,x)=>s.jsx("span",{className:`nox-psm__bar${x<f?" is-filled":""}`},x))}),i&&s.jsx("p",{id:"nox-psm-status",className:"nox-psm__label","aria-live":"polite",children:h})]})}const v=String.raw`
.nox-psm { display:grid; align-content:center; gap:11px; width:min(400px,100%); margin:0 auto; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-psm__field { display:flex; align-items:center; gap:8px; padding:2px 4px 2px 0; border-radius:11px; border:1px solid rgba(236,231,219,.13); background:rgba(255,255,255,.03); transition:border-color .24s ease; }
.nox-psm__field:focus-within { border-color:color-mix(in srgb, var(--psm-color) 60%, transparent); }
.nox-psm__input { flex:1 1 auto; padding:12px 14px; border:0; background:transparent; color:#f0ebe1; font:inherit; font-size:14px; outline:none; }
.nox-psm__input:focus-visible { outline:2px solid var(--psm-color); outline-offset:-2px; border-radius:10px; }
.nox-psm__input::placeholder { color:rgba(236,231,219,.28); }
.nox-psm__toggle { flex:0 0 auto; padding:6px 11px; border:0; border-radius:7px; background:transparent; color:rgba(236,231,219,.44); font:inherit; font-size:11px; cursor:pointer; }
.nox-psm__toggle:hover { color:#f0ebe1; }
.nox-psm__toggle:focus-visible { outline:2px solid var(--psm-color); outline-offset:1px; }
.nox-psm__bars { display:grid; grid-template-columns:repeat(var(--psm-count),1fr); gap:5px; }
.nox-psm__bar { height:4px; border-radius:999px; background:rgba(236,231,219,.09); overflow:hidden; }
/* Overshoot im Easing gibt dem Fuellen den federnden Charakter. */
.nox-psm__bar::after { content:''; display:block; height:100%; border-radius:inherit; background:var(--psm-color); transform:scaleX(0); transform-origin:left; transition:transform .42s cubic-bezier(.34,1.4,.64,1); }
.nox-psm__bar.is-filled::after { transform:scaleX(1); }
.nox-psm__label { margin:0; color:rgba(236,231,219,.44); font-size:11.5px; letter-spacing:.05em; }
@media (prefers-reduced-motion:reduce) {
  .nox-psm__bar::after { transition:none; }
  .nox-psm__field { transition:none; }
}
`;export{S as PasswordStrengthMeter,S as default};
