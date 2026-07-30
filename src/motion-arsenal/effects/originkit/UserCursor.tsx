import { useRef, useEffect, useCallback } from 'react';

/**
 * UserCursor — renders a fake "user cursor" that moves autonomously across
 * the screen, simulating a visitor's mouse. Good for demo/hero sections.
 * NOX-original, inspired by Originkit (originkit.dev/components/usercursor).
 */

interface Props {
  color?: string;
  size?: number;
  speed?: number;
  dotColor?: string;
  trail?: boolean;
  trailLength?: number;
  style?: React.CSSProperties;
}

export default function UserCursor({
  color = '#ffffff',
  size = 12,
  speed = 0.002,
  dotColor = '#ff6b6b',
  trail = true,
  trailLength = 15,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: 100, y: 100 });
  const targetRef = useRef({ x: 200, y: 150 });
  const trailRef = useRef<Array<{x: number; y: number}>>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Random new target occasionally
      if (Math.random() < 0.005) {
        targetRef.current = {
          x: 50 + Math.random() * (w - 100),
          y: 50 + Math.random() * (h - 100),
        };
      }

      // Move toward target
      const p = posRef.current;
      const t = targetRef.current;
      p.x += (t.x - p.x) * speed;
      p.y += (t.y - p.y) * speed;

      // Trail
      if (trail) {
        trailRef.current.push({ x: p.x, y: p.y });
        if (trailRef.current.length > trailLength) {
          trailRef.current.shift();
        }
      }

      ctx.clearRect(0, 0, w, h);

      // Draw trail
      if (trail && trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw cursor arrow
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + size, p.y + size * 0.3);
      ctx.lineTo(p.x + size * 0.5, p.y + size * 0.5);
      ctx.lineTo(p.x + size * 0.8, p.y + size);
      ctx.lineTo(p.x + size * 0.4, p.y + size * 0.7);
      ctx.lineTo(p.x, p.y + size);
      ctx.closePath();
      ctx.fill();

      // Dot
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(p.x + size * 0.3, p.y + size * 0.3, 3, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [color, size, speed, dotColor, trail, trailLength]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        minHeight: 200,
        background: '#0a0a0a',
        borderRadius: 4,
        cursor: 'none',
        ...style,
      }}
    />
  );
}
