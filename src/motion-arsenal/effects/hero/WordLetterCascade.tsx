import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// WordLetterCascade — Buchstaben-Kaskade mit per-Letter rotation/translateY/
// blur. Das Delay-Timing ist NICHT linear gestaffelt, sondern folgt dem
// Shopify-Butterflies-Muster (Butterflies-CFpdR9tM.js:307-390): 3 überlagerte
// Sinus-Phasen — wave = sin(i*a+p1)*1.0 + sin(i*2.1+p2)*0.2 +
// sin(i*0.37+p3)*0.3 — geben jedem Buchstaben ein organisches, nie
// mechanisches Einsetzen. Rotation/Richtung wird ebenfalls von der Welle
// moduliert.
// ---------------------------------------------------------------------------

export interface WordLetterCascadeProps {
  text?: string;
  speed?: number;
  waviness?: number; // 0..2 — how much the sine phases warp the stagger
  rotation?: number; // max per-letter entry rotation in degrees
  color?: string;
  seed?: number;
  loop?: boolean;
}

export function WordLetterCascade({
  text = 'SIGNAL FORGED IN THE DARK',
  speed = 1,
  waviness = 1,
  rotation = 14,
  color = NOX_COLORS.text,
  seed = 5,
  loop = true,
}: WordLetterCascadeProps) {
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const s = Math.max(speed, 0.2);

  // 3 Sinus-Phasen (deterministisch) — das Butterfly-Wave-Muster als Stagger.
  const { words, maxDelay } = useMemo(() => {
    const rnd = seededRandom(seed);
    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;
    const p3 = rnd() * Math.PI * 2;
    let i = 0;
    let max = 0;
    const built = text.split(/\s+/).filter(Boolean).map((word) => ({
      word,
      letters: word.split('').map((ch) => {
        const wave =
          Math.sin(i * 0.9 + p1) * 1.0 + Math.sin(i * 2.1 + p2) * 0.2 + Math.sin(i * 0.37 + p3) * 0.3;
        const delay = (i * 0.045 + (wave * 0.5 + 0.5) * 0.4 * waviness) / s;
        const rot = wave * rotation;
        i += 1;
        if (delay > max) max = delay;
        return { ch, delay, rot };
      }),
    }));
    return { words: built, maxDelay: max };
  }, [text, seed, waviness, rotation, s]);

  const inDur = 0.85 / s;
  const cycleMs = (maxDelay + inDur) * 1000 + 2600;

  useEffect(() => {
    if (reduced || !loop) return;
    const id = setInterval(() => setCycle((c) => c + 1), cycleMs);
    return () => clearInterval(id);
  }, [reduced, loop, cycleMs]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 95% at 50% 112%, #130b0c 0%, ${NOX_COLORS.bg} 60%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes wlc-in {
          from {
            opacity: 0;
            transform: translateY(0.75em) rotate(var(--wlc-r, 0deg)) scale(0.92);
            filter: blur(7px);
          }
          60% { filter: blur(0px); }
          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
            filter: blur(0px);
          }
        }
        .wlc-letter {
          display: inline-block;
          will-change: transform, filter, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .wlc-letter { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}</style>
      <div
        key={cycle}
        style={{
          padding: '0 7%',
          maxWidth: 860,
          textAlign: 'center',
          fontSize: 'clamp(24px, 5.4vw, 62px)',
          fontWeight: 790,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          color,
        }}
      >
        {words.map((w, wi) => (
          <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.28em' }}>
            {w.letters.map((l, li) => (
              <span
                key={li}
                className="wlc-letter"
                style={
                  {
                    '--wlc-r': `${l.rot.toFixed(1)}deg`,
                    opacity: reduced ? 1 : 0,
                    animation: reduced ? undefined : `wlc-in ${inDur}s ${EASE.outBack} ${l.delay.toFixed(3)}s both`,
                  } as CSSProperties
                }
              >
                {l.ch}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export default WordLetterCascade;
