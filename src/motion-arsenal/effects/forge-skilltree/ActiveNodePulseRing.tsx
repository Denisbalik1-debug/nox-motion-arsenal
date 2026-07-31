import React from 'react';
import { SkillNode, AtmosLayer, type SkillNodeState } from './skilltreeShared';

export type ActiveNodePulseRingVariant = 'active-quest' | 'agent-execution' | 'conversion-signal';
export type ActiveNodePulseRingEnergy = 'calm' | 'charged' | 'overdrive';

export interface ActiveNodePulseRingProps {
  pulseSpeed?: number; // 1 = Standard
  size?: number;
  variant?: ActiveNodePulseRingVariant;
  energy?: ActiveNodePulseRingEnergy;
  showContext?: boolean;
}

const VARIANTS: Record<
  ActiveNodePulseRingVariant,
  {
    activeLabel: string;
    comparisonLabel: string;
    activeState: SkillNodeState;
    comparisonState: SkillNodeState;
    badge: string;
    context: string;
  }
> = {
  'active-quest': {
    activeLabel: 'Aktive Quest',
    comparisonLabel: 'Nächste Quest',
    activeState: 'active',
    comparisonState: 'available',
    badge: 'RUNNING',
    context: 'Execution focus · current objective',
  },
  'agent-execution': {
    activeLabel: 'Builder Agent',
    comparisonLabel: 'Review Agent',
    activeState: 'active',
    comparisonState: 'recommended',
    badge: 'LIVE',
    context: 'Agent orchestration · task in progress',
  },
  'conversion-signal': {
    activeLabel: 'Qualified Lead',
    comparisonLabel: 'Next Best Action',
    activeState: 'completed',
    comparisonState: 'recommended',
    badge: 'SIGNAL',
    context: 'Revenue pipeline · conversion detected',
  },
};

const ENERGY: Record<
  ActiveNodePulseRingEnergy,
  { speed: number; particles: number; stars: number; size: number; floatDuration: number }
> = {
  calm: { speed: 0.72, particles: 5, stars: 2, size: 0.94, floatDuration: 8.5 },
  charged: { speed: 1, particles: 9, stars: 5, size: 1, floatDuration: 7 },
  overdrive: { speed: 1.38, particles: 14, stars: 9, size: 1.08, floatDuration: 5.6 },
};

export function ActiveNodePulseRing({
  pulseSpeed = 1,
  size = 64,
  variant = 'active-quest',
  energy = 'charged',
  showContext = true,
}: ActiveNodePulseRingProps) {
  const narrative = VARIANTS[variant];
  const profile = ENERGY[energy];
  const boundedSize = Math.max(40, Math.min(90, size));
  const effectiveSpeed = Math.max(0.25, pulseSpeed * profile.speed);

  return (
    <div
      className="stfx-stage"
      role="img"
      aria-label={`${narrative.activeLabel}: ${narrative.context}`}
      style={{ isolation: 'isolate' }}
    >
      <AtmosLayer particles={profile.particles} stars={profile.stars} />

      {showContext ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '14%',
            transform: 'translateX(-50%)',
            maxWidth: 'min(84%, 34rem)',
            padding: '0.45rem 0.8rem',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999,
            background: 'rgba(6,8,14,0.58)',
            backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,0.68)',
            fontSize: 'clamp(0.62rem, 1.5vw, 0.78rem)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {narrative.context}
        </div>
      ) : null}

      <SkillNode
        state={narrative.comparisonState}
        x={28}
        y={54}
        label={narrative.comparisonLabel}
        size={boundedSize * 0.78}
        speed={Math.max(0.4, effectiveSpeed * 0.72)}
        floatDur={profile.floatDuration + 1.4}
      />
      <SkillNode
        state={narrative.activeState}
        x={64}
        y={52}
        label={narrative.activeLabel}
        badge={narrative.badge}
        size={boundedSize * profile.size}
        speed={effectiveSpeed}
        floatDur={profile.floatDuration}
      />
    </div>
  );
}

export default ActiveNodePulseRing;
