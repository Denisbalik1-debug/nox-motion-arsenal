import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TypeWriter — typewriter effect that types out characters one by one,
 * with an optional blinking cursor. Supports loop, auto-restart, and
 * configurable speed. Ported from Originkit
 * (originkit.dev/components/typewriter), Framer runtime stripped.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  speed?: number;           // ms per character
  cursor?: boolean;
  cursorChar?: string;
  cursorColor?: string;
  loop?: boolean;
  delay?: number;           // ms before starting
  pauseAfter?: number;      // ms after full text before restart (only loop)
  mode?: 'forward' | 'forward-back' | 'random';
  style?: React.CSSProperties;
}

export default function TypeWriter({
  text = 'Hello, World!',
  color = '#ffffff',
  fontSize = 32,
  fontFamily = 'monospace',
  fontWeight = 400,
  speed = 80,
  cursor = true,
  cursorChar = '|',
  cursorColor = '#ffffff',
  loop = false,
  delay = 500,
  pauseAfter = 2500,
  mode = 'forward',
  style,
}: Props) {
  const [displayIdx, setDisplayIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [started, setStarted] = useState(false);
  const timeoutRef = useRef<number>(0);

  const reset = useCallback(() => {
    setDisplayIdx(0);
    setDirection(1);
    setStarted(false);
  }, []);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (mode === 'forward') {
      if (displayIdx <= text.length) {
        timeoutRef.current = window.setTimeout(() => {
          setDisplayIdx(i => i + 1);
        }, speed);
      } else if (loop) {
        timeoutRef.current = window.setTimeout(reset, pauseAfter);
      }
    } else if (mode === 'forward-back') {
      if (direction === 1) {
        if (displayIdx <= text.length) {
          timeoutRef.current = window.setTimeout(() => setDisplayIdx(i => i + 1), speed);
        } else {
          timeoutRef.current = window.setTimeout(() => setDirection(-1), pauseAfter);
        }
      } else {
        if (displayIdx >= 0) {
          timeoutRef.current = window.setTimeout(() => setDisplayIdx(i => i - 1), speed / 2);
        } else if (loop) {
          timeoutRef.current = window.setTimeout(reset, pauseAfter);
        }
      }
    } else if (mode === 'random') {
      // Random incremental reveal
      if (displayIdx < text.length) {
        const nextJump = Math.max(1, Math.floor(Math.random() * 4));
        timeoutRef.current = window.setTimeout(() => {
          setDisplayIdx(i => Math.min(i + nextJump, text.length));
        }, speed * (0.5 + Math.random()));
      } else if (loop) {
        timeoutRef.current = window.setTimeout(reset, pauseAfter);
      }
    }

    return () => clearTimeout(timeoutRef.current);
  }, [displayIdx, started, direction, mode, loop, speed, pauseAfter, text.length, reset]);

  const displayText = text.slice(0, displayIdx);

  return (
    <span style={{ color, fontSize, fontFamily, fontWeight, display: 'inline-block', lineHeight: 1.4, ...style }}>
      {displayText}
      {cursor && (
        <span
          style={{
            color: cursorColor,
            opacity: displayIdx > text.length ? 0 : 1,
            animation: displayIdx <= text.length ? 'tw-blink 0.8s step-end infinite' : 'none',
            marginLeft: 1,
          }}
        >
          {cursorChar}
        </span>
      )}
      <style>{`
        @keyframes tw-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
