import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SpiralImages — Images flow along an Archimedean spiral vortex from edge to
 * center, rotating to follow the tangent and fading at both ends.
 * NOX-original, inspired by Originkit (originkit.dev).
 */

interface Props {
  images?: string[];
  imageCount?: number;        // visible spiral arms/images
  width?: number;
  height?: number;
  spiralTurns?: number;       // number of full spiral rotations
  gap?: number;               // spacing factor between images along spiral
  speed?: number;             // ms per full cycle
  maxScale?: number;          // scale of outermost images
  minScale?: number;          // scale of innermost images
  style?: React.CSSProperties;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
  'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=300',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300',
  'https://images.unsplash.com/photo-1574169208507-84376144848b?w=300',
];

/**
 * Archimedean spiral: r(θ) = a + b·θ
 * Returns {x, y, tangentAngle, radius} for a given θ.
 */
function spiralPoint(
  theta: number,
  turns: number,
  maxRadius: number,
) {
  const b = maxRadius / (turns * 2 * Math.PI);
  const a = 0;
  const r = a + b * theta;
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);

  // Tangent angle: atan2(dy/dθ, dx/dθ)
  // dx/dθ = -r·sin(θ) + b·cos(θ)
  // dy/dθ =  r·cos(θ) + b·sin(θ)
  const dx = -r * Math.sin(theta) + b * Math.cos(theta);
  const dy = r * Math.cos(theta) + b * Math.sin(theta);
  const tangentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

  return { x, y, tangentAngle, r };
}

export default function SpiralImages({
  images = DEFAULT_IMAGES,
  imageCount = 24,
  width = 500,
  height = 500,
  spiralTurns = 4,
  gap = 0.3,
  speed = 8000,
  maxScale = 1,
  minScale = 0.3,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState(0);

  const maxRadius = Math.min(width, height) * 0.42;
  const totalArc = spiralTurns * 2 * Math.PI;

  // Distribute images evenly along the spiral
  const spiralItems = useMemo(() => {
    const items: {
      id: number;
      baseTheta: number;
      img: string;
      size: number;
    }[] = [];
    const imgPool = images.length > 0 ? images : DEFAULT_IMAGES;

    for (let i = 0; i < imageCount; i++) {
      const t = i / imageCount;
      const baseTheta = t * totalArc;
      const size = 60 + Math.random() * 40; // varied image sizes
      items.push({
        id: i,
        baseTheta,
        img: imgPool[i % imgPool.length],
        size,
      });
    }
    return items;
  }, [imageCount, images, totalArc]);

  // Animate phase with requestAnimationFrame
  useEffect(() => {
    let lastTime = performance.now();
    rafRef.current = requestAnimationFrame(function tick(now) {
      const dt = now - lastTime;
      lastTime = now;
      phaseRef.current = (phaseRef.current + dt / speed) % 1;
      setPhase(phaseRef.current);
      rafRef.current = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Center glow */}
      <div
        style={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {spiralItems.map((item) => {
        // θ sweeps from 0 to totalArc; images enter from outer edge and spiral inward
        const thetaOffset = phase * totalArc;
        const clamped = ((item.baseTheta + thetaOffset) % totalArc + totalArc) % totalArc;
        const theta = clamped;

        const { x, y, tangentAngle, r } = spiralPoint(theta, spiralTurns, maxRadius);

        // Normalised position along spiral (0 = centre, 1 = outer edge)
        const normPos = r / maxRadius;

        // Opacity: fade at both edges, full in middle band
        const opacity =
          normPos < 0.08
            ? Math.max(0, normPos / 0.08)
            : normPos > 0.85
              ? Math.max(0, (1 - normPos) / 0.15)
              : 1;

        // Scale: larger at outer edge, smaller toward center
        const scale = minScale + (maxScale - minScale) * normPos;

        // Image size
        const imgSize = item.size * scale;

        return (
          <motion.div
            key={item.id}
            style={{
              position: 'absolute',
              width: imgSize,
              height: imgSize,
              left: `calc(50% + ${x}px - ${imgSize / 2}px)`,
              top: `calc(50% + ${y}px - ${imgSize / 2}px)`,
              opacity,
              rotate: `${tangentAngle}deg`,
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: `0 ${2 * scale}px ${8 * scale}px rgba(0,0,0,0.25)`,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={item.img}
              alt={`Spiral ${item.id}`}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
