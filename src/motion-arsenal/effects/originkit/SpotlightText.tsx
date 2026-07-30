import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useCallback } from 'react';

/**
 * SpotlightText — text revealed by a moving spotlight (radial gradient).
 * The spotlight follows the cursor within the container. Off-spotlight
 * text is dimmed/colored. Ported from Originkit
 * (originkit.dev/components/spotlighttext), Framer runtime stripped.
 */

interface Props {
  text?: string;
  spotlightColor?: string;    // gradient center color
  dimColor?: string;          // off-spotlight text color
  backgroundColor?: string;   // bg behind the text
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  spotlightSize?: number;     // px radius of the spotlight
  blurSize?: number;          // px of blur on the dimmed area
  mode?: 'cursor' | 'auto';
  autoSpeed?: number;         // seconds for a full auto-sweep
  style?: React.CSSProperties;
}

export default function SpotlightText({
  text = 'SPOTLIGHT',
  spotlightColor = '#ffffff',
  dimColor = '#555555',
  backgroundColor = '#000000',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  spotlightSize = 180,
  blurSize = 4,
  mode = 'cursor',
  autoSpeed = 4,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 25 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'cursor') return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mode, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    if (mode !== 'cursor') return;
    mouseX.set(-9999);
    mouseY.set(-9999);
  }, [mode, mouseX, mouseY]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ background: backgroundColor }}
      animate={
        mode === 'auto'
          ? {
              background: [
                backgroundColor,
                `radial-gradient(circle ${spotlightSize}px at 10% 50%, ${spotlightColor}, ${backgroundColor} 80%)`,
                `radial-gradient(circle ${spotlightSize}px at 90% 50%, ${spotlightColor}, ${backgroundColor} 80%)`,
                `radial-gradient(circle ${spotlightSize}px at 10% 50%, ${spotlightColor}, ${backgroundColor} 80%)`,
                backgroundColor,
              ],
            }
          : undefined
      }
      transition={
        mode === 'auto'
          ? { duration: autoSpeed, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 3rem',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: mode === 'cursor' ? 'none' : undefined,
        ...style,
      }}
    >
      {/* Spotlight overlay */}
      {mode === 'cursor' && (
        <motion.div
          style={{
            position: 'absolute',
            width: spotlightSize * 2,
            height: spotlightSize * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle ${spotlightSize}px at center, ${spotlightColor}, transparent 70%)`,
            x: smoothX,
            y: smoothY,
            translateX: '-50%',
            translateY: '-50%',
            pointerEvents: 'none',
            mixBlendMode: 'difference',
            filter: `blur(${blurSize}px)`,
          }}
        />
      )}

      {/* Text */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          color: mode === 'cursor' ? dimColor : spotlightColor,
          fontSize,
          fontFamily,
          fontWeight,
          lineHeight: 1.2,
          textShadow: mode === 'auto' ? 'none' : `${dimColor} 0 0 ${blurSize}px`,
          transition: 'color 0.3s',
          letterSpacing: 2,
        }}
      >
        {text}
      </span>
    </motion.div>
  );
}
