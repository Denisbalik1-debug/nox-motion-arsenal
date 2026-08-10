import{u as k,r as w,j as e,m as o}from"./index-Dteotqf0.js";import{N as i}from"./motionPresets-DdDKkMP6.js";function X({lines:s=["NOX MOTION ARSENAL"],color:r=i.gold,angle:d=-7,thickness:m=3,speed:p=1,trigger:u="hover",struck:g=!1}){const f=k(),v=o(d,-20,20),x=o(m,1,8),a=o(p,.1,3),l=w.useMemo(()=>s.map((n,t)=>({transitionMs:Math.round(.9*a*1e3),delayMs:Math.round(t*.9*a*1e3)})),[s,a]),h=g||!f,y=`linear-gradient(90deg, transparent 0%, ${r} 28%, #ffe9b0 50%, ${r} 72%, transparent 100%)`;return e.jsxs("div",{className:`ags-root${g?" ags-struck":""}${u==="auto"?" ags-auto":""}`,style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-start",gap:"0.55em",overflow:"hidden",padding:"0 8%",background:`radial-gradient(120% 95% at 50% 115%, #14100a 0%, ${i.bg} 62%)`},children:[e.jsx("style",{children:`
        .ags-line {
          position: absolute;
          left: -6%;
          right: -6%;
          top: 50%;
          height: var(--ags-thick);
          border-radius: 999px;
          background: var(--ags-gradient);
          filter: drop-shadow(0 0 8px var(--ags-color));
          transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0);
          transform-origin: 0% 50%;
          pointer-events: none;
        }
        .ags-root:hover .ags-line,
        .ags-root:focus-visible .ags-line,
        .ags-root.ags-struck .ags-line {
          transform: rotate(var(--ags-angle)) translateY(0) scaleX(1);
        }
        .ags-root.ags-auto .ags-line {
          animation: ags-sweep calc(var(--ags-sp) * 2400ms) ease-in-out var(--ags-delay) infinite;
        }
        .ags-root.ags-auto.ags-struck .ags-line {
          animation: none;
        }
        @keyframes ags-sweep {
          0%   { transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0); }
          38%  { transform: rotate(var(--ags-angle)) translateY(0) scaleX(1); }
          58%  { transform: rotate(var(--ags-angle)) translateY(0) scaleX(1); }
          100% { transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0); }
        }
        @media (max-width: 520px) {
          .ags-line-wrap { font-size: 15px !important; letter-spacing: 0.06em !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ags-line { animation: none !important; transition: none !important; }
          .ags-root:not(.ags-struck) .ags-line {
            transform: rotate(var(--ags-angle)) translateY(0.55em) scaleX(0) !important;
          }
          .ags-root.ags-struck .ags-line {
            transform: rotate(var(--ags-angle)) translateY(0) scaleX(1) !important;
          }
        }
      `}),s.map((n,t)=>{const c=l[t]??l[0];return e.jsxs("div",{className:"ags-line-wrap",style:{position:"relative",fontFamily:"var(--display, inherit)",fontSize:"clamp(22px, 4.6vw, 52px)",fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",lineHeight:1.35,color:i.text,whiteSpace:"nowrap","--ags-angle":`${v}deg`,"--ags-thick":`${x}px`,"--ags-color":r,"--ags-gradient":y,"--ags-sp":a.toFixed(2),"--ags-delay":`${(c.delayMs/1e3).toFixed(2)}s`},children:[n,h&&e.jsx("span",{"aria-hidden":!0,className:"ags-line",style:{transition:`transform ${c.transitionMs}ms cubic-bezier(0.16, 1, 0.3, 1)`}})]},`${n}-${t}`)})]})}export{X as AngledGoldStrike,X as default};
