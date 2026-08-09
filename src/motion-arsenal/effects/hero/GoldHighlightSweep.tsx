import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GoldHighlightSweep — NOX Hero DNA.
// Fließtext, in dem markierte Wörter beim Einlaufen einen Gold-Marker
// bekommen: der Verlauf wächst über background-size von 0% auf 100%, sodass
// nur der Hintergrund animiert wird und der Text selbst nie neu gezeichnet
// werden muss. Markiert wird über *Sternchen* im Text, die Marker laufen
// gestaffelt nach Reihenfolge — kein Zufall, damit die Betonung reproduzierbar
// bleibt.
// ---------------------------------------------------------------------------

export interface GoldHighlightSweepProps {
  /** Text; *markierte* Stellen bekommen den Marker. */
  text?: string;
  /** Farbe des Markers. */
  color?: string;
  /** Tempo des Wischers. */
  speed?: number;
  /** Marker leicht schräg wie mit dem Textmarker gezogen. */
  skew?: boolean;
  /** Höhe des Markers relativ zur Zeile. */
  thickness?: number;
  /** Schriftgröße als CSS-Wert. */
  fontSize?: string;
  /** Versatz zwischen den Markern in Sekunden. */
  stagger?: number;
}

interface Segment {
  text: string;
  marked: boolean;
}

export function GoldHighlightSweep({
  text = 'Wir bauen *Motion-Systeme*, die eine Marke *ernst* wirken lassen — messbar schneller, ruhiger und *wiedererkennbar*.',
  color = NOX_COLORS.gold,
  speed = 1,
  skew = true,
  thickness = 0.42,
  fontSize = 'clamp(1.1rem, 2.6vw, 1.9rem)',
  stagger = 0.18,
}: GoldHighlightSweepProps) {
  const reduced = usePrefersReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // *markiert* zerlegen; ungerade Indizes sind die Treffer.
  const segments = useMemo<Segment[]>(
    () =>
      text
        .split(/\*([^*]+)\*/g)
        .map((part, index) => ({ text: part, marked: index % 2 === 1 }))
        .filter((segment) => segment.text.length > 0),
    [text],
  );

  useEffect(() => {
    setActive(false);
  }, [text, speed, stagger]);

  useEffect(() => {
    if (reduced) {
      setActive(true);
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [reduced, text, speed, stagger]);

  const style = {
    '--ghs-color': color,
    '--ghs-dur': `${clamp(0.62 / clamp(speed, 0.1, 3), 0.05, 6).toFixed(3)}s`,
    '--ghs-height': `${clamp(thickness, 0.1, 1).toFixed(2)}em`,
    '--ghs-skew': skew ? '-1.6deg' : '0deg',
    '--ghs-size': fontSize,
  } as React.CSSProperties;

  let markIndex = -1;

  return (
    <div ref={hostRef} className={`nox-ghs${active ? ' is-active' : ''}`} style={style}>
      <style>{CSS}</style>
      <p className="nox-ghs__text">
        {segments.map((segment, index) => {
          if (!segment.marked) return <span key={index}>{segment.text}</span>;
          markIndex += 1;
          return (
            <span
              key={index}
              className="nox-ghs__mark"
              style={{ '--ghs-delay': `${(markIndex * clamp(stagger, 0, 1)).toFixed(3)}s` } as React.CSSProperties}
            >
              {segment.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

const CSS = String.raw`
.nox-ghs { display:grid; place-items:center; width:100%; height:100%; padding:clamp(18px,5vw,52px); font-family:var(--sans,system-ui,sans-serif); }
.nox-ghs__text { max-width:22ch; margin:0; font-size:var(--ghs-size); font-weight:600; line-height:1.5; letter-spacing:-.015em; color:#ece7db; }
/* background-size wächst — der Text selbst wird dabei nie neu gezeichnet. */
.nox-ghs__mark { background-image:linear-gradient(var(--ghs-color), var(--ghs-color)); background-repeat:no-repeat; background-position:0 88%; background-size:0% var(--ghs-height); border-radius:2px; transition:background-size var(--ghs-dur) cubic-bezier(.22,1,.36,1) var(--ghs-delay); }
.nox-ghs.is-active .nox-ghs__mark { background-size:100% var(--ghs-height); }
.nox-ghs__mark { display:inline-block; transform:skewX(var(--ghs-skew)); }
@media (prefers-reduced-motion:reduce) {
  .nox-ghs__mark { transition:none; background-size:100% var(--ghs-height); }
}
`;

export default GoldHighlightSweep;
