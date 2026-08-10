import{r as o,u as D,j as l,m as A}from"./index-Dteotqf0.js";import{N as E}from"./motionPresets-DdDKkMP6.js";function P({length:g=6,onComplete:n,initial:p=""}){const r=A(Math.round(g),4,8),[s,m]=o.useState(()=>{const t=(p||"").slice(0,r);return Array.from({length:r},(e,a)=>t[a]??"")}),[i,c]=o.useState(0),w=o.useRef([]),x=D(),h=2.4,b=t=>t===""?0:-parseInt(t,10)*h,d=o.useCallback(t=>{m(t);const e=t.join("");e.length===r&&(n==null||n(e))},[r,n]),u=o.useCallback((t,e)=>{/^\d$/.test(e)&&(d(s.map((a,f)=>f===t?e:a)),c(a=>Math.min(r-1,a+1)))},[s,d,r]),v=o.useCallback(t=>{if(/^\d$/.test(t.key))t.preventDefault(),u(i,t.key);else if(t.key==="Backspace"){t.preventDefault();const e=[...s];e[i]?e[i]="":i>0&&(e[i-1]="",c(i-1)),d(e)}else if(t.key==="ArrowLeft")t.preventDefault(),c(e=>Math.max(0,e-1));else if(t.key==="ArrowRight")t.preventDefault(),c(e=>Math.min(r-1,e+1));else if(t.key==="Enter"){const e=s.join("");e.length===r&&(n==null||n(e))}},[i,s,d,r,n,u]),y=o.useCallback(t=>{t.preventDefault();const e=t.clipboardData.getData("text").replace(/\D/g,"").slice(0,r);if(!e)return;const a=s.map((f,j)=>e[j]??f);d(a),c(Math.min(r-1,e.length))},[s,d,r]);o.useEffect(()=>{w.current.forEach((t,e)=>{t&&(t.style.transform=`translateY(${b(s[e])}em)`)})},[s]);const k={"--tw-gold":E.gold,"--tw-wheel":`${h}em`};return l.jsxs("div",{className:"tw-root",style:k,tabIndex:0,role:"group","aria-label":`OTP-Eingabe, ${r} Stellen`,onKeyDown:v,onPaste:y,children:[l.jsx("div",{className:"tw-wheels",children:Array.from({length:r},(t,e)=>l.jsx("div",{className:`tw-wheel ${e===i?"tw-wheel--active":""} ${s[e]?"":"tw-wheel--empty"}`,onPointerDown:()=>c(e),children:l.jsx("div",{className:"tw-reel",ref:a=>{w.current[e]=a},style:{transition:x?"none":"transform .5s cubic-bezier(.2,.9,.3,1.12)"},children:Array.from({length:10},(a,f)=>l.jsx("span",{className:"tw-digit",children:f},f))})},e))}),l.jsx("p",{className:"tw-hint",children:"TYPE · PASTE · ARROWS"}),l.jsx("style",{children:`
.tw-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c);
  outline:none;cursor:text}
.tw-wheels{display:flex;gap:10px;padding:14px 16px;border:1px solid
  color-mix(in srgb,var(--tw-gold) 26%,transparent);border-radius:14px;
  background:rgba(255,255,255,.03);box-shadow:0 14px 40px rgba(0,0,0,.45)}
.tw-wheel{width:2.2em;height:2.6em;overflow:hidden;border-radius:8px;
  border:1px solid rgba(255,255,255,.08);background:#0b0e15;
  display:flex;align-items:center;justify-content:center;position:relative}
.tw-wheel--active{border-color:color-mix(in srgb,var(--tw-gold) 65%,transparent);
  box-shadow:0 0 18px color-mix(in srgb,var(--tw-gold) 22%,transparent)}
.tw-wheel--empty::after{content:'·';position:absolute;color:#5f5b52;font-size:1.4em}
.tw-reel{display:flex;flex-direction:column;will-change:transform}
.tw-digit{height:var(--tw-wheel);display:grid;place-items:center;
  font:700 1.3em/1 ui-monospace,monospace;color:#e8e6de}
.tw-wheel--active .tw-digit{color:var(--tw-gold)}
.tw-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  font:10px ui-monospace,monospace;letter-spacing:.3em;color:#8a8578}
`})]})}export{P as TumblerVaultOTP,P as default};
