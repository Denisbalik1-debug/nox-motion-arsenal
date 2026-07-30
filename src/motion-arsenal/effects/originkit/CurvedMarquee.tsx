import { motion } from 'framer-motion';

/**
 * CurvedMarquee — text scrolling along a curved/arc path, wrapping around
 * in a continuous loop. Uses SVG textPath for the curve. Ported from
 * Originkit (originkit.dev/components/curvedmarquee), Framer runtime
 * stripped → framer-motion + SVG.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  radius?: number;           // arc radius in px
  speed?: number;           // seconds per full rotation
  direction?: 'clockwise' | 'counter-clockwise';
  repeatText?: boolean;
  style?: React.CSSProperties;
}

export default function CurvedMarquee({
  text = 'CURVED MARQUEE • ',
  color = '#ffffff',
  fontSize = 24,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 600,
  radius = 150,
  speed = 8,
  direction = 'clockwise',
  repeatText = true,
  style,
}: Props) {
  const id = `curved-marquee-path-${Math.random().toString(36).slice(2, 9)}`;
  const diameter = radius * 2 + fontSize * 2;
  const viewBox = `0 0 ${diameter} ${diameter}`;
  const pathD = direction === 'clockwise'
    ? `M ${fontSize},${radius + fontSize} A ${radius},${radius} 0 1,1 ${diameter - fontSize},${radius + fontSize}`
    : `M ${diameter - fontSize},${radius + fontSize} A ${radius},${radius} 0 1,1 ${fontSize},${radius + fontSize}`;
  const repeatedText = repeatText ? Array(8).fill(text).join('') : text;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: diameter,
        height: diameter,
        ...style,
      }}
    >
      <svg viewBox={viewBox} width={diameter} height={diameter}>
        <defs>
          <path id={id} d={pathD} />
        </defs>
        <motion.text
          fill={color}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          letterSpacing={2}
        >
          <textPath
            href={`#${id}`}
            startOffset={0}
          >
            {repeatedText}
          </textPath>
          <animateMotion
            dur={`${speed}s`}
            repeatCount="indefinite"
            path={pathD}
            rotate="auto"
          />
        </motion.text>
      </svg>
    </div>
  );
}
