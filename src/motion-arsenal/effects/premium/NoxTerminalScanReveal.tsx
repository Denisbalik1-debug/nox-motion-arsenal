import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxTerminalScanReveal — Premium-CTA-Sequenz aus eigener NOX-Mechanik
// (Weiterentwicklung von TerminalBootStream + RankRevealSequence):
//  1. Kurzes Boot-Protokoll tippt sich zeilenweise (Typewriter, dt-getaktet).
//  2. Ein Scan-Balken fährt über das Modul-Panel; Module werden per
//     clip-path freigelegt, exakt synchron zur Balkenposition.
//  3. Sequenz endet in einem STATISCHEN, vollständigen CTA-Zustand —
//     kein Loop, kein Dauerflackern (Motion nur im passenden Moment).
// Getriggert per useInView, spielt genau einmal; Replay-Button für die
// Galerie. Reduced motion: sofort der fertige Endzustand.
// ---------------------------------------------------------------------------

export interface NoxTerminalScanRevealProps {
  speed?: number; // 0.5..2 — Gesamttempo der Sequenz
  scanDuration?: number; // 0.8..3 — Sekunden für den Scan-Pass
  autoStart?: boolean; // false: wartet auf Replay-Klick
}

const BOOT_LINES = [
  '> NOX PROTOKOLL v2 — system audit',
  '> scanne anfragefluss ............ ok',
  '> lead-endpunkte gefunden ........ 3',
  '> follow-up-kette ................ lücke erkannt',
  '> empfehlung: system-audit starten',
];

const MODULES = ['Website-Audit', 'Leadfluss-Analyse', 'Follow-up-Check', 'System-Empfehlung'];

type Phase = 'idle' | 'boot' | 'scan' | 'done';

export function NoxTerminalScanReveal({
  speed = 1,
  scanDuration = 1.6,
  autoStart = true,
}: NoxTerminalScanRevealProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState(0); // Gesamtzeichen über alle Zeilen
  const scanRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const timeInPhase = useRef(0);

  const totalChars = BOOT_LINES.join('').length;

  useEffect(() => {
    if (reduced) setPhase('done');
    else if (autoStart && inView && phase === 'idle') setPhase('boot');
  }, [inView, autoStart, phase, reduced]);

  useRafLoop(
    (dt) => {
      timeInPhase.current += dt;
      if (phase === 'boot') {
        const cps = 52 * speed; // Zeichen pro Sekunde
        const n = Math.min(Math.floor(timeInPhase.current * cps), totalChars);
        setTyped(n);
        if (n >= totalChars && timeInPhase.current > totalChars / cps + 0.35) {
          timeInPhase.current = 0;
          setPhase('scan');
        }
      } else if (phase === 'scan') {
        const t = Math.min(timeInPhase.current / (scanDuration / speed), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        if (scanRef.current) {
          scanRef.current.style.left = `${(eased * 100).toFixed(2)}%`;
          scanRef.current.style.opacity = t >= 1 ? '0' : '1';
        }
        moduleRefs.current.forEach((el, i) => {
          if (!el) return;
          // Modul i wird freigelegt, sobald der Balken seine Zone passiert.
          const zone = (i + 1) / MODULES.length;
          const reveal = Math.min(Math.max((eased - i / MODULES.length) / (zone - i / MODULES.length), 0), 1);
          el.style.clipPath = `inset(0 ${(100 - reveal * 100).toFixed(2)}% 0 0)`;
          el.style.opacity = reveal > 0.02 ? '1' : '0';
        });
        if (t >= 1) {
          timeInPhase.current = 0;
          setPhase('done');
        }
      }
    },
    phase === 'boot' || phase === 'scan',
  );

  const replay = () => {
    setTyped(0);
    timeInPhase.current = 0;
    moduleRefs.current.forEach((el) => {
      if (el) {
        el.style.clipPath = 'inset(0 100% 0 0)';
        el.style.opacity = '0';
      }
    });
    setPhase(reduced ? 'done' : 'boot');
  };

  // Sichtbare Zeichen auf Zeilen verteilen.
  let remaining = phase === 'done' ? totalChars : typed;
  const visibleLines = BOOT_LINES.map((line) => {
    const take = Math.max(0, Math.min(line.length, remaining));
    remaining -= take;
    return line.slice(0, take);
  });

  const done = phase === 'done';

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3cqw, 28px)',
      }}
    >
      <style>{`
        .ntsr-panel {
          width: min(620px, 100%);
          border: 1px solid rgba(240, 236, 228, 0.12);
          border-radius: 10px;
          background: linear-gradient(170deg, rgba(17,17,20,0.96), rgba(10,10,11,0.98));
          box-shadow: 0 30px 80px -50px rgba(201, 48, 48, 0.7);
        }
        .ntsr-module {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(201, 48, 48, 0.28);
          background: rgba(201, 48, 48, 0.06);
          border-radius: 7px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 600;
          color: ${NOX_COLORS.text};
          will-change: clip-path, opacity;
        }
        .ntsr-cta {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 8px;
          background: ${NOX_COLORS.red};
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          padding: 10px 18px;
          border: none;
          cursor: pointer;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ${EASE.outExpo}, transform 0.5s ${EASE.outBack};
        }
        .ntsr-cta.on { opacity: 1; transform: translateY(0); }
        .ntsr-caret {
          display: inline-block;
          width: 7px; height: 12px;
          background: ${NOX_COLORS.redBright};
          vertical-align: -1px;
          animation: ntsr-blink 0.9s steps(1) infinite;
        }
        @keyframes ntsr-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .ntsr-caret { animation: none; }
          .ntsr-cta { transition: none; }
        }
      `}</style>

      <div className="ntsr-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(240,236,228,0.08)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(201,48,48,0.8)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(240,236,228,0.18)' }} />
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginLeft: 8 }}>
            NOX SYSTEM AUDIT
          </span>
          <button
            onClick={replay}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid rgba(240,236,228,0.15)',
              borderRadius: 5,
              color: NOX_COLORS.textDim,
              fontFamily: 'var(--mono, monospace)',
              fontSize: 8,
              letterSpacing: '0.2em',
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            REPLAY
          </button>
        </div>

        <div style={{ padding: '14px 16px', fontFamily: 'var(--mono, monospace)', fontSize: 11, lineHeight: 1.8, color: NOX_COLORS.textDim, minHeight: 110 }}>
          {visibleLines.map((line, i) => (
            <div key={i} style={{ color: line.includes('lücke') ? NOX_COLORS.redBright : undefined }}>
              {line}
              {!done && line.length > 0 && line.length < BOOT_LINES[i].length && <span className="ntsr-caret" />}
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', padding: '4px 16px 18px' }}>
          {/* Scan-Balken */}
          <div
            ref={scanRef}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 46,
              marginLeft: -23,
              background: 'linear-gradient(to right, transparent, rgba(255,90,90,0.16), transparent)',
              borderLeft: '1px solid rgba(255,90,90,0.35)',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {MODULES.map((m, i) => (
              <div
                key={m}
                ref={(el) => { moduleRefs.current[i] = el; }}
                className="ntsr-module"
                style={done ? { clipPath: 'inset(0 0 0 0)', opacity: 1 } : { clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, background: 'rgba(57,255,139,0.85)', boxShadow: '0 0 10px rgba(57,255,139,0.6)' }} />
                {m}
              </div>
            ))}
          </div>
          <button className={`ntsr-cta ${done ? 'on' : ''}`} type="button">
            System-Audit starten →
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoxTerminalScanReveal;
