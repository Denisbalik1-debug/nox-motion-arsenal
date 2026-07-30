import { motion } from 'framer-motion';

/**
 * ShinyPill — text inside a rounded pill/button with a metallic sheen sweep
 * that moves across the surface. The shine loops or triggers on hover.
 * Ported from Originkit (originkit.dev/components/shiny-pill), Framer
 * runtime stripped → framer-motion with CSS gradient mask.
 */

interface Props {
  text?: string;
  color?: string;
  shineColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  paddingX?: number;
  paddingY?: number;
  borderRadius?: number;
  speed?: number;           // seconds for one shine sweep
  mode?: 'auto' | 'hover';
  style?: React.CSSProperties;
}

export default function ShinyPill({
  text = 'SHINY',
  color = '#ffffff',
  shineColor = 'rgba(255,255,255,0.7)',
  backgroundColor = '#333333',
  fontSize = 24,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 600,
  paddingX = 32,
  paddingY = 16,
  borderRadius = 999,
  speed = 2.5,
  mode = 'auto',
  style,
}: Props) {
  const shineWidth = 60; // px width of the shine sweep

  return (
    <motion.span
      whileHover={mode === 'hover' ? { scale: 1.05 } : undefined}
      animate={
        mode === 'auto'
          ? {
              backgroundPosition: ['200% 0%', '-100% 0%'],
            }
          : undefined
      }
      transition={
        mode === 'auto'
          ? {
              duration: speed,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.5,
            }
          : { duration: 0.3 }
      }
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        padding: `${paddingY}px ${paddingX}px`,
        borderRadius,
        background: mode === 'auto'
          ? `linear-gradient(90deg, ${backgroundColor} 0%, ${backgroundColor} 30%, ${shineColor} 50%, ${backgroundColor} 70%, ${backgroundColor} 100%)`
          : backgroundColor,
        backgroundSize: mode === 'auto' ? '200% 100%' : undefined,
        color,
        fontSize,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (mode !== 'hover') return;
        const target = e.currentTarget;
        target.style.background = `linear-gradient(90deg, ${backgroundColor} 0%, ${backgroundColor} 30%, ${shineColor} 50%, ${backgroundColor} 70%, ${backgroundColor} 100%)`;
        target.style.backgroundSize = '200% 100%';
        target.style.backgroundPosition = '200% 0%';
        // Force reflow then animate
        requestAnimationFrame(() => {
          target.style.transition = 'background-position 0.6s ease-in-out';
          target.style.backgroundPosition = '-100% 0%';
        });
      }}
      onMouseLeave={(e) => {
        if (mode !== 'hover') return;
        const target = e.currentTarget;
        target.style.transition = 'background 0.4s ease';
        target.style.background = backgroundColor;
      }}
    >
      {text}
    </motion.span>
  );
}
