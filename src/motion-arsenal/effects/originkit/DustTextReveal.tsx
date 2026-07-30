import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * DustTextReveal — text assembles from drifting dust particles on scroll
 * or hover. Uses a canvas particle layer behind text that coalesces into
 * readable form. Ported from Originkit
 * (originkit.dev/components/dust-text-reveal), Framer runtime stripped.
 */

interface Particle {
  x: number; y: number;
  targetX: number; targetY: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
}

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  particleCount?: number;
  particleSize?: number;
  particleColor?: string;
  revealDuration?: number;  // seconds to coalesce
  trigger?: 'hover' | 'scroll' | 'auto';
  style?: React.CSSProperties;
}

export default function DustTextReveal({
  text = 'DUST',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  particleCount = 200,
  particleSize = 2.5,
  particleColor = '#ffffff',
  revealDuration = 1.8,
  trigger = 'hover',
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const revealingRef = useRef(false);
  const revealProgressRef = useRef(0);

  const initParticles = useCallback((width: number, height: number, targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    // Measure text to scatter particles across its shape
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;
    const startX = (width - textWidth) / 2;
    const startY = (height + textHeight / 2) / 2;

    // Get pixel data of rendered text for target positions
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillText(text, startX, startY);
    const imageData = ctx.getImageData(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);

    // Extract occupied pixels as targets
    const targets: {x: number; y: number}[] = [];
    const step = Math.max(2, Math.ceil(Math.sqrt((width * height) / particleCount)));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        if (imageData.data[idx + 3] > 128) {
          targets.push({ x, y });
        }
      }
    }

    // Scatter particles — some on target, some scattered
    const particles: Particle[] = targets.map(t => ({
      x: Math.random() * width,
      y: Math.random() * height,
      targetX: t.x,
      targetY: t.y,
      size: particleSize * (0.3 + Math.random() * 0.7),
      opacity: 0.2 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.7,
      color: particleColor,
    }));

    // If too few from text coverage, refill
    while (particles.length < particleCount) {
      const t = targets[Math.floor(Math.random() * targets.length)] || { x: width/2, y: height/2 };
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: t.x + (Math.random() - 0.5) * 10,
        targetY: t.y + (Math.random() - 0.5) * 10,
        size: particleSize * (0.3 + Math.random()),
        opacity: 0.1 + Math.random() * 0.3,
        speed: 0.5 + Math.random() * 0.5,
        color: particleColor,
      });
    }

    particlesRef.current = particles;
  }, [text, fontSize, fontFamily, fontWeight, particleCount, particleSize, particleColor]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const progress = revealProgressRef.current;

    for (const p of particles) {
      p.x += (p.targetX - p.x) * p.speed * 0.02 * progress;
      p.y += (p.targetY - p.y) * p.speed * 0.02 * progress;
      if (revealingRef.current && progress < 1) {
        p.opacity = Math.min(p.opacity + 0.02, 0.6 + Math.random() * 0.4);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const startReveal = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const scale = window.devicePixelRatio || 1;
    canvas.getContext('2d')!.scale(scale, scale);

    initParticles(rect.width, rect.height, canvas);
    revealingRef.current = true;
    revealProgressRef.current = 0;

    // Progressively increase reveal
    const interval = setInterval(() => {
      revealProgressRef.current = Math.min(revealProgressRef.current + 0.05, 1);
      if (revealProgressRef.current >= 1) {
        clearInterval(interval);
      }
    }, revealDuration * 50);

    if (!animFrameRef.current) animate();
  }, [initParticles, animate, revealDuration]);

  const reset = useCallback(() => {
    revealingRef.current = false;
    revealProgressRef.current = 0;
    // Scatter particles back
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (const p of particlesRef.current) {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.opacity = 0.2 + Math.random() * 0.3;
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={trigger === 'hover' ? startReveal : undefined}
      onMouseLeave={trigger === 'hover' ? reset : undefined}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: 200,
        minHeight: fontSize * 2,
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
      {/* Fallback text behind canvas */}
      <span
        style={{
          visibility: 'hidden',
          fontSize,
          fontFamily,
          fontWeight,
          color,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </div>
  );
}
