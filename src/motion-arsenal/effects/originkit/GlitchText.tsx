import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * GlitchText — text with a recurring digital glitch effect: split/offset
 * RGB channels, horizontal slice displacement, and a brief flash/blockout.
 * Ported from Originkit (originkit.dev/components/glitch-text), Framer
 * runtime stripped (RenderTarget, property-controls → plain props).
 * Uses pure DOM + requestAnimationFrame — no canvas, no extra deps.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  glitchInterval?: number;   // ms between glitch bursts (default 3000)
  glitchDuration?: number;   // ms a burst lasts (default 200)
  intensity?: number;        // 1–10 pixel offset magnitude
  mode?: 'rgb-split' | 'slices' | 'full';
  style?: React.CSSProperties;
}

export default function GlitchText({
  text = 'GLITCH',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'monospace',
  fontWeight = 700,
  letterSpacing = 4,
  glitchInterval = 3000,
  glitchDuration = 200,
  intensity = 6,
  mode = 'rgb-split',
  style,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [glitching, setGlitching] = useState(false);
  const [glitchClass, setGlitchClass] = useState('');
  const frameRef = useRef<number>(0);
  const activeRef = useRef(false);

  const triggerGlitch = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setGlitching(true);

    const start = performance.now();
    const run = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= glitchDuration) {
        activeRef.current = false;
        setGlitching(false);
        setGlitchClass('');
        return;
      }

      // Dynamic glitch shape within the burst
      const phase = elapsed / glitchDuration;
      if (phase < 0.3) {
        setGlitchClass('glitch-split');
      } else if (phase < 0.6) {
        setGlitchClass('glitch-skip');
      } else {
        setGlitchClass('glitch-flash');
      }
      frameRef.current = requestAnimationFrame(run);
    };
    frameRef.current = requestAnimationFrame(run);
  }, [glitchDuration]);

  useEffect(() => {
    const id = setInterval(triggerGlitch, glitchInterval);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(frameRef.current);
      activeRef.current = false;
    };
  }, [glitchInterval, triggerGlitch]);

  const sliceOffset = Math.random() > 0.5 ? 1 : -1;
  const intensityPx = intensity * (2 + Math.random() * 3);
  const rOffset = mode === 'rgb-split' || mode === 'full' ? intensityPx * 1.5 : 0;
  const gOffset = mode === 'rgb-split' || mode === 'full' ? -intensityPx * 1.2 : 0;
  const bOffset = mode === 'rgb-split' || mode === 'full' ? intensityPx * 0.8 : 0;

  return (
    <>
      <style>{`
        .gt-root {
          position: relative;
          display: inline-block;
          font-family: ${fontFamily};
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          letter-spacing: ${letterSpacing}px;
          color: ${color};
          line-height: 1.2;
        }
        .gt-root.glitch-split {
          animation: gt-none 0.05s infinite;
        }
        .gt-root.glitch-split .gt-text::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          color: #ff0040;
          clip: rect(${intensityPx * 0.5}px, 9999px, ${intensityPx * 2}px, 0);
          transform: translate(${rOffset}px, 0);
          opacity: 0.85;
        }
        .gt-root.glitch-split .gt-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          color: #00e5ff;
          clip: rect(${intensityPx * 2.5}px, 9999px, ${intensityPx * 4}px, 0);
          transform: translate(${gOffset}px, 0);
          opacity: 0.85;
        }
        .gt-root.glitch-skip {
          animation: gt-none 0.02s infinite;
          opacity: 0.9;
        }
        .gt-root.glitch-skip .gt-text {
          transform: translate(${sliceOffset * intensityPx * 0.6}px, ${Math.random() * 3}px);
          clip-path: inset(${Math.random() * 40}% 0 ${Math.random() * 40}% 0);
        }
        .gt-root.glitch-flash {
          opacity: 0.05;
          transition: opacity 0.03s;
        }
        .gt-text {
          position: relative;
          display: inline-block;
          transition: transform 0.05s, clip-path 0.05s;
        }
        @keyframes gt-none {
          0%, 100% { transform: none; }
          50% { transform: translate(${Math.random() > 0.7 ? 2 : 0}px, 0); }
        }
      `}</style>
      <div
        ref={rootRef}
        className={`gt-root ${glitching ? glitchClass : ''}`}
        data-text={text}
        style={style}
      >
        <span className="gt-text" data-text={text}>{text}</span>
      </div>
    </>
  );
}
