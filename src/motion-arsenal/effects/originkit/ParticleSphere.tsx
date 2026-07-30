import { useRef, useEffect, useCallback } from 'react';

/**
 * ParticleSphere — rotating 3D sphere made of particles on canvas.
 * NOX-original, inspired by Originkit (originkit.dev/components/particlesphere).
 */

interface Props {
  width?: number;
  height?: number;
  particleCount?: number;
  particleSize?: number;
  color?: string;
  speed?: number;
  style?: React.CSSProperties;
}

export default function ParticleSphere({
  width = 400,
  height = 400,
  particleCount = 800,
  particleSize = 2,
  color = '#4facfe',
  speed = 0.005,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Generate sphere points (Fibonacci sphere)
    const pts: Array<{theta: number; phi: number; r: number; size: number}> = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = 2 * Math.PI * i / goldenRatio;
      pts.push({
        theta,
        phi: Math.acos(y),
        r: radius,
        size: particleSize * (0.5 + Math.random() * 0.5),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      angleRef.current += speed;

      // Sort by Z for depth ordering
      const sorted = pts.map(p => {
        const x = p.r * Math.sin(p.phi) * Math.cos(p.theta + angleRef.current);
        const y = p.r * Math.cos(p.phi);
        const z = p.r * Math.sin(p.phi) * Math.sin(p.theta + angleRef.current);

        // Project
        const scale = 600 / (600 + z);
        const px = cx + x * scale;
        const py = cy + y * scale;

        return { px, py, z, size: p.size * scale, alpha: (z + radius) / (radius * 2) };
      }).sort((a, b) => a.z - b.z);

      for (const p of sorted) {
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0.15, p.alpha);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, particleCount, particleSize, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, ...style }}
    />
  );
}
