import { useState } from 'react';
import type { CSSProperties } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

export type AnswerLockInVariant = 'assessment' | 'command-deck' | 'brand-lock';
export type AnswerLockInOrientation = 'horizontal' | 'vertical';

export interface AnswerLockInProps {
  accentColor?: string;
  lockDuration?: number;
  dimOpacity?: number;
  showEnergyLine?: boolean;
  variant?: AnswerLockInVariant;
  orientation?: AnswerLockInOrientation;
  energyIntensity?: number;
  showProgressRail?: boolean;
  eyebrow?: string;
  question?: string;
  brandMark?: string;
  logoUrl?: string;
  onChange?: (index: number) => void;
}

const SCALE = [
  { n: '01', label: 'SCHWACH' },
  { n: '02', label: 'GERING' },
  { n: '03', label: 'NEUTRAL' },
  { n: '04', label: 'STARK' },
  { n: '05', label: 'MAXIMAL' },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function AnswerLockIn({
  accentColor = NOX_COLORS.red,
  lockDuration = 0.58,
  dimOpacity = 0.28,
  showEnergyLine = true,
  variant = 'command-deck',
  orientation = 'horizontal',
  energyIntensity = 1,
  showProgressRail = true,
  eyebrow = 'SIGNAL CALIBRATION · NODE 03',
  question = 'Wie stark pulst dein SYSTEM-SIGNAL?',
  brandMark = 'NOX // DECISION CORE',
  logoUrl,
  onChange,
}: AnswerLockInProps) {
  const reduced = usePrefersReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const [lockKey, setLockKey] = useState(0);
  const intensity = clamp(energyIntensity, 0.25, 1.5);

  const pick = (index: number) => {
    setSelected(index);
    setLockKey((key) => key + 1);
    onChange?.(index);
  };

  const selectedCenter = selected === null ? 50 : ((selected + 0.5) / SCALE.length) * 100;
  const selectedProgress = selected === null ? 0 : (selected + 1) / SCALE.length;

  const rootStyle = {
    '--ali-accent': accentColor,
    '--ali-intensity': intensity,
    '--ali-dim': dimOpacity,
  } as CSSProperties;

  return (
    <div className={`ali-root ali-${variant} ali-${orientation}`} style={rootStyle}>
      <style>{`
        @keyframes ali-grid-drift { to { background-position: 44px 44px, 44px 44px; } }
        @keyframes ali-scan { 0% { transform: translateX(-130%); opacity: 0; } 18% { opacity: .9; } 80% { opacity: .35; } 100% { transform: translateX(130%); opacity: 0; } }
        @keyframes ali-lock { 0% { transform: translateY(0) scale(1); } 24% { transform: translateY(4px) scale(.91); } 58% { transform: translateY(-3px) scale(1.065); } 78% { transform: translateY(1px) scale(.985); } 100% { transform: translateY(0) scale(1.035); } }
        @keyframes ali-trace { from { stroke-dashoffset: 1; opacity: .25; } to { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes ali-led { 0% { opacity: .15; transform: scale(.35); } 54% { opacity: 1; transform: scale(1.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes ali-node { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ali-accent) 55%, transparent); } 50% { box-shadow: 0 0 0 8px transparent, 0 0 18px var(--ali-accent); } }
        @keyframes ali-flow { to { stroke-dashoffset: -1; } }
        @keyframes ali-draw { from { stroke-dashoffset: 1; opacity: 0; } 30% { opacity: 1; } to { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes ali-cta { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ali-accent) 38%, transparent), inset 0 0 0 transparent; } 50% { box-shadow: 0 0 24px color-mix(in srgb, var(--ali-accent) 34%, transparent), inset 0 0 18px color-mix(in srgb, var(--ali-accent) 9%, transparent); } }
        .ali-root { position:absolute; inset:0; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:clamp(14px,3vw,34px); color:${NOX_COLORS.text}; font-family:system-ui,sans-serif; user-select:none; isolation:isolate; background:radial-gradient(120% 110% at 50% -10%, color-mix(in srgb, var(--ali-accent) 16%, #11121a) 0%, #08090d 55%, #030407 100%); }
        .ali-root::before { content:""; position:absolute; inset:-35%; z-index:-3; background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px); background-size:44px 44px; transform:perspective(700px) rotateX(62deg) translateY(18%); mask-image:radial-gradient(circle at center,#000 0,transparent 70%); animation:ali-grid-drift 10s linear infinite; }
        .ali-root::after { content:""; position:absolute; inset:0; z-index:8; pointer-events:none; background:radial-gradient(circle at 50% 46%,transparent 28%,rgba(2,3,7,.25) 58%,rgba(2,3,7,.88) 100%); }
        .ali-aura { position:absolute; left:50%; top:50%; width:min(74vw,680px); aspect-ratio:1; transform:translate(-50%,-50%); border-radius:50%; z-index:-2; background:conic-gradient(from 180deg,transparent 0 18%,color-mix(in srgb,var(--ali-accent) 28%,transparent),transparent 44%,rgba(52,211,255,.12),transparent 74%); filter:blur(50px); opacity:calc(.65 * var(--ali-intensity)); }
        .ali-scan { position:absolute; inset:0 auto 0 0; width:42%; z-index:-1; pointer-events:none; background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--ali-accent) 8%,transparent),rgba(255,255,255,.08),transparent); filter:blur(2px); animation:ali-scan 4.8s ease-in-out infinite; }
        .ali-shell { position:relative; z-index:2; width:min(100%,920px); padding:clamp(16px,3vw,30px); border:1px solid rgba(255,255,255,.1); border-radius:22px; background:linear-gradient(145deg,rgba(16,17,24,.84),rgba(7,8,12,.66)); box-shadow:0 28px 80px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.08),0 0 70px color-mix(in srgb,var(--ali-accent) 8%,transparent); backdrop-filter:blur(18px) saturate(1.2); }
        .ali-shell::before { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none; background:linear-gradient(112deg,rgba(255,255,255,.08),transparent 22%,transparent 72%,color-mix(in srgb,var(--ali-accent) 10%,transparent)); }
        .ali-header { position:relative; display:flex; justify-content:space-between; gap:18px; align-items:flex-start; margin-bottom:clamp(16px,3vh,26px); }
        .ali-eyebrow { font-family:ui-monospace,monospace; font-size:clamp(8px,1vw,10px); letter-spacing:.28em; color:${NOX_COLORS.textDim}; text-transform:uppercase; }
        .ali-question { margin-top:7px; max-width:640px; font-size:clamp(17px,2.5vw,28px); font-weight:760; letter-spacing:-.025em; line-height:1.08; }
        .ali-brand { display:flex; align-items:center; gap:8px; min-width:max-content; font:700 8px/1 ui-monospace,monospace; letter-spacing:.2em; color:color-mix(in srgb,var(--ali-accent) 72%,white); }
        .ali-brand img { width:22px; height:22px; object-fit:contain; filter:drop-shadow(0 0 8px color-mix(in srgb,var(--ali-accent) 45%,transparent)); }
        .ali-brand-dot { width:8px; height:8px; border-radius:50%; background:var(--ali-accent); box-shadow:0 0 12px var(--ali-accent); animation:ali-node 1.8s ease-in-out infinite; }
        .ali-cards { position:relative; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:clamp(7px,1.4vw,14px); }
        .ali-vertical .ali-cards { grid-template-columns:1fr; gap:7px; max-height:58vh; overflow:auto; padding-right:4px; }
        .ali-card { position:relative; min-width:0; min-height:clamp(82px,15vh,132px); padding:clamp(12px,2vh,20px) 8px 12px; overflow:hidden; color:inherit; cursor:pointer; border:1px solid rgba(255,255,255,.1); border-radius:15px; background:linear-gradient(155deg,rgba(255,255,255,.065),rgba(255,255,255,.018)); box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.28); transition:opacity .42s ${EASE.outExpo},filter .42s ${EASE.outExpo},transform .42s ${EASE.outExpo},border-color .25s,background .25s,box-shadow .25s; }
        .ali-card:hover { transform:translateY(-3px); border-color:color-mix(in srgb,var(--ali-accent) 38%,rgba(255,255,255,.12)); background:linear-gradient(155deg,color-mix(in srgb,var(--ali-accent) 9%,rgba(255,255,255,.06)),rgba(255,255,255,.02)); }
        .ali-card[data-selected="true"] { z-index:3; border-color:color-mix(in srgb,var(--ali-accent) 62%,white 8%); background:linear-gradient(155deg,color-mix(in srgb,var(--ali-accent) 22%,#171820),rgba(8,9,14,.92)); box-shadow:0 18px 42px rgba(0,0,0,.36),0 0 calc(28px * var(--ali-intensity)) color-mix(in srgb,var(--ali-accent) 28%,transparent),inset 0 0 30px color-mix(in srgb,var(--ali-accent) 8%,transparent); }
        .ali-card::after { content:""; position:absolute; left:-35%; top:-120%; width:42%; height:340%; transform:rotate(24deg); background:linear-gradient(90deg,transparent,rgba(255,255,255,.11),transparent); opacity:0; transition:opacity .25s,transform .7s ${EASE.outExpo}; }
        .ali-card[data-selected="true"]::after { opacity:1; transform:translateX(390%) rotate(24deg); }
        .ali-index { position:relative; z-index:2; font:800 clamp(20px,3vw,34px)/1 ui-monospace,monospace; letter-spacing:-.06em; color:rgba(245,245,255,.92); transition:color .25s,text-shadow .25s; }
        .ali-card[data-selected="true"] .ali-index { color:var(--ali-accent); text-shadow:0 0 20px color-mix(in srgb,var(--ali-accent) 60%,transparent); }
        .ali-label { position:relative; z-index:2; margin-top:8px; font:650 clamp(7px,1vw,9px)/1.2 ui-monospace,monospace; letter-spacing:.16em; color:${NOX_COLORS.textDim}; }
        .ali-status { position:absolute; left:8px; right:8px; bottom:8px; display:flex; align-items:center; gap:6px; font:600 7px/1 ui-monospace,monospace; letter-spacing:.12em; color:rgba(255,255,255,.24); }
        .ali-status-line { flex:1; height:1px; background:rgba(255,255,255,.09); overflow:hidden; }
        .ali-status-line::after { content:""; display:block; width:var(--ali-load,18%); height:100%; background:var(--ali-accent); box-shadow:0 0 7px var(--ali-accent); transition:width .45s ${EASE.outExpo}; }
        .ali-led { position:absolute; top:9px; right:9px; width:7px; height:7px; border-radius:50%; background:#303039; transition:background .2s,box-shadow .2s; }
        .ali-card[data-selected="true"] .ali-led { background:var(--ali-accent); box-shadow:0 0 10px 2px color-mix(in srgb,var(--ali-accent) 65%,transparent); }
        .ali-rail { position:relative; height:clamp(38px,7vh,62px); margin:4px 0 0; }
        .ali-rail-base { position:absolute; left:2%; right:2%; top:50%; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.12) 8% 92%,transparent); }
        .ali-rail-fill { height:100%; width:var(--ali-progress); background:linear-gradient(90deg,var(--ali-accent),#72e8ff); box-shadow:0 0 14px color-mix(in srgb,var(--ali-accent) 55%,transparent); transition:width .55s ${EASE.outExpo}; }
        .ali-rail-nodes { position:absolute; left:2%; right:2%; top:50%; display:flex; justify-content:space-between; transform:translateY(-50%); }
        .ali-rail-node { width:6px; height:6px; border-radius:50%; background:#303039; border:1px solid rgba(255,255,255,.13); transition:background .25s,box-shadow .25s,transform .25s; }
        .ali-rail-node[data-active="true"] { transform:scale(1.35); background:var(--ali-accent); box-shadow:0 0 12px var(--ali-accent); }
        .ali-commit { position:relative; display:flex; justify-content:space-between; align-items:center; gap:16px; }
        .ali-commit-copy { min-width:0; font:600 8px/1.4 ui-monospace,monospace; letter-spacing:.14em; color:${NOX_COLORS.textDim}; }
        .ali-commit-copy strong { display:block; margin-bottom:4px; color:color-mix(in srgb,var(--ali-accent) 70%,white); font-size:10px; }
        .ali-cta { min-width:140px; padding:11px 22px; border-radius:999px; border:1px solid color-mix(in srgb,var(--ali-accent) 62%,rgba(255,255,255,.16)); background:linear-gradient(180deg,color-mix(in srgb,var(--ali-accent) 16%,rgba(255,255,255,.04)),rgba(255,255,255,.015)); color:${NOX_COLORS.text}; font:700 9px/1 ui-monospace,monospace; letter-spacing:.2em; cursor:pointer; transition:opacity .2s,filter .2s,transform .2s; }
        .ali-cta:disabled { cursor:default; opacity:.34; filter:saturate(.3); }
        .ali-cta:not(:disabled):hover { transform:translateY(-2px); }
        .ali-command-deck .ali-shell { border-color:color-mix(in srgb,var(--ali-accent) 22%,rgba(255,255,255,.1)); }
        .ali-brand-lock .ali-shell { background:linear-gradient(145deg,rgba(19,16,27,.86),rgba(8,7,12,.7)); }
        @media(max-width:700px){ .ali-root{padding:10px}.ali-shell{padding:14px;border-radius:17px}.ali-header{margin-bottom:12px}.ali-brand{display:none}.ali-cards{gap:5px}.ali-card{min-height:88px;padding:12px 3px 10px;border-radius:11px}.ali-label{font-size:6px;letter-spacing:.08em}.ali-status{display:none}.ali-commit-copy{display:none}.ali-cta{width:100%}.ali-rail{height:38px} }
        @media(prefers-reduced-motion:reduce){ .ali-root::before,.ali-scan,.ali-brand-dot{animation:none!important}.ali-card,.ali-rail-fill,.ali-rail-node,.ali-cta{transition:none!important} }
      `}</style>

      <div className="ali-aura" />
      <div className="ali-scan" />

      <section className="ali-shell" aria-label="Answer lock-in selection">
        <header className="ali-header">
          <div>
            <div className="ali-eyebrow">{eyebrow}</div>
            <div className="ali-question">{question}</div>
          </div>
          <div className="ali-brand">
            {logoUrl ? <img src={logoUrl} alt="" /> : <span className="ali-brand-dot" />}
            {brandMark}
          </div>
        </header>

        <div className="ali-cards">
          {SCALE.map((scale, index) => {
            const isSelected = selected === index;
            const dimmed = selected !== null && !isSelected;
            const load = selected === null ? 16 + index * 7 : isSelected ? 100 : 10 + index * 5;
            return (
              <button
                key={scale.n}
                type="button"
                aria-pressed={isSelected}
                data-selected={isSelected}
                onClick={() => pick(index)}
                className="ali-card"
                style={{
                  opacity: dimmed ? dimOpacity : 1,
                  filter: dimmed ? 'saturate(.22) brightness(.68)' : 'none',
                  transform: dimmed ? 'translateY(3px) scale(.96)' : undefined,
                  animation: isSelected && !reduced ? `ali-lock ${lockDuration}s ${EASE.krankOvershoot} both` : undefined,
                  '--ali-load': `${load}%`,
                } as CSSProperties}
              >
                {isSelected && (
                  <svg
                    key={`trace-${lockKey}`}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
                  >
                    <rect
                      x="1"
                      y="1"
                      width="98"
                      height="98"
                      rx="12"
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={reduced ? 0 : 1}
                      style={{
                        animation: reduced ? undefined : `ali-trace .65s ${EASE.outExpo} forwards`,
                        filter: `drop-shadow(0 0 ${6 * intensity}px ${accentColor})`,
                      }}
                    />
                  </svg>
                )}
                <span
                  key={isSelected ? `led-${lockKey}` : 'led-off'}
                  className="ali-led"
                  style={{ animation: isSelected && !reduced ? `ali-led .52s ${EASE.outBack} forwards` : undefined }}
                />
                <div className="ali-index">{scale.n}</div>
                <div className="ali-label">{scale.label}</div>
                <div className="ali-status">
                  <span>{isSelected ? 'LOCKED' : 'STANDBY'}</span>
                  <span className="ali-status-line" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="ali-rail">
          {showEnergyLine && selected !== null && (
            <svg
              key={`energy-${lockKey}`}
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
            >
              <path
                d={`M ${selectedCenter} 0 C ${selectedCenter} 19, 50 14, 50 26`}
                fill="none"
                stroke={accentColor}
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={reduced ? 0 : 1}
                opacity={0.6}
                style={{ animation: reduced ? undefined : `ali-draw .56s ${EASE.outExpo} .08s both` }}
              />
              {!reduced && (
                <path
                  d={`M ${selectedCenter} 0 C ${selectedCenter} 19, 50 14, 50 26`}
                  fill="none"
                  stroke="#8cecff"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray=".06 .18"
                  style={{ animation: 'ali-flow .9s linear .25s infinite', filter: `drop-shadow(0 0 ${5 * intensity}px ${accentColor})` }}
                />
              )}
            </svg>
          )}
          {showProgressRail && (
            <div className="ali-rail-base">
              <div className="ali-rail-fill" style={{ '--ali-progress': `${selectedProgress * 100}%` } as CSSProperties} />
            </div>
          )}
          {showProgressRail && (
            <div className="ali-rail-nodes">
              {SCALE.map((scale, index) => (
                <span key={scale.n} className="ali-rail-node" data-active={selected !== null && index <= selected} />
              ))}
            </div>
          )}
        </div>

        <footer className="ali-commit">
          <div className="ali-commit-copy">
            <strong>{selected === null ? 'AWAITING INPUT' : `SIGNAL COMMIT ${Math.round(selectedProgress * 100)}%`}</strong>
            {selected === null ? 'Select one calibrated response node.' : 'Selection encrypted and ready for the next section.'}
          </div>
          <button
            type="button"
            className="ali-cta"
            disabled={selected === null}
            onClick={() => setSelected(null)}
            style={{ animation: selected !== null && !reduced ? 'ali-cta 1.7s ease-in-out .45s infinite' : undefined }}
          >
            COMMIT SIGNAL →
          </button>
        </footer>
      </section>
    </div>
  );
}

export default AnswerLockIn;
