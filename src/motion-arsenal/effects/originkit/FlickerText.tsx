import { useEffect, useRef, useState } from 'react';

/**
 * FlickerText — a word "boots up" through a sequence of filled/outline/
 * invisible flicker phases (optionally with a random per-letter stroke/
 * opacity flicker layered on top and a horizontal shake). Plays once when
 * scrolled into view, and optionally replays on hover.
 * Ported from Originkit (originkit.dev/components/flickertext, source name
 * "OutlineFillText"), Framer runtime + property-controls stripped.
 *
 * NOTE: the upstream component also supports an image mode and fully
 * independent enter/hover flicker configs (8+ nested control objects). To
 * keep this a flat, props-panel-friendly component we ported the text-only
 * path with a single flicker config shared by the enter trigger and the
 * optional hover replay.
 */

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      const d = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      if (d === 0) break;
      t -= dx / d;
    }
    return sampleY(Math.max(0, Math.min(1, t)));
  };
}

function makeEaseFn(ease: unknown): (t: number) => number {
  if (Array.isArray(ease) && ease.length === 4) return cubicBezier(ease[0], ease[1], ease[2], ease[3]);
  switch (ease) {
    case 'linear':
      return (t) => t;
    case 'easeIn':
      return (t) => t * t;
    case 'easeOut':
      return (t) => 1 - (1 - t) * (1 - t);
    case 'easeInOut':
      return (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
    default:
      return (t) => t;
  }
}

type RestState = 'filled' | 'outline' | 'invisible';

interface Props {
  text?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontColor?: string;
  duration?: number;
  ease?: string;
  flickerCount?: number;
  showStroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  restState?: RestState;
  delay?: number;
  shakeEnabled?: boolean;
  shakeWidth?: number;
  shakeSpeed?: number;
  letterFlickerEnabled?: boolean;
  letterFlickerMode?: 'stroke' | 'opacity';
  letterFlickerIntensity?: number;
  letterFlickerOpacity?: number;
  replayOnHover?: boolean;
  style?: React.CSSProperties;
}

interface FlickerCfg {
  duration: number;
  ease: string;
  flickerCount: number;
  showStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  restState: RestState;
  delay: number;
  shakeEnabled: boolean;
  shakeWidth: number;
  shakeSpeed: number;
  letterFlickerEnabled: boolean;
  letterFlickerMode: 'stroke' | 'opacity';
  letterFlickerIntensity: number;
  letterFlickerOpacity: number;
}

function buildVisibleItems(cfg: FlickerCfg): string[] {
  if (!cfg.showStroke) return Array(cfg.flickerCount).fill('filled');
  const strokes = ['outline'];
  const fillCount = Math.max(1, cfg.flickerCount - 1);
  return [...strokes, ...Array(fillCount).fill('filled')];
}

function generateTimings(count: number, totalMs: number, ease: unknown): number[] {
  const fn = makeEaseFn(ease);
  const intervals: number[] = [];
  let prev = 0;
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const cur = fn(t) * totalMs;
    intervals.push(Math.max(0, cur - prev));
    prev = cur;
  }
  return intervals;
}

export default function FlickerText(props: Props) {
  const {
    text = 'FLICKER',
    tag = 'h1',
    fontSize = 96,
    fontFamily = 'Inter',
    fontWeight = 700,
    fontColor = '#ffffff',
    duration = 2,
    ease = 'easeInOut',
    flickerCount = 6,
    showStroke = true,
    strokeColor = '#ffffff',
    strokeWidth = 1.5,
    restState = 'filled',
    delay = 0,
    shakeEnabled = false,
    shakeWidth = 10,
    shakeSpeed = 10,
    letterFlickerEnabled = true,
    letterFlickerMode = 'opacity',
    letterFlickerIntensity = 10,
    letterFlickerOpacity = 30,
    replayOnHover = false,
    style,
  } = props;

  const cfg: FlickerCfg = {
    duration,
    ease,
    flickerCount,
    showStroke,
    strokeColor,
    strokeWidth,
    restState,
    delay,
    shakeEnabled,
    shakeWidth,
    shakeSpeed,
    letterFlickerEnabled,
    letterFlickerMode,
    letterFlickerIntensity,
    letterFlickerOpacity,
  };

  const [currentPhase, setCurrentPhase] = useState<string>(restState);
  const [moveX, setMoveX] = useState(0);
  const [flickerLetters, setFlickerLetters] = useState<Set<number>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasPlayedRef = useRef(false);

  function runAnimation(c: FlickerCfg) {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFlickerLetters(new Set());

    const totalMs = c.duration * 1000;
    const chars = text.split('');
    const nonSpaceIndices = chars.reduce<number[]>((acc, ch, i) => {
      if (ch.trim() !== '') acc.push(i);
      return acc;
    }, []);

    const scheduleTicks = (windowStart: number, windowDuration: number) => {
      if (!c.letterFlickerEnabled || nonSpaceIndices.length === 0) return;
      const cycleDuration = Math.round(1000 * Math.pow(50 / 1000, (c.letterFlickerIntensity - 1) / 19));
      const sub1 = Math.round(cycleDuration / 3);
      const sub2 = Math.round((2 * cycleDuration) / 3);
      const windowEnd = windowStart + windowDuration;
      let tickCursor = windowStart;
      while (tickCursor < windowEnd) {
        const tFlicker1 = tickCursor;
        const tFill = tickCursor + sub1;
        const tFlicker2 = tickCursor + sub2;
        const slot = { sel: new Set<number>() };
        timersRef.current.push(
          setTimeout(() => {
            const count = Math.min(nonSpaceIndices.length, Math.floor(Math.random() * 2) + 1);
            const shuffled = [...nonSpaceIndices].sort(() => Math.random() - 0.5);
            slot.sel = new Set(shuffled.slice(0, count));
            setFlickerLetters(slot.sel);
          }, tFlicker1),
        );
        if (tFill < windowEnd) {
          timersRef.current.push(setTimeout(() => setFlickerLetters(new Set()), tFill));
        }
        if (tFlicker2 < windowEnd) {
          timersRef.current.push(setTimeout(() => setFlickerLetters(slot.sel), tFlicker2));
        }
        tickCursor += cycleDuration;
      }
      timersRef.current.push(setTimeout(() => setFlickerLetters(new Set()), windowEnd));
    };

    setCurrentPhase(c.restState);
    setMoveX(0);
    const visibleItems = buildVisibleItems(c);
    const sequence: string[] = [];
    visibleItems.forEach((item) => {
      sequence.push('invisible');
      sequence.push(item);
    });
    const intervals = generateTimings(sequence.length, totalMs, c.ease);

    let cursor = c.delay * 1000;
    const phaseSlots: { phase: string; startMs: number; durationMs: number }[] = [];
    sequence.forEach((phase, i) => {
      const startMs = cursor;
      const durationMs = intervals[i] ?? 0;
      phaseSlots.push({ phase, startMs, durationMs });
      timersRef.current.push(setTimeout(() => setCurrentPhase(phase), startMs));
      cursor += durationMs;
    });
    timersRef.current.push(
      setTimeout(() => {
        setCurrentPhase(c.restState);
        setMoveX(0);
        setFlickerLetters(new Set());
      }, cursor),
    );

    if (c.shakeEnabled) {
      const flipMs = Math.round(500 * Math.pow(30 / 500, (c.shakeSpeed - 1) / 19));
      const animStart = c.delay * 1000;
      const animEnd = cursor;
      let flipCursor = animStart;
      let dir = 1;
      while (flipCursor < animEnd) {
        const t = flipCursor;
        const d = dir;
        timersRef.current.push(setTimeout(() => setMoveX(d * c.shakeWidth), t));
        dir *= -1;
        flipCursor += flipMs;
      }
    }

    phaseSlots.forEach(({ phase, startMs, durationMs }) => {
      if (phase !== 'filled' && phase !== 'outline') return;
      scheduleTicks(startMs, durationMs);
    });
  }

  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayedRef.current) {
            hasPlayedRef.current = true;
            runAnimation(cfg);
          }
        });
      },
      { threshold: 0 },
    );
    observer.observe(elementRef.current);
    return () => {
      observer.disconnect();
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, flickerCount, showStroke, ease]);

  const handleMouseEnter = () => {
    if (!replayOnHover) return;
    runAnimation(cfg);
  };

  const getTextStyle = (): React.CSSProperties => {
    switch (currentPhase) {
      case 'invisible':
        return { color: 'transparent', WebkitTextStroke: '0px transparent' };
      case 'outline':
        return { color: 'transparent', WebkitTextStroke: `${strokeWidth}px ${strokeColor}` };
      case 'filled':
        return { color: fontColor, WebkitTextStroke: '0px transparent' };
      default:
        return { color: 'transparent' };
    }
  };

  const getFlickerLetterStyle = (): React.CSSProperties => {
    if (letterFlickerMode === 'stroke') {
      if (currentPhase === 'outline') return { opacity: 0, color: 'transparent', WebkitTextStroke: '0px transparent' };
      return { color: 'transparent', WebkitTextStroke: `${strokeWidth}px ${strokeColor}` };
    }
    return { opacity: letterFlickerOpacity / 100 };
  };

  const renderText = () => {
    if (!letterFlickerEnabled || (currentPhase !== 'filled' && currentPhase !== 'outline') || flickerLetters.size === 0) {
      return text;
    }
    return text.split('').map((char, i) => {
      if (char.trim() === '' || !flickerLetters.has(i)) return <span key={i}>{char}</span>;
      return (
        <span key={i} style={getFlickerLetterStyle()}>
          {char}
        </span>
      );
    });
  };

  const Tag = tag as any;

  return (
    <Tag
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      style={{
        margin: 0,
        padding: 0,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        fontFamily,
        fontSize,
        fontWeight,
        transform: `translateX(${moveX}px)`,
        cursor: replayOnHover ? 'default' : undefined,
        ...getTextStyle(),
        ...(style || {}),
      }}
    >
      {renderText()}
    </Tag>
  );
}
