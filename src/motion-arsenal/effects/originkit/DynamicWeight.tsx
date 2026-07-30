import { motion } from 'framer-motion';

/**
 * DynamicWeight — text with variable font weight that undulates/changes
 * over time, creating a breathing liquid-typography effect. Auto-animates.
 * Ported from Originkit (originkit.dev/components/dynamic-weight),
 * Framer runtime stripped → framer-motion.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  minWeight?: number;
  maxWeight?: number;
  duration?: number;      // seconds for a full cycle
  delayPerChar?: number;  // phase offset per character
  easing?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
  style?: React.CSSProperties;
}

export default function DynamicWeight({
  text = 'DYNAMIC',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  minWeight = 200,
  maxWeight = 900,
  duration = 2,
  delayPerChar = 0.15,
  easing = 'easeInOut' as const,
  style,
}: Props) {
  const chars = Array.from(text);

  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize,
        fontFamily,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          animate={{
            fontWeight: [minWeight, maxWeight, minWeight],
          }}
          transition={{
            duration,
            delay: i * delayPerChar,
            repeat: Infinity,
            ease: easing,
          }}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            color,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}
