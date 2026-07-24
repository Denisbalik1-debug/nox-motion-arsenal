import { useCallback, useEffect, useRef, useState } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// MaskedRouteTransition — View-Transition-API-Ästhetik (Shopify Editions:
// `view-transition-name: navigation`) nachgebaut mit CSS clip-path + Scale-
// Choreografie: die neue Route wächst als Maske (Kreis oder Diamant) aus dem
// Origin-Punkt, die alte Route skaliert leicht zurück und dimmt; ein
// Akzent-Ring folgt der Maskenkante als Glow-Trace.
// ---------------------------------------------------------------------------

export interface MaskedRouteTransitionProps {
  shape?: 'circle' | 'diamond';
  origin?: 'center' | 'top-left' | 'bottom-right';
  speed?: number;
  accent?: string;
}

const ORIGINS: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 50 },
  'top-left': { x: 12, y: 14 },
  'bottom-right': { x: 88, y: 86 },
};

function RoutePage({ variant, accent }: { variant: 0 | 1; accent: string }) {
  const isA = variant === 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: isA
          ? 'linear-gradient(160deg, #120a0c 0%, #0a0a0b 55%, #0d0d10 100%)'
          : 'linear-gradient(200deg, #0a0f10 0%, #0a0a0b 55%, #100d0d 100%)',
        color: NOX_COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '5% 6%',
      }}
    >
      <div style={{ display: 'flex', gap: 14, fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.25em', color: NOX_COLORS.textDim }}>
        <span style={{ color: isA ? accent : NOX_COLORS.textDim }}>/FORGE</span>
        <span style={{ color: isA ? NOX_COLORS.textDim : NOX_COLORS.gold }}>/SIGNAL</span>
        <span>/SYSTEM</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.35em', color: isA ? accent : NOX_COLORS.gold }}>
          {isA ? 'ROUTE 01' : 'ROUTE 02'}
        </div>
        <div style={{ fontSize: 'clamp(22px, 5.5vw, 50px)', fontWeight: 780, letterSpacing: '-0.03em', lineHeight: 1.02, marginTop: 6 }}>
          {isA ? 'THE FORGE' : 'SIGNAL DECK'}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: NOX_COLORS.textDim, maxWidth: 360 }}>
          {isA
            ? 'Build ranks. Burn plateaus. Every rep feeds the system.'
            : 'Live telemetry of every node — scan, rank, repeat.'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 6,
              background: 'rgba(240,236,228,0.04)',
              border: '1px solid rgba(240,236,228,0.09)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.15em',
              color: NOX_COLORS.textDim,
            }}
          >
            {isA ? ['RANK 04', 'XP 1280', 'STREAK 9'][i] : ['NODES 32', 'SCAN OK', 'PING 12'][i]}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MaskedRouteTransition({
  shape = 'circle',
  origin = 'center',
  speed = 1,
  accent = NOX_COLORS.red,
}: MaskedRouteTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState<0 | 1>(reduced ? 1 : 0);
  const [overlay, setOverlay] = useState<0 | 1 | null>(null);
  const [expanded, setExpanded] = useState(false);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);

  const spd = Math.max(0.3, Math.min(3, speed));
  const durS = 1.0 / spd;
  const o = ORIGINS[origin] ?? ORIGINS.center;

  const clipFrom =
    shape === 'diamond'
      ? `polygon(${o.x}% ${o.y - 0.5}%, ${o.x + 0.5}% ${o.y}%, ${o.x}% ${o.y + 0.5}%, ${o.x - 0.5}% ${o.y}%)`
      : `circle(0% at ${o.x}% ${o.y}%)`;
  const clipTo =
    shape === 'diamond'
      ? `polygon(${o.x}% ${o.y - 180}%, ${o.x + 180}% ${o.y}%, ${o.x}% ${o.y + 180}%, ${o.x - 180}% ${o.y}%)`
      : `circle(145% at ${o.x}% ${o.y}%)`;

  const trigger = useCallback(() => {
    if (busy.current) return;
    if (reduced) {
      setCurrent((c) => (c === 0 ? 1 : 0));
      return;
    }
    busy.current = true;
    setOverlay(current === 0 ? 1 : 0);
    setExpanded(false);
    // Double-rAF so the collapsed clip-path is committed before transitioning.
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
    timers.current.push(
      window.setTimeout(() => {
        setCurrent((c) => (c === 0 ? 1 : 0));
        setOverlay(null);
        setExpanded(false);
        busy.current = false;
      }, durS * 1000 + 120),
    );
  }, [reduced, current, durS]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(trigger, 3500);
    return () => window.clearInterval(id);
  }, [reduced, trigger]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const ringSize = expanded ? '250%' : '0%';

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      {/* Outgoing route: scales back + dims while the mask grows over it */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: overlay !== null && expanded ? 'scale(0.94)' : 'scale(1)',
          filter: overlay !== null && expanded ? 'brightness(0.55)' : 'brightness(1)',
          transition: `transform ${durS}s ${EASE.outExpo}, filter ${durS}s ${EASE.outExpo}`,
          willChange: 'transform',
        }}
      >
        <RoutePage variant={current} accent={accent} />
      </div>
      {/* Incoming route under growing mask + counter-scale (1.07 → 1) */}
      {overlay !== null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: expanded ? clipTo : clipFrom,
            transition: `clip-path ${durS}s ${EASE.outExpo}`,
            zIndex: 10,
            willChange: 'clip-path',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: expanded ? 'scale(1)' : 'scale(1.07)',
              transition: `transform ${durS}s ${EASE.outExpo}`,
            }}
          >
            <RoutePage variant={overlay} accent={accent} />
          </div>
        </div>
      )}
      {/* Accent ring tracing the mask edge */}
      {overlay !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${o.x}%`,
            top: `${o.y}%`,
            width: ringSize,
            aspectRatio: '1',
            transform: `translate(-50%, -50%) ${shape === 'diamond' ? 'rotate(45deg)' : ''}`,
            borderRadius: shape === 'diamond' ? 6 : '50%',
            border: `1.5px solid ${accent}`,
            boxShadow: `0 0 24px ${accent}, inset 0 0 24px ${accent}44`,
            opacity: expanded ? 0 : 0.95,
            transition: `width ${durS}s ${EASE.outExpo}, opacity ${durS * 0.9}s ${EASE.sharpIn}`,
            zIndex: 11,
            pointerEvents: 'none',
          }}
        />
      )}
      <button
        onClick={trigger}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 50,
          background: 'rgba(17,17,20,0.8)',
          border: `1px solid ${accent}`,
          color: NOX_COLORS.text,
          fontFamily: 'monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          padding: '7px 14px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        NAVIGATE →
      </button>
    </div>
  );
}

export default MaskedRouteTransition;
