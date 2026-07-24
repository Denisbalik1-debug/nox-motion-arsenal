import React, { useRef } from 'react';
import { usePrefersReducedMotion, useRafLoop, damp, clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScrollVelocitySkew — Inhalt reagiert auf Scroll-GESCHWINDIGKEIT, nicht
// Position: skew/letter-spacing/blur proportional zur Velocity, federt mit
// Dämpfung zurück (KRANK SecondOrderDynamics: velocity accumulation →
// damping 8-15). Marquee-Zeilen beschleunigen mit der Velocity.
// ---------------------------------------------------------------------------

export interface ScrollVelocitySkewProps {
  skewMax?: number; // deg bei voller Velocity
  damping?: number; // Rückfeder-Lambda
  marqueeBase?: number; // Basis-Marquee-Speed px/s
  accent?: string;
}

const LINES = ['FORGE THE SIGNAL', 'VELOCITY IS TRUTH', 'NO AUTOPILOT', 'RANK OVER NOISE'];

export function ScrollVelocitySkew({ skewMax = 10, damping = 9, marqueeBase = 40, accent = NOX_COLORS.red }: ScrollVelocitySkewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const marqueeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ lastTop: 0, vel: 0, smooth: 0, offsets: [0, 0, 0, 0] });

  useRafLoop((dt) => {
    const sc = scrollerRef.current;
    const content = contentRef.current;
    if (!sc || !content) return;
    const s = state.current;
    // Velocity aus Positions-Delta (KRANK: wheel → velocity accumulation)
    const v = (sc.scrollTop - s.lastTop) / Math.max(dt, 0.001);
    s.lastTop = sc.scrollTop;
    s.vel = damp(s.vel, v, 20, dt); // schnelle Aufnahme
    s.smooth = damp(s.smooth, s.vel, damping, dt); // träge Rückfeder
    const norm = clamp(s.smooth / 1400, -1, 1);

    content.style.transform = `skewY(${(-norm * skewMax).toFixed(2)}deg)`;
    content.style.filter = Math.abs(norm) > 0.08 ? `blur(${(Math.abs(norm) * 2.2).toFixed(2)}px)` : 'none';

    marqueeRefs.current.forEach((el, i) => {
      if (!el) return;
      const dir = i % 2 === 0 ? 1 : -1;
      s.offsets[i] = (s.offsets[i] + dir * (marqueeBase + Math.abs(s.smooth) * 0.45) * dt) % (el.scrollWidth / 2 || 1);
      el.style.transform = `translateX(${(-Math.abs(s.offsets[i])).toFixed(1)}px)`;
      el.style.letterSpacing = `${(0.08 + Math.abs(norm) * 0.35).toFixed(3)}em`;
    });
  }, !reduced);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <div ref={scrollerRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div ref={contentRef} style={{ willChange: 'transform', padding: '40px 0 60px' }}>
          <div style={{ textAlign: 'center', fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginBottom: 22 }}>
            SCROLL FAST — CONTENT REACTS TO VELOCITY
          </div>
          {Array.from({ length: 4 }).map((_, block) => (
            <div key={block} style={{ marginBottom: 56 }}>
              {LINES.map((line, i) => (
                <div key={i} style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '6px 0', borderTop: '1px solid #1b1b20' }}>
                  <div
                    ref={(el) => {
                      marqueeRefs.current[i] = el;
                    }}
                    style={{ display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform', fontSize: 'clamp(26px, 5vw, 52px)', fontWeight: 780, color: i % 2 === 0 ? NOX_COLORS.text : 'transparent', WebkitTextStroke: i % 2 === 0 ? undefined : `1px ${accent}`, letterSpacing: '0.08em' }}
                  >
                    {Array.from({ length: 6 }).map((_, r) => (
                      <span key={r} style={{ paddingRight: 48 }}>
                        {line} <span style={{ color: accent }}>◆</span>{' '}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScrollVelocitySkew;
