import { useId, useMemo } from 'react';

/**
 * TextMorph — cycles through a list of words, morphing between them via an
 * SVG gooey-blur filter (blur + feColorMatrix threshold) plus scale/opacity.
 * Ported from Originkit (originkit.dev/components/textmorph), Framer
 * runtime stripped.
 */

function mapEaseToCSS(ease: unknown): string {
  if (Array.isArray(ease) && ease.length === 4) {
    return `cubic-bezier(${ease.join(',')})`;
  }
  switch (ease) {
    case 'linear':
      return 'linear';
    case 'easeIn':
      return 'ease-in';
    case 'easeOut':
      return 'ease-out';
    case 'easeInOut':
      return 'ease-in-out';
    case 'circIn':
      return 'cubic-bezier(0.6, 0.04, 0.98, 0.335)';
    case 'circOut':
      return 'cubic-bezier(0.075, 0.82, 0.165, 1)';
    case 'circInOut':
      return 'cubic-bezier(0.785, 0.135, 0.15, 0.86)';
    case 'backIn':
      return 'cubic-bezier(0.6, -0.28, 0.735, 0.045)';
    case 'backOut':
      return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    case 'backInOut':
      return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    default:
      return 'ease-in-out';
  }
}

interface Props {
  words?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  morphDuration?: number;
  holdDuration?: number;
  ease?: string;
  tag?: string;
  style?: React.CSSProperties;
}

export default function TextMorph(props: Props) {
  const {
    words = 'DESIGN\nCODE\nMOTION\nSHIP',
    color = '#ffffff',
    fontSize = 64,
    fontFamily = 'Inter',
    fontWeight = 700,
    textAlign = 'center',
    morphDuration = 1,
    holdDuration = 1,
    ease = 'easeInOut',
    tag = 'div',
    style,
  } = props;

  const morph = Math.max(0.1, morphDuration);
  const hold = Math.max(0, holdDuration);
  const easeCSS = mapEaseToCSS(ease);

  const Tag = tag as any;

  const wordList = useMemo<string[]>(
    () =>
      words
        .split(/\r?\n|,/)
        .map((w) => w.trim())
        .filter(Boolean),
    [words],
  );

  const rawId = useId();
  const safeId = rawId.replace(/[:]/g, '');
  const filterId = `tm-thr-${safeId}`;
  const animName = `tm-rot-${safeId}`;

  const count = Math.max(1, wordList.length);
  const slot = morph + hold;
  const cycle = slot * count;
  const pct = (s: number) => Math.min(100, (s / cycle) * 100).toFixed(4);
  const mIn = pct(morph);
  const mHold = pct(morph + hold);
  const mOut = pct(2 * morph + hold);

  const keyframes = `
@keyframes ${animName} {
  0% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(0.8);
  }
  ${mIn}% {
    opacity: 1;
    filter: blur(0px);
    transform: translate(-50%, -50%) scale(1);
  }
  ${mHold}% {
    opacity: 1;
    filter: blur(0px);
    transform: translate(-50%, -50%) scale(1);
  }
  ${mOut}%, 100% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(1.2);
  }
}
`;

  const fontStyle: React.CSSProperties = { fontFamily, fontSize, fontWeight };

  const longest = wordList.reduce((acc, w) => (w.length > acc.length ? w : acc), '');

  return (
    <Tag
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        ...(style || {}),
      }}
    >
      <style>{keyframes}</style>

      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden>
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: 'relative',
          filter: `url(#${filterId})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign,
          color,
          ...fontStyle,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            lineHeight: 1.2,
            minHeight: '1.2em',
          }}
        >
          <span style={{ visibility: 'hidden', whiteSpace: 'nowrap', display: 'inline-block' }}>
            {longest || ' '}
          </span>

          {wordList.map((word, i) => (
            <span
              key={`${word}-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                color,
                whiteSpace: 'nowrap',
                animation: `${animName} ${cycle}s ${(slot * i).toFixed(3)}s infinite ${easeCSS}`,
                willChange: 'opacity, filter, transform',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </Tag>
  );
}
