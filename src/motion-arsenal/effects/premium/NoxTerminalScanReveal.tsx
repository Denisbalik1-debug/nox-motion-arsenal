import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

export type TerminalScanVariant = 'system-audit' | 'lead-recovery' | 'agent-readiness';
export type TerminalScanEnergy = 'calm' | 'charged' | 'overdrive';

export interface NoxTerminalScanRevealProps {
  speed?: number;
  scanDuration?: number;
  autoStart?: boolean;
  variant?: TerminalScanVariant;
  energy?: TerminalScanEnergy;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
  showReplay?: boolean;
}

type Scenario = {
  label: string;
  eyebrow: string;
  cta: string;
  bootLines: string[];
  modules: string[];
};

const SCENARIOS: Record<TerminalScanVariant, Scenario> = {
  'system-audit': {
    label: 'System Audit',
    eyebrow: 'NOX SYSTEM AUDIT',
    cta: 'System-Audit starten →',
    bootLines: [
      '> NOX PROTOKOLL v3 — system audit',
      '> scanne anfragefluss ............ ok',
      '> lead-endpunkte gefunden ........ 3',
      '> follow-up-kette ................ lücke erkannt',
      '> empfehlung: system-audit starten',
    ],
    modules: ['Website-Audit', 'Leadfluss-Analyse', 'Follow-up-Check', 'System-Empfehlung'],
  },
  'lead-recovery': {
    label: 'Lead Recovery',
    eyebrow: 'REVENUE RECOVERY',
    cta: 'Verlorene Leads zurückholen →',
    bootLines: [
      '> recovery engine — pipeline scan',
      '> unbeantwortete anfragen ........ 17',
      '> kritisches zeitfenster ......... 42h',
      '> reaktivierungs-sequenz ......... bereit',
      '> prognose: 4–7 chancen rückholbar',
    ],
    modules: ['Inbox-Signale', 'Intent-Priorität', 'Follow-up-Sequenz', 'Recovery-Score'],
  },
  'agent-readiness': {
    label: 'Agent Readiness',
    eyebrow: 'AGENT READINESS',
    cta: 'Agenten-Stack aktivieren →',
    bootLines: [
      '> agent mesh — readiness check',
      '> datenquellen verbunden ......... 6',
      '> tool-berechtigungen ............ geprüft',
      '> fallback-routing ............... aktiv',
      '> status: deployment-ready',
    ],
    modules: ['Context Layer', 'Tool Router', 'Guardrails', 'Operator Handoff'],
  },
};

const ENERGY: Record<TerminalScanEnergy, { speed: number; glow: number; scanWidth: number; pulse: number }> = {
  calm: { speed: 0.82, glow: 0.55, scanWidth: 38, pulse: 1.8 },
  charged: { speed: 1, glow: 0.82, scanWidth: 48, pulse: 1.2 },
  overdrive: { speed: 1.24, glow: 1, scanWidth: 62, pulse: 0.78 },
};

type Phase = 'idle' | 'boot' | 'scan' | 'done';

export function NoxTerminalScanReveal({
  speed = 1,
  scanDuration = 1.6,
  autoStart = true,
  variant = 'system-audit',
  energy = 'charged',
  showVariantSwitcher = true,
  showEnergySwitcher = true,
  showReplay = true,
}: NoxTerminalScanRevealProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typed, setTyped] = useState(0);
  const [activeVariant, setActiveVariant] = useState<TerminalScanVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<TerminalScanEnergy>(energy);
  const scanRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const timeInPhase = useRef(0);

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const scenario = SCENARIOS[activeVariant];
  const profile = ENERGY[activeEnergy];
  const totalChars = useMemo(() => scenario.bootLines.join('').length, [scenario]);

  useEffect(() => {
    setTyped(0);
    timeInPhase.current = 0;
    moduleRefs.current.forEach((el) => {
      if (!el) return;
      el.style.clipPath = 'inset(0 100% 0 0)';
      el.style.opacity = '0';
    });
    setPhase(reduced ? 'done' : autoStart && inView ? 'boot' : 'idle');
  }, [activeVariant, reduced]);

  useEffect(() => {
    if (reduced) setPhase('done');
    else if (autoStart && inView && phase === 'idle') setPhase('boot');
  }, [inView, autoStart, phase, reduced]);

  useRafLoop(
    (dt) => {
      timeInPhase.current += dt;
      const tempo = speed * profile.speed;
      if (phase === 'boot') {
        const cps = 52 * tempo;
        const n = Math.min(Math.floor(timeInPhase.current * cps), totalChars);
        setTyped(n);
        if (n >= totalChars && timeInPhase.current > totalChars / cps + 0.3) {
          timeInPhase.current = 0;
          setPhase('scan');
        }
      } else if (phase === 'scan') {
        const t = Math.min(timeInPhase.current / (scanDuration / tempo), 1);
        const eased = 1 - Math.pow(1 - t, 3);
        if (scanRef.current) {
          scanRef.current.style.left = `${(eased * 100).toFixed(2)}%`;
          scanRef.current.style.opacity = t >= 1 ? '0' : '1';
        }
        moduleRefs.current.forEach((el, i) => {
          if (!el) return;
          const start = i / scenario.modules.length;
          const end = (i + 1) / scenario.modules.length;
          const reveal = Math.min(Math.max((eased - start) / (end - start), 0), 1);
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
      if (!el) return;
      el.style.clipPath = 'inset(0 100% 0 0)';
      el.style.opacity = '0';
    });
    setPhase(reduced ? 'done' : 'boot');
  };

  let remaining = phase === 'done' ? totalChars : typed;
  const visibleLines = scenario.bootLines.map((line) => {
    const take = Math.max(0, Math.min(line.length, remaining));
    remaining -= take;
    return line.slice(0, take);
  });
  const done = phase === 'done';

  return (
    <div
      ref={rootRef}
      data-variant={activeVariant}
      data-energy={activeEnergy}
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
        .ntsr-panel { width:min(660px,100%); border:1px solid rgba(240,236,228,.12); border-radius:12px; background:linear-gradient(170deg,rgba(17,17,20,.96),rgba(10,10,11,.98)); box-shadow:0 30px 90px -48px rgba(201,48,48,${0.82 * profile.glow}); overflow:hidden; }
        .ntsr-toolbar { display:flex; align-items:center; gap:6px; padding:10px 14px; border-bottom:1px solid rgba(240,236,228,.08); }
        .ntsr-switchers { display:flex; flex-wrap:wrap; gap:6px; padding:10px 14px 0; }
        .ntsr-chip { border:1px solid rgba(240,236,228,.14); border-radius:999px; background:rgba(255,255,255,.025); color:${NOX_COLORS.textDim}; font:700 8px/1 var(--mono,monospace); letter-spacing:.12em; padding:6px 9px; cursor:pointer; }
        .ntsr-chip.on { color:${NOX_COLORS.text}; border-color:rgba(201,48,48,.58); background:rgba(201,48,48,.12); box-shadow:0 0 18px rgba(201,48,48,${0.22 * profile.glow}); }
        .ntsr-module { display:flex; align-items:center; gap:10px; border:1px solid rgba(201,48,48,.28); background:rgba(201,48,48,.06); border-radius:7px; padding:9px 12px; font-size:12px; font-weight:600; color:${NOX_COLORS.text}; will-change:clip-path,opacity; }
        .ntsr-cta { margin-top:14px; display:inline-flex; align-items:center; gap:8px; border-radius:8px; background:${NOX_COLORS.red}; color:#fff; font-size:12.5px; font-weight:700; padding:10px 18px; border:none; cursor:pointer; opacity:0; transform:translateY(8px); transition:opacity .5s ${EASE.outExpo},transform .5s ${EASE.outBack}; box-shadow:0 10px 30px rgba(201,48,48,${0.24 * profile.glow}); }
        .ntsr-cta.on { opacity:1; transform:translateY(0); }
        .ntsr-caret { display:inline-block; width:7px; height:12px; background:${NOX_COLORS.redBright}; vertical-align:-1px; animation:ntsr-blink ${profile.pulse}s steps(1) infinite; }
        @keyframes ntsr-blink { 50% { opacity:0; } }
        @media (max-width:520px) { .ntsr-switchers { max-height:66px; overflow:auto; } .ntsr-module { font-size:10.5px; padding:8px 9px; } }
        @media (prefers-reduced-motion:reduce) { .ntsr-caret { animation:none; } .ntsr-cta { transition:none; } }
      `}</style>

      <div className="ntsr-panel">
        <div className="ntsr-toolbar">
          <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(201,48,48,0.8)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(240,236,228,0.18)' }} />
          <span style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.25em', color: NOX_COLORS.textDim, marginLeft: 8 }}>
            {scenario.eyebrow}
          </span>
          {showReplay && (
            <button onClick={replay} className="ntsr-chip" style={{ marginLeft: 'auto' }}>
              REPLAY
            </button>
          )}
        </div>

        {(showVariantSwitcher || showEnergySwitcher) && (
          <div className="ntsr-switchers">
            {showVariantSwitcher && (Object.keys(SCENARIOS) as TerminalScanVariant[]).map((key) => (
              <button key={key} className={`ntsr-chip ${activeVariant === key ? 'on' : ''}`} onClick={() => setActiveVariant(key)}>
                {SCENARIOS[key].label.toUpperCase()}
              </button>
            ))}
            {showEnergySwitcher && (Object.keys(ENERGY) as TerminalScanEnergy[]).map((key) => (
              <button key={key} className={`ntsr-chip ${activeEnergy === key ? 'on' : ''}`} onClick={() => setActiveEnergy(key)}>
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '14px 16px', fontFamily: 'var(--mono, monospace)', fontSize: 11, lineHeight: 1.8, color: NOX_COLORS.textDim, minHeight: 110 }} aria-live="polite">
          {visibleLines.map((line, i) => (
            <div key={`${activeVariant}-${i}`} style={{ color: /lücke|kritisch|bereit|deployment-ready/.test(line) ? NOX_COLORS.redBright : undefined }}>
              {line}
              {!done && line.length > 0 && line.length < scenario.bootLines[i].length && <span className="ntsr-caret" />}
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', padding: '4px 16px 18px' }}>
          <div
            ref={scanRef}
            style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: profile.scanWidth, marginLeft: -profile.scanWidth / 2,
              background: `linear-gradient(to right, transparent, rgba(255,90,90,${0.18 * profile.glow}), transparent)`,
              borderLeft: `1px solid rgba(255,90,90,${0.38 * profile.glow})`, opacity: 0, pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {scenario.modules.map((module, i) => (
              <div
                key={`${activeVariant}-${module}`}
                ref={(el) => { moduleRefs.current[i] = el; }}
                className="ntsr-module"
                style={done ? { clipPath: 'inset(0 0 0 0)', opacity: 1 } : { clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, background: 'rgba(57,255,139,0.85)', boxShadow: `0 0 ${8 + profile.glow * 7}px rgba(57,255,139,0.6)` }} />
                {module}
              </div>
            ))}
          </div>
          <button className={`ntsr-cta ${done ? 'on' : ''}`} type="button">
            {scenario.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoxTerminalScanReveal;
