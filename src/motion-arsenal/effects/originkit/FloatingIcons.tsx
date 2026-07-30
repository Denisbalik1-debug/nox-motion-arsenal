import { motion } from 'framer-motion';

/**
 * FloatingIcons — animated icons that float/bob up and down in a group.
 * NOX-original, inspired by Originkit (originkit.dev/components/floatingicons).
 */

interface Props {
  icons?: string[];
  width?: number;
  height?: number;
  floatAmount?: number;
  floatSpeed?: number;
  style?: React.CSSProperties;
}

const DEFAULT_ICONS = [
  '✦', '✧', '★', '☆', '◆', '◇', '○', '●', '◎', '♢', '♤', '♡',
  '♦', '♧', '☀', '☽', '⚡', '❄', '🔥', '💧',
];

export default function FloatingIcons({
  icons = DEFAULT_ICONS,
  width = 400,
  height = 250,
  floatAmount = 15,
  floatSpeed = 2,
  style,
}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        ...style,
      }}
    >
      {icons.map((icon, i) => {
        const x = (i % 8) * (width / 8) + 10 + Math.random() * 20;
        const y = Math.floor(i / 8) * (height / 3) + 20 + Math.random() * 30;
        const delay = Math.random() * 2;
        const size = 14 + Math.random() * 12;

        return (
          <motion.span
            key={i}
            animate={{
              y: [0, -floatAmount, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: floatSpeed + Math.random(),
              repeat: Infinity,
              delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontSize: size,
              color: `hsl(${i * 37}, 80%, 70%)`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {icon}
          </motion.span>
        );
      })}
    </div>
  );
}
