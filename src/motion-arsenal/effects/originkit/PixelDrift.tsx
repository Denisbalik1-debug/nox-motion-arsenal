import { useRef, useEffect, useCallback } from 'react';

/**
 * PixelDrift — pixels that slowly drift across the screen, creating an
 * organic/glitchy background animation. NOX-original, inspired by Originkit
 * (originkit.dev/components/pixeldrift).
 */

interface Props {
  width?: number;
  height?: number;
  pixelSize?: number;
  pixelCount?: number;
  colors?: string[];
  driftSpeed?: number;
  style?: React.CSSProperties;
}

export default function PixelDrift({
  width = 400,
  height = 300,
  pixelSize = 4,
  pixelCount = 200,
  colors = ['#ff6b6b', '#ffd93d', '#6bcbff', '#a29bfe', '#fd79a8', '#ffffff'],
  driftSpeed = 0.3,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Initialize drifting pixels
    const pixels = Array.from({ length: pixelCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * driftSpeed,
      vy: (Math.random() - 0.5) * driftSpeed - 0.1,
      size: pixelSize * (0.5 + Math.random() * 0.5),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.1 + Math.random() * 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of pixels) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = height + p.size;
        if (p.y > height + p.size) p.y = -p.size;

        // Slight wobble
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;
        p.vx = Math.max(-driftSpeed, Math.min(driftSpeed, p.vx));
        p.vy = Math.max(-driftSpeed, Math.min(driftSpeed, p.vy));

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, pixelSize, pixelCount, colors, driftSpeed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, ...style }}
    />
  );
}
