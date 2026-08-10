import{r as o,l as p,j as s,m as f}from"./index-Dteotqf0.js";import{N as u}from"./motionPresets-DdDKkMP6.js";function h({text:l="JACKPOT",duration:m=.9,seed:n=20260810}){const i=f(m,.3,1.6),t=o.useMemo(()=>l.split(""),[l]),e=o.useMemo(()=>p(n),[n]),d=o.useMemo(()=>t.map((a,r)=>({offset:(e()*8+3)*(e()>.5?1:-1),delay:r*.055+e()*.12})),[t,e]),c={"--srt-gold":u.gold,"--srt-duration":`${i}s`};return s.jsxs("div",{className:"srt-root",style:c,"aria-hidden":"true",children:[s.jsx("div",{className:"srt-word",children:t.map((a,r)=>s.jsx("span",{className:"srt-cell",children:s.jsx("span",{className:"srt-reel",style:{animationDuration:`${i}s`,animationDelay:`${d[r].delay}s`,"--srt-from":`${d[r].offset}em`},children:a===" "?" ":a})},r))}),s.jsx("style",{children:`
.srt-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.srt-word{display:flex;font:900 clamp(40px,9vw,104px)/1 system-ui;letter-spacing:-.02em}
.srt-cell{overflow:hidden;display:inline-block;line-height:1;padding-bottom:.08em;
  color:var(--srt-gold)}
.srt-reel{display:inline-block;will-change:transform;
  animation:srt-roll var(--srt-duration) cubic-bezier(.2,.9,.3,1.15) forwards;
  text-shadow:0 0 26px color-mix(in srgb,var(--srt-gold) 40%,transparent)}
@keyframes srt-roll{
  0%{transform:translateY(var(--srt-from, 4em))}
  100%{transform:translateY(0)}
}
@media (prefers-reduced-motion:reduce){
  .srt-reel{animation:none;transform:none !important}
}
`})]})}export{h as SlotReelTextRoll,h as default};
