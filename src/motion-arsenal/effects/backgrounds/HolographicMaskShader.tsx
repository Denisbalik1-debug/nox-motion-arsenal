import { useState } from 'react';

type HolographicMaskShaderProps = {
  intensity?: number;
  pointerLight?: number;
  label?: string;
};

export default function HolographicMaskShader({
  intensity = 0.85,
  pointerLight = 0.8,
  label = 'NOX',
}: HolographicMaskShaderProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  return (
    <div
      aria-label="Holographic mask shader preview"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 55%, #171a28 0%, #07080d 64%)',
        cursor: 'crosshair',
        ['--holo-x' as string]: `${pointer.x}%`,
        ['--holo-y' as string]: `${pointer.y}%`,
        ['--holo-intensity' as string]: intensity,
        ['--holo-pointer' as string]: pointerLight,
      }}
    >
      <style>{`
        .nox-holo-mask, .nox-holo-mask::before, .nox-holo-mask::after { position:absolute; inset:0; }
        .nox-holo-mask { inset: 9% 12%; clip-path: polygon(50% 0%, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%); background: linear-gradient(135deg,#171c2b,#05060a 50%,#162232); box-shadow: inset 0 0 0 1px #ffffff1f, 0 24px 50px #0009; }
        .nox-holo-mask::before { content:''; background: conic-gradient(from 210deg at var(--holo-x) var(--holo-y),#ff5278,#f6d46a,#78f4dc,#7789ff,#f468ff,#ff5278); background-size: 160% 160%; mix-blend-mode: color-dodge; opacity: calc(var(--holo-intensity) * .88); filter: saturate(1.3); animation:nox-holo-shift 6s linear infinite; }
        .nox-holo-mask::after { content:''; background: radial-gradient(circle at var(--holo-x) var(--holo-y),#ffffff calc(var(--holo-pointer) * 5%),transparent calc(var(--holo-pointer) * 28%)), repeating-linear-gradient(115deg,#fff0 0 4px,#fff2 5px 6px,#fff0 8px 12px); mix-blend-mode: screen; opacity:.72; }
        .nox-holo-word { position:absolute; inset:0; display:grid; place-items:center; z-index:2; color:#f6efe2; font:800 clamp(34px,10vw,92px)/.8 Arial,sans-serif; letter-spacing:-.14em; text-shadow:0 0 16px #fff8,0 0 42px #8aa8ff88; mix-blend-mode:screen; }
        .nox-holo-caption { position:absolute; z-index:3; left:14px; bottom:10px; color:#efe6d9; opacity:.9; font:9px var(--mono,monospace); letter-spacing:.13em; }
        @keyframes nox-holo-shift { to { background-position:180% 180%; } }
        @media (prefers-reduced-motion: reduce) { .nox-holo-mask::before { animation:none; } }
      `}</style>
      <div className="nox-holo-mask" />
      <div className="nox-holo-word">{label}</div>
      <span className="nox-holo-caption">POINTER-LIT HOLOGRAPHIC MASK</span>
    </div>
  );
}
