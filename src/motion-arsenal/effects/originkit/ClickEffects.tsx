import { useRef, useEffect, useCallback } from 'react';

/**
 * ClickEffects — particle burst on click/tap. Each click spawns a burst of
 * colorful particles that dissipate with gravity.
 * NOX-original, inspired by Originkit (originkit.dev/components/clickeffects).
 */

interface Props {
  colors?: string[];
  particleCount?: number;
  particleSize?: number;
  burstRadius?: number;
  fadeTime?: number;      // ms
  style?: React.CSSProperties;
}

export default function ClickEffects({
  colors = ['#ff6b6b', '#ffd93d', '#6bcbff', '#a29bfe', '#fd79a8'],
  particleCount = 20,
  particleSize = 6,
  burstRadius = 120,
  fadeTime = 800,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{x: number; y: number; vx: number; vy: number; life: number; color: string; size: number}>>([]);
  const animRef = useRef<number>(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const scale = window.devicePixelRatio || 1;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = (0.3 + Math.random() * 1) * burstRadius / 30;
      particles.push({
        x: cx * scale,
        y: cy * scale,
        vx: Math.cos(angle) * speed * scale,
        vy: Math.sin(angle) * speed * scale - 0.5,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: (particleSize * (0.5 + Math.random() * 0.5)) * scale,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  }, [colors, particleCount, particleSize, burstRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * (window.devicePixelRatio || 1);
        canvas.height = parent.clientHeight * (window.devicePixelRatio || 1);
        canvas.style.width = parent.clientWidth + 'px';
        canvas.style.height = parent.clientHeight + 'px';
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1 / fadeTime * 16;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [fadeTime]);

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 200,
        cursor: 'crosshair',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span style={{ color: '#666', fontFamily: 'monospace', fontSize: 14, pointerEvents: 'none', userSelect: 'none' }}>
        Click anywhere ✦
      </span>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
