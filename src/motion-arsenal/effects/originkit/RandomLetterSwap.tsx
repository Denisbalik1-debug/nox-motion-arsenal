import { motion } from 'framer-motion';

/**
 * RandomLetterSwap — on hover, each character of text swaps vertically with
 * a duplicate, revealing alternative glyphs in randomized staggered order.
 * Ported from Originkit (originkit.dev/components/random-letter-swap),
 * Framer runtime stripped → framer-motion.
 */

interface Props {
  text?: string;
  altText?: string;        // alternative text to swap into (same length)
  color?: string;
  altColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  staggerDelay?: number;    // seconds between each letter swap
  swapDuration?: number;    // duration of each letter swap animation
  style?: React.CSSProperties;
}

export default function RandomLetterSwap({
  text = 'RANDOM',
  altText,
  color = '#ffffff',
  altColor = '#888888',
  fontSize = 64,
  fontFamily = 'monospace',
  fontWeight = 700,
  staggerDelay = 0.04,
  swapDuration = 0.3,
  style,
}: Props) {
  const chars = Array.from(text);
  const altChars = altText ? Array.from(altText) : chars.map(() => chars[Math.floor(Math.random() * chars.length)]);

  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        cursor: 'pointer',
        perspective: 800,
        ...style,
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial="rest"
          whileHover="swap"
          style={{
            display: 'inline-block',
            position: 'relative',
            width: '1ch',
            height: `${fontSize * 1.2}px`,
            whiteSpace: 'pre',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Primary character (front) */}
          <motion.span
            variants={{
              rest: { rotateX: 0, opacity: 1 },
              swap: {
                rotateX: 90,
                opacity: 0,
                transition: {
                  duration: swapDuration,
                  delay: i * staggerDelay,
                },
              },
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              backfaceVisibility: 'hidden',
              transformOrigin: 'center center',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>

          {/* Alternative character (back) */}
          <motion.span
            variants={{
              rest: {
                rotateX: -90,
                opacity: 0,
              },
              swap: {
                rotateX: 0,
                opacity: 1,
                transition: {
                  duration: swapDuration,
                  delay: i * staggerDelay,
                },
              },
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: altColor,
              backfaceVisibility: 'hidden',
              transformOrigin: 'center center',
            }}
          >
            {altChars[i] === ' ' ? '\u00A0' : altChars[i]}
          </motion.span>
        </motion.span>
      ))}
    </span>
  );
}
