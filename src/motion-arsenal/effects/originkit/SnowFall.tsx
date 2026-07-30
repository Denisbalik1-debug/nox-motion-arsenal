import { useRef, useEffect } from 'react';

/**
 * SnowFall — gentle snowfall particle animation. Configurable density,
 * speed, and wind. Good for backgrounds/hero sections.
 * NOX-original, inspired by Originkit (originkit.dev/components/snowfall).
 */

interface Props {
  width?: number;
  height?: number;
  flakeCount?: number;
  flakeSize?: number;
  speed?: number;
  wind?: number;
  color?: string;
  style?: React.CSSProperties;
}

export default function SnowFall({
  width = 400,
  height = 300,
  flakeCount = 100,
  flakeSize = 3,
  speed = 0.5,
  wind = 0.3,
  color = '#ffffff',
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: flakeSize * (0.3 + Math.random() * 0.7),
      d: Math.random() * flakeCount,
      speed: speed * (0.5 + Math.random()),
      wind: wind * (0.5 + Math.random()),
      opacity: 0.3 + Math.random() * 0.7,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const f of flakes) {
        f.y += f.speed;
        f.x += Math.sin(f.d * 0.01 + Date.now() * 0.001) * f.wind;

        if (f.y > height) {
          f.y = -f.r;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = -f.r;
        if (f.x < -f.r) f.x = width;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = f.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animId);
  }, [width, height, flakeCount, flakeSize, speed, wind, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, background: '#0a0a1a', display: 'block', ...style }}
    />
  );
}
