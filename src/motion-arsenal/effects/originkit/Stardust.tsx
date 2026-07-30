import { useRef, useEffect } from 'react';

/**
 * Stardust — twinkling starfield with drifting dust particles. Each star
 * has its own twinkle phase. NOX-original, inspired by Originkit
 * (originkit.dev/components/stardust).
 */

interface Props {
  width?: number;
  height?: number;
  starCount?: number;
  starSize?: number;
  twinkleSpeed?: number;
  driftSpeed?: number;
  color?: string;
  style?: React.CSSProperties;
}

export default function Stardust({
  width = 400,
  height = 300,
  starCount = 150,
  starSize = 2,
  twinkleSpeed = 1,
  driftSpeed = 0.1,
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

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: starSize * (0.3 + Math.random() * 0.7),
      phase: Math.random() * Math.PI * 2,
      speed: twinkleSpeed * (0.3 + Math.random() * 0.7),
      driftX: (Math.random() - 0.5) * driftSpeed,
      driftY: (Math.random() - 0.5) * driftSpeed,
      hue: Math.random() < 0.3 ? Math.floor(Math.random() * 360) : 0,
    }));

    let animId: number;
    const draw = () => {
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, width, height);

      const t = Date.now() * 0.001;

      for (const star of stars) {
        star.x += star.driftX;
        star.y += star.driftY;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const twinkle = (Math.sin(t * star.speed + star.phase) + 1) / 2;
        const alpha = Math.max(0.1, twinkle);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (0.5 + twinkle * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = star.hue ? `hsl(${star.hue}, 80%, ${50 + twinkle * 40}%)` : color;
        ctx.globalAlpha = alpha;

        // Glow
        if (twinkle > 0.5) {
          ctx.shadowColor = star.hue ? `hsl(${star.hue}, 80%, 70%)` : color;
          ctx.shadowBlur = star.size * twinkle * 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animId);
  }, [width, height, starCount, starSize, twinkleSpeed, driftSpeed, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, display: 'block', ...style }}
    />
  );
}
