/**
 * Exact scroll-driven shader structure from Christian Alder's CodePen:
 * https://codepen.io/HejChristian/pen/YPzLbYX
 *
 * The author-hosted base/mask assets remain external so their attribution and
 * provenance stay intact. `background-attachment: fixed` is deliberately
 * retained: it is the mechanism that makes the shader move while the page
 * scrolls, rather than merely animating a gradient in place.
 */
export default function HolographicMaskShader() {
  return (
    <div className="holographic-mask-scroll-demo">
      <style>{`
        .holographic-mask-scroll-demo { position:relative; width:100%; height:100%; overflow:hidden; background:#08090d; }
        .holographic-mask-scroll-demo .shader { position:relative; width:100%; height:100%; overflow:hidden; backface-visibility:hidden; }
        .holographic-mask-scroll-demo .shader-layer { background:black; mix-blend-mode:multiply; position:absolute; inset:0; width:100%; height:100%; background-position:center; }
        .holographic-mask-scroll-demo .specular { mix-blend-mode:color-dodge; background-attachment:fixed; }
        .holographic-mask-scroll-demo .mask { mix-blend-mode:multiply; object-fit:cover; }
        .holographic-mask-scroll-demo .gradient-sparrow { background-image:linear-gradient(0deg,hsl(359,60%,40%),hsl(16,60%,45%),hsl(33,60%,50%),hsl(45,60%,55%),hsl(58,60%,60%),hsl(58,60%,65%),hsl(58,60%,70%),hsl(96,60%,65%),hsl(146,60%,60%),hsl(183,60%,55%),hsl(225,60%,50%),hsl(265,60%,45%),hsl(303,60%,40%)); }
        .holographic-mask-scroll-demo .holo-base { width:100%; height:100%; display:block; object-fit:cover; }
        .holographic-mask-scroll-demo .holo-note { position:absolute; z-index:3; left:14px; bottom:10px; color:#eee6d8; font:9px var(--mono,monospace); letter-spacing:.13em; }
        @media (prefers-reduced-motion:reduce) { .holographic-mask-scroll-demo .specular { background-attachment:scroll; } }
      `}</style>
      <div className="shader">
        <img
          className="holo-base"
          src="https://assets.codepen.io/2153413/sparrow-base.png"
          alt="Silhouette design of a sparrow sitting on a branch"
        />
        <div className="shader-layer specular gradient-sparrow">
          <img
            className="shader-layer mask"
            src="https://assets.codepen.io/2153413/sparrow-mask.png"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
      <span className="holo-note">SCROLL THE PAGE · FIXED-BACKGROUND MASK SHADER</span>
    </div>
  );
}
