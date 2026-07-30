import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * AxisCursor — custom cursor that renders particle/axis crosshairs following
 * the mouse. NOX-original, inspired by Originkit
 * (originkit.dev/components/axis-cursor).
 */

interface Props {
  color?: string;
  size?: number;
  lineWidth?: number;
  showCircle?: boolean;
  circleRadius?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

export default function AxisCursor({
  color = '#ffffff',
  size = 20,
  lineWidth = 1.5,
  showCircle = true,
  circleRadius = 8,
  opacity = 0.7,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    posRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleLeave = useCallback(() => {
    posRef.current = { x: -1000, y: -1000 };
  }, []);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x, y } = posRef.current;

      if (x >= 0 && y >= 0) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = lineWidth;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Circle
        if (showCircle) {
          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [color, size, lineWidth, showCircle, circleRadius, opacity]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 200,
        cursor: 'none',
        background: '#111',
        borderRadius: 4,
        overflow: 'hidden',
        ...style,
      }}
    >
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
