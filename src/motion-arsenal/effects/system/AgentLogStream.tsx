import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// AgentLogStream — Live-Agent-Log: Einträge streamen mit outExpo herein,
// ältere dimmen und schrumpfen, Typ-Badges mit LEDs, Auto-Scroll,
// „Thinking…"-Zeilen mit animierten Dots, kritische Einträge zünden einen
// Border-Blitz.
// ---------------------------------------------------------------------------

export interface AgentLogStreamProps {
  interval?: number; // Sek. zwischen Einträgen
  accent?: string;
  maxVisible?: number;
}

type LogType = 'SCAN' | 'EXEC' | 'DONE' | 'CRIT' | 'THINK';

const POOL: Array<{ type: LogType; text: string }> = [
  { type: 'SCAN', text: 'reading operator state…' },
  { type: 'THINK', text: 'weighing quest options' },
  { type: 'EXEC', text: 'compiling daily quest' },
  { type: 'DONE', text: 'quest sealed → Iron Word Tree' },
  { type: 'SCAN', text: 'checking streak integrity' },
  { type: 'CRIT', text: 'dopamine trap detected — scroll_time spike' },
  { type: 'EXEC', text: 'countermeasure: 25min focus block' },
  { type: 'DONE', text: 'rank progress +12 XP' },
  { type: 'THINK', text: 'evaluating hard mode readiness' },
  { type: 'DONE', text: 'protocol window opened' },
];

const TYPE_COLOR: Record<LogType, string> = {
  SCAN: '#8a8781',
  EXEC: '#d4a24a',
  DONE: '#39ff8b',
  CRIT: '#ff4d4d',
  THINK: '#7aa7ff',
};

export function AgentLogStream({ interval = 1.1, accent = NOX_COLORS.red, maxVisible = 7 }: AgentLogStreamProps) {
  const [entries, setEntries] = useState<Array<{ id: number; type: LogType; text: string }>>([]);
  const [critFlash, setCritFlash] = useState(0);
  const reduced = usePrefersReducedMotion();
  const idRef = useRef(0);
  const rndRef = useRef(seededRandom(23));

  useEffect(() => {
    if (reduced) {
      setEntries(POOL.slice(0, maxVisible).map((p, i) => ({ id: i, ...p })));
      return;
    }
    const iv = setInterval(() => {
      const pick = POOL[Math.floor(rndRef.current() * POOL.length)];
      const id = ++idRef.current;
      setEntries((prev) => [...prev.slice(-(maxVisible - 1)), { id, ...pick }]);
      if (pick.type === 'CRIT') setCritFlash(id);
    }, Math.max(interval, 0.3) * 1000);
    return () => clearInterval(iv);
  }, [interval, maxVisible, reduced]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0b0b0d', fontFamily: 'var(--mono, monospace)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 18px' }}>
      <style>{`
        @keyframes als-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes als-dots { 0% { content: '.'; } 33% { content: '..'; } 66% { content: '...'; } }
        @keyframes als-critflash { 0% { box-shadow: inset 0 0 0 1px transparent; } 15% { box-shadow: inset 0 0 0 1px ${accent}, inset 0 0 24px ${accent}44; } 100% { box-shadow: inset 0 0 0 1px transparent; } }
        .als-think::after { content: '…'; display: inline-block; overflow: hidden; vertical-align: bottom; animation: als-dotwidth 1.2s steps(4) infinite; }
        @keyframes als-dotwidth { 0% { width: 0; } 100% { width: 1.3em; } }
        @media (prefers-reduced-motion: reduce) { .als-a, .als-think::after { animation: none !important; } }
      `}</style>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c22', background: 'rgba(11,11,13,0.9)', zIndex: 2 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.26em', color: NOX_COLORS.textDim }}>FORGE AGENT // LIVE</span>
        <span style={{ fontSize: 10, color: '#39ff8b' }}>● ONLINE</span>
      </div>
      {/* Crit-Blitz-Rahmen */}
      <div key={critFlash} className="als-a" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', animation: critFlash && !reduced ? 'als-critflash 1.2s ease-out both' : undefined, zIndex: 3 }} />
      {/* Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((e, i) => {
          const age = entries.length - 1 - i; // 0 = neueste
          const c = TYPE_COLOR[e.type];
          return (
            <div
              key={e.id}
              className="als-a"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                animation: reduced ? undefined : `als-in 0.45s ${EASE.outExpo} both`,
                opacity: Math.max(0.25, 1 - age * 0.13),
                transform: `scale(${Math.max(0.94, 1 - age * 0.008)})`,
                transformOrigin: 'left center',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: age === 0 ? `0 0 8px ${c}` : undefined, flexShrink: 0 }} />
              <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: c, width: 44, flexShrink: 0 }}>[{e.type}]</span>
              <span className={e.type === 'THINK' && age === 0 ? 'als-think' : undefined} style={{ fontSize: 11.5, color: NOX_COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentLogStream;
