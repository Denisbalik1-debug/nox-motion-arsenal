import { motion } from 'framer-motion';

/**
 * SmokyText — text rendered as individual characters that drift, blur, and
 * fade like smoke on hover. Each letter moves independently with randomized
 * physics. Ported from Originkit (originkit.dev/components/smokytext),
 * Framer runtime stripped → framer-motion.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  driftX?: number;         // max px horizontal drift (5–30)
  driftY?: number;         // max px vertical drift (–20 to –60)
  blurMax?: number;        // max blur px during drift
  fadeIntensity?: number;  // max opacity fade (0–1)
  restDuration?: number;   // seconds character stays at rest
  style?: React.CSSProperties;
}

export default function SmokyText({
  text = 'SMOKY',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  driftX = 20,
  driftY = -40,
  blurMax = 8,
  fadeIntensity = 0.4,
  restDuration = 0.5,
  style,
}: Props) {
  const chars = Array.from(text);

  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        color,
        fontSize,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        cursor: 'pointer',
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          initial={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          whileHover={{
            opacity: 1 - fadeIntensity,
            x: (Math.random() - 0.5) * driftX * 2,
            y: -Math.abs(Math.sin(i * 1.7)) * driftY,
            filter: `blur(${(0.5 + Math.random() * 0.5) * blurMax}px)`,
            transition: {
              duration: 0.8 + Math.random() * 0.6,
              ease: 'easeOut',
              delay: i * 0.04,
            },
          }}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            transition: `opacity ${restDuration}s ease, filter ${restDuration}s ease`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}
