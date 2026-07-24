import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion, useRafLoop, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TerminalBootStream — Terminal bootet: Zeilen tippen sich mit variablem
// Tempo, farbige Status-Tags, ASCII-Header, Scanline-Overlay + dezentes
// Flicker (KRANK --pulse Filter-Chain-Idee), am Ende pulsierender Prompt.
// ---------------------------------------------------------------------------

export interface TerminalBootStreamProps {
  speed?: number;
  accent?: string;
  flicker?: boolean;
  autoReplay?: boolean;
}

interface BootLine {
  text: string;
  tag?: 'OK' | 'WARN' | 'SYS';
  pause: number; // Sek. Wartezeit vor der Zeile
}

const BOOT: BootLine[] = [
  { text: 'NOX FORGE RUNTIME v2.5', tag: 'SYS', pause: 0.2 },
  { text: 'mounting truth chain .......', tag: 'OK', pause: 0.5 },
  { text: 'loading rank ladder ........', tag: 'OK', pause: 0.25 },
  { text: 'dopamine traps detected: 3', tag: 'WARN', pause: 0.7 },
  { text: 'sealing excuses ............', tag: 'OK', pause: 0.3 },
  { text: 'quest compiler ready .......', tag: 'OK', pause: 0.4 },
  { text: 'FORGE ONLINE — awaiting operator', tag: 'SYS', pause: 0.8 },
];

export function TerminalBootStream({ speed = 1, accent = NOX_COLORS.red, flicker = true, autoReplay = true }: TerminalBootStreamProps) {
  const [runId, setRunId] = useState(0);
  const [lines, setLines] = useState<Array<{ line: BootLine; chars: number }>>([]);
  const [finished, setFinished] = useState(false);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ idx: 0, chars: 0, wait: 0.3 });
  const rndRef = useRef(seededRandom(11));

  useEffect(() => {
    if (reduced) {
      setLines(BOOT.map((line) => ({ line, chars: line.text.length })));
      setFinished(true);
      return;
    }
    state.current = { idx: 0, chars: 0, wait: 0.3 };
    rndRef.current = seededRandom(11 + runId);
    setLines([]);
    setFinished(false);
  }, [runId, reduced]);

  useRafLoop((dt) => {
    const s = state.current;
    if (s.idx >= BOOT.length) {
      if (!finished) {
        setFinished(true);
        if (autoReplay) setTimeout(() => setRunId((r) => r + 1), 3400);
      }
      return;
    }
    if (s.wait > 0) {
      s.wait -= dt * speed;
      return;
    }
    // Variables Tipp-Tempo (28-80 Zeichen/s) mit Mikro-Stottern
    s.chars += dt * speed * (28 + rndRef.current() * 52);
    const cur = BOOT[s.idx];
    const chars = Math.min(Math.floor(s.chars), cur.text.length);
    setLines((prev) => {
      const next = prev.slice(0, s.idx);
      next[s.idx] = { line: cur, chars };
      return next;
    });
    if (chars >= cur.text.length) {
      s.idx += 1;
      s.chars = 0;
      s.wait = (BOOT[s.idx]?.pause ?? 0) / speed;
    }
  }, !reduced && !finished);

  const tagColor = (t?: string) => (t === 'OK' ? '#39ff8b' : t === 'WARN' ? '#ff9f2e' : accent);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#070708', fontFamily: 'var(--mono, monospace)', overflow: 'hidden' }}>
      <style>{`
        @keyframes tbs-scan { 0% { top: -12%; } 100% { top: 112%; } }
        @keyframes tbs-caret { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes tbs-flicker { 0%,100% { opacity: 1; } 96% { opacity: 1; } 97% { opacity: 0.86; } 98% { opacity: 1; } 99% { opacity: 0.93; } }
        @media (prefers-reduced-motion: reduce) { .tbs-a { animation: none !important; } }
      `}</style>
      <div className="tbs-a" style={{ position: 'absolute', inset: 0, padding: '16px 18px', animation: flicker && !reduced ? 'tbs-flicker 5s steps(1) infinite' : undefined }}>
        <div style={{ color: accent, fontSize: 10.5, letterSpacing: '0.1em', whiteSpace: 'pre', lineHeight: 1.35, marginBottom: 12, opacity: 0.9 }}>
{`  _  _ _____  __
 | \\| |  _  \\ \\/ /   FORGE TERMINAL
 | .\\ | |_| |>  <    ------------------
 |_|\\_|_____/_/\\_\\   boot sequence`}
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 11.5, lineHeight: 1.8, color: NOX_COLORS.text, opacity: 0.92 }}>
            <span style={{ color: '#5a5852' }}>[{String(i).padStart(2, '0')}]</span>{' '}
            {l.line.tag && l.chars >= l.line.text.length && (
              <span style={{ color: tagColor(l.line.tag), marginRight: 6 }}>[{l.line.tag}]</span>
            )}
            {l.line.text.slice(0, l.chars)}
            {i === lines.length - 1 && l.chars < l.line.text.length && <span style={{ color: accent }}>▮</span>}
          </div>
        ))}
        {finished && (
          <div style={{ fontSize: 11.5, marginTop: 8, color: NOX_COLORS.text }}>
            <span style={{ color: accent }}>operator@nox</span>
            <span style={{ color: '#5a5852' }}>:~$</span>{' '}
            <span className="tbs-a" style={{ display: 'inline-block', width: 8, height: 13, background: accent, verticalAlign: 'text-bottom', animation: reduced ? undefined : 'tbs-caret 1.1s steps(1) infinite' }} />
          </div>
        )}
      </div>
      {/* Scanline-Overlay */}
      {!reduced && (
        <div className="tbs-a" style={{ position: 'absolute', left: 0, right: 0, height: 46, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.035), transparent)', animation: 'tbs-scan 5.5s linear infinite', pointerEvents: 'none' }} />
      )}
      {/* CRT-Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </div>
  );
}

export default TerminalBootStream;
