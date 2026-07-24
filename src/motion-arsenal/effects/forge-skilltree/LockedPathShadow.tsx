import React from 'react';
import { SkillNode, AtmosLayer, linkClass } from './skilltreeShared';

// ---------------------------------------------------------------------------
// LockedPathShadow — gesperrte Pfade liegen im Schatten: ein radialer
// Dunkel-Veil über dem gesperrten Ast, gedimmte Links, entsättigte Nodes.
// ---------------------------------------------------------------------------

export interface LockedPathShadowProps {
  veilStrength?: number; // 0..1
}

export function LockedPathShadow({ veilStrength = 0.55 }: LockedPathShadowProps) {
  const lit = linkClass('active');
  const dim = linkClass('locked');
  return (
    <div className="stfx-stage" style={{ ['--stfx-veil' as any]: veilStrength }}>
      <AtmosLayer particles={10} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className={lit.className} style={lit.style} d="M 20 50 Q 34 34 48 42" vectorEffect="non-scaling-stroke" />
        <path className={dim.className} d="M 48 42 Q 62 50 74 34" vectorEffect="non-scaling-stroke" />
        <path className={dim.className} d="M 48 42 Q 64 58 78 66" vectorEffect="non-scaling-stroke" />
      </svg>
      <SkillNode state="completed" x={20} y={50} label="Fundament" />
      <SkillNode state="active" x={48} y={42} label="Aktueller Pfad" size={58} />
      <SkillNode state="locked" x={74} y={34} label="Späterer Ast" />
      <SkillNode state="locked" x={78} y={66} label="Elite-Ast" />
      {/* Schatten-Veil über dem gesperrten Bereich */}
      <div className="stfx-veil" style={{ ['--vx' as any]: '78%', ['--vy' as any]: '50%' }} />
    </div>
  );
}

export default LockedPathShadow;
