import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ScrambleText — cycles through random characters before settling on the
 * target text. On hover or auto-trigger, each character scrambles with
 * staggered timing. Ported from Originkit (originkit.dev/components/scrambletext),
 * Framer runtime stripped → plain React.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  mode?: 'auto' | 'hover' | 'once';
  speed?: number;         // ms per character scramble tick
  iterations?: number;    // how many scramble cycles before settling (3–10)
  triggerOnMount?: boolean;
  style?: React.CSSProperties;
}

export default function ScrambleText({
  text = 'SCRAMBLE',
  color = '#ffffff',
  fontSize = 48,
  fontFamily = 'monospace',
  fontWeight = 700,
  mode = 'auto',
  speed = 60,
  iterations = 5,
  triggerOnMount = true,
  style,
}: Props) {
  const [displayText, setDisplayText] = useState(text);
  const [scrambling, setScrambling] = useState(false);
  const intervalRef = useRef<number>(0);
  const mountedRef = useRef(false);

  const scramble = useCallback(() => {
    if (scrambling) return;
    setScrambling(true);

    const target = text;
    const len = target.length;
    let currentIter = 0;
    const charsPerIter = Math.max(1, Math.floor(len / iterations));
    const resolvedIndices = new Set<number>();

    // Phase 1: Full scramble
    const sc = () => {
      const out = Array.from(target).map((c, i) => {
        if (c === ' ') return ' ';
        if (resolvedIndices.has(i)) return target[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      });
      setDisplayText(out.join(''));
      currentIter++;
      if (currentIter > iterations) {
        // Phase 2: Settle — reveal chars left to right
        let settleIdx = 0;
        const settleInterval = setInterval(() => {
          // skip spaces
          while (settleIdx < len && target[settleIdx] === ' ') settleIdx++;
          if (settleIdx >= len) {
            clearInterval(settleInterval);
            setDisplayText(target);
            setScrambling(false);
            return;
          }
          resolvedIndices.add(settleIdx);
          const settled = Array.from(target).map((c, j) =>
            resolvedIndices.has(j) ? target[j] : CHARS[Math.floor(Math.random() * CHARS.length)]
          );
          setDisplayText(settled.join(''));
          settleIdx++;
        }, speed * 1.5);
        clearInterval(intervalRef.current);
        return;
      }
    };
    intervalRef.current = window.setInterval(sc, speed);
  }, [text, speed, iterations, scrambling]);

  useEffect(() => {
    if (mode === 'once' && triggerOnMount && !mountedRef.current) {
      mountedRef.current = true;
      scramble();
    }
    if (mode === 'auto') {
      scramble();
      const autoInterval = setInterval(() => {
        // After 4s settled, re-scramble
        const t = setTimeout(() => scramble(), 4000);
        return t;
      }, 4000 + iterations * speed * 2);
      return () => clearInterval(autoInterval);
    }
  }, [mode, scramble, triggerOnMount]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <span
      onMouseEnter={mode === 'hover' ? scramble : undefined}
      style={{
        color,
        fontSize,
        fontFamily,
        fontWeight,
        display: 'inline-block',
        lineHeight: 1.2,
        cursor: mode === 'hover' ? 'pointer' : undefined,
        ...style,
      }}
    >
      {displayText}
    </span>
  );
}
