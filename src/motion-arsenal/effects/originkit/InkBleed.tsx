import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * InkBleed — text that distorts / bleeds like wet ink on paper on hover.
 * Each character gets a randomized SVG filter distortion with blur + noise.
 * Ported from Originkit (originkit.dev/components/inkbleed), Framer runtime
 * stripped → framer-motion + inline SVG filter.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  bleedAmount?: number;     // 0–1 how much the ink bleeds
  blurAmount?: number;       // px of SVG blur during bleed
  noiseIntensity?: number;   // 0–1 turbulence noise
  mode?: 'hover' | 'always';
  style?: React.CSSProperties;
}

export default function InkBleed({
  text = 'INKBLEED',
  color = '#1a1a1a',
  fontSize = 72,
  fontFamily = 'Georgia, serif',
  fontWeight = 700,
  bleedAmount = 0.6,
  blurAmount = 2.5,
  noiseIntensity = 0.15,
  mode = 'hover',
  style,
}: Props) {
  const [isActive, setIsActive] = useState(false);
  const filterId = useRef(`inkbleed-${Math.random().toString(36).slice(2, 9)}`).current;

  const handleHoverStart = useCallback(() => setIsActive(true), []);
  const handleHoverEnd = useCallback(() => setIsActive(false), []);

  const bleedScale = isActive ? 1 + bleedAmount * 0.15 : 1;
  const letterSpacing = isActive ? fontSize * bleedAmount * 0.03 : 0;

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={isActive ? noiseIntensity * 0.5 : 0.01}
              numOctaves={isActive ? 3 : 1}
              result="noise"
              seed={Math.floor(Math.random() * 100)}
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isActive ? blurAmount * 15 : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur
              stdDeviation={isActive ? blurAmount : 0}
              result="blurred"
            />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <motion.span
        onHoverStart={mode === 'hover' ? handleHoverStart : undefined}
        onHoverEnd={mode === 'hover' ? handleHoverEnd : undefined}
        animate={{
          scale: bleedScale,
          letterSpacing,
          filter: isActive ? `url(#${filterId})` : 'none',
        }}
        transition={{
          duration: isActive ? 0.25 : 0.6,
          ease: isActive ? 'easeOut' : 'easeInOut',
        }}
        style={{
          display: 'inline-block',
          color,
          fontSize,
          fontFamily,
          fontWeight,
          lineHeight: 1.2,
          cursor: mode === 'hover' ? 'pointer' : undefined,
          transformOrigin: 'center center',
          ...style,
        }}
      >
        {text}
      </motion.span>
    </>
  );
}
