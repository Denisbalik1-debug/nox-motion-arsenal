import { useRef, useCallback } from 'react';

/**
 * EmojiBurst — click to spawn a burst of emoji that fly outward with physics.
 * NOX-original, inspired by Originkit (originkit.dev/components/emojiburst).
 */

interface Props {
  emojis?: string[];
  burstCount?: number;
  burstRadius?: number;
  fadeTime?: number;
  style?: React.CSSProperties;
}

const DEFAULT_EMOJIS = ['🔥', '✨', '💫', '⚡', '🎯', '💥', '🌟', '⭐', '🎉', '💪', '🚀', '👑'];

interface EmojiParticle {
  x: number; y: number;
  vx: number; vy: number;
  emoji: string;
  size: number;
  life: number;
  rotation: number;
  rotSpeed: number;
}

export default function EmojiBurst({
  emojis = DEFAULT_EMOJIS,
  burstCount = 12,
  burstRadius = 100,
  fadeTime = 1200,
  style,
}: Props) {
  const particlesRef = useRef<EmojiParticle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const spawnBurst = useCallback((cx: number, cy: number) => {
    const scale = window.devicePixelRatio || 1;
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.3;
      const speed = (0.5 + Math.random() * 1) * burstRadius / 20;
      particlesRef.current.push({
        x: cx * scale,
        y: cy * scale,
        vx: Math.cos(angle) * speed * scale,
        vy: Math.sin(angle) * speed * scale,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: 16 + Math.random() * 16,
        life: 1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }, [emojis, burstCount, burstRadius]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
  }, [spawnBurst]);

  // Animation loop
  if (!animRef.current) {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
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

        const animate = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const parts = particlesRef.current;
          const dt = 16 / fadeTime;

          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= dt;
            p.rotation += p.rotSpeed;

            if (p.life <= 0) {
              parts.splice(i, 1);
              continue;
            }

            ctx.globalAlpha = Math.max(0, p.life);
            ctx.font = `${p.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillText(p.emoji, 0, 0);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
          ctx.globalAlpha = 1;
          animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
      }
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 150,
        cursor: 'crosshair',
        background: '#0a0a0a',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <span style={{ color: '#666', fontFamily: 'monospace', fontSize: 14, pointerEvents: 'none', userSelect: 'none' }}>
        Click for emojis ✨
      </span>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
