import{u as y,r as t,j as s,m as c}from"./index-Dteotqf0.js";import{N as h}from"./motionPresets-DdDKkMP6.js";function M({color:g=h.gold,speed:u=1,scanDuration:m=2.2,pulseRings:b=4,label:l="Fingerprint bestätigen",successLabel:i="Verifiziert",autoReset:p=!0}){const f=y(),[e,r]=t.useState("idle"),v=c(u,.1,3),d=Math.round(c(m,1,4)*1e3),k=Math.round(c(b,1,6)),x=t.useRef([]);t.useEffect(()=>()=>x.current.forEach(n=>window.clearTimeout(n)),[]);const a=t.useCallback((n,o)=>{x.current.push(window.setTimeout(n,o))},[]),w=t.useCallback(()=>{if(e==="idle"){if(f){r("success"),p&&a(()=>r("idle"),4e3);return}r("scanning"),a(()=>{r("success"),p&&a(()=>r("idle"),4e3)},d)}},[e,f,p,a,d]);return s.jsxs("div",{className:"fps-root",style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(120% 95% at 50% 115%, #14100a 0%, ${h.bg} 62%)`,"--fps-color":g,"--fps-sp":v.toFixed(2)},children:[s.jsx("style",{children:`
        .fps-panel {
          position: relative;
          width: min(420px, 86%);
          padding: 34px 28px 30px;
          border-radius: 22px;
          background: linear-gradient(180deg, #15151a 0%, #0e0e11 100%);
          border: 1px solid #232329;
          box-shadow: 0 24px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }
        .fps-scan-stage {
          position: relative;
          width: 132px;
          height: 148px;
          display: grid;
          place-items: center;
        }
        .fps-svg {
          position: relative;
          z-index: 2;
          width: 108px;
          height: 128px;
          color: var(--fps-color);
          filter: drop-shadow(0 0 10px color-mix(in srgb, var(--fps-color) 55%, transparent));
          opacity: .9;
        }
        .fps-svg path {
          fill: none;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
        }
        /* Scan-Linie: wischt vertikal über den Abdruck */
        .fps-scanline {
          position: absolute;
          left: 6%;
          right: 6%;
          top: 12%;
          height: 2px;
          z-index: 3;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, var(--fps-color) 30%, #ffe9b0 50%, var(--fps-color) 70%, transparent);
          box-shadow: 0 0 12px var(--fps-color), 0 0 26px var(--fps-color);
          opacity: 0;
          pointer-events: none;
        }
        .fps-root.fps-scanning .fps-scanline {
          opacity: 1;
          animation: fps-sweep calc(var(--fps-sp) * 1.25s) ease-in-out infinite;
        }
        @keyframes fps-sweep {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(96px); }
          100% { transform: translateY(0); }
        }
        /* Puls-Ringe um den Abdruck */
        .fps-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid var(--fps-color);
          opacity: 0;
          pointer-events: none;
        }
        .fps-root.fps-scanning .fps-ring {
          animation: fps-pulse calc(var(--fps-sp) * 1.25s) ease-out infinite;
        }
        @keyframes fps-pulse {
          0%   { transform: scale(.86); opacity: .85; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        /* Check-Draw beim Erfolg */
        .fps-check {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          z-index: 4;
        }
        .fps-check svg {
          width: 84px;
          height: 84px;
          color: var(--fps-color);
          filter: drop-shadow(0 0 12px color-mix(in srgb, var(--fps-color) 70%, transparent));
        }
        .fps-check path {
          fill: none;
          stroke: currentColor;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
        }
        .fps-root.fps-success .fps-check path {
          animation: fps-draw calc(var(--fps-sp) * 0.5s) ease-out forwards;
        }
        @keyframes fps-draw {
          to { stroke-dashoffset: 0; }
        }
        .fps-status {
          font-family: var(--display, inherit);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--fps-color);
          min-height: 1.4em;
          text-align: center;
        }
        .fps-btn {
          appearance: none;
          cursor: pointer;
          width: 100%;
          padding: 15px 20px;
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--fps-color) 55%, #232329);
          background: linear-gradient(180deg, color-mix(in srgb, var(--fps-color) 16%, #131317) 0%, #0d0d10 100%);
          color: var(--fps-color);
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
        }
        .fps-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(0,0,0,.45), 0 0 18px color-mix(in srgb, var(--fps-color) 26%, transparent); }
        .fps-btn:focus-visible { outline: 2px solid var(--fps-color); outline-offset: 3px; }
        .fps-btn:active { transform: translateY(0); }
        .fps-btn:disabled { cursor: default; opacity: .75; transform: none; box-shadow: none; }
        @media (max-width: 520px) {
          .fps-panel { padding: 26px 18px 22px; gap: 18px; }
          .fps-scan-stage { width: 108px; height: 124px; }
          .fps-svg { width: 90px; height: 108px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fps-scanline, .fps-ring, .fps-check path { animation: none !important; transition: none !important; }
          .fps-root.fps-scanning .fps-scanline { opacity: 0; }
          .fps-root.fps-scanning .fps-ring { opacity: 0; }
          .fps-check path { stroke-dashoffset: 0; }
          .fps-btn { transition: none !important; }
        }
      `}),s.jsxs("div",{className:"fps-panel",children:[s.jsxs("div",{className:"fps-scan-stage","aria-hidden":!0,children:[s.jsxs("svg",{className:"fps-svg",viewBox:"0 0 100 120",role:"presentation",children:[s.jsx("path",{d:"M50 8 C82 8 94 40 94 66 C94 92 78 112 54 116"}),s.jsx("path",{d:"M50 20 C74 20 84 46 84 66 C84 88 70 104 52 108"}),s.jsx("path",{d:"M50 32 C66 32 74 52 74 66 C74 82 62 96 50 100"}),s.jsx("path",{d:"M50 44 C58 44 64 56 64 66 C64 78 58 86 50 90"}),s.jsx("path",{d:"M50 10 C58 10 62 18 62 26 C62 34 58 40 50 40 C42 40 38 34 38 26"}),s.jsx("path",{d:"M8 66 C8 50 16 36 30 28"}),s.jsx("path",{d:"M92 66 C92 50 84 36 70 28"}),s.jsx("path",{d:"M14 84 C20 98 34 108 50 110"}),s.jsx("path",{d:"M86 84 C80 98 66 108 50 110"})]}),e==="scanning"&&s.jsx("span",{className:"fps-scanline"}),Array.from({length:k},(n,o)=>s.jsx("span",{className:"fps-ring",style:{animationDelay:`${(o*.31).toFixed(2)}s`}},o)),e==="success"&&s.jsx("span",{className:"fps-check",children:s.jsx("svg",{viewBox:"0 0 48 48",role:"presentation",children:s.jsx("path",{d:"M10 25 L20 35 L38 14"})})})]}),s.jsx("div",{className:"fps-status",role:"status","aria-live":"polite",children:e==="scanning"?"Scan läuft …":e==="success"?i:"Bereit"}),s.jsx("button",{type:"button",className:"fps-btn",onClick:w,disabled:e==="scanning","aria-label":e==="idle"?l:`${i} (Fingerprint-Scan)`,children:e==="idle"?l:e==="scanning"?"Scan …":i})]})]})}export{M as FingerprintScanSubmit,M as default};
