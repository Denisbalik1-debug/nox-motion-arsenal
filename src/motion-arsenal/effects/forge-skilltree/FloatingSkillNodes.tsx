import React from 'react';
import { SkillNode, AtmosLayer, det } from './skilltreeShared';

// ---------------------------------------------------------------------------
// FloatingSkillNodes — das Schwebe-Fundament isoliert: Nodes driften vertikal
// mit versetzten Phasen (nur transform), Hover skaliert den Kern.
// ---------------------------------------------------------------------------

export interface FloatingSkillNodesProps {
  count?: number;
  floatDistance?: number; // px
  floatSpeed?: number;    // s pro Halbzyklus
}

export function FloatingSkillNodes({ count = 5, floatDistance = 7, floatSpeed = 6 }: FloatingSkillNodesProps) {
  const n = Math.max(2, Math.min(8, Math.round(count)));
  return (
    <div className="stfx-stage" style={{ ['--stfx-float' as any]: floatDistance }}>
      <AtmosLayer particles={10} />
      {Array.from({ length: n }, (_, i) => (
        <SkillNode
          key={i}
          state={i % 3 === 0 ? 'available' : i % 3 === 1 ? 'active' : 'completed'}
          x={12 + (i * 76) / Math.max(1, n - 1)}
          y={42 + (det(i, 3) - 0.5) * 26}
          label={`Skill ${String(i + 1).padStart(2, '0')}`}
          floatDur={floatSpeed + det(i, 5) * 2}
          floatDelay={i * -1.1}
        />
      ))}
    </div>
  );
}

export default FloatingSkillNodes;
