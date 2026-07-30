import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * DirectionHover — each character responds to the mouse entry direction
 * (top/right/bottom/left) with a matching directional slide + fade.
 * Ported from Originkit (originkit.dev/components/directionhover),
 * Framer runtime stripped → framer-motion.
 */

type Dir = 'top' | 'right' | 'bottom' | 'left';

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  slideDistance?: number;
  duration?: number;
  style?: React.CSSProperties;
}

const dirOffsets: Record<Dir, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

function getDirection(element: HTMLElement, clientX: number, clientY: number): Dir {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle > -45 && angle <= 45) return 'right';
  if (angle > 45 && angle <= 135) return 'bottom';
  if (angle > -135 && angle <= -45) return 'top';
  return 'left';
}

export default function DirectionHover({
  text = 'DIRECTION',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  slideDistance = 30,
  duration = 0.35,
  style,
}: Props) {
  const chars = Array.from(text);
  const [lastDir, setLastDir] = useState<Dir>('top');

  const handleEnter = useCallback((e: React.MouseEvent) => {
    const dir = getDirection(e.currentTarget as HTMLElement, e.clientX, e.clientY);
    setLastDir(dir);
  }, []);

  const offset = dirOffsets[lastDir];

  return (
    <motion.span
      onMouseEnter={handleEnter}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight: 1.2,
        cursor: 'pointer',
        perspective: 600,
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          whileHover={{
            opacity: 0,
            x: offset.x * slideDistance,
            y: offset.y * slideDistance,
            filter: 'blur(5px)',
            transition: {
              duration,
              delay: i * 0.025,
              ease: 'easeIn',
            },
          }}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            color,
            backfaceVisibility: 'hidden',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
