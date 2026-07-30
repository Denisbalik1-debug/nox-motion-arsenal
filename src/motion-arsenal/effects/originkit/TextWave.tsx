import { motion } from 'framer-motion';

/**
 * TextWave — characters undulate in a wave/ripple pattern that travels
 * across the text. Auto-animating continuous wave. Ported from Originkit
 * (originkit.dev/components/text-wave), Framer runtime stripped.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  amplitude?: number;    // px up/down movement
  waveLength?: number;   // characters per full wave
  speed?: number;        // seconds per cycle
  trigger?: 'auto' | 'hover';
  style?: React.CSSProperties;
}

export default function TextWave({
  text = 'WAVE',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  amplitude = 12,
  waveLength = 5,
  speed = 1.5,
  trigger = 'auto',
  style,
}: Props) {
  const chars = Array.from(text);

  return (
    <motion.span
      whileHover={
        trigger === 'hover'
          ? { scale: 1.02 }
          : undefined
      }
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        cursor: trigger === 'hover' ? 'pointer' : undefined,
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          animate={
            trigger === 'auto'
              ? {
                  y: [
                    0,
                    -amplitude * Math.sin((i / waveLength) * Math.PI * 2),
                    0,
                    amplitude * Math.sin((i / waveLength) * Math.PI * 2),
                    0,
                  ],
                  color: [
                    color,
                    `hsl(${(i * 30) % 360}, 100%, 70%)`,
                    color,
                    `hsl(${(i * 30 + 180) % 360}, 100%, 70%)`,
                    color,
                  ],
                }
              : undefined
          }
          transition={
            trigger === 'auto'
              ? {
                  duration: speed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * (speed / chars.length / 2),
                }
              : undefined
          }
          whileHover={
            trigger === 'hover'
              ? {
                  y: -amplitude * 2,
                  color: `hsl(${(i * 40) % 360}, 100%, 70%)`,
                  transition: { duration: 0.2, delay: i * 0.03 },
                }
              : undefined
          }
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            color,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
