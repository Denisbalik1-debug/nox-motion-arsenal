import{r as a,t as O,u as P,o as M,v as A,m as o,x,j as i,l as C}from"./index-Dteotqf0.js";import{N as c}from"./motionPresets-DdDKkMP6.js";function V({text:d="NOX FORGE",depth:z=1,speed:k=1,color:R=c.gold,glow:S=!0,seed:y=7}){const p=a.useRef(null),$=O(p),s=P(),l=M(p),g=a.useRef(!1),[h,j]=a.useState(!1),f=o(z,0,2),w=o(k,.1,3),u=R||c.gold,E=a.useMemo(()=>{const t=C(o(Math.round(y),1,20)*7+13>>>0);return Array.from({length:d.length},()=>({ix:.6+t()*1.6,iy:.6+t()*1.6,iz:14+t()*56}))},[d,y]);a.useEffect(()=>{s||l&&!g.current&&(g.current=!0,j(!0))},[l,s]);const F=a.useRef({rx:0,ry:0,tz:0});A(t=>{const e=p.current;if(!e)return;const n=$.current,b=n.inside?o(n.tx,0,1)-.5:0,v=n.inside?o(n.ty,0,1)-.5:0,m=5+w*5,r=F.current;r.rx=x(r.rx,v*-18*f,m,t),r.ry=x(r.ry,b*26*f,m,t),r.tz=x(r.tz,(Math.abs(b)+Math.abs(v))*110*f,m,t),e.style.setProperty("--ptd-rx",r.rx.toFixed(3)),e.style.setProperty("--ptd-ry",r.ry.toFixed(3)),e.style.setProperty("--ptd-tz",r.tz.toFixed(1))},!s&&l);const N=`linear-gradient(115deg, #7a4f1a 0%, ${u} 36%, #ffe9b0 50%, ${u} 64%, #7a4f1a 100%)`;return i.jsxs("div",{ref:p,role:"img","aria-label":d,className:"ptd-root",style:{position:"absolute",inset:0,display:"grid",placeItems:"center",overflow:"hidden",background:`radial-gradient(120% 95% at 50% 115%, #17100a 0%, ${c.bg} 62%)`,perspective:"900px",cursor:"crosshair"},children:[i.jsx("style",{children:`
        @keyframes ptd-stage-in {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes ptd-char-in {
          0%   { opacity: 0; filter: blur(12px); }
          100% { opacity: 1; filter: blur(0); }
        }
        @keyframes ptd-sheen {
          0%   { background-position: 0% 50%, 0 0; }
          100% { background-position: 200% 50%, 0 0; }
        }
        .ptd-stage { transform-style: preserve-3d; }
        .ptd-stage.ptd-entered { animation: ptd-stage-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ptd-char {
          display: inline-block;
          will-change: transform;
        }
        .ptd-char.ptd-in { animation: ptd-char-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ptd-fill { animation: ptd-sheen 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ptd-char, .ptd-fill, .ptd-stage.ptd-entered { animation: none !important; }
          .ptd-char { transform: none !important; }
        }
      `}),i.jsx("div",{className:`ptd-stage${h?" ptd-entered":""}`,style:{display:"inline-block",fontSize:"clamp(34px, 11vw, 128px)",fontWeight:900,letterSpacing:"-0.02em",lineHeight:1.05,textAlign:"center",whiteSpace:"pre-wrap",padding:"0 4%",userSelect:"none",filter:S?`drop-shadow(0 0 26px ${u}40)`:void 0},children:Array.from(d).map((t,e)=>{const n=E[e]??{ix:1,iy:1,iz:30};return i.jsx("span",{"aria-hidden":!0,className:`ptd-char${h?" ptd-in":""}`,style:{"--ptd-i":e,"--ptd-ix":n.ix.toFixed(3),"--ptd-iy":n.iy.toFixed(3),"--ptd-iz":n.iz.toFixed(1),animationDelay:`${e*34}ms`,transform:s?void 0:"perspective(900px) rotateX(calc(var(--ptd-rx, 0) * var(--ptd-ix) * 1deg)) rotateY(calc(var(--ptd-ry, 0) * var(--ptd-iy) * 1deg)) translateZ(calc(var(--ptd-tz, 0) * var(--ptd-iz) * 1px))"},children:i.jsx("span",{className:"ptd-fill",style:{backgroundImage:N,backgroundSize:"220% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"},children:t})},`${t}-${e}`)})}),!s&&i.jsx("div",{"aria-hidden":!0,style:{position:"absolute",bottom:"6%",left:0,right:0,textAlign:"center",fontFamily:"var(--mono, monospace)",fontSize:9,letterSpacing:"0.35em",color:c.textDim,pointerEvents:"none"},children:"MOVE TO SHAPE"})]})}export{V as PointerTextDepth,V as default};
