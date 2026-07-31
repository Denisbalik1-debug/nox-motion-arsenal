import React, { useMemo, useState } from 'react';
import { SkillNode, AtmosLayer, linkClass, det, SkillNodeState } from './skilltreeShared';

export type AstralSkilltreeVariant = 'focus-os' | 'revenue-command' | 'agent-orchestration';
export type AstralSkilltreeEnergy = 'calm' | 'charged' | 'overdrive';

export interface AstralSkilltreeConstellationProps {
  nodeCount?: number;
  speed?: number;
  stars?: number;
  showLabels?: boolean;
  variant?: AstralSkilltreeVariant;
  energy?: AstralSkilltreeEnergy;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

type NodeDefinition = { label: string; state: SkillNodeState };
type Scenario = { root: string; nodes: NodeDefinition[] };

const ROOT = { x: 22, y: 48 };
const POS = [
  { x: 44, y: 14 }, { x: 68, y: 26 }, { x: 78, y: 52 },
  { x: 64, y: 80 }, { x: 40, y: 74 }, { x: 54, y: 46 },
];

const SCENARIOS: Record<AstralSkilltreeVariant, Scenario> = {
  'focus-os': {
    root: 'Deep-Work OS',
    nodes: [
      { label: 'Reizkontrolle', state: 'completed' },
      { label: 'Fokus-Sprint', state: 'active' },
      { label: 'Next Best Action', state: 'recommended' },
      { label: 'Ablenkungs-Loop', state: 'risk' },
      { label: 'Schlafschutz', state: 'available' },
      { label: 'Flow Mastery', state: 'locked' },
    ],
  },
  'revenue-command': {
    root: 'Revenue Command',
    nodes: [
      { label: 'ICP Signal', state: 'completed' },
      { label: 'Lead Engine', state: 'active' },
      { label: 'Follow-up OS', state: 'recommended' },
      { label: 'Pipeline Leak', state: 'risk' },
      { label: 'Offer Stack', state: 'available' },
      { label: 'Scale Layer', state: 'locked' },
    ],
  },
  'agent-orchestration': {
    root: 'Agent Core',
    nodes: [
      { label: 'Research Agent', state: 'completed' },
      { label: 'Operator Agent', state: 'active' },
      { label: 'QA Sentinel', state: 'recommended' },
      { label: 'Blocked Tool', state: 'risk' },
      { label: 'Memory Sync', state: 'available' },
      { label: 'Autonomy Tier', state: 'locked' },
    ],
  },
};

const ENERGY: Record<AstralSkilltreeEnergy, { speed: number; particles: number; glow: string }> = {
  calm: { speed: 0.72, particles: 10, glow: '0 0 36px rgba(212,175,55,.08)' },
  charged: { speed: 1, particles: 16, glow: '0 0 54px rgba(212,175,55,.14)' },
  overdrive: { speed: 1.35, particles: 24, glow: '0 0 72px rgba(147,51,234,.22)' },
};

export function AstralSkilltreeConstellation({
  nodeCount = 6,
  speed = 1,
  stars = 40,
  showLabels = true,
  variant = 'focus-os',
  energy = 'charged',
  showVariantSwitcher = true,
  showEnergySwitcher = true,
}: AstralSkilltreeConstellationProps) {
  const [activeVariant, setActiveVariant] = useState(variant);
  const [activeEnergy, setActiveEnergy] = useState(energy);
  const scenario = SCENARIOS[activeVariant];
  const profile = ENERGY[activeEnergy];
  const effectiveSpeed = Math.max(0.2, speed * profile.speed);
  const nodes = useMemo(
    () => scenario.nodes.slice(0, Math.max(1, Math.min(6, Math.round(nodeCount)))),
    [scenario, nodeCount],
  );

  return (
    <div className="stfx-stage" style={{ boxShadow: profile.glow }} data-variant={activeVariant} data-energy={activeEnergy}>
      <AtmosLayer particles={profile.particles} stars={stars} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.map((node, index) => {
          const position = POS[index % POS.length];
          const link = linkClass(node.state, effectiveSpeed);
          return (
            <path
              key={node.label}
              className={link.className}
              style={link.style}
              d={`M ${ROOT.x} ${ROOT.y} Q ${(ROOT.x + position.x) / 2} ${(ROOT.y + position.y) / 2 - 6} ${position.x} ${position.y}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      <SkillNode state="active" x={ROOT.x} y={ROOT.y} label={showLabels ? scenario.root : undefined} size={62} floatDur={8} speed={effectiveSpeed} />
      {nodes.map((node, index) => (
        <SkillNode
          key={node.label}
          state={node.state}
          x={POS[index % POS.length].x}
          y={POS[index % POS.length].y}
          label={showLabels ? node.label : undefined}
          badge={node.state === 'recommended' ? 'Von NOX empfohlen' : undefined}
          floatDur={6 + det(index, 7) * 3}
          floatDelay={index * -0.9}
          speed={effectiveSpeed}
        />
      ))}

      {(showVariantSwitcher || showEnergySwitcher) && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 5, display: 'grid', gap: 6, maxWidth: 'min(72%, 420px)' }}>
          {showVariantSwitcher && (
            <div role="group" aria-label="Skilltree narrative" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 5 }}>
              {(Object.keys(SCENARIOS) as AstralSkilltreeVariant[]).map((item) => (
                <button key={item} type="button" aria-pressed={activeVariant === item} onClick={() => setActiveVariant(item)} style={switchStyle(activeVariant === item)}>
                  {item.replaceAll('-', ' ')}
                </button>
              ))}
            </div>
          )}
          {showEnergySwitcher && (
            <div role="group" aria-label="Skilltree energy" style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
              {(Object.keys(ENERGY) as AstralSkilltreeEnergy[]).map((item) => (
                <button key={item} type="button" aria-pressed={activeEnergy === item} onClick={() => setActiveEnergy(item)} style={switchStyle(activeEnergy === item)}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function switchStyle(active: boolean): React.CSSProperties {
  return {
    border: `1px solid ${active ? 'rgba(212,175,55,.8)' : 'rgba(255,255,255,.14)'}`,
    background: active ? 'rgba(212,175,55,.16)' : 'rgba(5,5,9,.72)',
    color: active ? '#f3d77b' : 'rgba(255,255,255,.72)',
    borderRadius: 999,
    padding: '5px 8px',
    font: '600 9px/1 system-ui, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    cursor: 'pointer',
  };
}

export default AstralSkilltreeConstellation;
