import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// MassiveTypographyReveal — riesige Display-Typo, Zeilen per overflow-clip
// maskiert, gestaffelter Slide-up (outExpo) + anschließendes Weight/Tracking-
// Settle. Mechanik: Shopify Editions Nav-Entrance-Cascade (animation-delay
// 500ms + 100ms-Steps, -translate-y-full → 0) kombiniert mit der mask-/clip-
// Reveal-Technik aus shopify.css. NOX-adaptiert: Ember-Akzent, Scan-Kicker.
// ---------------------------------------------------------------------------

export interface MassiveTypographyRevealProps {
  lines?: string[];
  speed?: number; // 0.4..2 — playback multiplier
  stagger?: number; // seconds between lines
  accent?: string; // underline / kicker accent
  loop?: boolean; // replay the reveal periodically
}

export function MassiveTypographyReveal({
  lines = ['FORGE', 'THE', 'SIGNAL'],
  speed = 1,
  stagger = 0.14,
  accent = NOX_COLORS.red,
  loop = true,
}: MassiveTypographyRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const s = Math.max(speed, 0.2);

  // Total choreography length → replay interval (reveal + hold).
  const cycleMs = useMemo(
    () => ((1.1 + 0.9 + lines.length * stagger) / s) * 1000 + 2600,
    [lines.length, stagger, s],
  );

  useEffect(() => {
    if (reduced || !loop) return;
    const id = setInterval(() => setCycle((c) => c + 1), cycleMs);
    return () => clearInterval(id);
  }, [reduced, loop, cycleMs]);

  const riseDur = 1.1 / s;
  const settleDur = 0.9 / s;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(130% 100% at 50% 115%, #150a0b 0%, ${NOX_COLORS.bg} 60%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes mtr-rise {
          from { transform: translateY(112%) skewY(4deg); }
          to   { transform: translateY(0) skewY(0deg); }
        }
        @keyframes mtr-settle {
          from { letter-spacing: 0.06em; font-weight: 650; }
          to   { letter-spacing: -0.015em; font-weight: 800; }
        }
        @keyframes mtr-underline {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes mtr-kicker {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mtr-anim { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
      <div key={cycle} style={{ padding: '0 6%', maxWidth: '100%' }}>
        <div
          className="mtr-anim"
          style={{
            fontFamily: 'var(--mono, monospace)',
            fontSize: 10,
            letterSpacing: '0.4em',
            color: accent,
            marginBottom: '0.9em',
            opacity: reduced ? 1 : 0,
            animation: reduced ? undefined : `mtr-kicker ${0.6 / s}s ${EASE.outExpo} ${0.1 / s}s both`,
          }}
        >
          NOX // TRANSMISSION
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              // Per-line mask: the clip window the glyphs slide up through.
              overflow: 'clip',
              lineHeight: 1.02,
              paddingBottom: '0.04em',
            }}
          >
            <div
              className="mtr-anim"
              style={{
                fontSize: 'clamp(30px, 9vw, 110px)',
                fontWeight: reduced ? 800 : 650,
                letterSpacing: reduced ? '-0.015em' : '0.06em',
                color: NOX_COLORS.text,
                transform: reduced ? 'none' : 'translateY(112%)',
                willChange: 'transform, letter-spacing',
                animation: reduced
                  ? undefined
                  : `mtr-rise ${riseDur}s ${EASE.outExpo} ${(i * stagger) / s}s both, ` +
                    `mtr-settle ${settleDur}s ${EASE.outQuint} ${(riseDur * 0.75 + i * stagger) / s}s both`,
              }}
            >
              {line}
            </div>
          </div>
        ))}
        <div
          className="mtr-anim"
          style={{
            height: 3,
            width: 'clamp(80px, 22%, 220px)',
            marginTop: '0.7em',
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            transformOrigin: 'left center',
            transform: reduced ? 'none' : 'scaleX(0)',
            animation: reduced
              ? undefined
              : `mtr-underline ${0.8 / s}s ${EASE.outExpo} ${(riseDur * 0.7 + lines.length * stagger) / s}s both`,
          }}
        />
      </div>
    </div>
  );
}

export default MassiveTypographyReveal;
