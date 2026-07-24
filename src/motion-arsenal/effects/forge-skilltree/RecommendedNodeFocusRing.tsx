import React from 'react';
import { SkillNode, AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// RecommendedNodeFocusRing — der Empfohlen-Zustand: langsam rotierender
// gestrichelter Fokus-Ring + „Von NOX empfohlen"-Badge.
// ---------------------------------------------------------------------------

export interface RecommendedNodeFocusRingProps {
  spinSpeed?: number;
  showBadge?: boolean;
}

export function RecommendedNodeFocusRing({ spinSpeed = 1, showBadge = true }: RecommendedNodeFocusRingProps) {
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={8} stars={16} />
      <SkillNode state="locked" x={24} y={50} label="Gesperrt" />
      <SkillNode
        state="recommended" x={54} y={48} size={62}
        label="Doomscrolling-Bremse"
        badge={showBadge ? 'Von NOX empfohlen' : undefined}
        speed={spinSpeed}
      />
      <SkillNode state="available" x={82} y={54} label="Verfügbar" />
    </div>
  );
}

export default RecommendedNodeFocusRing;
