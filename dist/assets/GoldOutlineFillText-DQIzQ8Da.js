import{u as P,r as o,o as V,j as i}from"./index-Dteotqf0.js";import{N as K}from"./motionPresets-DdDKkMP6.js";function B({text:r="FORGED IN GOLD",strokeWidth:m=1.2,fillOn:t="scroll",shimmer:x=!1,speed:k=1,color:h=K.gold,accentColor:b="#f7e8a4",fontSize:v="clamp(2rem, 6vw, 4.5rem)",fontWeight:w=800,letterSpacing:y="0.04em",align:s="center",as:F="h2",seed:R=3}){const c=P(),a=o.useRef(null),n=V(a,"80px"),[l,f]=o.useState(!1),[j,g]=o.useState(!1),[S,E]=o.useState(!1),d=o.useRef(!1),D=Math.max(.2,Math.min(3,k)),L=typeof r=="string"&&r?r:"FORGED",u=["left","center","right"].includes(s)?s:"center";o.useEffect(()=>{t==="scroll"&&n&&!d.current&&(d.current=!0,E(!0))},[n,t]);const p=c||t==="none"||t==="scroll"&&(n||S)||t==="hover"&&j||t==="click"&&l,N=()=>g(!0),$=()=>g(!1),z=()=>{t==="click"&&f(e=>!e)},G=e=>{t==="click"&&(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),f(M=>!M))},T=(R%97+3).toString(),C=F,I=t==="click";return i.jsxs("div",{ref:a,className:`goft-root goft-align-${u}`,style:{"--goft-color":h,"--goft-accent":b,"--goft-stroke":`${m}px`,"--goft-fs":v,"--goft-fw":w,"--goft-ls":y,"--goft-speed":D,"--goft-seed":T},children:[i.jsx("style",{children:`
        .goft-root { display: flex; width: 100%; }
        .goft-align-left { justify-content: flex-start; }
        .goft-align-center { justify-content: center; }
        .goft-align-right { justify-content: flex-end; }
        .goft-text {
          font-size: var(--goft-fs); font-weight: var(--goft-fw);
          letter-spacing: var(--goft-ls); line-height: 1.08;
          margin: 0; padding: 0; text-align: ${u};
          -webkit-text-stroke: var(--goft-stroke) var(--goft-color);
          color: transparent;
          background-image: linear-gradient(105deg,
            color-mix(in srgb, var(--goft-color) 70%, #000 30%),
            var(--goft-color) 40%, var(--goft-accent) 50%,
            var(--goft-color) 60%, color-mix(in srgb, var(--goft-color) 70%, #000 30%));
          background-size: 200% 100%;
          background-position: 100% 0; /* leer = nur Kontur */
          background-clip: text; -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: background-position 0.05s linear;
          user-select: none;
        }
        .goft-text.goft-filled {
          background-position: 0 0;
          transition: background-position 1.2s cubic-bezier(.22,1,.36,1);
        }
        .goft-text.goft-shimmer {
          background-size: 300% 100%;
          animation: goftShimmer calc(2.6s / var(--goft-speed)) linear infinite;
        }
        .goft-text[role="button"] { cursor: pointer; }
        .goft-text[role="button"]:focus-visible {
          outline: 2px solid var(--goft-color); outline-offset: 6px; border-radius: 4px;
        }
        @keyframes goftShimmer {
          from { background-position: 200% 0; }
          to { background-position: -100% 0; }
        }
        .goft-hint { font: 600 10px/1 var(--mono, ui-monospace, monospace);
          color: rgba(240,236,228,0.35); letter-spacing: 0.24em; text-transform: uppercase;
          margin-top: 10px; }
        @media (hover: none) and (pointer: coarse) {
          .goft-root { touch-action: manipulation; }
        }
        @media (prefers-reduced-motion: reduce) {
          .goft-text, .goft-text.goft-filled { transition: none !important; }
          .goft-text.goft-filled { background-position: 0 0; }
          .goft-text.goft-shimmer { animation: none !important; }
        }
      `}),i.jsx(C,{className:`goft-text${p?" goft-filled":""}${x&&p&&!c?" goft-shimmer":""}`,onPointerEnter:N,onPointerLeave:$,onClick:z,...I?{role:"button",tabIndex:0,onKeyDown:G,"aria-pressed":l}:{},children:L})]})}export{B as GoldOutlineFillText,B as default};
