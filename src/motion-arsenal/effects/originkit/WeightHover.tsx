import { motion } from 'framer-motion';

/**
 * WeightHover — text whose font weight increases smoothly on hover, like
 * variable-font weight axis animation. Also works with standard fonts via
 * font-weight steps. Ported from Originkit
 * (originkit.dev/components/weight-hover), Framer runtime stripped.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  lightWeight?: number;       // 100–900
  heavyWeight?: number;       // 100–900
  duration?: number;
  easing?: 'easeOut' | 'easeIn' | 'easeInOut' | 'linear';
  stagger?: number;           // seconds between each char
  scale?: number;             // optional scale boost
  style?: React.CSSProperties;
}

export default function WeightHover({
  text = 'WEIGHT',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  lightWeight = 300,
  heavyWeight = 900,
  duration = 0.4,
  easing = 'easeOut',
  stagger = 0.03,
  scale = 1.0,
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
        cursor: 'pointer',
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ fontWeight: lightWeight, color }}
          whileHover={{
            fontWeight: heavyWeight,
            scale,
            color,
          }}
          transition={{
            fontWeight: { duration, delay: i * stagger, ease: easing as any },
            scale: { duration: duration * 1.3, delay: i * stagger },
          }}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            fontVariationSettings: `"wght" ${lightWeight}`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}
