import React from 'react';
import { AtmosLayer, SkillNode } from './skilltreeShared';

// ---------------------------------------------------------------------------
// RecommendedNodeFocusRing — production-ready next-best-action focus state.
// CSS/React-only, no animation loop or runtime dependency.
// ---------------------------------------------------------------------------

export type RecommendedFocusVariant = 'next-best-action' | 'operator-priority' | 'conversion-path';
export type RecommendedFocusEnergy = 'calm' | 'charged' | 'overdrive';

export interface RecommendedNodeFocusRingProps {
  spinSpeed?: number;
  showBadge?: boolean;
  variant?: RecommendedFocusVariant;
  energy?: RecommendedFocusEnergy;
  showContext?: boolean;
}

const VARIANTS: Record<
  RecommendedFocusVariant,
  {
    eyebrow: string;
    title: string;
    detail: string;
    badge: string;
    recommended: string;
    previous: string;
    next: string;
  }
> = {
  'next-best-action': {
    eyebrow: 'NEXT BEST ACTION',
    title: 'Protect the next focus block',
    detail: 'The recommended node converts the current momentum into one clear, low-friction action.',
    badge: 'Von NOX empfohlen',
    recommended: 'Deep-Work-Block',
    previous: 'Reiz reduzieren',
    next: 'Routine sichern',
  },
  'operator-priority': {
    eyebrow: 'OPERATOR PRIORITY',
    title: 'Resolve the highest-leverage task',
    detail: 'A visible command-state marker for agent dashboards, queues, and mission-critical workflows.',
    badge: 'Priority Route',
    recommended: 'Lead-Recovery',
    previous: 'Signale prüfen',
    next: 'Follow-up aktivieren',
  },
  'conversion-path': {
    eyebrow: 'CONVERSION PATH',
    title: 'Guide attention toward the decision',
    detail: 'Use the focus ring to highlight the preferred package, CTA, onboarding step, or upgrade route.',
    badge: 'Best Fit',
    recommended: 'Growth-System',
    previous: 'Bedarf erkennen',
    next: 'System starten',
  },
};

const ENERGY: Record<
  RecommendedFocusEnergy,
  { speed: number; particles: number; stars: number; nodeSize: number; opacity: number }
> = {
  calm: { speed: 0.72, particles: 4, stars: 10, nodeSize: 58, opacity: 0.72 },
  charged: { speed: 1, particles: 8, stars: 16, nodeSize: 64, opacity: 0.88 },
  overdrive: { speed: 1.32, particles: 12, stars: 22, nodeSize: 70, opacity: 1 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function RecommendedNodeFocusRing({
  spinSpeed = 1,
  showBadge = true,
  variant = 'next-best-action',
  energy = 'charged',
  showContext = true,
}: RecommendedNodeFocusRingProps) {
  const narrative = VARIANTS[variant];
  const profile = ENERGY[energy];
  const effectiveSpeed = clamp(spinSpeed, 0.3, 3) * profile.speed;

  return (
    <div
      className="stfx-stage"
      role="img"
      aria-label={`${narrative.eyebrow}: ${narrative.title}. Recommended node: ${narrative.recommended}.`}
      style={{ ['--stfx-focus-opacity' as any]: profile.opacity } as React.CSSProperties}
    >
      <AtmosLayer particles={profile.particles} stars={profile.stars} />

      <SkillNode
        state="completed"
        x={22}
        y={52}
        size={46}
        label={narrative.previous}
        floatDur={8.5}
        floatDelay={-2}
      />
      <SkillNode
        state="recommended"
        x={53}
        y={46}
        size={profile.nodeSize}
        label={narrative.recommended}
        badge={showBadge ? narrative.badge : undefined}
        speed={effectiveSpeed}
        floatDur={6.8 / profile.speed}
        floatDelay={-1.4}
      />
      <SkillNode
        state="available"
        x={82}
        y={56}
        size={48}
        label={narrative.next}
        floatDur={9}
        floatDelay={-4}
      />

      {showContext && (
        <div
          style={{
            position: 'absolute',
            left: 'clamp(18px, 4vw, 44px)',
            right: 'clamp(18px, 4vw, 44px)',
            bottom: 'clamp(18px, 4vw, 34px)',
            display: 'grid',
            gap: 5,
            maxWidth: 520,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: '0.18em', opacity: 0.64 }}>{narrative.eyebrow}</span>
          <strong style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', lineHeight: 1.15 }}>{narrative.title}</strong>
          <span style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', lineHeight: 1.45, opacity: 0.68 }}>
            {narrative.detail}
          </span>
        </div>
      )}
    </div>
  );
}

export default RecommendedNodeFocusRing;
