import React from 'react';
import { AtmosLayer, SkillNode, det, type SkillNodeState } from './skilltreeShared';

export type FloatingSkillNodesVariant = 'capability-map' | 'agent-swarm' | 'revenue-orbit';
export type FloatingSkillNodesEnergy = 'calm' | 'charged' | 'overdrive';

export interface FloatingSkillNodesProps {
  count?: number;
  floatDistance?: number;
  floatSpeed?: number;
  variant?: FloatingSkillNodesVariant;
  energy?: FloatingSkillNodesEnergy;
  showLabels?: boolean;
}

const VARIANT_LABELS: Record<FloatingSkillNodesVariant, string[]> = {
  'capability-map': ['Research', 'Strategy', 'Build', 'QA', 'Deploy', 'Learn', 'Scale', 'Review'],
  'agent-swarm': ['Hermes', 'Tartaros', 'Codex', 'Scout', 'Closer', 'Auditor', 'Builder', 'Oracle'],
  'revenue-orbit': ['Signal', 'Lead', 'Offer', 'Demo', 'Close', 'Onboard', 'Upsell', 'Retain'],
};

const VARIANT_STATES: Record<FloatingSkillNodesVariant, SkillNodeState[]> = {
  'capability-map': ['completed', 'active', 'recommended', 'available'],
  'agent-swarm': ['active', 'recommended', 'completed', 'available'],
  'revenue-orbit': ['available', 'active', 'completed', 'recommended'],
};

const ENERGY: Record<FloatingSkillNodesEnergy, { speed: number; distance: number; particles: number }> = {
  calm: { speed: 1.18, distance: 0.72, particles: 6 },
  charged: { speed: 1, distance: 1, particles: 12 },
  overdrive: { speed: 0.78, distance: 1.28, particles: 18 },
};

export function FloatingSkillNodes({
  count = 5,
  floatDistance = 7,
  floatSpeed = 6,
  variant = 'capability-map',
  energy = 'charged',
  showLabels = true,
}: FloatingSkillNodesProps) {
  const n = Math.max(2, Math.min(8, Math.round(count)));
  const profile = ENERGY[energy];
  const labels = VARIANT_LABELS[variant];
  const states = VARIANT_STATES[variant];
  const effectiveDistance = Math.max(2, floatDistance * profile.distance);
  const effectiveSpeed = Math.max(2.4, floatSpeed * profile.speed);

  return (
    <div
      className="stfx-stage"
      style={{ ['--stfx-float' as any]: effectiveDistance }}
      role="img"
      aria-label={`${variant.replace('-', ' ')} floating skill node system`}
    >
      <AtmosLayer particles={profile.particles} stars={energy === 'overdrive' ? 12 : 5} />
      {Array.from({ length: n }, (_, i) => {
        const lane = i % 2 === 0 ? -1 : 1;
        const state = states[i % states.length];
        return (
          <SkillNode
            key={`${variant}-${i}`}
            state={state}
            x={10 + (i * 80) / Math.max(1, n - 1)}
            y={48 + lane * (8 + det(i, 3) * 12)}
            label={showLabels ? labels[i] : undefined}
            badge={state === 'recommended' ? 'NEXT' : undefined}
            size={44 + Math.round(det(i, 8) * 12)}
            floatDur={effectiveSpeed + det(i, 5) * 1.8}
            floatDelay={i * -0.95}
            speed={energy === 'overdrive' ? 1.35 : energy === 'calm' ? 0.8 : 1}
          />
        );
      })}
    </div>
  );
}

export default FloatingSkillNodes;
