import { motion } from 'framer-motion';

/**
 * TextRevealWall — a wall/grid of characters where each cell flips or fades
 * in/out, revealing the text. Useful for large hero text entries. Ported
 * from Originkit (originkit.dev/components/text-reveal-wall), Framer
 * runtime stripped → framer-motion.
 */

interface Props {
  text?: string;
  color?: string;
  secondaryColor?: string;   // color of unrevealed chars
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  gridSize?: number;          // characters per row
  revealMode?: 'flip' | 'fade' | 'slide';
  staggerDelay?: number;      // per-char delay in seconds
  trigger?: 'hover' | 'auto' | 'once';
  triggerOnMount?: boolean;
  style?: React.CSSProperties;
}

const revealVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -90, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  }),
};

const fadeVariants = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.02,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

const slideVariants = {
  hidden: { opacity: 0, x: -20, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: i * 0.025,
      duration: 0.35,
      ease: 'easeOut' as const,
    },
  }),
};

export default function TextRevealWall({
  text = 'REVEAL',
  color = '#ffffff',
  secondaryColor = '#333333',
  fontSize = 48,
  fontFamily = 'monospace',
  fontWeight = 700,
  gridSize = 7,
  revealMode = 'flip',
  staggerDelay = 0.03,
  trigger = 'auto',
  triggerOnMount = true,
  style,
}: Props) {
  const chars = Array.from(text);
  const totalLength = Math.max(gridSize * 3, chars.length);

  // Pad text with filler characters to fill the grid
  const fillChars = '+-*/~#@%&?';
  const fullGrid = Array.from({ length: totalLength }, (_, i) =>
    i < chars.length ? chars[i] : fillChars[i % fillChars.length]
  );

  const variants = revealMode === 'flip'
    ? revealVariants
    : revealMode === 'fade'
    ? fadeVariants
    : slideVariants;

  return (
    <motion.div
      initial={trigger === 'once' || trigger === 'auto' ? 'hidden' : 'hidden'}
      animate={
        trigger === 'auto' ? 'visible' :
        trigger === 'once' && triggerOnMount ? 'visible' : undefined
      }
      whileInView={trigger === 'once' ? 'visible' : undefined}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={
        trigger === 'hover' ? 'visible' : undefined
      }
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 2,
        fontSize,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        letterSpacing: 4,
        cursor: trigger === 'hover' ? 'pointer' : undefined,
        maxWidth: '100%',
        ...style,
      }}
    >
      {fullGrid.map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          initial="hidden"
          animate={
            (trigger === 'auto' || (trigger === 'once' && triggerOnMount))
              ? 'visible'
              : undefined
          }
          whileHover={trigger === 'hover' ? 'visible' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: i < chars.length ? color : secondaryColor,
            opacity: i < chars.length ? 1 : 0.3,
            fontFamily: i < chars.length ? fontFamily : 'monospace',
            textAlign: 'center',
            minWidth: `1.2ch`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
}
