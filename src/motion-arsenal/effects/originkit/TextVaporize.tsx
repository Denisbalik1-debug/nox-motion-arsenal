import { useState, useRef, useCallback } from 'react';

/**
 * TextVaporize — text that vaporizes/dissolves into particles on hover,
 * then reassembles. Each character breaks apart in a puff of particles.
 * Ported from Originkit (originkit.dev/components/text-vaporize),
 * Framer runtime stripped.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  particleCount?: number;
  vaporizeDuration?: number;
  reassembleDelay?: number;
  style?: React.CSSProperties;
}

interface VaporParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export default function TextVaporize({
  text = 'VAPORIZE',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  particleCount = 60,
  vaporizeDuration = 600,
  reassembleDelay = 2000,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<VaporParticle[]>([]);
  const [vaporized, setVaporized] = useState(false);
  const animRef = useRef<number>(0);

  const startVaporize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create particles from text position
    const particles: VaporParticle[] = [];
    const charWidth = fontSize * 0.6;
    const totalWidth = text.length * charWidth;
    const startX = (rect.width - totalWidth) / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const charIdx = Math.floor(Math.random() * text.length);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        id: i,
        x: startX + charIdx * charWidth + Math.random() * charWidth,
        y: centerY + (Math.random() - 0.5) * fontSize,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 4,
        opacity: 0.6 + Math.random() * 0.4,
        color,
      });
    }
    particlesRef.current = particles;
    setVaporized(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx * 0.03 * elapsed;
        p.y += p.vy * 0.03 * elapsed;
        p.vy += 0.05; // gravity
        p.opacity -= 0.003 * elapsed;

        if (p.opacity > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (elapsed < vaporizeDuration) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Reassemble after delay
        setTimeout(() => {
          setVaporized(false);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, reassembleDelay);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [text, color, fontSize, fontFamily, fontWeight, particleCount, vaporizeDuration, reassembleDelay]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={startVaporize}
      style={{
        position: 'relative',
        display: 'inline-block',
        minHeight: fontSize * 1.5,
        cursor: 'pointer',
        ...style,
      }}
    >
      {!vaporized && (
        <span
          style={{
            display: 'inline-block',
            color,
            fontSize,
            fontFamily,
            fontWeight,
            lineHeight: 1.2,
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
