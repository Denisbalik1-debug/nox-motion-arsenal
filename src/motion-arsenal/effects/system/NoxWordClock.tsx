import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, seededRandom, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxWordClock — NOX System DNA. Die Zeit als Wortsatz, der sich selbst
// schreibt: Jede Minute rotiert der exakte Wort-Block (Stunde/Minute) um
// seine vertikale Achse (Flip). Deterministische, initiale Wort-Grid-Jitter
// aus dem det-PRNG (keine unseeded Zufallswerte). Kein rAF — zwei Timer (Minute + 30s), die
// nach Reduced Motion / Unmount sauber geräumt werden.
// ---------------------------------------------------------------------------

export interface NoxWordClockProps {
  /** 24h oder 12h Anzeige. */
  hour12?: boolean;
  /** 12h-Variante: Nachmittags-Suffix ("PM" / "NACHM."). */
  suffix?: string;
  /** Wortfarbe (Default Gold #d4af37). */
  color?: string;
  /** Farbe der bereits "vergangenen" Wörter (Satz-Logik). */
  dimColor?: string;
  /** Trennzeichen zwischen Stunden- und Minuten-Wort. */
  separator?: string;
  /** PRNG-Salz für den initialen Grid-Jitter. */
  seed?: number;
  /** Lockere, typografisch wertige Standardschrift. */
  font?: string;
}

const HOURS: string[] = [
  'ZWÖLF', 'EINS', 'ZWEI', 'DREI', 'VIER', 'FÜNF',
  'SECHS', 'SIEBEN', 'ACHT', 'NEUN', 'ZEHN', 'ELF',
];

const MINUTES: Record<number, string> = {
  0: 'PUNKT', 5: 'FÜNF NACH', 10: 'ZEHN NACH', 15: 'VIERTEL NACH',
  20: 'ZWANZIG NACH', 25: 'FÜNF VOR HALB', 30: 'HALB',
  35: 'FÜNF NACH HALB', 40: 'ZWANZIG VOR', 45: 'VIERTEL VOR',
  50: 'ZEHN VOR', 55: 'FÜNF VOR',
};

export function NoxWordClock({
  hour12 = true,
  suffix = 'PM',
  color = NOX_COLORS.gold,
  dimColor = 'rgba(240,236,228,0.28)',
  separator = '·',
  seed = 11,
  font = `'Cormorant Garamond', Georgia, serif`,
}: NoxWordClockProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  useInView(rootRef);

  const [now, setNow] = useState(() => new Date());
  const [flip, setFlip] = useState(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Reduzierte Bewegung: Zeitakt nur 30s; Flip-Fanfare entfällt (kein Rotieren).
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setFlip((f) => f + 1), 30000);
    return () => window.clearInterval(id);
  }, [reduced]);

  const h = now.getHours();
  const m = now.getMinutes();
  const bucket = Math.floor(m / 5) * 5;
  const nextBucket = (bucket + 5) % 60;
  const hourWord = HOURS[h % 12];
  const minuteWord = MINUTES[bucket];
  const minuteWordNext = MINUTES[nextBucket];

  const rnd = useMemo(() => seededRandom(seed), [seed]);
  const words = useMemo(
    () =>
      [hourWord, minuteWord].map((w) => ({
        w,
        rot: (rnd() - 0.5) * 3,
        drift: (rnd() - 0.5) * 2,
      })),
    [hourWord, minuteWord, rnd],
  );

  const flipMs = 620;
  const firstKey = `${h}-${bucket}-${flip}`;
  const secondKey = `${h}-${nextBucket}-${flip}`;

  return (
    <div
      ref={rootRef}
      className="nwc-root"
      style={{
        ['--nwc-color' as string]: color,
        ['--nwc-dim' as string]: dimColor,
        ['--nwc-font' as string]: font,
      }}
    >
      <style>{`
        .nwc-root { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 26px 18px; }
        .nwc-clock { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .nwc-word { position: relative; display: inline-block; color: var(--nwc-color); font: 400 40px/1.1 var(--nwc-font);
          letter-spacing: 0.03em; text-shadow: 0 0 22px color-mix(in srgb, var(--nwc-color) 42%, transparent); }
        .nwc-word.is-second { color: var(--nwc-dim); }
        .nwc-sep { color: color-mix(in srgb, var(--nwc-color) 45%, transparent); font-size: 30px; }
        .nwc-meta { font: 600 11px/1 var(--mono, ui-monospace, monospace); color: rgba(240,236,228,0.4);
          letter-spacing: 0.32em; text-transform: uppercase; }
        .nwc-cols { display: grid; grid-template-columns: repeat(5, 14px); gap: 5px; margin-top: 2px; }
        .nwc-col { width: 14px; height: 28px; border-radius: 3px; background: rgba(240,236,228,0.07);
          position: relative; overflow: hidden; }
        .nwc-col.on { background: linear-gradient(180deg, color-mix(in srgb, var(--nwc-color) 70%, transparent), color-mix(in srgb, var(--nwc-color) 25%, transparent)); }
        .nwc-col.on i { position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #0a0a0b; }
        @keyframes nwcFlip { from { transform: rotateX(0deg); } to { transform: rotateX(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .nwc-word { animation: none !important; }
        }
      `}</style>

      <div className="nwc-clock" role="timer" aria-label={`Es ist ${hourWord} ${minuteWord}`}>
        <span
          className="nwc-word"
          key={firstKey}
          style={{
            animation:
              !reduced && flip > 0
                ? `nwcFlip ${flipMs}ms cubic-bezier(.45,.05,.55,.95) both`
                : undefined,
            transform: words[0] ? `rotate(${words[0].rot.toFixed(2)}deg)` : undefined,
          }}
        >
          {hourWord}
        </span>
        <span className="nwc-sep" aria-hidden="true">
          {separator}
        </span>
        <span
          className="nwc-word is-second"
          key={secondKey}
          style={{
            animation:
              !reduced && flip > 0
                ? `nwcFlip ${flipMs}ms cubic-bezier(.45,.05,.55,.95) both`
                : undefined,
            transform: words[1] ? `rotate(${words[1].rot.toFixed(2)}deg)` : undefined,
          }}
        >
          {minuteWord}
        </span>
      </div>

      <div className="nwc-meta" aria-hidden="true">
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
        {hour12 ? ` ${suffix}` : ''}
      </div>

      {/* Deterministische Fünf-Minuten-Segmente (5 Spalten × 12) */}
      <div className="nwc-cols" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <span
            key={i}
            className={`nwc-col${i < m ? ' on' : ''}`}
            style={{ opacity: 0.65 }}
          >
            {i < m && i % 5 === 0 ? <i /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export default NoxWordClock;
