import{u as X,r as o,v as G,x as $,j as n,m as g}from"./index-Dteotqf0.js";import{N as m}from"./motionPresets-DdDKkMP6.js";function _({color:z=m.gold,dodgeRadius:L=120,dodgeDistance:D=46,maxDodges:F=5,damping:B=9,label:b="Fang mich",successLabel:v="Gefangen ✓"}){const y=X(),[r,w]=o.useState(!1),[k,j]=o.useState(0),[S,R]=o.useState(!1),u=o.useRef(null),i=o.useRef(null),d=o.useRef({x:0,y:0,px:0,py:0,tx:0,ty:0,active:!1}),c=o.useRef(!1),O=g(L,40,260),C=g(D,12,120),l=Math.round(g(F,1,12)),M=g(B,3,18),N=k>=l;G(t=>{const e=d.current,s=i.current;if(!s)return;const h=Math.hypot(e.x-e.px,e.y-e.py)<O;if(e.active&&h&&!N&&!r){const p=e.x-e.px,a=e.y-e.py,E=Math.max(Math.hypot(p,a),1);e.tx=-p/E*C,e.ty=-a/E*C,c.current||(c.current=!0,j(T=>Math.min(T+1,l)))}else e.tx=0,e.ty=0,c.current=!1;e.px=$(e.px,e.tx,M,t),e.py=$(e.py,e.ty,M,t),s.style.transform=`translate3d(${e.px.toFixed(2)}px, ${e.py.toFixed(2)}px, 0)`},!y&&!r);const x=o.useCallback(t=>{if(t.pointerType!=="mouse")return;const e=u.current;if(!e)return;const s=e.getBoundingClientRect(),h=s.left+s.width/2,p=s.top+s.height/2,a=d.current;a.x=t.clientX-h,a.y=t.clientY-p,a.active=!0},[]),f=o.useCallback(()=>{d.current.active=!1},[]);o.useEffect(()=>{const t=u.current;if(t)return t.addEventListener("pointermove",x,{passive:!0}),t.addEventListener("pointerleave",f),()=>{t.removeEventListener("pointermove",x),t.removeEventListener("pointerleave",f)}},[x,f]);const P=o.useCallback(()=>{r||(w(!0),R(!0),window.setTimeout(()=>R(!1),650))},[r]),A=o.useCallback(()=>{w(!1),j(0);const t=d.current;t.px=0,t.py=0,t.tx=0,t.ty=0,c.current=!1,i.current&&(i.current.style.transform="translate3d(0, 0, 0)")},[]);return n.jsxs("div",{ref:u,className:"dodge-root",style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,background:`radial-gradient(120% 95% at 50% 115%, #14100a 0%, ${m.bg} 62%)`,overflow:"hidden","--dodge-color":z},children:[n.jsx("style",{children:`
        .dodge-stage {
          position: relative;
          width: 100%;
          height: 190px;
          display: grid;
          place-items: center;
        }
        .dodge-btn {
          position: relative;
          z-index: 2;
          appearance: none;
          cursor: pointer;
          will-change: transform;
          padding: 16px 30px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--dodge-color) 60%, #232329);
          background: linear-gradient(180deg, color-mix(in srgb, var(--dodge-color) 18%, #131317) 0%, #0d0d10 100%);
          color: var(--dodge-color);
          font-family: var(--display, inherit);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
          box-shadow: 0 14px 34px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
          transition: box-shadow .18s ease, border-color .18s ease;
        }
        .dodge-btn:hover {
          box-shadow: 0 18px 40px rgba(0,0,0,.55), 0 0 22px color-mix(in srgb, var(--dodge-color) 30%, transparent);
        }
        .dodge-btn:focus-visible { outline: 2px solid var(--dodge-color); outline-offset: 3px; }
        .dodge-btn.dodge-flash {
          animation: dodge-pop 0.5s ease-out;
          border-color: var(--dodge-color);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--dodge-color) 22%, transparent), 0 0 34px var(--dodge-color);
        }
        @keyframes dodge-pop {
          0%   { transform: scale(1); }
          45%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .dodge-ring {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 1px dashed color-mix(in srgb, var(--dodge-color) 42%, transparent);
          pointer-events: none;
          opacity: .5;
        }
        .dodge-hud {
          font-family: var(--display, inherit);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dodge-color);
          opacity: .85;
          min-height: 1.4em;
          text-align: center;
        }
        .dodge-hint {
          font-size: 12px;
          color: ${m.textDim};
          letter-spacing: .06em;
          max-width: 320px;
          text-align: center;
          line-height: 1.5;
        }
        .dodge-reset {
          appearance: none;
          background: none;
          border: none;
          font-size: 12px;
          color: var(--dodge-color);
          text-decoration: underline;
          cursor: pointer;
          padding: 2px 8px;
        }
        .dodge-reset:focus-visible { outline: 2px solid var(--dodge-color); outline-offset: 2px; }
        @media (max-width: 520px) {
          .dodge-stage { height: 160px; }
          .dodge-hint { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dodge-btn { transition: none !important; }
          .dodge-btn.dodge-flash { animation: none !important; }
        }
      `}),n.jsxs("div",{className:"dodge-stage","aria-hidden":!0,children:[n.jsx("span",{className:"dodge-ring"}),n.jsx("button",{ref:i,type:"button",className:`dodge-btn${S?" dodge-flash":""}`,onClick:P,"aria-label":r?v:b,children:r?v:b})]}),n.jsx("div",{className:"dodge-hud",role:"status","aria-live":"polite",children:r?"Fang gelungen":N?"Ergeben — jetzt klickbar!":`${k} / ${l} Ausweich-Manöver`}),n.jsx("p",{className:"dodge-hint",children:y?"Reduced Motion: der Button ist statisch klickbar.":`Der Button weicht dem Mauszeiger aus — nach ${l} Annäherungen ergibt er sich.`}),r&&n.jsx("button",{type:"button",className:"dodge-reset",onClick:A,children:"Nochmal versuchen"})]})}export{_ as DodgeButton,_ as default};
