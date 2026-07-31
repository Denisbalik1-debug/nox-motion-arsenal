import { useMemo, useRef, useState } from 'react';
import { clamp, damp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { easeOutBack, easeOutExpo, NOX_COLORS } from '../../lib/motionPresets';

export type TimelineVariant = 'revenue-os' | 'agent-ops' | 'launch-sequence';
export type TimelineEnergy = 'calm' | 'charged' | 'overdrive';

export interface NoxTimelineOrchestratorProps {
  progress?: number;
  playSpeed?: number;
  overshoot?: boolean;
  variant?: TimelineVariant;
  energy?: TimelineEnergy;
  showVariantSwitcher?: boolean;
  showLegend?: boolean;
}

type TimelineNode = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  at: readonly [number, number];
  from: { x: number; y: number };
};

type TimelinePreset = {
  label: string;
  eyebrow: string;
  accent: string;
  success: string;
  nodes: TimelineNode[];
};

const PRESETS: Record<TimelineVariant, TimelinePreset> = {
  'revenue-os': {
    label: 'Revenue OS',
    eyebrow: 'SIGNAL → REVENUE',
    accent: '201, 48, 48',
    success: '57, 255, 139',
    nodes: [
      { id: 'signal', label: 'Signals', detail: 'Intent detected', x: 12, y: 27, at: [0, 0.15], from: { x: -42, y: 0 } },
      { id: 'agents', label: 'Agent Stack', detail: 'Context enriched', x: 34, y: 60, at: [0.12, 0.29], from: { x: 0, y: 48 } },
      { id: 'automation', label: 'Automation', detail: 'Flow executed', x: 56, y: 23, at: [0.26, 0.43], from: { x: 0, y: -48 } },
      { id: 'followup', label: 'Follow-up', detail: 'Timing optimized', x: 76, y: 57, at: [0.4, 0.58], from: { x: 42, y: 0 } },
      { id: 'cta', label: 'Revenue Loop', detail: 'System compounding', x: 89, y: 29, at: [0.62, 0.82], from: { x: 0, y: 32 } },
    ],
  },
  'agent-ops': {
    label: 'Agent Ops',
    eyebrow: 'MISSION → EXECUTION',
    accent: '117, 92, 255',
    success: '82, 214, 255',
    nodes: [
      { id: 'brief', label: 'Operator Brief', detail: 'Scope locked', x: 11, y: 54, at: [0, 0.14], from: { x: -44, y: 0 } },
      { id: 'router', label: 'Task Router', detail: 'Agent selected', x: 31, y: 25, at: [0.11, 0.28], from: { x: 0, y: -46 } },
      { id: 'workers', label: 'Worker Mesh', detail: 'Parallel execution', x: 53, y: 59, at: [0.25, 0.43], from: { x: 0, y: 50 } },
      { id: 'review', label: 'Quality Gate', detail: 'Evidence checked', x: 74, y: 25, at: [0.4, 0.58], from: { x: 40, y: 0 } },
      { id: 'cta', label: 'Mission Complete', detail: 'Audit persisted', x: 90, y: 53, at: [0.62, 0.82], from: { x: 0, y: 34 } },
    ],
  },
  'launch-sequence': {
    label: 'Launch',
    eyebrow: 'BUILD → MARKET',
    accent: '255, 145, 61',
    success: '255, 220, 92',
    nodes: [
      { id: 'position', label: 'Positioning', detail: 'Promise sharpened', x: 11, y: 26, at: [0, 0.14], from: { x: -42, y: 0 } },
      { id: 'offer', label: 'Offer Stack', detail: 'Value engineered', x: 31, y: 58, at: [0.11, 0.28], from: { x: 0, y: 48 } },
      { id: 'asset', label: 'Launch Assets', detail: 'Pages deployed', x: 53, y: 25, at: [0.25, 0.43], from: { x: 0, y: -48 } },
      { id: 'traffic', label: 'Distribution', detail: 'Demand activated', x: 74, y: 58, at: [0.4, 0.58], from: { x: 42, y: 0 } },
      { id: 'cta', label: 'Market Signal', detail: 'Feedback captured', x: 90, y: 29, at: [0.62, 0.82], from: { x: 0, y: 34 } },
    ],
  },
};

const ENERGY = {
  calm: { speed: 0.72, damping: 7.5, glow: 0.58, lineWidth: 1.1 },
  charged: { speed: 1, damping: 6, glow: 1, lineWidth: 1.4 },
  overdrive: { speed: 1.32, damping: 4.8, glow: 1.42, lineWidth: 1.8 },
} as const;

const LINKS: Array<[number, number, number]> = [
  [0, 1, 0.29],
  [1, 2, 0.43],
  [2, 3, 0.57],
  [3, 4, 0.81],
];

function stateAt(progress: number, node: TimelineNode, overshoot: boolean) {
  const [a, b] = node.at;
  const t = clamp((progress - a) / (b - a), 0, 1);
  const eased = overshoot ? easeOutBack(t) : easeOutExpo(t);
  return {
    opacity: easeOutExpo(t),
    dx: node.from.x * (1 - eased),
    dy: node.from.y * (1 - eased),
    scale: 0.86 + 0.14 * eased,
  };
}

export function NoxTimelineOrchestrator({
  progress = -1,
  playSpeed = 0.16,
  overshoot = true,
  variant = 'revenue-os',
  energy = 'charged',
  showVariantSwitcher = true,
  showLegend = true,
}: NoxTimelineOrchestratorProps) {
  const reduced = usePrefersReducedMotion();
  const [activeVariant, setActiveVariant] = useState<TimelineVariant>(variant);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const prog = useRef(0);

  const preset = PRESETS[activeVariant];
  const energyProfile = ENERGY[energy];
  const nodes = useMemo(() => preset.nodes, [preset]);

  useRafLoop((dt, elapsed) => {
    const cycle = (elapsed * playSpeed * energyProfile.speed) % 1.28;
    const target = progress >= 0 ? clamp(progress, 0, 1) : cycle > 1 ? 1 : cycle;
    prog.current = damp(prog.current, target, energyProfile.damping, dt);
    const p = prog.current;

    nodes.forEach((node, i) => {
      const el = nodeRefs.current[i];
      if (!el) return;
      const state = stateAt(p, node, overshoot);
      el.style.opacity = state.opacity.toFixed(3);
      el.style.transform = `translate(-50%, -50%) translate(${state.dx.toFixed(2)}px, ${state.dy.toFixed(2)}px) scale(${state.scale.toFixed(3)})`;
      el.style.setProperty('--node-progress', String(state.opacity));
    });

    LINKS.forEach(([, , drawStart], i) => {
      const line = lineRefs.current[i];
      if (!line) return;
      const t = clamp((p - drawStart) / 0.14, 0, 1);
      const len = Number(line.dataset.len ?? 100);
      line.style.strokeDashoffset = String(len * (1 - easeOutExpo(t)));
      line.style.opacity = t > 0 ? '1' : '0';
    });

    if (railRef.current) railRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
    if (pulseRef.current) {
      pulseRef.current.style.left = `${8 + p * 84}%`;
      pulseRef.current.style.opacity = p > 0.01 && p < 0.99 ? '1' : '0';
    }
  }, !reduced);

  const staticState = reduced ? 1 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(circle at 50% 42%, rgba(${preset.accent}, 0.08), transparent 52%), ${NOX_COLORS.bg}`,
        containerType: 'size',
      }}
    >
      <style>{`
        .nto-node {
          --node-progress: 0;
          position: absolute;
          transform: translate(-50%, -50%);
          min-width: clamp(92px, 15cqw, 148px);
          border: 1px solid rgba(${preset.accent}, 0.38);
          background: linear-gradient(145deg, rgba(22,22,27,.96), rgba(12,12,15,.9));
          border-radius: 11px;
          padding: 9px 12px 8px;
          color: ${NOX_COLORS.text};
          box-shadow: 0 0 calc(16px + 18px * var(--node-progress)) rgba(${preset.accent}, ${0.11 * energyProfile.glow});
          white-space: nowrap;
          will-change: transform, opacity;
        }
        .nto-node::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,.07), transparent 72%);
          transform: translateX(calc(-130% + 230% * var(--node-progress)));
          pointer-events: none;
        }
        .nto-node.nto-cta {
          border-color: rgba(${preset.success}, 0.48);
          box-shadow: 0 0 calc(18px + 20px * var(--node-progress)) rgba(${preset.success}, ${0.1 * energyProfile.glow});
        }
        .nto-label {
          font: 700 clamp(8px, 1.45cqw, 11px)/1.1 var(--mono, monospace);
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .nto-detail {
          margin-top: 5px;
          font: 500 clamp(7px, 1.15cqw, 9px)/1.2 var(--mono, monospace);
          letter-spacing: .06em;
          color: ${NOX_COLORS.textDim};
        }
        .nto-line {
          stroke: rgba(${preset.accent}, 0.72);
          stroke-width: ${energyProfile.lineWidth};
          filter: drop-shadow(0 0 ${Math.round(5 * energyProfile.glow)}px rgba(${preset.accent}, .72));
        }
        .nto-switch {
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(10,10,13,.72);
          color: ${NOX_COLORS.textDim};
          border-radius: 999px;
          padding: 5px 8px;
          font: 700 8px/1 var(--mono, monospace);
          letter-spacing: .08em;
          cursor: pointer;
        }
        .nto-switch[data-active='true'] {
          color: ${NOX_COLORS.text};
          border-color: rgba(${preset.accent}, .55);
          background: rgba(${preset.accent}, .14);
        }
        @media (max-width: 460px) {
          .nto-detail { display: none; }
          .nto-node { min-width: 70px; padding: 8px 9px; }
        }
      `}</style>

      <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 3, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '.35em', color: NOX_COLORS.textDim }}>
          {preset.eyebrow} // {reduced ? 'END-STATE' : progress >= 0 ? 'SCROLL-SYNC' : energy.toUpperCase()}
        </div>
        {showLegend && (
          <div style={{ marginTop: 6, fontFamily: 'var(--mono, monospace)', fontSize: 8, letterSpacing: '.12em', color: `rgba(${preset.accent}, .78)` }}>
            {preset.label.toUpperCase()} · ONE TIMELINE CONTROLLER · DOM + SVG
          </div>
        )}
      </div>

      {showVariantSwitcher && (
        <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 4, display: 'flex', gap: 5 }}>
          {(Object.keys(PRESETS) as TimelineVariant[]).map((key) => (
            <button
              key={key}
              type="button"
              className="nto-switch"
              data-active={activeVariant === key}
              onClick={() => {
                prog.current = 0;
                setActiveVariant(key);
              }}
              aria-pressed={activeVariant === key}
            >
              {PRESETS[key].label}
            </button>
          ))}
        </div>
      )}

      <div style={{ position: 'absolute', inset: '15% 4% 17% 4%' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {LINKS.map(([a, b], i) => {
            const A = nodes[a];
            const B = nodes[b];
            const len = Math.hypot(B.x - A.x, B.y - A.y) * 1.2;
            return (
              <line
                key={`${activeVariant}-${i}`}
                ref={(el) => { lineRefs.current[i] = el; }}
                className="nto-line"
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                data-len={len}
                strokeDasharray={len}
                strokeDashoffset={reduced ? 0 : len}
                opacity={reduced ? 1 : 0}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {nodes.map((node, i) => (
          <div
            key={`${activeVariant}-${node.id}`}
            ref={(el) => { nodeRefs.current[i] = el; }}
            className={`nto-node ${node.id === 'cta' ? 'nto-cta' : ''}`}
            style={{ left: `${node.x}%`, top: `${node.y}%`, opacity: staticState }}
          >
            <div className="nto-label">{node.label}</div>
            <div className="nto-detail">{node.detail}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: 18, height: 1, background: 'rgba(240,236,228,.1)' }}>
        <div
          ref={railRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left',
            transform: `scaleX(${staticState})`,
            background: `linear-gradient(to right, rgba(${preset.accent},.88), rgba(${preset.success},.72))`,
          }}
        />
      </div>
      <div
        ref={pulseRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 14,
          width: 9,
          height: 9,
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          background: `rgb(${preset.success})`,
          boxShadow: `0 0 ${Math.round(14 * energyProfile.glow)}px rgba(${preset.success}, .78)`,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default NoxTimelineOrchestrator;
