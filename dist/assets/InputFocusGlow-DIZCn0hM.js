import{r as c,j as n,m as f}from"./index-Dteotqf0.js";import{N as _}from"./motionPresets-DdDKkMP6.js";function w({label:i="E-Mail-Adresse",type:o="email",hint:e="Wir melden uns innerhalb eines Werktags.",glowColor:d=_.gold,glowIntensity:g=.5,labelFloat:r=!0,radius:p=12,sweep:s=!0}){const a=c.useMemo(()=>`nox-ifg-${Math.abs(u(i))}`,[i]),t=`${a}-hint`,l=f(g,0,1),x={"--ifg-glow":d,"--ifg-alpha":l.toFixed(3),"--ifg-spread":`${(l*9).toFixed(2)}px`,"--ifg-radius":`${f(p,0,24)}px`};return n.jsxs("div",{className:"nox-ifg",style:x,children:[n.jsx("style",{children:b}),n.jsxs("div",{className:`nox-ifg__field${r?" has-float":""}${s?" has-sweep":""}`,children:[n.jsx("input",{id:a,className:"nox-ifg__input",type:o,placeholder:r?" ":i,"aria-describedby":e?t:void 0}),n.jsx("label",{className:"nox-ifg__label",htmlFor:a,children:i}),s&&n.jsx("span",{className:"nox-ifg__sweep","aria-hidden":"true"})]}),e&&n.jsx("p",{id:t,className:"nox-ifg__hint",children:e})]})}function u(i){let o=0;for(let e=0;e<i.length;e+=1)o=o*31+i.charCodeAt(e)|0;return o}const b=String.raw`
.nox-ifg { display:grid; align-content:center; gap:9px; width:min(420px,100%); margin:0 auto; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-ifg__field { position:relative; overflow:hidden; border-radius:var(--ifg-radius); border:1px solid rgba(236,231,219,.13); background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.012)); backdrop-filter:blur(7px); transition:border-color .28s ease, box-shadow .28s ease; }
.nox-ifg__field:focus-within { border-color:color-mix(in srgb, var(--ifg-glow) 72%, transparent); box-shadow:0 0 0 1px color-mix(in srgb, var(--ifg-glow) calc(var(--ifg-alpha)*55%), transparent), 0 0 var(--ifg-spread) color-mix(in srgb, var(--ifg-glow) calc(var(--ifg-alpha)*45%), transparent); }
.nox-ifg__input { width:100%; padding:22px 15px 10px; border:0; background:transparent; color:#f0ebe1; font:inherit; font-size:14px; outline:none; }
/* Der Glow allein traegt den Fokus nicht: bei Tastaturbedienung kommt eine
   echte Outline dazu. Mausklicks loesen :focus-visible nicht aus, dort bleibt
   es beim Glow. */
.nox-ifg__input:focus-visible { outline:2px solid var(--ifg-glow); outline-offset:-2px; border-radius:calc(var(--ifg-radius) - 1px); }
.nox-ifg__input::placeholder { color:transparent; }
.nox-ifg__label { position:absolute; top:16px; left:15px; color:rgba(236,231,219,.44); font-size:14px; pointer-events:none; transition:transform .24s cubic-bezier(.22,1,.36,1), color .24s ease; transform-origin:left top; }
/* Nur die Float-Variante hebt das Label an; sonst bleibt es als sichtbarer Feldname stehen. */
.nox-ifg__field.has-float:focus-within .nox-ifg__label,
.nox-ifg__field.has-float .nox-ifg__input:not(:placeholder-shown) + .nox-ifg__label { transform:translateY(-10px) scale(.74); color:var(--ifg-glow); }
.nox-ifg__field:not(.has-float) .nox-ifg__label { position:static; display:block; padding:10px 15px 0; }
.nox-ifg__field:not(.has-float) .nox-ifg__input { padding-top:8px; }
.nox-ifg__sweep { position:absolute; inset:0; pointer-events:none; background:linear-gradient(105deg, transparent 34%, color-mix(in srgb, var(--ifg-glow) 26%, transparent) 50%, transparent 66%); transform:translateX(-130%); }
.nox-ifg__field.has-sweep:focus-within .nox-ifg__sweep { transition:transform .72s cubic-bezier(.3,0,.2,1); transform:translateX(130%); }
.nox-ifg__hint { margin:0; padding-left:2px; color:rgba(236,231,219,.34); font-size:11.5px; }
@media (prefers-reduced-motion:reduce) {
  .nox-ifg__field, .nox-ifg__label { transition:none; }
  .nox-ifg__sweep { display:none; }
}
`;export{w as InputFocusGlow,w as default};
