import { useRef, useEffect, useCallback } from 'react';

/**
 * KineticGrid — interactive grid where lines follow/distort toward the
 * mouse cursor. NOX-original, inspired by Originkit
 * (originkit.dev/components/kineticgrid).
 */

interface Props {
  width?: number;
  height?: number;
  gridSpacing?: number;
  lineColor?: string;
  lineWidth?: number;
  responsiveness?: number;  // 0–1
  style?: React.CSSProperties;
}

export default function KineticGrid({
  width = 400,
  height = 300,
  gridSpacing = 30,
  lineColor = '#ffffff',
  lineWidth = 1,
  responsiveness = 0.4,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const pointsRef = useRef<Array<{ox: number; oy: number; cx: number; cy: number}>>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Initialize grid points
    const cols = Math.floor(width / gridSpacing) + 1;
    const rows = Math.floor(height / gridSpacing) + 1;
    const pts: Array<{ox: number; oy: number; cx: number; cy: number}> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pts.push({
          ox: c * gridSpacing,
          oy: r * gridSpacing,
          cx: c * gridSpacing,
          cy: r * gridSpacing,
        });
      }
    }
    pointsRef.current = pts;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.5;

      const { x: mx, y: my } = mouseRef.current;
      const cols = Math.floor(width / gridSpacing) + 1;

      for (const pt of pointsRef.current) {
        const dx = mx - pt.ox;
        const dy = my - pt.oy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / (width * 0.5)) * responsiveness;

        pt.cx += (pt.ox + dx * influence - pt.cx) * 0.15;
        pt.cy += (pt.oy + dy * influence - pt.cy) * 0.15;
      }

      // Draw horizontal lines
      for (let r = 0; r < pointsRef.current.length / cols; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const pt = pointsRef.current[idx];
          if (c === 0) ctx.moveTo(pt.cx, pt.cy);
          else ctx.lineTo(pt.cx, pt.cy);
        }
        ctx.stroke();
      }

      // Draw vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < pointsRef.current.length / cols; r++) {
          const idx = r * cols + c;
          const pt = pointsRef.current[idx];
          if (r === 0) ctx.moveTo(pt.cx, pt.cy);
          else ctx.lineTo(pt.cx, pt.cy);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, gridSpacing, lineColor, lineWidth, responsiveness]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleLeave = useCallback(() => {
    mouseRef.current = { x: -999, y: -999 };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ borderRadius: 4, cursor: 'crosshair', ...style }}
    />
  );
}
